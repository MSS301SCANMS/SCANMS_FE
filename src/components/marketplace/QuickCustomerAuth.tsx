import { useEffect, useRef, useState } from 'react';
import { Loader2, LockKeyhole, X } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { GoogleOfficialButton } from '@/components/auth/GoogleOfficialButton';

export function QuickCustomerAuth({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const run = async (operation: () => Promise<unknown>, finish = true) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
      if (finish) {
        if (!authService.getCurrentUser() || !localStorage.getItem('token')) throw new Error('Chưa xác thực được tài khoản.');
        onSuccess();
      }
    } catch (cause: unknown) {
      const failure = cause as { response?: { data?: { message?: string | string[] } }; message?: string };
      const message = failure.response?.data?.message || failure.message || 'Chưa thể đăng nhập. Vui lòng thử lại.';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const normalizedEmail = identifier.trim().toLowerCase();

  return (
    <dialog ref={dialog} aria-labelledby="quick-auth-title" aria-describedby="quick-auth-description"
      onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !submitting.current) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-3xl border border-[#EAE4D7] bg-white p-6 text-left text-[#1A1612] shadow-2xl backdrop:bg-[#231D15]/50 backdrop:backdrop-blur-sm sm:p-8">
      <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng đăng nhập, giữ sản phẩm trong giỏ" className="absolute right-4 top-4 rounded-full p-2 text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-40"><X size={19} /></button>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><LockKeyhole size={23} /></span>
      <p className="mb-1 text-[10px] font-black tracking-[0.15em] text-[#B88E4F]">SCANMS · MUA SẮM LIỀN MẠCH</p>
      <h2 id="quick-auth-title" className="m-0 text-xl font-black">{mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản bằng OTP'}</h2>
      <p id="quick-auth-description" className="mb-5 mt-2 text-xs leading-5 text-[#7D715E]">Sản phẩm đã được lưu trong giỏ. Bạn tiếp tục ngay tại đây sau khi xác thực.</p>
      <div aria-busy={busy} className={busy ? 'pointer-events-none opacity-60' : ''}><GoogleOfficialButton onSuccess={(token) => void run(() => authService.googleLogin(token, 'CUSTOMER'))} onError={setError} text="continue_with" /></div>
      <div className="my-4 flex items-center gap-3 text-[10px] text-[#7D715E]"><span className="h-px flex-1 bg-[#EAE4D7]" />{mode === 'login' ? 'hoặc dùng email / số điện thoại' : 'hoặc đăng ký bằng email'}<span className="h-px flex-1 bg-[#EAE4D7]" /></div>
      <form onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          if (mode === 'register') {
            if (sentTo !== normalizedEmail) throw new Error('Vui lòng gửi OTP đến email hiện tại trước.');
            await authService.register({ email: normalizedEmail, password, fullName: name.trim(), otp, role: 'CUSTOMER' });
            setMode('login');
          }
          await authService.login(mode === 'login' ? identifier.trim() : normalizedEmail, password);
        });
      }} className="space-y-3">
        {mode === 'register' && <label className="block text-xs font-semibold">Họ và tên<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={150} className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-3 text-sm outline-[#C59B58]" /></label>}
        <label className="block text-xs font-semibold">{mode === 'login' ? 'Email hoặc số điện thoại' : 'Email'}<input required type={mode === 'login' ? 'text' : 'email'} value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete={mode === 'login' ? 'username' : 'email'} placeholder={mode === 'login' ? 'Email hoặc SĐT đã đăng ký' : 'Email nhận mã OTP'} autoFocus maxLength={254} className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-3 text-sm outline-[#C59B58]" /></label>
        <label className="block text-xs font-semibold">Mật khẩu<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} maxLength={128} className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-3 text-sm outline-[#C59B58]" /></label>
        {mode === 'register' && <div className="space-y-2">
          <button type="button" disabled={busy || cooldown > 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)} onClick={() => void run(async () => { await authService.sendOtp(normalizedEmail); setSentTo(normalizedEmail); setCooldown(60); }, false)} className="min-h-10 text-xs font-bold text-[#B88E4F] disabled:text-[#7D715E]">{cooldown ? `Gửi lại sau ${cooldown}s` : 'Gửi mã OTP xác thực email'}</button>
          {sentTo && <p role="status" className="text-xs text-[#7D715E]">Đã gửi mã xác thực tới {sentTo}. Mã có hiệu lực 5 phút.</p>}
          <label className="block text-xs font-semibold">Mã OTP<input required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] px-3 py-3 text-center text-base tracking-[0.4em] outline-[#C59B58]" /></label>
        </div>}
        {error && <p role="alert" className="rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5 p-3 text-xs leading-5 text-[#DC2626]">{error}</p>}
        <button type="submit" disabled={busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-4 text-sm font-bold text-[#231D15] hover:bg-[#B88E4F] disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}{mode === 'login' ? 'Đăng nhập an toàn' : 'Xác thực và tiếp tục'}</button>
      </form>
      <button type="button" disabled={busy} onClick={() => { setMode((value) => value === 'login' ? 'register' : 'login'); setError(''); }} className="mt-4 min-h-10 w-full text-xs font-semibold text-[#7D715E] hover:text-[#B88E4F]">{mode === 'login' ? 'Chưa có tài khoản? Đăng ký bằng OTP' : 'Đã có tài khoản? Đăng nhập'}</button>
    </dialog>
  );
}
