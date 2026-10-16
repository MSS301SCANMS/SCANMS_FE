import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { startKeycloakLogin, finishKeycloakLogin } from '../../services/keycloak';
import { authService } from '../../services/auth.service';

export default function IdentityPage({ mode = 'login' }: { mode?: 'login' | 'register' | 'callback' }) {
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [busy, setBusy] = useState(mode === 'callback');
  const [error, setError] = useState('');
  useEffect(() => {
    if (mode !== 'callback' || started.current) return;
    started.current = true;
    finishKeycloakLogin(query).then(async returnTo => {
      // /users/me is authoritative for the internal user UUID and role set.
      await authService.getMe();
      navigate(returnTo, { replace: true });
    }).catch(failure => { setError(failure.message); setBusy(false); });
  }, [mode, query, navigate]);
  async function signIn() {
    setBusy(true); setError('');
    try { await startKeycloakLogin(mode === 'register' ? 'register' : 'login', query.get('returnTo') || '/portal'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Không mở được trang đăng nhập.'); setBusy(false); }
  }
  return <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
    <section className="w-full max-w-lg rounded-3xl bg-white border border-[#EAE4D7] p-8 shadow-sm space-y-5">
      <Link to="/" className="font-black text-xl text-[#B88E4F]">SCANMS</Link>
      <ShieldCheck className="text-[#B88E4F] w-10 h-10" />
      <h1 className="text-2xl font-bold">{mode === 'register' ? 'Tạo tài khoản' : mode === 'callback' ? 'Hoàn tất đăng nhập' : 'Đăng nhập tài khoản'}</h1>
      <p className="text-[#7D715E]">{mode === 'register' ? 'Tạo tài khoản khách hàng. Sau khi đăng nhập, bạn có thể gửi hồ sơ mở shop hoặc đăng ký KOL / CTV.' : 'Tiếp tục đến trang tài khoản để đăng nhập. Các vai trò đã được cấp sẽ dùng chung một tài khoản.'}</p>
      {error && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}
      <button disabled={busy} onClick={signIn} className="w-full rounded-xl bg-[#B88E4F] text-white p-3 font-bold disabled:opacity-50">{busy ? 'Đang xác thực…' : 'Tiếp tục'}</button>
      <Link className="block text-sm underline text-[#7D715E]" to={mode === 'register' ? '/login' : '/register'}>{mode === 'register' ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</Link>
    </section>
  </main>;
}
