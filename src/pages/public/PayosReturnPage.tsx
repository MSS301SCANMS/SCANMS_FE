import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { PayosOrderPayment } from '../../components/checkout/PayosOrderPayment';
import { toast } from '../../utils/toast';
import PaymentStatusPage from '../finance/PaymentStatusPage';
import { usesLegacyCheckout } from '../../services/checkout.service';

export default function PayosReturnPage() {
  const [params] = useSearchParams();
  if (params.get('payment')) return <PaymentStatusPage />;
  return <OrderPayosReturnPage />;
}

function OrderPayosReturnPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderCode = params.get('order') || '';
  const [status, setStatus] = useState<'loading' | 'PAID' | 'WAITING_PAYMENT' | 'CANCELLED' | 'error'>('loading');
  const [confirmedOrderCode, setConfirmedOrderCode] = useState('');
  const loggedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());

  useEffect(() => {
    if (!usesLegacyCheckout || !loggedIn || !orderCode) return;
    let active = true;
    const refresh = async () => {
      try {
        const response: any = await api.get(`/orders/payos/${encodeURIComponent(orderCode)}/status`, {
          headers: { 'x-skip-cache': 'true' },
        });
        const data = response?.data?.data || response?.data || response;
        if (active) {
          setStatus(data.paymentStatus === 'PAID' ? 'PAID' : data.orderStatus === 'CANCELLED' ? 'CANCELLED' : 'WAITING_PAYMENT');
          if (data.paymentStatus === 'PAID') setConfirmedOrderCode(orderCode);
        }
      } catch {
        if (active) setStatus('error');
      }
    };
    void refresh();
    return () => { active = false; };
  }, [loggedIn, orderCode]);

  useEffect(() => {
    if (!loggedIn || !orderCode || status !== 'PAID' || confirmedOrderCode !== orderCode) return;
    navigate('/customer/orders', { replace: true, state: { placedOrderCodes: [orderCode] } });
    toast.success('Thanh toán thành công. Bạn có thể theo dõi đơn trong Đơn mua.');
  }, [loggedIn, orderCode, confirmedOrderCode, status, navigate]);

  const icon = status === 'PAID' ? <CheckCircle2 className="h-10 w-10 text-[#B88E4F]" />
    : status === 'error' ? <AlertCircle className="h-10 w-10 text-[#DC2626]" />
    : <Clock3 className="h-10 w-10 text-[#B88E4F]" />;
  const title = status === 'PAID' ? 'Thanh toán thành công'
    : status === 'CANCELLED' ? 'Đơn hàng đã hủy'
    : status === 'error' ? 'Chưa kiểm tra được thanh toán'
    : 'Đang chờ PayOS xác nhận';

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-16 text-[#1A1612]">
      <div className="mx-auto max-w-lg rounded-3xl border border-[#EAE4D7] bg-white p-8 text-center shadow-sm">
        <div className="mb-5 flex justify-center">{icon}</div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-3 text-sm text-[#7D715E]">
          {!loggedIn ? 'Đăng nhập để xem trạng thái thanh toán của đơn hàng.'
            : !orderCode ? 'Liên kết chưa có mã đơn hàng. Vui lòng mở thanh toán từ mục Đơn mua.'
            : status === 'CANCELLED' ? 'Đơn này không còn nhận thanh toán.'
            : status === 'PAID' ? `Đơn ${orderCode} đã được xác nhận thanh toán.`
            : 'Trang PayOS chuyển hướng về không tự xác nhận tiền. SCANMS đang kiểm tra kết quả từ máy chủ PayOS.'}
        </p>
        {loggedIn && orderCode && ((!usesLegacyCheckout && status === 'loading') || status === 'WAITING_PAYMENT' || status === 'error') && (
          <div className="mt-5"><PayosOrderPayment key={orderCode} orderCode={orderCode} onPaid={() => { setConfirmedOrderCode(orderCode); setStatus('PAID'); }} /></div>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!loggedIn ? (
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className="rounded-xl bg-[#C59B58] px-5 py-3 text-sm font-bold text-[#1A1612]">Đăng nhập</Link>
          ) : (
            <Link to="/customer/orders" className="rounded-xl bg-[#C59B58] px-5 py-3 text-sm font-bold text-[#1A1612]">Xem đơn mua</Link>
          )}
          <Link to="/marketplace" className="rounded-xl border border-[#EAE4D7] px-5 py-3 text-sm font-bold">Về sàn</Link>
        </div>
      </div>
    </main>
  );
}
