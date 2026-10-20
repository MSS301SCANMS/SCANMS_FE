import { memo, useEffect, useState } from 'react';
import { Sparkles, IdCard } from 'lucide-react';
import { RegisterMarketScene } from './RegisterMarketScene';
import api from '../../services/api';
import { getSafeProductImageUrl } from '../../utils/marketplace.utils';

interface ShowcaseProduct { imageUrl?: string; mediaAssets?: { urlOrContent?: string }[] }

export const RegisterShowcase = memo(function RegisterShowcase({ name }: { name: string }) {
  const [productImages, setProductImages] = useState<string[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    void api.get('/public/products', { params: { limit: 48, sortBy: 'newest' }, signal: abort.signal }).then(response => {
      if (abort.signal.aborted) return;
      // The API interceptor unwraps responses; also accept the marketplace envelope.
      const res = response as unknown as { data?: unknown; items?: ShowcaseProduct[] };
      const outer = res?.data ?? res;
      const payload = (outer as { data?: unknown })?.data ?? outer;
      const items: ShowcaseProduct[] = Array.isArray(payload) ? payload : (payload as { items?: ShowcaseProduct[] })?.items ?? [];
      const images = items.map(item => getSafeProductImageUrl(item.imageUrl || item.mediaAssets?.[0]?.urlOrContent))
        .filter(url => url !== '/assets/product-placeholder.svg');
      setProductImages([...new Set(images)]);
    }).catch(() => { /* Keep the shop visible without substituting unrelated products. */ });
    return () => abort.abort();
  }, []);
  return (
    <section className="register-showcase" aria-label="Khám phá cộng đồng SCANMS">
      <div className="register-story">
        <span className="register-story-tag"><Sparkles size={14} /> Sàn Thương Mại Đối Tác</span>
        <h1 className="font-display">Kết nối gian hàng,<br /><em>lan tỏa giá trị.</em></h1>
      </div>
      <div className="register-world register-world-market" aria-hidden="true">
        <RegisterMarketScene images={productImages} />
        <div className="register-creator-badge">
          <span className="register-camera-icon"><i className="camera-reel reel-left" /><i className="camera-reel reel-right" /><i className="camera-body"><i className="camera-lens" /><i className="camera-light" /></i><i className="camera-viewfinder" /></span>
          <span><strong>Nhà sáng tạo</strong><small>Kết nối & chia sẻ</small></span>
        </div>
      </div>
      <div className="register-member-badge" aria-hidden="true">
        <span className="register-member-pass"><span>SCANMS</span><IdCard size={24} strokeWidth={1.3} /><i /></span>
        <div><strong>{name.trim() || 'Không gian của bạn'}</strong><small>Khám phá · Mua sắm · Chia sẻ</small></div>
      </div>
    </section>
  );
});
