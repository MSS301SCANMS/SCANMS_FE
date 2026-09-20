import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Gift, ShoppingBag, Ticket, Trash2 } from 'lucide-react';
import {
  buyerVoucherService,
  type BuyerVoucher,
} from '../../services/buyer-voucher.service';
import { hasAuthenticatedSession } from '../../utils/authRedirect';

export default function BuyerVouchersPage() {
  const [vouchers, setVouchers] = useState<BuyerVoucher[]>(() => buyerVoucherService.list());

  useEffect(() => {
    const refresh = () => setVouchers(buyerVoucherService.list());
    window.addEventListener('scanms:vouchers-changed', refresh);
    return () => window.removeEventListener('scanms:vouchers-changed', refresh);
  }, []);

  if (!hasAuthenticatedSession()) {
    return <Navigate to="/login?redirect=%2Fmy-vouchers" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-8 text-[#1A1612] sm:px-6">
      <main className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/marketplace" className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#7D715E] hover:text-[#B88E4F]">
              <ArrowLeft className="h-4 w-4" /> Quay lại mua sắm
            </Link>
            <h1 className="m-0 flex items-center gap-2 text-2xl font-black sm:text-3xl">
              <Gift className="h-7 w-7 text-[#B88E4F]" /> Ví voucher của tôi
            </h1>
            <p className="mt-1 text-sm text-[#7D715E]">Các mã bạn đã săn và lưu bằng tài khoản hiện tại.</p>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#C59B58] px-4 py-2.5 text-xs font-black text-white hover:bg-[#B88E4F]">
            <ShoppingBag className="h-4 w-4" /> Săn thêm voucher
          </Link>
        </div>

        {vouchers.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#D7C39F] bg-white px-6 py-16 text-center">
            <Ticket className="mx-auto mb-3 h-12 w-12 text-[#B88E4F]" />
            <h2 className="text-lg font-black">Bạn chưa săn voucher nào</h2>
            <p className="mt-1 text-sm text-[#7D715E]">Lưu voucher ở trang sản phẩm, sau đó chọn trực tiếp khi thanh toán.</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {vouchers.map((voucher) => (
              <article key={voucher.id} className="relative overflow-hidden rounded-3xl border border-[#EEDFC6] bg-white p-5 shadow-xs">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#C59B58]" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="rounded-md bg-[#FBF5EB] px-2 py-1 text-[10px] font-black uppercase text-[#8C6226]">{voucher.scope}</span>
                    <h2 className="mb-1 mt-3 font-mono text-lg font-black">{voucher.code}</h2>
                    <p className="m-0 text-sm font-bold">{voucher.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#7D715E]">{voucher.description}</p>
                    {voucher.expiresAt && (
                      <p className="mt-3 text-[11px] font-semibold text-[#B88E4F]">Hạn dùng: {new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => buyerVoucherService.remove(voucher.code)}
                    aria-label={`Xóa voucher ${voucher.code}`}
                    className="rounded-xl p-2 text-[#A49B8B] hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Link to={`/marketplace?voucher=${encodeURIComponent(voucher.code)}`} className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#C59B58] px-3 py-2 text-xs font-black text-[#8C6226] hover:bg-[#FBF5EB]">
                  Dùng voucher này
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
