import { toast } from './toast';

declare global {
  interface Window {
    google?: any;
  }
}

let isGoogleInitialized = false;
let activeClientId: string | null = null;

export function triggerGoogleSignIn(
  onSuccess: (idToken: string) => void,
  onError?: (errorMsg: string) => void,
) {
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1028788240521-ujoshj82g60v811p5fkqv3hh4iirqbt3.apps.googleusercontent.com';

  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    const msg = 'Thư viện Google Identity Services đang tải hoặc bị chặn bởi trình duyệt. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
    if (onError) onError(msg);
    else toast.error(msg);
    return;
  }

  try {
    if (!isGoogleInitialized || activeClientId !== clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('Không nhận được mã xác thực (credential) từ Google.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });
      isGoogleInitialized = true;
      activeClientId = clientId;
    }

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason?.() || 'trình duyệt chặn';
        console.warn('Google prompt không hiển thị:', reason);
        onError?.(
          `Google Sign-In prompt không thể hiển thị (${reason}). Tên miền http://localhost:5173 có thể chưa được thêm vào Authorized JavaScript Origins trên Google Cloud Console. Bạn hãy sử dụng hình thức Đăng ký bằng Email & OTP ngay bên dưới nhé!`
        );
      } else if (notification.isSkippedMoment()) {
        console.warn('Google prompt bị bỏ qua:', notification.getSkippedReason?.());
      }
    });
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    onError?.(
      'Không thể khởi động Google One Tap. Bạn vui lòng sử dụng biểu mẫu Đăng ký bằng Email & OTP ngay bên dưới.'
    );
  }
}
