import { useState } from 'react';
import { ChevronDown, Search, Store } from 'lucide-react';
import type { WalletSummary } from '../../types/wallet.types';

const labels = { APPROVED: 'Đã duyệt hợp tác', PENDING: 'Chờ duyệt', REJECTED: 'Đã từ chối', BLOCKED: 'Đã ngừng hợp tác' };
export function WalletCooperationStores({ stores = [] }: { stores?: WalletSummary['cooperationStores'] }) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const money = (value: string) => `${Number(value).toLocaleString('vi-VN')} đ`;
  const list = stores.filter(store => store.storeName.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  return <section className="overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white">
    <button type="button" aria-expanded={open} aria-controls="wallet-cooperation-shops" onClick={() => setOpen(value => !value)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FAF8F5]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]"><Store size={18} /></span>
      <span className="flex-1"><span className="text-sm font-semibold text-[#1A1612]">Gian hàng hợp tác <span className="ml-1 text-xs font-normal text-[#7D715E]">({stores.length})</span></span><span className="mt-0.5 block text-xs text-[#7D715E]">Trạng thái hợp tác và hoa hồng theo từng Shop.</span></span>
      <ChevronDown size={17} className={`text-[#B88E4F] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id="wallet-cooperation-shops" className="border-t border-[#EAE4D7] p-4">
      <p className="mb-3 text-xs leading-relaxed text-[#7D715E]">KOL có thể hợp tác với nhiều Shop. Danh sách rút tiền chỉ gồm Shop đã có ví hoa hồng; được duyệt hợp tác chưa đồng nghĩa đã phát sinh thu nhập.</p>
      {stores.length > 6 && <label className="mb-3 flex max-w-sm items-center gap-2 rounded-xl border border-[#EAE4D7] px-3 py-2 text-[#7D715E]"><Search size={15} /><input aria-label="Tìm gian hàng hợp tác" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên Shop…" className="w-full bg-transparent text-xs outline-none" /></label>}
      <div className="max-h-80 overflow-auto rounded-xl border border-[#EAE4D7]">
        <table className="w-full min-w-[530px] text-left text-xs">
          <thead className="sticky top-0 bg-[#FAF8F5] text-[#7D715E]"><tr><th className="px-3 py-2.5 font-medium">Gian hàng</th><th className="px-3 py-2.5 font-medium">Hợp tác</th><th className="px-3 py-2.5 text-right font-medium">Khả dụng</th><th className="px-3 py-2.5 text-right font-medium">Chờ duyệt</th></tr></thead>
          <tbody>{list.map(store => <tr key={store.storeId} className="border-t border-[#EAE4D7]">
            <td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EAE4D7] bg-white">{store.logoUrl ? <img src={store.logoUrl} alt="" className="h-full w-full object-contain" /> : <Store size={16} className="text-[#B88E4F]" />}</span><div><span className="font-semibold text-[#1A1612]">{store.storeName}</span>{!store.hasWallet && <span className="mt-0.5 block text-[10px] text-[#7D715E]">Chưa phát sinh hoa hồng</span>}</div></div></td>
            <td className="px-3 py-3"><span className="rounded-md bg-[#FBF5EB] px-2 py-1 text-[#7D715E]">{labels[store.status]}</span>{store.status === 'PENDING' && <span className="mt-1 block text-[10px] text-[#7D715E]">{store.requestedByKol ? 'Đã gửi yêu cầu đến Shop' : 'Shop đã mời · Chờ bạn xác nhận'}</span>}</td>
            <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#1A1612]">{money(store.availableBalance)}</td><td className="px-3 py-3 text-right tabular-nums text-[#7D715E]">{money(store.pendingBalance)}</td>
          </tr>)}</tbody>
        </table>
        {!list.length && <p className="p-5 text-center text-xs text-[#7D715E]">{query ? 'Không tìm thấy Shop phù hợp.' : 'Chưa có quan hệ hợp tác với Shop nào.'}</p>}
      </div>
    </div>}
  </section>;
}
