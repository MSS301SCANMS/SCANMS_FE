import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Search, Store, ArrowLeft, LogIn } from 'lucide-react';
import { authService } from '../services/auth.service';
import { catalogProduct, formatVnd } from '../services/domain-model';
import { loadSnapshot, scopedSnapshot, emptySnapshot } from '../features/backend/snapshot';
import type { ProductResponse, ProductVariantResponse, ProductImageResponse } from '../types/backend.generated';

export default function BackendCatalogPage() {
  const { productId, shopId } = useParams();
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [variantId, setVariantId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [user, setUser] = useState(() => authService.getCurrentUser());
  useEffect(() => {
    const update = () => setUser(authService.getCurrentUser());
    window.addEventListener('scanms_auth_changed', update);
    return () => window.removeEventListener('scanms_auth_changed', update);
  }, []);
  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController(); setLoading(true); setError(''); setSnapshot(emptySnapshot()); setVariantId('');
    loadSnapshot('products', controller.signal).then(result => { if (!controller.signal.aborted) setSnapshot(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId, refresh]);
  const scoped = user ? scopedSnapshot(snapshot, user, 'catalog') : emptySnapshot();
  const products = (scoped.products as unknown as ProductResponse[]).map(product => catalogProduct(product,
    scoped['product-variants'] as unknown as ProductVariantResponse[], scoped['product-images'] as unknown as ProductImageResponse[]));
  const selected = products.find(product => product.productId === productId);
  const variant = selected?.variants.find(item => item.variantId === variantId);
  const rows = products.filter(product => (!shopId || product.storeId === shopId) && (!category || product.categoryId === category)
    && `${product.name || ''} ${product.description || ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612]">
    <header className="border-b border-[#EAE4D7] bg-white"><div className="max-w-7xl mx-auto px-5 py-5 flex justify-between items-center gap-4"><Link to="/" className="text-2xl font-black text-[#B88E4F]">SCANMS</Link><nav className="flex gap-5 text-sm font-semibold"><Link to="/">Sản phẩm</Link><Link to={user ? '/portal' : '/login'}>{user ? 'Không gian của tôi' : 'Đăng nhập'}</Link></nav></div></header>
    <main className="max-w-7xl mx-auto px-5 py-10 space-y-6">
      {!user ? <section className="rounded-3xl bg-white border border-[#EAE4D7] p-8 max-w-2xl mx-auto space-y-4"><LogIn className="text-[#B88E4F] w-8 h-8" /><h1 className="text-2xl font-bold">Khám phá sản phẩm SCANMS</h1><p className="text-[#7D715E]">Vui lòng đăng nhập để xem sản phẩm và dữ liệu của bạn. Truy cập không cần tài khoản sẽ được mở sau.</p><Link className="inline-block bg-[#B88E4F] text-white px-5 py-3 rounded-xl font-bold" to={`/login?returnTo=${encodeURIComponent(window.location.pathname)}`}>Đăng nhập</Link></section>
        : error ? <section role="alert" className="bg-red-50 text-red-700 p-5 rounded-xl"><p>{error}</p><button className="underline mt-2" onClick={() => setRefresh(value => value + 1)}>Thử lại</button></section>
          : loading ? <p role="status">Đang tải sản phẩm…</p>
            : productId ? selected ? <>
              <Link to="/" className="inline-flex items-center gap-2 text-[#7D715E]"><ArrowLeft className="w-4 h-4" />Danh sách sản phẩm</Link>
              <article className="bg-white border border-[#EAE4D7] rounded-3xl p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">{selected.imageUrl ? <img src={selected.imageUrl} alt={selected.name || 'Sản phẩm'} className="w-full aspect-square rounded-2xl object-contain bg-[#FAF8F5]" /> : <div className="aspect-square rounded-2xl bg-[#F3EFE6] grid place-items-center"><Package className="w-16 h-16 text-[#B88E4F]" /></div>}<div className="flex gap-3 overflow-x-auto">{selected.images.map(image => <img key={image.imageId} src={image.imageUrl || ''} alt={image.altText || selected.name || ''} className="w-24 h-24 object-contain rounded-xl border" />)}</div></div>
                <div className="space-y-5"><h1 className="text-3xl font-black">{selected.name}</h1><Link to={`/shops/${selected.storeId}`} className="inline-flex items-center gap-2 text-[#7D715E]"><Store className="w-4 h-4" />{String(scoped.stores.find(store => store.storeId === selected.storeId)?.name || 'Gian hàng')}</Link><p className="text-2xl text-[#B88E4F] font-bold">{formatVnd(variant?.priceVnd ?? selected.priceVnd)}</p><p className="whitespace-pre-line text-[#7D715E]">{selected.description}</p>
                  <label className="block text-sm font-bold">Chọn biến thể<select value={variantId} onChange={event => setVariantId(event.target.value)} className="block mt-2 rounded-xl border p-3 w-full"><option value="">Chọn size / màu</option>{selected.variants.map(item => <option key={item.variantId} value={item.variantId || ''} disabled={item.status !== 'ACTIVE' || !item.stockQuantity}>{[item.size, item.color, item.sku].filter(Boolean).join(' · ')} · {item.stockQuantity || 0} còn lại</option>)}</select></label>
                  <p className="text-sm">Tồn kho: {variant ? variant.stockQuantity : selected.availableQuantity}</p>
                  <button disabled className="bg-[#B88E4F] text-white p-3 rounded-xl w-full opacity-50">Đặt hàng — sắp có</button>
                  <p className="text-sm text-[#7D715E]">Giao diện đặt hàng đang được kết nối với checkout và thanh toán của hệ thống.</p>
                </div>
              </article>
            </> : <p role="alert">Sản phẩm không tồn tại hoặc hiện không được bán.</p>
              : <>
                <div><p className="text-sm font-bold text-[#B88E4F]">SẢN PHẨM & GIAN HÀNG</p><h1 className="text-3xl font-black mt-2">{shopId ? String(scoped.stores.find(store => store.storeId === shopId)?.name || 'Gian hàng') : 'Khám phá sản phẩm'}</h1></div>
                <div className="flex flex-wrap gap-3"><label className="bg-white border rounded-xl p-3 flex items-center gap-2 flex-1 min-w-64"><Search className="w-4 h-4 text-[#7D715E]" /><input aria-label="Tìm sản phẩm" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tên hoặc mô tả sản phẩm" className="bg-transparent outline-none w-full" /></label><select aria-label="Danh mục" value={category} onChange={event => setCategory(event.target.value)} className="bg-white border rounded-xl p-3"><option value="">Tất cả danh mục</option>{scoped['product-categories'].filter(row => row.active).map(row => <option key={String(row.categoryId)} value={String(row.categoryId)}>{String(row.name)}</option>)}</select></div>
                {rows.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{rows.map(product => <Link key={product.productId} to={`/products/${product.productId}`} className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">{product.imageUrl ? <img loading="lazy" src={product.imageUrl} alt={product.name || ''} className="w-full aspect-square object-contain bg-[#F3EFE6]" /> : <div className="aspect-square bg-[#F3EFE6] grid place-items-center"><Package className="w-12 h-12 text-[#B88E4F]" /></div>}<div className="p-4 space-y-2"><h2 className="font-bold">{product.name}</h2><p className="text-[#B88E4F] font-bold">{formatVnd(product.priceVnd)}</p><p className="text-xs text-[#7D715E]">{product.availableQuantity} sản phẩm có sẵn theo biến thể</p></div></Link>)}</div> : <p className="text-[#7D715E] bg-white p-6 rounded-2xl border">Chưa có sản phẩm phù hợp.</p>}
              </>}
    </main>
  </div>;
}
