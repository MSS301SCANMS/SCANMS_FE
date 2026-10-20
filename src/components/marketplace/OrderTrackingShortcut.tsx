import { useState, type Ref } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Truck } from 'lucide-react';
import './OrderTrackingShortcut.css';

export function OrderTrackingShortcut({ sectionRef }: { sectionRef: Ref<HTMLElement> }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'orderSn' | 'phone'>('orderSn');
  return (
    <section ref={sectionRef} id="tracking-section" aria-labelledby="tracking-shortcut-title" className="scroll-mt-36 border-t border-[#EAE4D7] bg-[#F3EFE6] py-8">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
        <div className="grid gap-5 rounded-2xl border border-[#EAE4D7] bg-white p-5 text-left lg:grid-cols-[260px_1fr] lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]"><Truck size={22} /></span>
            <div><h2 id="tracking-shortcut-title" className="m-0 text-base font-black">Đơn hàng của bạn đến đâu?</h2><Link to="/tracking" className="mt-1 inline-flex items-center gap-1 text-xs text-[#7D715E] hover:text-[#B88E4F]">Tra cứu và đánh giá<ArrowRight size={13} /></Link></div>
          </div>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) navigate(`/tracking?${new URLSearchParams({ [kind]: query.trim() })}`);
          }} className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="tracking-kind">Loại thông tin tra cứu</label>
            <select id="tracking-kind" value={kind} onChange={(event) => setKind(event.target.value as 'orderSn' | 'phone')} className="tracking-kind-select rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs outline-[#C59B58]"><option value="orderSn">Mã đơn hàng</option><option value="phone">Số điện thoại</option></select>
            <label className="sr-only" htmlFor="tracking-shortcut-query">{kind === 'phone' ? 'Số điện thoại đặt hàng' : 'Mã đơn hàng'}</label>
            <input id="tracking-shortcut-query" required value={query} onChange={(event) => setQuery(event.target.value)} inputMode={kind === 'phone' ? 'tel' : 'text'} maxLength={100} placeholder={kind === 'phone' ? 'Nhập số điện thoại đặt hàng' : 'Nhập mã đơn hàng của bạn'} className="min-h-11 min-w-0 flex-1 basis-44 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs outline-[#C59B58]" />
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-[#231D15] hover:bg-[#B88E4F]"><Package size={16} />Tra cứu</button>
          </form>
        </div>
      </div>
    </section>
  );
}
