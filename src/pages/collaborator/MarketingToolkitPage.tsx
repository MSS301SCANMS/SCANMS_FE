import { useSearchParams } from 'react-router-dom';
import { Link2, Tag, Plus, Radio, Handshake } from 'lucide-react';
import { PartnershipInvitations } from '../../components/affiliate/PartnershipInvitations';
import { type HubTabItem } from '../../components/common/HubTabs';
import ReferralLinksPage from './ReferralLinksPage';
import KolCouponsPage from './KolCouponsPage';
import CollaboratorLiveSessionsPage from './LiveSessionsPage';
import './MarketingToolkitPage.css';

export default function MarketingToolkitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab =
    tabParam === 'invitations' ? 'invitations' : tabParam === 'coupons' ? 'coupons' : tabParam === 'live' ? 'live' : 'links';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabs: HubTabItem[] = [
    { id: 'invitations', label: 'Lời mời hợp tác', icon: Handshake },
    { id: 'links', label: 'Liên kết tiếp thị', icon: Link2 },
    { id: 'coupons', label: 'Mã giảm giá KOL', icon: Tag },
    { id: 'live', label: 'Tham gia phát trực tiếp', icon: Radio },
  ];

  return (
    <div
      id="marketing-toolkit-hub"
      data-active-tab={activeTab}
      role="region"
      aria-label="Công cụ tiếp thị"
      className="flex flex-col gap-4 w-full min-w-0 text-[#1A1612] pb-16 md:pb-0"
    >
      <div className="mb-1 grid w-full min-w-0 grid-cols-1 gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-2.5 md:grid-cols-4">
        <div role="tablist" aria-label="Công cụ tiếp thị" className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 md:col-span-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`hub-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#C59B58] bg-[#FBF5EB] text-[#1A1612]'
                    : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'links', create: '1' }, { replace: true })}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 min-h-[44px] px-2 py-2 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#795A2D] text-xs font-bold transition-colors shadow-none cursor-pointer"
            title="Tạo liên kết tiếp thị mới"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Tạo liên kết mới</span>
          </button>
        </div>
      </div>

      <div className="w-full min-w-0 min-h-[500px]">
        {activeTab === 'invitations' && <PartnershipInvitations mode="kol" />}
        {activeTab === 'links' && (
          <div className="animate-in fade-in-50 duration-200">
            <ReferralLinksPage />
          </div>
        )}
        {activeTab === 'coupons' && (
          <div className="animate-in fade-in-50 duration-200">
            <KolCouponsPage />
          </div>
        )}
        {activeTab === 'live' && (
          <div className="animate-in fade-in-50 duration-200">
            <CollaboratorLiveSessionsPage />
          </div>
        )}
      </div>
    </div>
  );
}
