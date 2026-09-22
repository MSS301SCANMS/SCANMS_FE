import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import RealtimeAnalyticsPage from '../dashboard/RealtimeAnalyticsPage';
import LeaderboardPage from '../dashboard/LeaderboardPage';
import KolRecommendationPage from '../merchant/KolRecommendationPage';

export default function AdminAnalyticsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'realtime';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    {
      id: 'realtime',
      label: 'Analytics Thời Gian Thực',
      icon: TrendingUp,
    },
    {
      id: 'leaderboard',
      label: 'Bảng Vinh Danh Top KOL',
      icon: Trophy,
    },
    {
      id: 'ai-matching',
      label: 'AI Khớp Nối Toàn Sàn',
      icon: Sparkles,
    },
  ];

  return (
    <div className="w-full flex flex-col" id="admin-analytics-hub">
      <HubTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        title="Giám Sát & Hiệu Suất Toàn Sàn"
        subtitle="Theo dõi biến động doanh thu theo thời gian thực, bảng xếp hạng các nhà sáng tạo hàng đầu và điều phối AI matching"
      />

      <div className="w-full min-h-[500px]">
        {activeTab === 'realtime' && (
          <div className="animate-in fade-in-50 duration-200">
            <RealtimeAnalyticsPage />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in-50 duration-200">
            <LeaderboardPage />
          </div>
        )}

        {activeTab === 'ai-matching' && (
          <div className="animate-in fade-in-50 duration-200">
            <KolRecommendationPage />
          </div>
        )}
      </div>
    </div>
  );
}
