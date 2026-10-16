import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService, type UserProfile } from '../services/auth.service';
import type { RoleName } from '../types/backend.generated';

export default function SessionGate({ children, roles }: { children: ReactNode; roles?: RoleName[] }) {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const expired = (event: Event) => {
      if ((event as CustomEvent).detail?.userId === null) {
        setUser(null); setLoading(false); setError('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
      }
    };
    window.addEventListener('scanms_auth_changed', expired);
    return () => window.removeEventListener('scanms_auth_changed', expired);
  }, []);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setUser(null);
    if (!sessionStorage.getItem('scanms-access-token')) { setLoading(false); return; }
    authService.getMe().then(fresh => { if (active) setUser(fresh); })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [location.pathname, retry]);
  if (loading) return <p role="status">Đang kiểm tra tài khoản…</p>;
  if (!user) return <section className="rounded-2xl border bg-white p-6 space-y-3"><h1 className="font-bold text-xl">Đăng nhập để tiếp tục</h1>{error && <p role="alert" className="text-red-700">{error}</p>}<Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} className="text-[#B88E4F] font-bold underline">Đăng nhập tài khoản</Link>{error && <button onClick={() => setRetry(value => value + 1)} className="block underline">Thử lại</button>}</section>;
  if (user.status !== 'ACTIVE' || (roles && !roles.some(role => user.roles.includes(role)))) return <p role="alert" className="bg-white border p-6 rounded-2xl">Tài khoản hiện tại không có quyền truy cập mục này.</p>;
  return <>{children}</>;
}
