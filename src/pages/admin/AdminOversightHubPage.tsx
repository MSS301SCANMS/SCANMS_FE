import { useSearchParams, Navigate } from 'react-router-dom';
import { Link2, Tag, Radio } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import { authService } from '../../services/auth.service';
import AdminReferralLinksPage from './AdminReferralLinksPage';
import AdminCouponsPage from './AdminCouponsPage';
import AdminLiveSessionsPage from './AdminLiveSessionsPage';

export default function AdminOversightHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'links';

  const user = authService.getCurrentUser();
  if (user && user.role === 'SHOP_MANAGER') {
    return <Navigate to="/merchant/promotions?tab=referral-links" replace />;
  }
  if (user && user.role === 'COLLABORATOR') {
    return <Navigate to="/collaborator/marketing?tab=links" replace />;
  }
  if (user && user.role === 'CUSTOMER') {
    return <Navigate to="/customer/orders" replace />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
    {
      id: 'live-sessions',
      label: 'Giám sát Livestream',
      icon: Radio,
    },
  ];

  return (
    <div className="w-full min-w-0 flex flex-col pt-4 text-[#1A1612] sm:pt-5" id="admin-oversight-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        stretchTabs
        stretchTabColumns={3}
        tone="white"
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

        {activeTab === 'live-sessions' && <AdminLiveSessionsPage />}
      </div>
    </div>
  );
}
