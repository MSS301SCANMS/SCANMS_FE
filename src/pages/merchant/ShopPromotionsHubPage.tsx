import { useSearchParams } from 'react-router-dom';
import { Tag, Trophy, Link2 } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import ShopCouponsPage from './ShopCouponsPage';
import { CommissionRulesPage } from './CommissionRulesPage';
import StoreReferralLinksPage from './StoreReferralLinksPage';

export default function ShopPromotionsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'coupons';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'coupons',
      label: 'Mã giảm giá (Coupons)',
      icon: Tag,
    },
    {
      id: 'commission-rules',
      label: 'Cấu hình % Hoa hồng',
      icon: Trophy,
    },
    {
      id: 'referral-links',
      label: 'Link Tiếp thị của Shop',
      icon: Link2,
    },
  ];

  return (
    <div className="w-full flex flex-col" id="shop-promotions-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        title="Khuyến Mãi & Hoa Hồng"
        subtitle="Quản lý chiến lược chiết khấu tiếp thị: phát hành mã giảm giá, thiết lập chính sách hoa hồng lũy tiến và giám sát link tiếp thị"
      />

      <div className="w-full min-h-[500px]">
        {activeTab === 'coupons' && (
          <div className="animate-in fade-in-50 duration-200">
            <ShopCouponsPage />
          </div>
        )}

        {activeTab === 'commission-rules' && (
          <div className="animate-in fade-in-50 duration-200">
            <CommissionRulesPage />
          </div>
        )}

        {activeTab === 'referral-links' && (
          <div className="animate-in fade-in-50 duration-200">
            <StoreReferralLinksPage />
          </div>
        )}
      </div>
    </div>
  );
}
