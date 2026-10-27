import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Download, ExternalLink, Link2, Loader2, PackageSearch, Search, X } from 'lucide-react';
import QRCode from 'qrcode';
import { referralLinksService, type EligibleProduct, type ReferralLinkItem } from '../../services/referral-links.service';
import { Select } from '../../components/ui/Select';
import { DateTimePicker } from '../../components/common/DateTimePicker';
import './CreateReferralLinkModal.css';
import { productCommissionDeals, type ProductCommissionRate } from '../../services/product-commission-deals.service';

const channels = { TIKTOK: 'TikTok', FACEBOOK: 'Facebook', YOUTUBE: 'YouTube', INSTAGRAM: 'Instagram', WEBSITE: 'Trang web', OTHER: 'Khác' };
const searchText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const money = (value: number | string) => Number(value).toLocaleString('vi-VN') + ' ₫';

export function CreateReferralLinkModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<EligibleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [shop, setShop] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [selected, setSelected] = useState<EligibleProduct | null>(null);
  const [commissionRate, setCommissionRate] = useState<ProductCommissionRate | null>(null);
  const [label, setLabel] = useState('');
  const [channel, setChannel] = useState('TIKTOK');
  const [expires, setExpires] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReferralLinkItem | null>(null);
  const [qr, setQr] = useState('');
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const expiryPopover = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const request = useRef<{ payload: string; token: string } | null>(null);
  const loadNumber = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const load = useCallback(async (nextPage = 1) => {
    const number = ++loadNumber.current;
    setLoading(true); setCatalogError('');
    try {
      const items = await referralLinksService.getEligibleProducts({ page: nextPage, limit: 100 });
      if (number !== loadNumber.current) return;
      setProducts(previous => nextPage === 1 ? items : [...new Map([...previous, ...items].map(item => [item.id, item])).values()]);
      setPage(nextPage); setHasMore(items.length === 100);
    } catch (cause) {
      if (number === loadNumber.current) setCatalogError(cause instanceof Error ? cause.message : 'Không tải được sản phẩm. Vui lòng thử lại.');
    } finally { if (number === loadNumber.current) setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const requests = loadNumber;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !inFlight.current) { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]') || [])].filter(element => element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { requests.current++; document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, [load]);

  useEffect(() => {
    let active = true; setQr(''); setQrError(false);
    if (result) QRCode.toDataURL(result.shortUrl, { width: 512, margin: 3 }).then(url => { if (active) setQr(url); }).catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [result]);
  useEffect(() => {
    let active = true; setCommissionRate(null);
    if (selected) productCommissionDeals.rate(selected.id).then(rate => { if (active) setCommissionRate(rate); }).catch(() => {});
    return () => { active = false; };
  }, [selected?.id]);

  const shops = [...new Map(products.map(product => [product.store.id, product.store.name])).entries()];
  const categories = [...new Set(products.map(product => product.categoryName).filter((value): value is string => Boolean(value)))];
  const filtered = useMemo(() => products.filter(product => (shop === 'ALL' || product.store.id === shop)
    && (category === 'ALL' || product.categoryName === category)
    && searchText(`${product.title} ${product.sku} ${product.store.name}`).includes(searchText(search.trim()))), [products, shop, category, search]);
  const expiryInstant = expires ? Date.parse(`${expires}+07:00`) : NaN;
  const expiryInvalid = Boolean(expires && (!Number.isFinite(expiryInstant) || expiryInstant <= Date.now()));
  const valid = Boolean(selected && label.trim().length >= 2 && label.trim().length <= 150 && !expiryInvalid);
  const submit = async () => {
    if (!selected || !valid || result || inFlight.current) return;
    const payload = { productId: selected.id, label: label.trim(), channel, ...(expires ? { expiresAt: new Date(expiryInstant).toISOString() } : {}) };
    const serialized = JSON.stringify(payload);
    if (request.current?.payload !== serialized) request.current = { payload: serialized, token: crypto.randomUUID() };
    inFlight.current = true; setSaving(true); setError('');
    try {
      const link = await referralLinksService.createLink(payload, request.current.token);
      setResult({ ...link, product: { ...link.product, title: selected.title, imageUrl: selected.imageUrl, price: selected.price }, store: { ...link.store, name: selected.store.name } });
      onCreated();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa tạo được liên kết. Vui lòng thử lại.'); }
    finally { inFlight.current = false; setSaving(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(result!.shortUrl); setCopied(true); setError(''); }
    catch { setError('Không sao chép được. Bạn có thể chọn và sao chép đường dẫn bên dưới.'); }
  };

  return <div className="referral-create-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !inFlight.current) onClose(); }}>
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="create-link-title" className="referral-create-dialog">
      <header className="referral-create-header"><span className="referral-create-icon"><Link2 size={21} /></span><div><h2 id="create-link-title">{result ? 'Liên kết của bạn đã sẵn sàng' : 'Tạo liên kết tiếp thị'}</h2><p>{result ? 'Sao chép đường dẫn hoặc tải mã QR để chia sẻ.' : 'Chọn sản phẩm và thiết lập liên kết riêng của bạn.'}</p></div><button type="button" title="Đóng modal" aria-label="Đóng hộp tạo liên kết" disabled={saving} onClick={onClose}><X size={20} /></button></header>
      {!result && <nav className="referral-create-steps" aria-label="Các bước tạo liên kết">{[[1, 'Chọn sản phẩm'], [2, 'Thiết lập liên kết']].map(([number, title]) => <button key={number} type="button" aria-current={step === number ? 'step' : undefined} disabled={saving || (number === 2 && !selected)} onClick={() => { setStep(Number(number)); setError(''); }}><span>{number === 1 && step === 2 ? <Check size={15} /> : number}</span>{title}</button>)}</nav>}
      <form className="referral-create-form" onSubmit={event => { event.preventDefault(); if (step === 1) { if (selected) setStep(2); } else void submit(); }}>
        <div className="referral-create-body">
          {result ? <div className="referral-create-success"><CheckCircle2 size={34} /><h3>Tạo liên kết thành công</h3><p>{result.product.title}</p><label htmlFor="referral-result-url">Đường dẫn chia sẻ</label><div className="referral-create-url"><input id="referral-result-url" readOnly value={result.shortUrl} onFocus={event => event.target.select()} /><button type="button" onClick={() => void copy()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Đã sao chép' : 'Sao chép'}</button></div><div className="referral-create-qr">{qr ? <><img src={qr} alt="Mã QR liên kết tiếp thị" /><a href={qr} download={`lien-ket-${result.shortCode}.png`}><Download size={15} />Tải mã QR</a></> : <p>{qrError ? 'Chưa tạo được mã QR. Bạn vẫn có thể sao chép đường dẫn.' : 'Đang tạo mã QR…'}</p>}</div><a className="referral-create-open" href={result.shortUrl} target="_blank" rel="noopener noreferrer">Mở liên kết<ExternalLink size={15} /></a></div> : step === 1 ? <>
            <div className="referral-create-section-title"><h3>Sản phẩm tiếp thị</h3><span>{filtered.length} / {products.length}{hasMore ? '+' : ''} sản phẩm</span></div>
            <div className="referral-create-filters"><div className="referral-create-search"><Search size={16} /><input aria-label="Tìm sản phẩm tiếp thị" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm sản phẩm, gian hàng…" /></div><Select aria-label="Lọc gian hàng tiếp thị" className="w-full h-10 rounded-lg py-2 text-xs sm:text-xs shadow-none" value={shop} onChange={event => setShop(event.target.value)}><option value="ALL">Tất cả gian hàng</option>{shops.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select><Select aria-label="Lọc ngành hàng tiếp thị" className="w-full h-10 rounded-lg py-2 text-xs sm:text-xs shadow-none" value={category} onChange={event => setCategory(event.target.value)}><option value="ALL">Tất cả ngành hàng</option>{categories.map(name => <option key={name} value={name}>{name}</option>)}</Select></div>
            {catalogError ? <div role="alert" className="referral-create-error"><p>{catalogError}</p><button type="button" onClick={() => void load()}>Thử tải lại</button></div> : loading && !products.length ? <div role="status" className="referral-create-empty"><Loader2 size={26} className="animate-spin" /><strong>Đang tải sản phẩm…</strong></div> : !filtered.length ? <div className="referral-create-empty"><PackageSearch size={32} /><strong>{products.length ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm đang mở bán'}</strong><p>{products.length ? 'Thử đổi từ khóa hoặc bộ lọc để tìm sản phẩm khác.' : 'Sản phẩm của các gian hàng sẽ xuất hiện tại đây khi được mở bán.'}</p>{products.length > 0 && <button type="button" onClick={() => { setSearch(''); setShop('ALL'); setCategory('ALL'); }}>Xóa bộ lọc</button>}</div> : <div className="referral-create-products" role="group" aria-label="Chọn sản phẩm tiếp thị">{filtered.map(product => <button key={product.id} type="button" aria-pressed={selected?.id === product.id} onClick={() => { setSelected(product); setError(''); }} className="referral-create-product"><img src={product.imageUrl || '/assets/product-placeholder.svg'} alt="" /><span><strong>{product.title}</strong><small>{product.store.name}</small><b>{money(product.price)}</b></span><span className="referral-create-radio">{selected?.id === product.id && <Check size={13} />}</span></button>)}</div>}
            {hasMore && !catalogError && <button type="button" className="referral-create-load-more" disabled={loading} onClick={() => void load(page + 1)}>{loading ? 'Đang tải…' : 'Tải thêm sản phẩm'}</button>}
          </> : <>
            <div className="referral-create-selected"><img src={selected!.imageUrl || '/assets/product-placeholder.svg'} alt="" /><div><strong>{selected!.title}</strong><span>{selected!.store.name} · {money(selected!.price)}</span></div><button type="button" disabled={saving} onClick={() => setStep(1)}>Đổi</button></div>
            <div className="referral-create-fields"><div className="referral-create-field"><label htmlFor="referral-label">Tên liên kết <span>*</span></label><input id="referral-label" autoComplete="off" value={label} disabled={saving} maxLength={150} minLength={2} required onChange={event => setLabel(event.target.value)} placeholder="Ví dụ: Sản phẩm chăm sóc da tháng 10" /><small>Dùng để nhận biết liên kết trong danh sách · {label.length}/150 ký tự</small></div><div className="referral-create-field"><label htmlFor="referral-channel-trigger">Kênh chia sẻ <span>*</span></label><Select id="referral-channel" aria-label="Kênh chia sẻ" value={channel} disabled={saving} onChange={event => setChannel(event.target.value)} className="w-full h-11 rounded-lg py-2 text-sm shadow-none">{Object.entries(channels).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</Select></div><div className="referral-create-field"><label htmlFor="referral-expires">Ngày hết hạn <small>(tùy chọn)</small></label><DateTimePicker id="referral-expires" value={expires} disabled={saving} onChange={setExpires} timeZone="Asia/Ho_Chi_Minh" compact floatingAbove inlinePopoverRef={expiryPopover} popoverTitle="Chọn ngày hết hạn" placeholder="Ngày / tháng / năm · giờ:phút" /><div ref={expiryPopover} className="referral-create-expiry-calendar" />{expiryInvalid ? <small className="referral-create-invalid">Chọn thời điểm trong tương lai.</small> : null}</div></div>
          </>}
          {selected && (step === 2 || result) && <p className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-3 text-xs leading-6 text-[#795A2D]">{commissionRate ? <>Hoa hồng đang áp dụng: <strong>{Number(commissionRate.totalRate)}%</strong> · Cơ bản {Number(commissionRate.baseRate)}% + {commissionRate.extraPoints} điểm % từ deal. Tỷ lệ của đơn sẽ được chốt khi hệ thống ghi nhận hoa hồng.</> : 'Chưa tải được mức hoa hồng. Kiểm tra chính sách hoặc mục Deal hoa hồng sản phẩm trước khi chia sẻ.'}</p>}
          {error && <p role="alert" className="referral-create-error">{error}</p>}
        </div>
        <footer className="referral-create-footer"><span>{result ? 'Liên kết đã được lưu' : selected ? 'Đã chọn 1 sản phẩm' : 'Chọn sản phẩm để tiếp tục'}</span><div>{result ? <button type="button" className="referral-create-primary" onClick={onClose}>Hoàn tất<Check size={16} /></button> : <><button type="button" className="referral-create-secondary" disabled={saving} onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 2 && <ArrowLeft size={15} />}{step === 1 ? 'Hủy bỏ' : 'Quay lại'}</button>{step === 1 ? <button type="submit" className="referral-create-primary" disabled={!selected || loading || Boolean(catalogError)}>Tiếp tục<ArrowRight size={16} /></button> : <button type="submit" className="referral-create-primary" disabled={saving || !valid}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}{saving ? 'Đang tạo…' : 'Tạo liên kết'}</button>}</>}</div></footer>
      </form>
    </div>
  </div>;
}
