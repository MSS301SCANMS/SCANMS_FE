import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { finishKeycloakLogin, startKeycloakLogin } from '../../services/keycloak.service';
import { usesLegacyCheckout } from '../../services/checkout.service';

export default function FinanceLoginPage() {
  const location = useLocation(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const started = useRef(false);
  const callback = location.pathname.endsWith('/callback');
  useEffect(() => {
    if (!callback || started.current) return; started.current = true; setBusy(true);
    void finishKeycloakLogin().then(path => navigate(path, { replace: true })).catch(e => { setError(e.response?.data?.message || e.message || 'Đăng nhập thất bại'); setBusy(false); });
  }, [callback, navigate]);
  if (usesLegacyCheckout && !callback) return <Navigate replace to={`/login?redirect=${encodeURIComponent(params.get('redirect') || '/customer/wallet')}`} />;
  return <main className="min-h-screen bg-[#FAF8F5] p-8"><section className="mx-auto mt-12 max-w-lg space-y-5 rounded-2xl border bg-white p-7"><h1 className="text-2xl font-bold">Đăng nhập SCANMS</h1><p>Tài khoản được xác thực qua Keycloak để sử dụng dịch vụ thanh toán và ví.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {busy ? <p>Đang xác thực tài khoản…</p> : <button className="rounded-xl bg-[#C59B58] px-5 py-3 font-semibold text-white" onClick={() => { setBusy(true); void startKeycloakLogin(params.get('redirect') || '/customer/wallet').catch(e => { setError(e.message); setBusy(false); }); }}>Đăng nhập qua Keycloak</button>}
    <Link to="/" className="block underline">Về trang chủ</Link></section></main>;
}
