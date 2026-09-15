import { toast } from './toast';

declare global {
  interface Window {
    google?: any;
  }
}

export function triggerGoogleSignIn(
  onSuccess: (idToken: string) => void,
  onError?: (errorMsg: string) => void,
) {
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1028788240521-ujoshj82g60v811p5fkqv3hh4iirqbt3.apps.googleusercontent.com';

  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    if (onError) {
      onError('Thư viện Google Identity Services đang tải hoặc bị chặn bởi trình duyệt. Vui lòng kiểm tra kết nối mạng.');
    } else {
      toast.error('Thư viện Google Identity Services đang tải hoặc bị chặn. Vui lòng kiểm tra kết nối mạng.');
    }
    return;
  }

  try {
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
    });

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        console.warn('Google prompt không hiển thị:', notification.getNotDisplayedReason?.());
        onError?.(
          `Google Sign-In prompt bị chặn (${notification.getNotDisplayedReason?.() || 'trình duyệt chặn popup/third-party cookies'}). Bạn có thể thêm http://localhost:5173 vào Authorized JavaScript Origins trên Google Cloud Console.`
        );
      }
    });
  } catch (err: any) {
    onError?.(err?.message || 'Lỗi khởi động Google Sign-In');
  }
}
