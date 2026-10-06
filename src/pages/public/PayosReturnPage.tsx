import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { authService } from '../../services/auth.service';

export default function PayosReturnPage() {
  const [params] = useSearchParams();
  const orderCode = params.get('order') || '';
  const [status, setStatus] = useState<'loading' | 'PAID' | 'WAITING_PAYMENT' | 'error'>('loading');
  const loggedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());

  useEffect(() => {
    if (!loggedIn || !orderCode) return;
    let active = true;
    const refresh = async () => {
      try {
        const response: any = await api.get(`/orders/payos/${encodeURIComponent(orderCode)}/status`, {
          headers: { 'x-skip-cache': 'true' },
        });
        const value = response?.data?.paymentStatus || response?.paymentStatus;
        if (active) setStatus(value === 'PAID' ? 'PAID' : 'WAITING_PAYMENT');
      } catch {
        if (active) setStatus('error');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loggedIn, orderCode]);

  const icon = status === 'PAID' ? <CheckCircle2 className="h-10 w-10 text-[#B88E4F]" />
    : status === 'error' ? <AlertCircle className="h-10 w-10 text-[#DC2626]" />
    : <Clock3 className="h-10 w-10 text-[#B88E4F]" />;
  const title = status === 'PAID' ? 'Thanh toán thành công'
    : status === 'error' ? 'Chưa kiểm tra được thanh toán'
    : 'Đang chờ PayOS xác nhận';

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-16 text-[#1A1612]">
      <div className="mx-auto max-w-lg rounded-3xl border border-[#EAE4D7] bg-white p-8 text-center shadow-sm">
        <div className="mb-5 flex justify-center">{icon}</div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-3 text-sm text-[#7D715E]">
          {!loggedIn ? 'Đăng nhập để xem trạng thái thanh toán của đơn hàng.'
            : status === 'PAID' ? `Đơn ${orderCode} đã được xác nhận thanh toán.`
            : 'Trang PayOS chuyển hướng về không tự xác nhận tiền. SCANMS đang kiểm tra kết quả từ máy chủ PayOS.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!loggedIn ? (
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className="rounded-xl bg-[#EBD08C] px-5 py-3 text-sm font-bold text-white">Đăng nhập</Link>
          ) : (
            <Link to="/customer/orders" className="rounded-xl bg-[#EBD08C] px-5 py-3 text-sm font-bold text-white">Xem đơn mua</Link>
          )}
          <Link to="/marketplace" className="rounded-xl border border-[#EAE4D7] px-5 py-3 text-sm font-bold">Về sàn</Link>
        </div>
      </div>
    </main>
  );
}
