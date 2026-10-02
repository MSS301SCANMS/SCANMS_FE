import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Heart, MessageSquare, Search, Store } from 'lucide-react';
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { PublicHeader } from '../../components/layout/PublicHeader';

type Shop = { id: string; name: string; logoUrl?: string; description?: string; isActive: boolean; isVerified: boolean; productCount: number; followerCount: number; categories: string[] };
type Product = { id: string; sku: string; title: string; imageUrl?: string; price: number; originalPrice?: number; categoryName?: string };
type ProductResult = { items: Product[]; pagination: { page: number; totalPages: number; total: number } };
const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value;
const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`;

export default function ShopPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [result, setResult] = useState<ProductResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [savingFollow, setSavingFollow] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!shopId) return;
    let active = true;
    setLoading(true);
    setShop(null);
    setResult(null);
    setFollowing(false);
    api.get(`/stores/public/id/${shopId}`).then((res) => {
      if (active) { setShop(unwrap(res)); setError(''); }
    }).catch(() => { if (active) setError('Không tìm thấy Shop hoặc Shop đã ngừng hoạt động.'); })
      .finally(() => { if (active) setLoading(false); });
    if (authService.getCurrentUser()) {
      api.get(`/stores/public/id/${shopId}/follow`).then((res) => {
        if (active) setFollowing(Boolean(unwrap(res)?.following));
      }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [shopId]);

  useEffect(() => {
    if (!shopId || !shop) return;
    let active = true;
    api.get('/public/products', { params: { storeId: shopId, search, category, sortBy, page, limit: 16 } })
      .then((res) => { if (active) setResult(unwrap(res)); })
      .catch(() => { if (active) setError('Không tải được sản phẩm của Shop.'); });
    return () => { active = false; };
  }, [shopId, shop?.id, search, category, sortBy, page]);

  const chat = () => {
    if (!authService.getCurrentUser()) {
      navigate(`/login?redirect=${encodeURIComponent(`/shops/${shopId}`)}`);
      return;
    }
    navigate(`/chat?storeId=${shopId}`);
  };
  const toggleFollow = async () => {
    if (!authService.getCurrentUser()) {
      navigate(`/login?redirect=${encodeURIComponent(`/shops/${shopId}`)}`);
      return;
    }
    if (!shopId || savingFollow) return;
    setSavingFollow(true);
    try {
      await (following ? api.delete(`/stores/public/id/${shopId}/follow`) : api.post(`/stores/public/id/${shopId}/follow`));
      setFollowing(!following);
      setShop((current) => current ? { ...current, followerCount: current.followerCount + (following ? -1 : 1) } : current);
    } catch { setError('Chưa thể cập nhật theo dõi. Vui lòng thử lại.'); }
    finally { setSavingFollow(false); }
  };

  return <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612]">
    <PublicHeader />
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      {loading ? <p>Đang tải Shop...</p> : error && !shop ? <p role="alert">{error}</p> : shop && <>
        <section className="rounded-3xl border border-[#EAE4D7] bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#EAE4D7] bg-[#F3EFE6] text-3xl font-bold text-[#B88E4F] sm:h-28 sm:w-28">
              {shop.logoUrl ? <img src={shop.logoUrl} alt={`Logo ${shop.name}`} className="h-full w-full object-cover" /> : <Store size={36} />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">{shop.name}{shop.isVerified && <BadgeCheck size={22} className="text-[#B88E4F]" aria-label="Shop đã xác minh" />}</h1>
              {shop.description && <p className="mt-2 max-w-2xl text-sm text-[#7D715E]">{shop.description}</p>}
              <p className="mt-3 text-xs text-[#7D715E]">{shop.isActive ? 'Shop đang hoạt động' : 'Shop ngừng hoạt động'} · {shop.productCount} sản phẩm · {shop.followerCount} người theo dõi</p>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <button onClick={toggleFollow} disabled={savingFollow} className="flex-1 rounded-xl border border-[#C59B58] px-5 py-2.5 font-semibold text-[#B88E4F] hover:bg-[#FBF5EB] disabled:opacity-50"><Heart size={16} className="mr-2 inline" />{following ? 'Đang theo dõi' : 'Theo dõi'}</button>
              <button onClick={chat} className="flex-1 rounded-xl bg-[#C59B58] px-5 py-2.5 font-semibold text-[#231D15] hover:bg-[#B88E4F]"><MessageSquare size={16} className="mr-2 inline" />Chat ngay</button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#EAE4D7] bg-white p-4 sm:p-6">
          <h2 className="text-xl font-bold">Sản phẩm của {shop.name}</h2>
          <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="mt-4 flex flex-wrap gap-2">
            <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[#EAE4D7] px-3"><Search size={16} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm trong Shop" className="w-full py-2.5 outline-none" /></label>
            <button type="submit" className="rounded-xl bg-[#C59B58] px-4 py-2 font-semibold">Tìm</button>
            <select aria-label="Danh mục" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-xl border border-[#EAE4D7] bg-white px-3 py-2"><option value="all">Tất cả danh mục</option>{shop.categories.map((name) => <option key={name} value={name}>{name}</option>)}</select>
            <select aria-label="Sắp xếp" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="rounded-xl border border-[#EAE4D7] bg-white px-3 py-2"><option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option></select>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-[#DC2626]">{error}</p>}
          {result?.items.length === 0 && <p className="py-12 text-center text-[#7D715E]">Chưa có sản phẩm phù hợp.</p>}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {result?.items.map((product) => <Link key={product.id} to={`/products/${product.sku || product.id}`} className="overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white transition hover:border-[#C59B58] hover:shadow-md">
              <div className="aspect-square bg-[#F3EFE6]">{product.imageUrl && <img src={product.imageUrl} alt={product.title} loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="p-3"><p className="line-clamp-2 min-h-10 text-sm font-semibold">{product.title}</p><p className="mt-2 font-bold text-[#B88E4F]">{money(product.price)}</p>{product.originalPrice && Number(product.originalPrice) > Number(product.price) && <p className="text-xs text-[#7D715E] line-through">{money(product.originalPrice)}</p>}</div>
            </Link>)}
          </div>
          {(result?.pagination.totalPages || 0) > 1 && <nav aria-label="Phân trang sản phẩm" className="mt-6 flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-[#EAE4D7] px-3 py-2 disabled:opacity-40">Trước</button><span>{page} / {result?.pagination.totalPages}</span><button disabled={page >= (result?.pagination.totalPages || 1)} onClick={() => setPage(page + 1)} className="rounded-lg border border-[#EAE4D7] px-3 py-2 disabled:opacity-40">Sau</button></nav>}
        </section>
      </>}
    </main>
  </div>;
}
