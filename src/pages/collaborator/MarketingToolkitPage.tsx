import { useSearchParams } from 'react-router-dom';
import { Link2, Images, Tag, Clock, Video, Plus } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import ReferralLinksPage from './ReferralLinksPage';
import MediaHubBrowserPage from './MediaHubBrowserPage';
import KolCouponsPage from './KolCouponsPage';

export default function MarketingToolkitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'links';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'links',
      label: 'Link & QR Tiếp thị',
      icon: Link2,
    },
    {
      id: 'media',
      label: 'Kho Nội dung Media',
      icon: Images,
    },
    {
      id: 'coupons',
      label: 'Mã Giảm Giá Độc Quyền',
      icon: Tag,
    },
  ];

  const actions = (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <span className="hidden 2xl:inline-flex items-center gap-1.5 text-xs font-semibold text-[#7D715E] whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-[#B88E4F]" />
        <span>Chính sách Last Click 30 ngày</span>
      </span>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('scanms_open_submit_video'))}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer select-none whitespace-nowrap shrink-0"
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
            setTimeout(() => window.dispatchEvent(new CustomEvent('scanms_open_create_link')), 150);
          } else {
            window.dispatchEvent(new CustomEvent('scanms_open_create_link'));
          }
        }}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-[#B88E4F] hover:text-[#A47B3E] transition cursor-pointer select-none whitespace-nowrap shrink-0"
        title="Tạo link tiếp thị mới"
      >
        <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
        <span>Tạo link tiếp thị mới</span>
      </button>
    </div>
  );

  return (
    <div className="w-full flex flex-col pt-1 sm:pt-1.5" id="marketing-toolkit-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="pills"
        actions={actions}
        compact
        className="mb-1.5"
      />

      <div className="w-full min-h-[500px]">
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
    </div>
  );
}
