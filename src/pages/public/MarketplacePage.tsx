import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  X,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import api from '../../services/api';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import { LiveCommerceHubModal } from '../../components/marketplace/LiveCommerceHubModal';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { MarketplaceShortcuts } from '../../components/marketplace/MarketplaceShortcuts';
import { OrderTrackingShortcut } from '../../components/marketplace/OrderTrackingShortcut';
import { LiveNowSection } from '../../components/marketplace/LiveNowSection';
import { SponsoredStores } from '../../components/marketplace/SponsoredStores';
import type { MarketplaceStore } from '@/types/marketplace-home.types';
import { MarketplaceHero } from '../../components/marketplace/MarketplaceHero';
import { ProductCatalogBrowser } from '../../components/marketplace/ProductCatalogBrowser';

export default function MarketplacePage() {
  const location = useLocation();

  const { data: featuredStores = [] } = useQuery<MarketplaceStore[]>({
    queryKey: ['marketplace-featured-stores'],
    queryFn: async () => {
      const res: any = await api.get('/stores/marketplace');
      const payload = res?.data?.data ?? res?.data ?? res ?? [];
      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const marketplaceStores = featuredStores;

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const catalogRef = useRef<HTMLElement>(null);
  const trackingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targetId = location.hash.slice(1);
    if (!['catalog-section', 'live', 'tracking-section'].includes(targetId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key]);

  useEffect(() => {
    if (!isGuideOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsGuideOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [isGuideOpen]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F]">

      <PublicHeader onOpenTracking={() => trackingRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <MarketplaceShortcuts onOpenLive={() => setIsLiveModalOpen(true)} />

      <MarketplaceHero stores={marketplaceStores} onOpenLive={() => setIsLiveModalOpen(true)} />

      <SponsoredStores />

      <LiveNowSection onOpenHub={() => setIsLiveModalOpen(true)} />

      {/* Guest + logged-in: same filter/sort catalog (Search layout) under Live */}
      <section
        ref={catalogRef}
        id="catalog-section"
        className="w-full scroll-mt-36 bg-[#FAF8F5] py-4 text-left lg:py-5"
      >
        <ProductCatalogBrowser mode="embed" pageSize={20} />
      </section>

      <OrderTrackingShortcut sectionRef={trackingRef} />

      <footer className="mt-auto border-t border-[#EAE4D7] bg-[#F3EFE6] px-4 py-9 text-left text-[#1A1612] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1fr] lg:gap-10">
          <div className="max-w-sm">
            <div className="mb-3">
              <ScanMSLogo size="sm" />
            </div>
            <p className="m-0 text-xs leading-relaxed text-[#7D715E]">
              Hệ thống sàn thương mại tiếp thị liên kết đa gian hàng, kết nối hàng nghìn Creator với các thương hiệu chính hãng hàng đầu.
            </p>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              Dành cho người mua
            </strong>
            <ul className="m-0 list-none space-y-2 p-0 text-[11px] text-[#7D715E]">
              <li>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="hover:text-[#B88E4F] transition cursor-pointer font-medium"
                >
                  Chính sách bảo hộ 14 ngày
                </button>
              </li>
              <li>
                <Link to="/search" className="hover:text-[#B88E4F] transition font-medium">
                  Tìm kiếm sản phẩm
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => trackingRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#B88E4F] transition cursor-pointer font-medium"
                >
                  Tra cứu đơn hàng
                </button>
              </li>
            </ul>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              Dành cho đối tác
            </strong>
            <ul className="m-0 list-none space-y-2 p-0 text-[11px] text-[#7D715E]">
              <li>
                <Link to="/register?role=MERCHANT" className="hover:text-[#B88E4F] transition font-medium">
                  Mở gian hàng
                </Link>
              </li>
              <li>
                <Link to="/register?role=COLLABORATOR" className="hover:text-[#B88E4F] transition font-medium">
                  Trở thành KOC / CTV
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              Cam kết ScanMS
            </strong>
            <ul className="m-0 list-none space-y-2 p-0 text-[11px] text-[#7D715E]">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                Gian hàng đối tác KYC
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                Bảo hộ giao dịch 14 ngày
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" onClick={() => setIsGuideOpen(false)}>
          <div
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#EAE4D7] bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="absolute right-3 top-3 rounded-xl p-1.5 text-[#7D715E] hover:bg-[#FAF8F5]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EAE4D7] bg-[#FBF5EB] text-[#B88E4F]">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="m-0 font-display text-lg font-black text-[#1A1612]">
              Chính Sách Mua Sắm An Tâm Tại ScanMS
            </h3>
            <p className="mb-5 mt-1 text-xs text-[#7D715E]">
              ScanMS cam kết bảo vệ quyền lợi người tiêu dùng thông qua mạng lưới gian hàng đối tác xác minh 100% KYC.
            </p>

            <div className="space-y-4 text-xs leading-relaxed text-[#7D715E]">
              <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3.5">
                <strong className="mb-1 block text-xs font-bold text-[#1A1612]">
                  1. Quyền lợi Đồng kiểm tận tay khi nhận hàng
                </strong>
                Quý khách được quyền mở gói hàng và kiểm tra ngoại quan cùng bưu tá trước khi thanh toán. Nếu phát hiện sản phẩm vỡ hỏng, sai mô tả hoặc nghi vấn nguồn gốc, quý khách có quyền từ chối nhận hàng không phát sinh bất kỳ khoản phí nào.
              </div>

              <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3.5">
                <strong className="mb-1 block text-xs font-bold text-[#1A1612]">
                  2. Bảo hộ đổi trả miễn phí trong vòng 14 ngày
                </strong>
                Trong vòng 14 ngày kể từ ngày nhận hàng, quý khách được hỗ trợ đổi sản phẩm mới hoặc hoàn tiền 100% nếu sản phẩm có lỗi từ nhà sản xuất hoặc gây kích ứng đối với dòng mỹ phẩm chính hãng.
              </div>

              <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3.5">
                <strong className="mb-1 block text-xs font-bold text-[#1A1612]">
                  3. Cam kết chính hãng & Tra cứu hành trình minh bạch
                </strong>
                Mọi thương hiệu và gian hàng đều có hồ sơ pháp nhân được System Admin duyệt trên hệ thống. Quý khách có thể sử dụng Số điện thoại hoặc Mã vận đơn để tra cứu tiến độ bưu kiện bất kỳ lúc nào.
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-[#EAE4D7] pt-4">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="cursor-pointer rounded-xl bg-[#C59B58] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#B88E4F]"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveCommerceHubModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
      />

    </div>
  );
}
