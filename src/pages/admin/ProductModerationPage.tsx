import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ClipboardCheck, ExternalLink, Eye, Image as ImageIcon, RefreshCw, Search, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { productService, type Product } from '../../services/product.service';
import { toast } from '../../utils/toast';
import './ProductModerationPage.css';

type ModerationProduct = Product & {
  createdAt?: string;
  moderationStatus?: 'DRAFT' | 'APPROVED' | 'REJECTED';
  moderationReason?: string | null;
  moderatedAt?: string | null;
  store?: Product['store'] & {
    slug?: string;
    logoUrl?: string | null;
    owner?: { id: string; fullName?: string | null; email?: string | null };
  };
  mediaAssets?: Array<{ id: string; urlOrContent: string; title?: string | null }>;
  variants?: Array<{ id: string; name: string; sku: string; price: number | string | null; imageUrl?: string | null; stockQuantity: number }>;
};

type FilterStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'ALL';

const FILTERS: Array<{ value: FilterStatus; label: string }> = [
  { value: 'DRAFT', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Đã từ chối' },
  { value: 'ALL', label: 'Tất cả' },
];

function extractItems(response: any): ModerationProduct[] {
  const body = response?.data ?? response;
  const items = Array.isArray(body) ? body : body?.items;
  return Array.isArray(items) ? items : [];
}

function money(value?: number) {
  return Number(value || 0).toLocaleString('vi-VN') + ' ₫';
}

function imageUrl(product: ModerationProduct) {
  return product.imageUrl || product.mediaAssets?.[0]?.urlOrContent || '';
}

export default function ProductModerationPage() {
  const [filter, setFilter] = useState<FilterStatus>('DRAFT');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ModerationProduct[]>([]);
  const [selected, setSelected] = useState<ModerationProduct | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<ModerationProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getModerationProducts(filter);
      setProducts(extractItems(response));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không tải được hàng đợi kiểm duyệt sản phẩm.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    if (!keyword) return products;
    return products.filter((product) => [
      product.title,
      product.sku,
      product.store?.name,
      product.store?.owner?.fullName,
      product.store?.owner?.email,
    ].some((value) => String(value || '').toLocaleLowerCase('vi-VN').includes(keyword)));
  }, [products, search]);

  const moderate = async (product: ModerationProduct, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setSavingId(product.id);
    try {
      await productService.moderateProduct(product.id, status, reason);
      toast.success(status === 'APPROVED' ? 'Đã duyệt sản phẩm và đưa lên sàn.' : 'Đã từ chối sản phẩm và gửi lý do cho Shop.');
      setSelected(null);
      setRejectionTarget(null);
      setRejectionReason('');
      await loadProducts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể lưu quyết định kiểm duyệt.');
    } finally {
      setSavingId(null);
    }
  };

  const submitRejection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejectionTarget || rejectionReason.trim().length < 3) return;
    void moderate(rejectionTarget, 'REJECTED', rejectionReason.trim());
  };

  const isPending = selected?.moderationStatus === 'DRAFT';
  const gallery = selected
    ? [...new Set([selected.imageUrl, ...(selected.mediaAssets || []).map((asset) => asset.urlOrContent), ...(selected.subImages || []), ...(selected.variants || []).map((variant) => variant.imageUrl)].filter(Boolean) as string[])]
    : [];

  return (
    <main className="product-moderation min-h-[calc(100vh-80px)] bg-[#FAF8F5] px-0 py-5 text-[#1A1612]">
      <div className="mx-0 w-full min-w-0 max-w-none space-y-4">
        <section className="rounded-xl border border-[#EAE4D7] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái kiểm duyệt">
              {FILTERS.map((item) => (
                <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} onClick={() => setFilter(item.value)}
                  className={'rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ' + (filter === item.value ? 'bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#EEDFC6]' : 'text-[#7D715E] hover:bg-[#FAF8F5]')}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
              <label className="relative w-full min-w-0 sm:w-72 sm:shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
                <input aria-label="Tìm sản phẩm, SKU hoặc Shop" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, SKU, Shop…" className="h-9 w-full rounded-lg border border-[#EAE4D7] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C59B58]" />
              </label>
              <button
                type="button"
                onClick={() => void loadProducts()}
                disabled={loading}
                aria-label={loading ? 'Đang tải danh sách sản phẩm' : 'Làm mới danh sách sản phẩm'}
                className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[#7D715E] transition hover:text-[#8C6226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={'h-3.5 w-3.5 text-[#B88E4F]' + (loading ? ' animate-spin' : '')} />
                <span>{loading ? 'Đang tải…' : 'Làm mới'}</span>
              </button>
            </div>
          </div>
        </section>
        <p role="status" className="text-xs text-[#7D715E]">{loading ? 'Đang tải danh sách…' : filteredProducts.length + ' sản phẩm'}</p>

        {loading ? (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-12 text-center text-sm text-[#7D715E]">Đang tải hồ sơ sản phẩm...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-12 text-center">
            <ClipboardCheck className="mx-auto h-9 w-9 text-[#C59B58]" />
            <p className="mt-3 font-bold">Không có sản phẩm trong danh sách này</p>
            <p className="mt-1 text-sm text-[#7D715E]">Sản phẩm Shop vừa tạo sẽ xuất hiện ở mục “Chờ duyệt”.</p>
          </div>
        ) : (
          <div className="moderation-grid">
            {filteredProducts.map((product) => {
              const pending = product.moderationStatus === 'DRAFT';
              const rejected = product.moderationStatus === 'REJECTED';
              return (
                <article key={product.id} className="moderation-card min-w-0 rounded-xl border border-[#EAE4D7] bg-white shadow-[0_2px_8px_rgba(35,29,21,0.025)]">
                  <div className="flex gap-3 p-4">
                    <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg border border-[#EAE4D7] bg-white">
                      {imageUrl(product) ? <img src={imageUrl(product)} alt={product.title} className="h-full w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-[#B88E4F]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={pending ? 'warning' : rejected ? 'danger' : 'amber'}>{pending ? 'Chờ duyệt' : rejected ? 'Đã từ chối' : 'Đã duyệt'}</Badge>
                        <span className="break-all text-[11px] text-[#7D715E]">SKU: {product.sku || '—'}</span>
                        {product.variants?.length ? <span className="rounded-full bg-[#FBF5EB] px-2 py-0.5 text-[10px] font-semibold text-[#8C6226]">{product.variants.length} SKU</span> : null}
                      </div>
                      <h2 title={product.title} className="mt-2 line-clamp-2 break-words text-sm font-semibold leading-5">{product.title}</h2>
                      <p title={product.store?.name} className="mt-1 truncate text-xs text-[#7D715E]">{product.store?.name || 'Chưa có thông tin Shop'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="text-sm font-semibold tabular-nums text-[#1A1612]">{money(product.price)}</span>
                        <span className="text-[#7D715E]">Tồn: {Number(product.stockQuantity || 0).toLocaleString('vi-VN')}</span>
                        {product.createdAt && <span className="text-[11px] text-[#7D715E]">Gửi {new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>}
                      </div>
                    </div>
                  </div>
                  {rejected && product.moderationReason && <p className="mx-4 mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Lý do từ chối: {product.moderationReason}</p>}
                  <div className="moderation-actions mx-4 flex flex-wrap items-center gap-2 border-t border-[#EAE4D7] py-3">
                    <Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />} onClick={() => setSelected(product)}>Xem hồ sơ</Button>
                    {pending && <>
                      <Button className="moderation-reject" size="sm" variant="outline" disabled={savingId === product.id} icon={<XCircle className="h-4 w-4" />} onClick={() => { setRejectionTarget(product); setRejectionReason(''); }}>Từ chối</Button>
                      <Button size="sm" variant="dark" icon={<BadgeCheck className="h-4 w-4" />} loading={savingId === product.id} onClick={() => void moderate(product, 'APPROVED')}>Phê duyệt</Button>
                    </>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Hồ sơ kiểm duyệt sản phẩm" subtitle={selected?.store?.name || 'Thông tin do Shop cung cấp'} icon={<ClipboardCheck className="h-5 w-5" />} maxWidth="3xl">
        {selected && <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-[#EAE4D7] bg-[#F3EFE6]">
              {gallery[0] ? <img src={gallery[0]} alt={selected.title} className="aspect-square w-full object-contain" /> : <div className="grid aspect-square place-items-center"><ImageIcon className="h-12 w-12 text-[#B88E4F]" /></div>}
              {gallery.length > 1 && <div className="flex gap-2 overflow-x-auto border-t border-[#EAE4D7] bg-white p-2">{gallery.map((url, index) => <img key={url + index} src={url} alt={'Ảnh sản phẩm ' + (index + 1)} className="h-16 w-16 shrink-0 rounded-lg border border-[#EAE4D7] object-cover" />)}</div>}
            </div>
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#7D715E]">Tên sản phẩm</p><h2 className="mt-1 text-lg font-extrabold">{selected.title}</h2></div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#FAF8F5] p-3 text-sm">
                <div><p className="text-xs text-[#7D715E]">SKU</p><p className="font-semibold">{selected.sku || '—'}</p></div>
                <div><p className="text-xs text-[#7D715E]">Danh mục</p><p className="font-semibold">{selected.categoryName || '—'}</p></div>
                <div><p className="text-xs text-[#7D715E]">Giá bán</p><p className="font-semibold text-[#8C6226]">{money(selected.price)}</p></div>
                <div><p className="text-xs text-[#7D715E]">Tồn kho</p><p className="font-semibold">{Number(selected.stockQuantity || 0).toLocaleString('vi-VN')}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#7D715E]">Chủ Shop</p><p className="font-semibold">{selected.store?.owner?.fullName || '—'} {selected.store?.owner?.email ? '· ' + selected.store.owner.email : ''}</p></div>
              </div>
              <ReviewField title="Xuất xứ" value={selected.origin} />
              <ReviewField title="Thành phần" value={selected.ingredients} />
              <ReviewField title="Nhãn mác / thông tin công bố" value={selected.labelInfo} />
            </div>
          </div>
          <section className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#7D715E]">Tài liệu minh chứng nguồn gốc và nhãn mác</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <ProofReviewField title="Nguồn gốc / xuất xứ" links={selected.originProofLinks} images={selected.originProofImages} />
              <ProofReviewField title="Nhãn mác / thông tin công bố" links={selected.labelProofLinks} images={selected.labelProofImages} />
            </div>
          </section>
          <ReviewField title="Mô tả sản phẩm" value={selected.description} />
          {(selected.variants || []).length > 0 && <section className="rounded-xl border border-[#EAE4D7] p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#7D715E]">Phân loại / SKU và ảnh biến thể</h3>
            <div className="mt-2 space-y-2">{selected.variants?.map((variant) => <div key={variant.id} className="flex items-center gap-3 rounded-lg bg-[#FAF8F5] p-2">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#EAE4D7] bg-white">{variant.imageUrl ? <img src={variant.imageUrl} alt={variant.name} className="h-full w-full object-cover" /> : <ImageIcon className="m-3 h-6 w-6 text-[#B88E4F]" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{variant.name}</p><p className="text-xs text-[#7D715E]">SKU: {variant.sku} · Tồn: {Number(variant.stockQuantity || 0).toLocaleString('vi-VN')}</p></div>
              <span className="shrink-0 text-sm font-bold text-[#8C6226]">{money(Number(variant.price ?? selected.price))}</span>
            </div>)}</div>
          </section>}
          {selected.moderationStatus === 'REJECTED' && selected.moderationReason && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Lý do đã từ chối: {selected.moderationReason}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] pt-4">
            <p className="text-xs text-[#7D715E]">{selected.createdAt ? 'Shop gửi ngày ' + new Date(selected.createdAt).toLocaleString('vi-VN') : ''} · Sản phẩm chỉ xuất hiện công khai sau khi được duyệt.</p>
            {isPending && <div className="flex gap-2">
              <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => { setRejectionTarget(selected); setRejectionReason(''); }}>Từ chối có lý do</Button>
              <Button variant="dark" icon={<BadgeCheck className="h-4 w-4" />} loading={savingId === selected.id} onClick={() => void moderate(selected, 'APPROVED')}>Phê duyệt sản phẩm</Button>
            </div>}
          </div>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(rejectionTarget)} onClose={() => setRejectionTarget(null)} title="Từ chối sản phẩm" subtitle={rejectionTarget?.title} icon={<XCircle className="h-5 w-5" />} maxWidth="lg">
        <form onSubmit={submitRejection} className="space-y-4">
          <p className="text-sm text-[#7D715E]">Nêu rõ thông tin cần sửa hoặc tiêu chuẩn chưa đạt. Lý do này sẽ được gửi cho Shop và hiển thị trong quản lý sản phẩm.</p>
          <label className="block text-sm font-semibold">Lý do từ chối <span className="text-rose-600">*</span>
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} minLength={3} maxLength={1000} required rows={5} placeholder="Ví dụ: Thiếu thông tin thành phần hoặc xuất xứ chưa rõ ràng..." className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-sm outline-none focus:border-[#C59B58]" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectionTarget(null)}>Hủy</Button>
            <Button type="submit" variant="danger" loading={savingId === rejectionTarget?.id} disabled={rejectionReason.trim().length < 3}>Gửi lý do & từ chối</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

function ReviewField({ title, value }: { title: string; value?: string | null }) {
  return (
    <section className="rounded-xl border border-[#EAE4D7] p-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#7D715E]">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() || <span className="italic text-[#9A8E7B]">Shop chưa cung cấp</span>}</p>
    </section>
  );
}

function ProofReviewField({ title, links = [], images = [] }: { title: string; links?: string[]; images?: string[] }) {
  const hasEvidence = links.length > 0 || images.length > 0;
  return (
    <div className="min-w-0 rounded-lg border border-[#EAE4D7] bg-white p-3">
      <h4 className="text-xs font-semibold text-[#1A1612]">{title}</h4>
      {!hasEvidence ? (
        <p className="mt-2 text-xs italic text-[#9A8E7C]">Shop chưa gửi minh chứng.</p>
      ) : (
        <>
          {links.length > 0 && <ul className="mt-2 space-y-1.5">{links.map((url, index) => <li key={`${url}-${index}`} className="truncate text-xs"><a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-[#8C6226] underline underline-offset-2"><ExternalLink className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{url}</span></a></li>)}</ul>}
          {images.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{images.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh minh chứng ${index + 1}`} className="aspect-square overflow-hidden rounded-md border border-[#EAE4D7]"><img src={url} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" /></a>)}</div>}
        </>
      )}
    </div>
  );
}
