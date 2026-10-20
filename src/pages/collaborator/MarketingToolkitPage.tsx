import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import { Link2, Images, Tag, Video, Plus } from 'lucide-react';
import { type HubTabItem } from '../../components/common/HubTabs';
import ReferralLinksPage from './ReferralLinksPage';
import MediaHubBrowserPage from './MediaHubBrowserPage';
import KolCouponsPage from './KolCouponsPage';
import './MarketingToolkitPage.css';
export default function MarketingToolkitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'links';
  const [isSubmitVideoOpen, setIsSubmitVideoOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'links',
      label: 'Link & QR tiếp thị',
      icon: Link2,
    },
    {
      id: 'media',
      label: 'Kho nội dung',
      icon: Images,
    },
    {
      id: 'coupons',
      label: 'Mã giảm giá độc quyền',
      icon: Tag,
    },
  ];

  const actions = (
    <div className="grid min-w-0 grid-cols-2 gap-2 xl:col-span-2">
      <button
        type="button"
        onClick={() => setIsSubmitVideoOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] px-2 py-2 border border-[#EAE4D7] rounded-xl bg-white text-[#1A1612] text-xs font-bold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors shadow-none focus-visible:outline-2 focus-visible:outline-[#C59B58] focus-visible:outline-offset-2 cursor-pointer"
        title="Nộp video review sản phẩm"
      >
        <Video className="w-3.5 h-3.5 text-[#B88E4F]" />
        <span>Nộp video review</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (activeTab !== 'links') {
            handleTabChange('links');
            setTimeout(() => window.dispatchEvent(new CustomEvent('scanms_open_create_link')), 200);
          } else {
            window.dispatchEvent(new CustomEvent('scanms_open_create_link'));
          }
        }}
        className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] px-2 py-2 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#795A2D] text-xs font-bold transition-colors shadow-none cursor-pointer"
        title="Tạo link tiếp thị mới"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Tạo link mới</span>
      </button>
    </div>
  );

  return (
    <div id="marketing-toolkit-hub" data-active-tab={activeTab} role="region" aria-label="Công cụ tiếp thị" className="flex flex-col gap-4 w-full min-w-0 text-[#1A1612] pb-16 md:pb-0">
      <div className="mb-1 grid w-full min-w-0 grid-cols-1 gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-2.5 xl:grid-cols-5">
        <div role="tablist" aria-label="Công cụ tiếp thị" className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 xl:col-span-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return <button key={tab.id} id={`hub-tab-${tab.id}`} type="button" role="tab"
              aria-selected={selected} onClick={() => handleTabChange(tab.id)}
              className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${selected
                ? 'border-[#C59B58] bg-[#FBF5EB] text-[#1A1612]'
                : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FAF8F5]'}`}>
              <Icon className="h-4 w-4 shrink-0 text-[#B88E4F]" />
              <span>{tab.label}</span>
            </button>;
          })}
        </div>
        {actions}
      </div>

      <div className="w-full min-w-0 min-h-[500px]">
        {activeTab === 'links' && (
          <div className="animate-in fade-in-50 duration-200">
            <ReferralLinksPage />
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-in fade-in-50 duration-200">
            <MediaHubBrowserPage />
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="animate-in fade-in-50 duration-200">
            <KolCouponsPage />
          </div>
        )}
      </div>
      <SubmitKolVideoModal
        isOpen={isSubmitVideoOpen}
        onClose={() => setIsSubmitVideoOpen(false)}
        onSuccess={() => window.dispatchEvent(new CustomEvent('scanms_media_updated'))}
      />
    </div>
  );
}
