import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag, Trophy, Link2, Radio, RefreshCw } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import ShopCouponsPage from './ShopCouponsPage';
import { CommissionRulesPage } from './CommissionRulesPage';
import StoreReferralLinksPage from './StoreReferralLinksPage';
import LiveSessionsPage from './LiveSessionsPage';

export default function ShopPromotionsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'coupons';
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasOpenedLiveTab, setHasOpenedLiveTab] = useState(activeTab === 'live-sessions');

  useEffect(() => {
    if (activeTab === 'live-sessions') setHasOpenedLiveTab(true);
  }, [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleTabChange = (tabId: string) => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        updated.set('tab', tabId);
        return updated;
      },
      { replace: true }
    );
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
    {
      id: 'live-sessions',
      label: 'Voucher Livestream',
      icon: Radio,
    },
  ];

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1520px] flex-col gap-4 pt-3 pb-6 sm:pt-4" id="shop-promotions-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        compact
        stretchTabs
        tone="light"
        className="mb-0"
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] transition shadow-2xs cursor-pointer select-none active:scale-95 disabled:opacity-60"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#B88E4F] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        }
      />

      <div className="w-full min-w-0">
        {activeTab === 'coupons' && (
          <div key={`coupons-${refreshKey}`} className="animate-in fade-in-50 duration-200">
            <ShopCouponsPage />
          </div>
        )}

        {activeTab === 'commission-rules' && (
          <div key={`commission-${refreshKey}`} className="animate-in fade-in-50 duration-200">
            <CommissionRulesPage />
          </div>
        )}

        {activeTab === 'referral-links' && (
          <div key={`referral-${refreshKey}`} className="animate-in fade-in-50 duration-200">
            <StoreReferralLinksPage />
          </div>
        )}

        {hasOpenedLiveTab && (
          <div className={activeTab === 'live-sessions' ? 'animate-in fade-in-50 duration-200' : 'hidden'}>
            <LiveSessionsPage refreshKey={refreshKey} isActive={activeTab === 'live-sessions'} />
          </div>
        )}
      </div>
    </div>
  );
}
