import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Loader2, MessageSquare, Package, Plus, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import api from '@/services/api';
import { unwrapApi } from '@/utils/api-response';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { productDisplayCode } from '@/utils/product-display-code';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import type { ChatProductInfo } from '@/types/chat.types';
import type { ResourceKind } from '@/services/collaboration-chat.service';
import { Button } from '@/components/ui/Button';
import { CollaborationResourceCard } from './CollaborationResourceCard';

export function ChatProductsPanel({ storeId, onSend }: { storeId: string; onSend: (product: ChatProductInfo) => void }) {
  const chat = useScanmsChat();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const products = useQuery({
    queryKey: ['chat-store-products', chat.accountId, storeId, search, page], retry: false,
    queryFn: async ({ signal }) => {
      const result = unwrapApi<{ items: Array<{ id?: string; productId?: string; name?: string; title?: string;
        price?: number; priceVnd?: number; imageUrl?: string; status?: string }>; pagination?: { totalPages?: number } }>(
        await api.get('/public/products', { signal, params: { storeId, search: search.trim() || undefined, page, limit: 12 }, headers: { 'x-skip-cache': '1' } }),
      );
      if (!Array.isArray(result?.items)) throw new Error('Danh sách sản phẩm chưa hợp lệ.');
      return { items: result.items.map(raw => ({ id: raw.productId || raw.id || '', title: raw.name || raw.title || 'Sản phẩm',
        price: Number(raw.priceVnd ?? raw.price ?? 0), imageUrl: raw.imageUrl, status: raw.status })), totalPages: result.pagination?.totalPages || 1 };
    },
  });
  return <section className="store-chat-resource-panel" aria-label="Sản phẩm trong hội thoại">
    <div className="store-chat-panel-title"><div><h2><ShoppingBag size={20} />Sản phẩm của gian hàng</h2><p>Chọn sản phẩm để gửi vào cuộc trò chuyện và trao đổi rõ hơn.</p></div></div>
    <label className="store-chat-search store-chat-product-search"><Search size={17} /><input aria-label="Tìm sản phẩm trong chat" value={search}
      placeholder="Tìm sản phẩm…" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
    {products.isPending && <p className="store-chat-loading"><Loader2 size={18} className="animate-spin" />Đang tải sản phẩm…</p>}
    {products.isError && <div className="store-chat-error" role="alert"><p>Chưa tải được sản phẩm của gian hàng.</p><button type="button" onClick={() => void products.refetch()}>Thử lại</button></div>}
    {products.data?.items.length === 0 && <div className="store-chat-panel-empty"><ShoppingBag size={36} /><h3>Chưa có sản phẩm phù hợp</h3><p>Thử từ khóa khác hoặc quay lại tin nhắn để hỏi gian hàng.</p></div>}
    <div className="store-chat-product-grid">{products.data?.items.map(product => <article key={product.id} className="store-chat-product-card">
      <Link to={`/products/${encodeURIComponent(product.id)}`}><img src={getSafeProductImageUrl(product.imageUrl)} alt={product.title} loading="lazy" /></Link>
      <div><span className="store-chat-product-code" title={product.id}>{productDisplayCode(product.id)}</span>
        <h3>{product.title}</h3><strong>{product.price.toLocaleString('vi-VN')} ₫</strong>
        <div className="store-chat-product-actions"><Button size="sm" variant="secondary" onClick={() => onSend(product)}><MessageSquare size={14} />Gửi sản phẩm</Button>
          <Link to={`/products/${encodeURIComponent(product.id)}`} aria-label={`Xem ${product.title}`}><ArrowUpRight size={16} /></Link></div></div>
    </article>)}</div>
    {products.data && products.data.totalPages > 1 && <div className="store-chat-pagination">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trang trước</Button>
      <span>{page} / {products.data.totalPages}</span>
      <Button variant="ghost" size="sm" disabled={page >= products.data.totalPages} onClick={() => setPage(value => value + 1)}>Trang sau</Button>
    </div>}
  </section>;
}

export function ChatResourcesPanel({ kind, ids, shop, loading, error, onRetry, onCreate }: {
  kind: ResourceKind; ids: string[]; shop: boolean; loading: boolean; error: boolean;
  onRetry: () => void; onCreate?: () => void;
}) {
  const samples = kind === 'SAMPLE_REQUEST';
  return <section className="store-chat-resource-panel" aria-label={samples ? 'Hàng mẫu trong hội thoại' : 'Thỏa thuận hoa hồng'}>
    <div className="store-chat-panel-title"><div><h2><Package size={20} />{samples ? 'Hàng mẫu với đối tác này' : 'Thỏa thuận hoa hồng'}</h2>
      <p>{samples ? 'Theo dõi yêu cầu, phản hồi và vận đơn của đúng hai bên trong hội thoại.' : 'Mức hoa hồng và phản hồi luôn lấy từ trạng thái mới nhất.'}</p></div>
      {onCreate && <Button size="sm" variant="secondary" onClick={onCreate}><Plus size={15} />Xin hàng dùng thử</Button>}</div>
    {loading && <p className="store-chat-loading"><Loader2 size={18} className="animate-spin" />Đang tải…</p>}
    {error && <div className="store-chat-error" role="alert"><p>Chưa tải được trạng thái yêu cầu.</p><button type="button" onClick={onRetry}><RefreshCw size={13} />Thử lại</button></div>}
    {!loading && !error && !ids.length && <div className="store-chat-panel-empty"><Package size={38} />
      <h3>{samples ? 'Chưa có yêu cầu hàng mẫu' : 'Chưa có thỏa thuận'}</h3><p>{samples ? 'KOL có thể gửi yêu cầu hàng mẫu cho gian hàng đã hợp tác.' : 'Các đề xuất hoa hồng với đối tác sẽ xuất hiện tại đây.'}</p></div>}
    <div className="store-chat-resource-grid">{ids.map(id => <CollaborationResourceCard key={id} kind={kind} id={id} isStoreOwner={shop} />)}</div>
  </section>;
}
