import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, Search, Store, PackageOpen } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { authService } from '../services/auth.service';
import type { ResourcePath } from '../services/backend-contract';
import { formatVnd } from '../services/domain-model';
import CreateResourceForm from '../features/backend/CreateResourceForm';
import { LivestreamMetrics, StoreMetrics } from '../features/backend/SalesMetrics';
import { canCreate } from '../features/backend/capabilities';
import { emptySnapshot, loadSnapshot, scopedSnapshot, referenceLabel, type Row } from '../features/backend/snapshot';
import { resourceConfig, fieldLabels, statusLabels } from '../features/backend/resource-config';
import { scanmsService } from '../services/scanms.service';

export type Area = 'customer' | 'merchant' | 'collaborator' | 'admin';
export type Section = 'catalog' | 'stores' | 'applications' | 'live' | 'vouchers' | 'orders' | 'finance' | 'affiliate' | 'policies';
const sections: Record<Section, ResourcePath[]> = {
  catalog: ['products', 'product-variants', 'product-images', 'product-categories', 'feedbacks'],
  stores: ['stores', 'store-applications'], applications: ['store-applications', 'stores', 'collaborators'],
  live: ['livestreams'], vouchers: ['vouchers', 'voucher-redemptions'],
  orders: ['orders', 'seller-orders', 'order-items', 'shipments', 'returns', 'discount-allocations', 'payments'],
  finance: ['wallets', 'wallet-transactions', 'withdrawals', 'settlements', 'bank-accounts'],
  affiliate: ['referrals', 'commissions', 'collaborators', 'commission-policies'],
  policies: ['commission-policies', 'fee-configs'],
};
const sectionNames: Record<Section, string> = {
  catalog: 'Danh mục sản phẩm', stores: 'Gian hàng', applications: 'Đăng ký đối tác', live: 'Livestream',
  vouchers: 'Voucher & lượt sử dụng', orders: 'Đơn hàng & giao nhận', finance: 'Ví & dòng tiền',
  affiliate: 'Tiếp thị liên kết', policies: 'Chính sách hệ thống',
};
const amountFields = new Set(['priceVnd', 'unitPrice', 'payableVnd', 'amountVnd', 'netAmountVnd', 'discountAmountVnd',
  'netPaidAmountVnd', 'allocatedAmountVnd', 'availableBalanceVnd', 'heldBalanceVnd', 'balanceAfterVnd', 'basisVnd', 'refundAmount', 'fixedAmountVnd']);

export default function BackendResourcePage({ area, section }: { area: Area; section: Section }) {
  const user = authService.getCurrentUser();
  const location = useLocation();
  const [query, setQuery] = useSearchParams();
  const allowed = area === 'admin' && !user?.roles.includes('ADMIN')
    ? sections[section].filter(key => key !== 'payments' && key !== 'discount-allocations') : sections[section];
  const requested = query.get('resource') as ResourcePath;
  const initialResource = location.pathname.endsWith('/kol') && section === 'applications' ? 'collaborators'
    : location.pathname.includes('/payouts') && section === 'finance' ? 'settlements' : allowed[0];
  const resource = allowed.includes(requested) ? requested : initialResource;
  const config = resourceConfig[resource];
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [storeId, setStoreId] = useState(localStorage.getItem('current_store_id') || '');
  const [create, setCreate] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [saved, setSaved] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const userId = user?.userId;

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setDetail(null); setCreate(false); setSnapshot(emptySnapshot());
    loadSnapshot(resource, controller.signal).then(raw => {
      if (!controller.signal.aborted) setSnapshot(raw);
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure.message || 'Không tải được dữ liệu.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [resource, refresh, userId]);

  if (!user) return null;
  const scoped = scopedSnapshot(snapshot, user, area);
  const ownStores = snapshot.stores.filter(row => row.ownerUserId === user.userId);
  const selectableStores = area === 'admin' && user.roles.includes('ADMIN') ? snapshot.stores : ownStores;
  const selectedStore = selectableStores.find(row => row.storeId === storeId) || selectableStores[0];
  const selectedStoreId = String(selectedStore?.storeId || '');
  const ownProductIds = new Set(scoped.products.filter(row => row.storeId === selectedStoreId).map(row => row.productId));
  let rows = scoped[resource];
  if (area === 'merchant' && selectedStoreId) {
    if (['products', 'livestreams', 'vouchers', 'seller-orders', 'settlements'].includes(resource)) rows = rows.filter(row => row.storeId === selectedStoreId);
    if (['product-images', 'product-variants', 'feedbacks'].includes(resource)) rows = rows.filter(row => ownProductIds.has(row.productId));
  }
  rows = rows.filter(row => config.columns.some(key => String(row[key] ?? '').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))));
  const permittedCreate = !loading && !error && canCreate(resource, user, snapshot, selectedStoreId);

  function selectStore(value: string) { setStoreId(value); localStorage.setItem('current_store_id', value); }
  async function runAction(action: string) {
    if (!detail || actionBusy) return;
    setActionBusy(true); setActionError('');
    try {
      await scanmsService.action(resource, String(detail[config.id]), action);
      setDetail(null); setSaved('Đã cập nhật trạng thái.'); setRefresh(value => value + 1);
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Không thể cập nhật trạng thái.'); }
    finally { setActionBusy(false); }
  }
  function cell(row: Row, field: string) {
    const value = row[field];
    if (value === null || value === undefined || value === '') return <span className="text-[#A09583]">Chưa có</span>;
    if (amountFields.has(field)) return formatVnd(value);
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (field === 'imageUrl') return <img src={String(value)} alt={String(row.altText || 'Ảnh sản phẩm')} className="w-14 h-14 object-cover rounded-lg" loading="lazy" />;
    const label = referenceLabel(snapshot, field, value);
    if (label) return label;
    if (field.endsWith('Id')) return <span title={String(value)} className="font-mono text-xs">{String(value).slice(0, 8)}…</span>;
    if (field.endsWith('At') || field === 'returnDeadline') return String(value).replace('T', ' ').replace(/\.\d+Z?$/, '').replace('Z', ' UTC');
    if (typeof value === 'object') return JSON.stringify(value);
    return statusLabels[String(value)] || String(value);
  }
  const relatedSellerIds = detail && resource === 'orders' ? scoped['seller-orders'].filter(row => row.orderId === detail.orderId).map(row => row.sellerOrderId)
    : detail && resource === 'seller-orders' ? [detail.sellerOrderId] : [];
  const items = scoped['order-items'].filter(row => relatedSellerIds.includes(row.sellerOrderId));

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold text-[#B88E4F] uppercase tracking-wider">SCANMS</p><h1 className="text-2xl font-black mt-1">{sectionNames[section]}</h1><p className="text-sm text-[#7D715E] mt-2">Dữ liệu được tải trực tiếp từ hệ thống.</p></div>
      <button onClick={() => setRefresh(value => value + 1)} disabled={loading} className="border border-[#EAE4D7] bg-white rounded-xl px-4 py-2 flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Tải lại</button>
    </header>
    {area === 'merchant' && <section className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
      <Store className="w-5 h-5 text-[#B88E4F]" />
      <label htmlFor="active-store" className="font-semibold text-sm">Gian hàng</label>
      <select id="active-store" value={selectedStoreId} onChange={event => selectStore(event.target.value)} className="border rounded-xl p-2 min-w-48"><option value="">Chọn shop</option>{selectableStores.map(row => <option key={String(row.storeId)} value={String(row.storeId)}>{String(row.name)}</option>)}</select>
      {selectedStore && <span className="text-sm text-[#7D715E]">{statusLabels[String(selectedStore.approvalStatus)] || String(selectedStore.approvalStatus)}</span>}
      {!loading && !error && !selectedStore && <Link className="text-[#B88E4F] underline text-sm" to="/customer/upgrade/shop">Gửi hồ sơ mở shop</Link>}
    </section>}
    <nav aria-label="Nhóm dữ liệu" className="flex flex-wrap gap-2">
      {allowed.map(key => <button key={key} onClick={() => { setQuery({ resource: key }); setSearch(''); }} className={`px-4 py-2 rounded-xl text-sm font-bold border ${resource === key ? 'bg-[#B88E4F] border-[#B88E4F] text-white' : 'bg-white border-[#EAE4D7] text-[#7D715E]'}`}>{resourceConfig[key].title}</button>)}
    </nav>
    {config.note && <p className="rounded-xl bg-[#F3EFE6] p-4 text-sm text-[#7D715E]">{config.note}</p>}
    {saved && <p role="status" className="bg-green-50 text-green-800 rounded-xl p-3">{saved}</p>}
    {error ? <section role="alert" className="rounded-2xl bg-red-50 border border-red-100 p-5 text-red-700"><p>{error}</p><button onClick={() => setRefresh(value => value + 1)} className="underline mt-3">Thử lại</button></section>
      : <section className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden">
        <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE4D7]">
          <label className="flex items-center gap-2 border rounded-xl px-3 py-2"><Search className="w-4 h-4 text-[#7D715E]" /><input aria-label="Tìm kiếm" placeholder="Tìm trong danh sách" value={search} onChange={event => setSearch(event.target.value)} className="outline-none bg-transparent" /></label>
          {permittedCreate && <button onClick={() => setCreate(true)} className="rounded-xl bg-[#B88E4F] text-white px-4 py-2 font-bold flex items-center gap-2"><Plus className="w-4 h-4" />{resource === 'store-applications' || resource === 'collaborators' ? 'Gửi hồ sơ' : 'Thêm mới'}</button>}
        </div>
        {loading ? <p role="status" className="p-8 text-center text-[#7D715E]">Đang tải dữ liệu…</p>
          : rows.length === 0 ? <div className="p-10 text-center text-[#7D715E] space-y-3"><PackageOpen className="w-8 h-8 mx-auto" /><p>Chưa có dữ liệu phù hợp.</p></div>
            : <div className="relative overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#FAF8F5]"><tr>{config.columns.map(field => <th key={field} className="text-left p-4 font-semibold whitespace-nowrap">{fieldLabels[field] || field}</th>)}<th className="p-4"><span className="sr-only">Chi tiết</span></th></tr></thead><tbody>{rows.map(row => <tr key={String(row[config.id])} className="border-t border-[#EAE4D7] hover:bg-[#FAF8F5]">{config.columns.map(field => <td key={field} className="p-4 max-w-72 break-words">{cell(row, field)}</td>)}<td className="p-4"><button onClick={() => setDetail(row)} className="text-[#B88E4F] font-bold whitespace-nowrap">Xem chi tiết</button></td></tr>)}</tbody></table></div>}
      </section>}
    {create && permittedCreate && <CreateResourceForm resource={resource} user={user} snapshot={snapshot} storeId={selectedStoreId} onClose={() => setCreate(false)} onSaved={() => { setCreate(false); setSaved('Đã lưu vào hệ thống.'); setRefresh(value => value + 1); }} />}
    {detail && <Modal isOpen onClose={() => setDetail(null)} title={config.title} maxWidth="2xl"><div className="space-y-4 max-h-[65vh] overflow-y-auto"><p className="text-xs text-[#7D715E] break-all">Mã: {String(detail[config.id])}</p><dl className="grid grid-cols-2 gap-4">{config.columns.map(field => <div key={field}><dt className="text-xs text-[#7D715E]">{fieldLabels[field] || field}</dt><dd className="font-semibold mt-1 break-words">{cell(detail, field)}</dd></div>)}</dl>
      {detail.description !== undefined && <p>{String(detail.description || '')}</p>}
      {resource === 'stores' && (detail.ownerUserId === user.userId || user.roles.includes('ADMIN')) &&
        <StoreMetrics storeId={String(detail.storeId)} />}
      {resource === 'livestreams' && (user.roles.includes('ADMIN') || (detail.storeId === selectedStoreId && selectedStore?.ownerUserId === user.userId)) &&
        <LivestreamMetrics livestreamId={String(detail.livestreamId)} />}
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{actionError}</p>}
      {resource === 'store-applications' && (user.roles.includes('ADMIN') || user.roles.includes('MANAGER')) && detail.status === 'PENDING' &&
        <div className="flex gap-2"><button disabled={actionBusy} onClick={() => void runAction('approve')} className="rounded-xl bg-green-700 px-4 py-2 text-white disabled:opacity-50">Duyệt hồ sơ</button><button disabled={actionBusy} onClick={() => void runAction('reject')} className="rounded-xl bg-red-700 px-4 py-2 text-white disabled:opacity-50">Từ chối</button></div>}
      {resource === 'stores' && (user.roles.includes('ADMIN') || user.roles.includes('MANAGER')) && ['APPROVED', 'SUSPENDED'].includes(String(detail.approvalStatus)) &&
        <button disabled={actionBusy} onClick={() => void runAction(detail.approvalStatus === 'APPROVED' ? 'suspend' : 'activate')} className="rounded-xl bg-[#B88E4F] px-4 py-2 text-white disabled:opacity-50">{detail.approvalStatus === 'APPROVED' ? 'Tạm dừng shop' : 'Kích hoạt shop'}</button>}
      {resource === 'livestreams' && (user.roles.includes('ADMIN') || (detail.storeId === selectedStoreId && selectedStore?.ownerUserId === user.userId)) && ['SCHEDULED', 'LIVE'].includes(String(detail.status)) &&
        <button disabled={actionBusy} onClick={() => void runAction(detail.status === 'LIVE' ? 'end' : 'start')} className="rounded-xl bg-[#B88E4F] px-4 py-2 text-white disabled:opacity-50">{detail.status === 'LIVE' ? 'Kết thúc live' : 'Bắt đầu live'}</button>}
      {resource === 'feedbacks' && detail.status === 'ACTIVE' && (user.roles.includes('ADMIN') || user.roles.includes('MANAGER')) &&
        <button disabled={actionBusy} onClick={() => void runAction('hide')} className="rounded-xl bg-[#B88E4F] px-4 py-2 text-white disabled:opacity-50">Ẩn đánh giá</button>}
      {detail.attributes && typeof detail.attributes === 'object' ? <dl className="space-y-2">{Object.entries(detail.attributes).map(([key, value]) => <div key={key} className="flex gap-2"><dt className="text-[#7D715E]">{key}:</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl> : null}
      {items.length > 0 && <section><h3 className="font-bold mb-2">Sản phẩm trong đơn</h3>{items.map(item => <p key={String(item.orderItemId)} className="py-2 border-t">{referenceLabel(snapshot, 'productId', item.productId) || String(item.productId)} · {String(item.quantity)} sản phẩm · Khách trả {formatVnd(item.netPaidAmountVnd)}</p>)}</section>}
      {Boolean(detail.returnDeadline) && <p className="text-sm text-[#7D715E]">Thời hạn trả hàng lấy từ ngày giao thành công của đơn theo shop.</p>}
    </div></Modal>}
  </div>;
}
