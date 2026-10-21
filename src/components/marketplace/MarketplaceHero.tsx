import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Store, ShieldCheck, Radio } from 'lucide-react';

interface BannerStore {
  id: string;
  name: string;
  activeCampaign?: { name: string; endsAt: string } | null;
}

export function MarketplaceHero({ stores, onOpenLive }: { stores: BannerStore[]; onOpenLive: () => void }) {
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const partner = stores.find((store) => store.activeCampaign && Date.parse(store.activeCampaign.endsAt) > Date.now());
  const slides = [
    {
      image: '/assets/marketplace/scanms-marketplace-banner-v3.png',
      eyebrow: 'SCANMS · SÀN ĐA GIAN HÀNG',
      title: partner ? partner.activeCampaign!.name : 'Một điểm đến. Nhiều lựa chọn chính hãng.',
      description: partner ? `Khám phá chương trình đang diễn ra tại ${partner.name} và chọn sản phẩm phù hợp với bạn.` : 'Khám phá sản phẩm từ nhiều gian hàng đối tác, kết nối cùng những nhà sáng tạo bạn yêu thích.',
      label: partner ? `Ghé thăm ${partner.name}` : 'Khám phá sản phẩm',
      href: partner ? `/shops/${partner.id}` : '#catalog-section',
    },
    {
      image: '/assets/marketplace/scanms-affiliate-banner-v2.png',
      eyebrow: 'KHÁM PHÁ CÙNG NHÀ SÁNG TẠO',
      title: 'Chọn sản phẩm hay, cùng KOC bạn thích.',
      description: 'Tìm sản phẩm trong mạng lưới tiếp thị liên kết SCANMS và khám phá thêm nhiều thương hiệu.',
      label: 'Khám phá sản phẩm KOC',
      href: '/search?commission=true',
    },
    {
      image: '/assets/marketplace/scanms-live-banner-v2.png',
      eyebrow: 'SCANMS LIVE COMMERCE',
      title: 'Xem trực tiếp. Hỏi ngay. Chọn đúng.',
      description: 'Gặp gỡ KOC, khám phá sản phẩm đang được giới thiệu và ưu đãi còn hiệu lực trong phiên Live.',
      label: 'Khám phá KOC Live',
      href: null,
    },
  ];
  const move = (offset: number) => setActive((previous) => (previous + offset + slides.length) % slides.length);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((previous) => (previous + 1) % 3);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [interacting, reducedMotion]);

  return (
    <section className="border-b border-[#EAE4D7] bg-[#F3EFE6] py-5 text-left sm:py-7">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
        <div
          role="region" aria-roledescription="carousel" aria-label="Chương trình nổi bật SCANMS"
          className="relative overflow-hidden rounded-3xl border border-[#EAE4D7] bg-[#FAF8F5] shadow-[0_16px_44px_rgba(93,70,35,0.10)]"
          onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              move(event.key === 'ArrowLeft' ? -1 : 1);
            }
          }}
        >
          {slides.map((slide, index) => (
            <div key={slide.image} hidden={index !== active} role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${slides.length}`}>
              <img src={slide.image} alt="" fetchPriority={index === 0 ? 'high' : 'auto'} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#FAF8F5_0%,rgba(250,248,245,.96)_32%,rgba(250,248,245,.78)_55%,rgba(250,248,245,.20)_100%)]" />
              {slide.href ? (
                <Link to={slide.href} aria-label={slide.label} className="absolute inset-0 focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#C59B58]" />
              ) : (
                <button type="button" onClick={onOpenLive} aria-label={slide.label} className="absolute inset-0 cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#C59B58]" />
              )}
              <div className="pointer-events-none relative flex min-h-[430px] max-w-[660px] flex-col items-start justify-center px-6 pb-24 pt-10 sm:min-h-[440px] sm:px-12 sm:pb-28 sm:pt-14">
                <span className="inline-flex items-center rounded-full border border-[#EEDFC6] bg-white/90 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-[#B88E4F]">{slide.eyebrow}</span>
                {index === 0 ? <h1 className="mb-4 mt-5 text-3xl font-black leading-[1.12] tracking-tight sm:text-[44px]">{slide.title}</h1> : <h2 className="mb-4 mt-5 text-3xl font-black leading-[1.12] tracking-tight sm:text-[44px]">{slide.title}</h2>}
                <p className="max-w-[470px] text-sm leading-6 text-[#7D715E]">{slide.description}</p>
                <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
                  {slide.href ? <Link to={slide.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C59B58] px-5 text-xs font-bold text-[#231D15] hover:bg-[#B88E4F]">{slide.label}<ArrowRight size={16} /></Link> : <button type="button" onClick={onOpenLive} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C59B58] px-5 text-xs font-bold text-[#231D15] hover:bg-[#B88E4F]">{slide.label}<Radio size={16} /></button>}
                  <Link to="/search" className="inline-flex min-h-11 items-center rounded-xl border border-[#EAE4D7] bg-white/90 px-5 text-xs font-bold hover:border-[#C59B58]">Tất cả sản phẩm</Link>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-[#EAE4D7] bg-white/90 px-4 py-3 sm:px-6">
            <div className="hidden gap-4 text-[11px] font-semibold text-[#7D715E] md:flex"><span className="flex items-center gap-1.5"><Store size={15} /> Đa gian hàng</span><span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Đối tác xác minh</span></div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(-1)} aria-label="Banner trước" className="rounded-full p-3 hover:bg-[#F3EFE6]"><ArrowLeft size={16} /></button>
              {slides.map((slide, index) => <button type="button" key={slide.image} onClick={() => setActive(index)} aria-label={`Xem banner ${index + 1}`} aria-current={index === active ? 'true' : undefined} className="flex h-10 w-8 items-center justify-center"><span className={`h-1.5 rounded-full ${index === active ? 'w-6 bg-[#C59B58]' : 'w-2 bg-[#EAE4D7]'}`} /></button>)}
              <button type="button" onClick={() => move(1)} aria-label="Banner tiếp theo" className="rounded-full p-3 hover:bg-[#F3EFE6]"><ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

