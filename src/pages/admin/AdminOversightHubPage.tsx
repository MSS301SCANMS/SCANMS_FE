import { useSearchParams } from 'react-router-dom';
import { Link2, Tag } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import AdminReferralLinksPage from './AdminReferralLinksPage';
import AdminCouponsPage from './AdminCouponsPage';

export default function AdminOversightHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'links';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'links',
      label: 'Quản trị Link Tiếp thị Sàn',
      icon: Link2,
    },
    {
      id: 'coupons',
      label: 'Quản trị Mã Giảm Giá Sàn',
      icon: Tag,
    },
  ];

  return (
    <div className="w-full flex flex-col" id="admin-oversight-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        title="Tiếp Thị & Dòng Tiền Toàn Sàn"
        subtitle="Giám sát và kiểm soát toàn diện hệ thống link tiếp thị affiliate và các mã ưu đãi giảm giá trên toàn nền tảng"
      />

      <div className="w-full min-h-[500px]">
        {activeTab === 'links' && (
          <div className="animate-in fade-in-50 duration-200">
            <AdminReferralLinksPage />
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="animate-in fade-in-50 duration-200">
            <AdminCouponsPage />
          </div>
        )}
      </div>
    </div>
  );
}
