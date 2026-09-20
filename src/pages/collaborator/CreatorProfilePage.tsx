import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Share2, Award } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import KycSubmissionPage from './KycSubmissionPage';
import SocialChannelsPage from './SocialChannelsPage';
import KolTierStatusPage from './KolTierStatusPage';

export default function CreatorProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kyc';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'kyc',
      label: 'Định danh điện tử KYC',
      icon: ShieldCheck,
    },
    {
      id: 'social',
      label: 'Kênh Mạng Xã Hội',
      icon: Share2,
    },
    {
      id: 'tiers',
      label: 'Cấp bậc & Vinh danh',
      icon: Award,
    },
  ];

  return (
    <div className="w-full flex flex-col" id="creator-profile-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        title="Hồ Sơ & Cấp Bậc KOL"
        subtitle="Quản lý hồ sơ định danh điện tử, kết nối kênh mạng xã hội tiếp thị và theo dõi thứ hạng thành tích"
      />

      <div className="w-full min-h-[500px]">
        {activeTab === 'kyc' && (
          <div className="animate-in fade-in-50 duration-200">
            <KycSubmissionPage />
          </div>
        )}

        {activeTab === 'social' && (
          <div className="animate-in fade-in-50 duration-200">
            <SocialChannelsPage />
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="animate-in fade-in-50 duration-200">
            <KolTierStatusPage />
          </div>
        )}
      </div>
    </div>
  );
}
