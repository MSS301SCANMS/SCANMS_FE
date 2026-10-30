import { useEffect, useState } from 'react';
import { liveCommerceService, liveCommerceErrorMessage, type LiveCommerce } from '../../services/live-commerce.service';
import api from '../../services/api';
import { unwrapApi } from '../../utils/api-response';
import { toast } from '../../utils/toast';

type Product = { id: string; title: string; variants?: { id: string; name?: string; size?: string; color?: string; price?: number; stockQuantity: number; isActive?: boolean }[] };
const money = (value: number) => Number(value).toLocaleString('vi-VN') + 'đ';
const field = 'w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2 text-sm';
const button = 'rounded-xl bg-[#C59B58] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';
const utc = (value: string) => value ? new Date(value).toISOString() : undefined;

export function LiveCommercePanel({ sessionId, storeId, products, onChanged }: {
  sessionId: string; storeId: string; products: Product[]; onChanged: (state: LiveCommerce) => void;
}) {
  const [data, setData] = useState<LiveCommerce>({ offers: [], voucherDrops: [] });
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [variantId, setVariantId] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minutes, setMinutes] = useState('10');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [voucherId, setVoucherId] = useState('');
  const [dropQuantity, setDropQuantity] = useState('10');
  const [releaseAt, setReleaseAt] = useState('');
  const [dropMinutes, setDropMinutes] = useState('5');
  const [createNew, setCreateNew] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('30000');
  const [minimum, setMinimum] = useState('250000');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const product = products.find(item => item.id === productId);
  const variants = product?.variants?.filter(row => row.isActive !== false && row.stockQuantity > 0) || [];
  const variant = variants.find(row => row.id === variantId);

  useEffect(() => {
    let active = true;
    void Promise.all([liveCommerceService.get(sessionId, true), api.get('/vouchers', { headers: { 'x-skip-cache': 'true' } }), api.get('/vouchers/public/platform', { params: { storeId }, headers: { 'x-skip-cache': 'true' } })])
      .then(([state, own, platform]) => {
        if (!active) return;
        setData(state);
        const rows = [...(unwrapApi<any[]>(own) || []), ...(unwrapApi<any[]>(platform) || [])];
        const now = Date.now();
        setCoupons(rows.filter(row => (!row.storeId || row.storeId === storeId) && (!row.livestreamId || row.livestreamId === sessionId) && new Date(String(row.validUntil).replace(/Z$/, '') + 'Z').getTime() > now));
      }).catch(() => { if (active) setError('Chưa tải được ưu đãi của shop. Hãy đóng và mở lại bảng điều khiển.'); });
    return () => { active = false; };
  }, [sessionId, storeId]);

  useEffect(() => { setVariantId(''); setPrice(''); }, [productId]);
  const run = async (action: () => Promise<LiveCommerce>, message: string) => {
    if (busy) return;
    setBusy(true); setError('');
    try { const state = await action(); setData(state); onChanged(state); toast.success(message); }
    catch (reason: any) { setError(liveCommerceErrorMessage(reason)); }
    finally { setBusy(false); }
  };
  const saveOffer = () => run(() => liveCommerceService.offer(sessionId, {
    productId, variantId, priceVnd: Number(price), quantityLimit: Number(quantity),
    endsAt: new Date(Date.now() + Number(minutes) * 60000).toISOString(),
  }), 'Đã cập nhật giá live và ghim sản phẩm cho người xem.');
  const saveDrop = () => run(async () => {
    const start = utc(releaseAt) || new Date().toISOString();
    let end = new Date(new Date(start).getTime() + Number(dropMinutes) * 60000).toISOString();
    let selectedId = voucherId;
    if (createNew) {
      const created = unwrapApi<any>(await api.post('/vouchers', {
        code: code.trim().toUpperCase(), issuerType: 'STORE', storeId, livestreamId: sessionId, scopeType: 'LIVESTREAM',
        discountType: 'FIXED', value: Number(discount), minimumSubtotal: Number(minimum),
        validFrom: start.slice(0, -1), validUntil: end.slice(0, -1),
        limits: { totalUsageLimit: Number(dropQuantity), perCustomerLimit: 1 }, scope: { benefitType: 'GOODS' }, funding: { fundedBy: 'STORE' },
      }));
      selectedId = created.voucherId;
      setCoupons(previous => [created, ...previous]); setVoucherId(selectedId); setCreateNew(false);
    } else {
      const selected = coupons.find(row => row.voucherId === selectedId);
      const deadline = new Date(String(selected?.validUntil).replace(/Z$/, '') + 'Z').getTime();
      if (Number.isFinite(deadline)) end = new Date(Math.min(new Date(end).getTime(), deadline)).toISOString();
    }
    return liveCommerceService.drop(sessionId, { voucherId: selectedId, quantity: Number(dropQuantity), releaseAt: start, expiresAt: end });
  }, releaseAt ? 'Đã lên lịch tung voucher. Hệ thống tự hiển thị khi đến giờ.' : 'Đã tung voucher cho người xem.');

  return <div className="space-y-6 p-5" aria-label="Giá live và voucher">
    <section className="space-y-3 rounded-2xl border border-[#EAE4D7] p-4">
      <h3 className="font-bold">Giá bán trong live</h3>
      <p className="text-xs text-[#7D715E]">Giá riêng cho phân loại đã chọn trong phiên này. Giá bán ngoài livestream được quản lý ở Danh mục sản phẩm. Đơn đã tạo giữ nguyên giá đã chốt.</p>
      <label className="block text-sm">Sản phẩm<select className={field} value={productId} onChange={event => setProductId(event.target.value)}>{products.map(row => <option value={row.id} key={row.id}>{row.title}</option>)}</select></label>
      <label className="block text-sm">Phân loại<select className={field} value={variantId} onChange={event => { setVariantId(event.target.value); setPrice(String(variants.find(row => row.id === event.target.value)?.price || '')); }}><option value="">Chọn size / màu</option>{variants.map(row => <option key={row.id} value={row.id}>{row.name || [row.color, row.size].filter(Boolean).join(' / ')} · {money(Number(row.price))} · Kho {row.stockQuantity}</option>)}</select></label>
      <div className="grid grid-cols-3 gap-3"><label className="text-sm">Giá live<input aria-label="Giá live" className={field} type="number" min="1" max={variant?.price} value={price} onChange={event => setPrice(event.target.value)} /></label><label className="text-sm">Số lượng<input aria-label="Số lượng ưu đãi" className={field} type="number" min="1" max={variant?.stockQuantity} value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label className="text-sm">Số phút<input aria-label="Thời hạn giá live" className={field} type="number" min="1" max="1440" value={minutes} onChange={event => setMinutes(event.target.value)} /></label></div>
      {variant && Number(price) > Number(variant.price) && <p role="alert" className="text-xs text-rose-700">Giá live không được vượt giá bán của phân loại.</p>}
      <button className={button} disabled={busy || !variant || !Number.isSafeInteger(Number(price)) || Number(price) <= 0 || Number(price) > Number(variant.price) || !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > Number(variant?.stockQuantity) || Number(minutes) < 1 || Number(minutes) > 1440} onClick={() => void saveOffer()}>Áp dụng & ghim sản phẩm</button>
      {data.offers.filter(row => ['ACTIVE', 'SCHEDULED'].includes(row.status)).map(row => <div key={row.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FAF8F5] p-3 text-xs"><span>{products.find(item => item.id === row.productId)?.title} · {money(row.priceVnd)} · Còn {row.quantityLimit - row.reservedQuantity}</span><button disabled={busy} className="underline" onClick={() => void run(() => liveCommerceService.stopOffer(sessionId, row.id), 'Đã dừng giá ưu đãi.')}>Dừng ưu đãi</button></div>)}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#EAE4D7] p-4">
      <h3 className="font-bold">Tung voucher</h3>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createNew} onChange={event => setCreateNew(event.target.checked)} />Tạo mã riêng cho phiên live · Shop tài trợ</label>
      {createNew ? <div className="grid grid-cols-3 gap-3"><label className="text-sm">Mã voucher<input className={field} value={code} maxLength={50} onChange={event => setCode(event.target.value)} /></label><label className="text-sm">Giảm tiền hàng<input className={field} type="number" min="1" value={discount} onChange={event => setDiscount(event.target.value)} /></label><label className="text-sm">Đơn tối thiểu<input className={field} type="number" min="0" value={minimum} onChange={event => setMinimum(event.target.value)} /></label></div> : <label className="block text-sm">Voucher có sẵn<select className={field} value={voucherId} onChange={event => setVoucherId(event.target.value)}><option value="">Chọn voucher shop hoặc sàn</option>{coupons.map(row => <option key={row.voucherId} value={row.voucherId}>{row.code} · {row.issuerType === 'PLATFORM' ? 'Sàn tài trợ' : 'Shop tài trợ'}</option>)}</select></label>}
      <div className="grid grid-cols-3 gap-3"><label className="text-sm">Số lượt giới thiệu<input className={field} type="number" min="1" max="10000" value={dropQuantity} onChange={event => setDropQuantity(event.target.value)} /></label><label className="text-sm">Tung theo lịch<input className={field} type="datetime-local" value={releaseAt} onChange={event => setReleaseAt(event.target.value)} /></label><label className="text-sm">Hiển thị trong (phút)<input className={field} type="number" min="1" max="1440" value={dropMinutes} onChange={event => setDropMinutes(event.target.value)} /></label></div>
      <p className="text-xs text-[#7D715E]">Để trống lịch để tung ngay. Với mã có sẵn, số lượt giới thiệu không tăng ngân sách hoặc thay điều kiện mã. Mỗi đơn dùng tối đa 1 mã tiền hàng và 1 mã vận chuyển.</p>
      <button className={button} disabled={busy || (createNew ? !code.trim() || Number(discount) <= 0 : !voucherId) || Number(dropQuantity) < 1 || Number(dropMinutes) < 1} onClick={() => void saveDrop()}>{releaseAt ? 'Lên lịch tung voucher' : 'Tung voucher ngay'}</button>
      {data.voucherDrops.filter(row => ['PUBLISHED', 'SCHEDULED'].includes(row.status)).map(row => <div className="flex justify-between rounded-xl bg-[#FAF8F5] p-3 text-xs" key={row.id}><span>{row.code} · {row.status === 'SCHEDULED' ? `Hẹn ${new Date(row.releaseAt).toLocaleString('vi-VN')}` : 'Đang giới thiệu'}</span><button disabled={busy} className="underline" onClick={() => void run(() => liveCommerceService.cancelDrop(sessionId, row.id), 'Đã dừng giới thiệu voucher.')}>Dừng</button></div>)}
    </section>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
