import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { usesLegacyCheckout } from '../../services/checkout.service';

export default function RedirectHandlerPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    const resolve = async () => {
      if (!shortCode) { setError('Liên kết không hợp lệ.'); return; }
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');
      if (usesLegacyCheckout) {
        window.location.replace(`${apiUrl.replace(/\/api(?:\/v\d+)?$/, '')}/r/${encodeURIComponent(shortCode)}${window.location.search}`);
        return;
      }
      try {
        // A shared link works for guests and must not depend on a stored login token.
        const response = await axios.get(`${apiUrl}/referrals/resolve/${encodeURIComponent(shortCode)}`, { signal: controller.signal, timeout: 20000 });
        const link = response.data?.result;
        if (!link || !/^[A-Za-z0-9_-]{1,100}$/.test(link.productId) || !/^[A-Za-z0-9_-]{1,100}$/.test(link.referralLinkId))
          throw new Error('invalid-response');
        if (!controller.signal.aborted) window.location.replace(`/products/${encodeURIComponent(link.productId)}?ref=${encodeURIComponent(link.referralLinkId)}`);
      } catch (cause) {
        if (controller.signal.aborted) return;
        const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
        setError(status === 404 ? 'Liên kết không tồn tại.' : status === 410 ? 'Liên kết đã hết hạn hoặc ngừng hoạt động.'
          : status === 409 ? 'Sản phẩm hoặc gian hàng hiện không khả dụng.' : 'Chưa mở được liên kết. Vui lòng thử lại sau.');
      }
    };
    void resolve();
    return () => controller.abort();
  }, [shortCode, attempt]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#EAE4D7] p-8 max-w-md w-full text-center">
        {error ? <AlertCircle className="mx-auto mb-4 text-[#B88E4F]" size={32} /> : <Loader2 className="animate-spin mx-auto mb-4 text-[#B88E4F]" size={32} />}
        <h1 className="text-lg font-bold mb-2">{error ? 'Chưa thể mở liên kết' : 'Đang mở sản phẩm…'}</h1>
        <p role={error ? 'alert' : 'status'} className="text-sm text-[#7D715E]">{error || 'Vui lòng chờ trong giây lát.'}</p>
        {error && <div className="mt-6 flex justify-center gap-4 items-center text-sm"><button type="button" onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-2 rounded-xl border border-[#EAE4D7] px-4 py-2"><RefreshCw size={15} />Thử lại</button><Link to="/marketplace" className="underline">Về sàn mua sắm</Link></div>}
      </div>
    </main>
  );
}
