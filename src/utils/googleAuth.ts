declare global {
  interface Window {
    google?: any;
  }
}

let isGoogleInitialized = false;
let activeClientId: string | null = null;
let activeSuccessHandler: ((idToken: string) => void) | null = null;
let activeErrorHandler: ((errorMsg: string) => void) | null = null;

const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1028788240521-ujoshj82g60v811p5fkqv3hh4iirqbt3.apps.googleusercontent.com';
const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services-sdk';
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let googleIdentityScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(forceReload = false) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Trình duyệt không khả dụng'));
  if (window.google?.accounts?.id && !forceReload) return Promise.resolve();

  if (forceReload) {
    document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)?.remove();
    googleIdentityScriptPromise = null;
    isGoogleInitialized = false;
    activeClientId = null;
  }

  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript || document.createElement('script');
    let timeoutId = 0;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
    const handleLoad = () => {
      cleanup();
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        googleIdentityScriptPromise = null;
        reject(new Error('Google Identity SDK không khởi tạo được'));
      }
    };
    const handleError = () => {
      cleanup();
      googleIdentityScriptPromise = null;
      reject(new Error('Không tải được Google Identity SDK'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.id = GOOGLE_IDENTITY_SCRIPT_ID;
      script.src = GOOGLE_IDENTITY_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    timeoutId = window.setTimeout(handleError, 12000);
  });

  return googleIdentityScriptPromise;
}

export async function requestGoogleAccessToken(
  onSuccess: (accessToken: string) => void,
  onError?: (message: string) => void,
  onCancel?: () => void,
) {
  try {
    await loadGoogleIdentityScript();
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: DEFAULT_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response: { access_token?: string; error?: string }) => {
        if (response?.access_token) {
          onSuccess(response.access_token);
          return;
        }
        if (response?.error === 'access_denied') {
          onCancel?.();
          return;
        }
        onError?.(`Đăng nhập Google thất bại: ${response?.error || 'không nhận được Access Token'}`);
      },
      error_callback: (error: { type?: string }) => {
        if (error?.type === 'popup_closed') {
          onCancel?.();
        } else if (error?.type === 'popup_blocked_by_browser') {
          onError?.('Trình duyệt đang chặn cửa sổ Google. Vui lòng cho phép popup rồi thử lại.');
        } else {
          onError?.('Không thể mở cửa sổ đăng nhập Google. Vui lòng thử lại.');
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch {
    onError?.('Không tải được Google Identity. Hãy kiểm tra mạng hoặc tắt tiện ích chặn quảng cáo rồi thử lại.');
  }
}

/**
 * Khởi tạo Google Identity Services (dành cho ID Token & renderButton)
 */
export function initGoogleIdentity(
  onSuccess: (idToken: string) => void,
  onError?: (errorMsg: string) => void,
) {
  if (typeof window === 'undefined') return false;

  activeSuccessHandler = onSuccess;
  activeErrorHandler = onError || null;

  if (!window.google?.accounts?.id) {
    return false;
  }

  try {
    if (!isGoogleInitialized || activeClientId !== DEFAULT_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: DEFAULT_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            activeSuccessHandler?.(response.credential);
          } else {
            activeErrorHandler?.('Không nhận được mã xác thực (credential) từ Google.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
      isGoogleInitialized = true;
      activeClientId = DEFAULT_CLIENT_ID;
    }
    return true;
  } catch (err: any) {
    console.warn('Lỗi khởi tạo Google Identity:', err);
    return false;
  }
}

/**
 * Hiển thị nút Google Sign-In chính thức vào một container DOM
 */
export function renderGoogleButton(
  container: HTMLElement,
  onSuccess: (idToken: string) => void,
  onError?: (errorMsg: string) => void,
  options?: {
    width?: number;
    text?: 'signin_with' | 'signup_with' | 'continue_with';
  },
) {
  const initialized = initGoogleIdentity(onSuccess, onError);
  if (!initialized || !container) return false;

  try {
    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: options?.text || 'continue_with',
      logo_alignment: 'left',
      width: Math.min(400, Math.max(200, Math.floor(options?.width || 200))),
    });
    return true;
  } catch (err) {
    console.warn('Không thể render nút Google Sign-In:', err);
    return false;
  }
}
