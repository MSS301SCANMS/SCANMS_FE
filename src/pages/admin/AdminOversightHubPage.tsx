import { useSearchParams, Navigate } from 'react-router-dom';
import { Link2, Tag } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { authService } from '../../services/auth.service';
import AdminReferralLinksPage from './AdminReferralLinksPage';
import AdminCouponsPage from './AdminCouponsPage';

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
    { id: 'links', label: 'Referral Links', icon: Link2 },
    { id: 'coupons', label: 'Vouchers', icon: Tag },
  ];

  return (
    <div className="w-full min-w-0 flex flex-col gap-4 text-[#1A1612]" id="admin-oversight-hub">
      <PageHeader
        title="Referral & Voucher"
        description="Giám sát link tiếp thị và voucher theo mainflow affiliate/promotion"
        icon={<Link2 className="w-5 h-5" />}
      />

      <HubTabs
        className="mb-2 shadow-none"
        compact
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        stretchTabs
        stretchTabColumns={2}
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
      </div>
    </div>
  );
}
