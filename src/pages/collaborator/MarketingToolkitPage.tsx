import { useSearchParams } from 'react-router-dom';
import { Link2, Images, Tag } from 'lucide-react';
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

  return (
    <div className="w-full flex flex-col" id="marketing-toolkit-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        title="Trung Tâm Tiếp Thị"
        subtitle="Bộ công cụ toàn diện dành cho KOL: quản lý link affiliate, tải ảnh/video tư liệu và nhận mã giảm giá độc quyền"
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
