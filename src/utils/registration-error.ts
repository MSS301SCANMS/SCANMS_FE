export function registrationErrorMessage(error: any): string {
  const message = String(error?.response?.data?.message || error?.message || '');
  const detail = message.toLowerCase();
  const status = error?.response?.status ?? error?.status;
  // Also handle older User Service instances that wrap a Keycloak 409 in HTTP 500.
  if (detail.includes('same email') || detail.startsWith('email đã')) {
    return 'Email đã được sử dụng. Vui lòng đăng nhập hoặc chọn Quên mật khẩu.';
  }
  if (detail.includes('same username') || detail.includes('tên đăng nhập đã')) {
    return 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.';
  }
  if (status === 409 || error?.response?.data?.code === 1000) {
    return 'Tên đăng nhập hoặc email đã tồn tại. Vui lòng đăng nhập hoặc dùng thông tin khác.';
  }
  if (error?.code === 'ERR_NETWORK' || detail.includes('network error')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
  }
  if (status === 503) return 'Chưa thể hoàn tất đăng ký. Vui lòng thử lại sau.';
  if (status === 400 && message && !/https?:|\bexception\b|\berrorMessage\b/i.test(message)) return message;
  return 'Đăng ký chưa thành công. Vui lòng kiểm tra thông tin hoặc thử lại sau.';
}
