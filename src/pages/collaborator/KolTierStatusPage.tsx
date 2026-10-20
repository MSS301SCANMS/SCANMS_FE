import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trophy, Award, Target, ArrowUpRight, Gift, Check } from 'lucide-react';
import { tierService, type TierStatus, type TierPolicy } from '../../services/tier.service';
import { leaderboardService, type LeaderboardPodium } from '../../services/leaderboard.service';
import LeaderboardPage from '../dashboard/LeaderboardPage';
import KolBonusProgressPage from './KolBonusProgressPage';
import { KolTierExplanation } from '../../components/affiliate/KolTierExplanation';

const currency = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
const samePolicy = (left: TierPolicy, right: TierPolicy) =>
  left.id === right.id || (
    left.name.trim().toLowerCase() === right.name.trim().toLowerCase() &&
    Number(left.minRevenueThreshold) === Number(right.minRevenueThreshold) &&
    Number(left.extraBonusPercentage) === Number(right.extraBonusPercentage)
  );

export default function KolTierStatusPage({ view = 'tiers' }: { view?: 'tiers' | 'leaderboard' | 'bonus' } = {}) {
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [podium, setPodium] = useState<LeaderboardPodium | null>(null);
  const [tierPolicies, setTierPolicies] = useState<TierPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [policyError, setPolicyError] = useState(false);
  const [podiumError, setPodiumError] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);

  useEffect(() => {
    if (view !== 'tiers') return;
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      const [status, policies, podiumData] = await Promise.allSettled([
        tierService.getMyTierStatus(),
        tierService.getAllTiers(),
        leaderboardService.getPodium({ metric: 'REVENUE', timeRange: 'this_month' }),
      ]);
      if (cancelled) return;
      setTierStatus(status.status === 'fulfilled' ? status.value : null);
      setTierPolicies(policies.status === 'fulfilled' ? policies.value : []);
      setPodium(podiumData.status === 'fulfilled' ? podiumData.value : null);
      setStatusError(status.status === 'rejected');
      setPolicyError(policies.status === 'rejected');
      setPodiumError(podiumData.status === 'rejected');
      setLoading(false);
    };
    void loadData();
    return () => { cancelled = true; };
  }, [view, loadRevision]);

  const currentTier = tierStatus?.currentTier;
  const currentRevenue = Number(tierStatus?.currentRevenue || 0);
  const totalOrders = Number(tierStatus?.totalOrders || 0);
  const nextTier = tierStatus?.nextTier;
  const targetSales = Number(nextTier?.minRevenueThreshold || 0);
  const progressPct = Number(tierStatus?.progressPercentage ?? 0);
  const podiumEntries = [
    { slot: 2, creator: podium?.rank2 },
    { slot: 1, creator: podium?.rank1 },
    { slot: 3, creator: podium?.rank3 },
  ].filter(entry => entry.creator);
  const retry = () => setLoadRevision(revision => revision + 1);

  return (
    <div className="flex flex-col gap-3 min-w-0 text-[#1A1612] text-left">
      <nav className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 border border-[#EAE4D7] rounded-xl bg-white" aria-label="Cấp bậc và vinh danh">
        <Link
          to="/collaborator/tiers"
          aria-current={view === 'tiers' ? 'page' : undefined}
          className={`flex items-center justify-center gap-2 min-h-[38px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            view === 'tiers'
              ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
              : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
          }`}
        >
          <Award className="w-4 h-4 text-[#B88E4F] shrink-0" aria-hidden="true" />
          <span>Cấp bậc &amp; Quyền lợi</span>
        </Link>
        <Link
          to="/collaborator/leaderboard"
          aria-current={view === 'leaderboard' ? 'page' : undefined}
          className={`flex items-center justify-center gap-2 min-h-[38px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            view === 'leaderboard'
              ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
              : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#B88E4F] shrink-0" aria-hidden="true" />
          <span>Bảng vinh danh Top Creator</span>
        </Link>
        <Link
          to="/collaborator/bonus-progress"
          aria-current={view === 'bonus' ? 'page' : undefined}
          className={`flex items-center justify-center gap-2 min-h-[38px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            view === 'bonus'
              ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
              : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
          }`}
        >
          <Target className="w-4 h-4 text-[#B88E4F] shrink-0" aria-hidden="true" />
          <span>Tiến độ thưởng doanh số</span>
        </Link>
      </nav>

      {view === 'leaderboard' ? (
        <LeaderboardPage alignToContainer />
      ) : view === 'bonus' ? (
        <KolBonusProgressPage embedded />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
          {loading ? (
            <section className="flex items-center justify-center p-6 border border-[#EAE4D7] rounded-xl bg-white text-xs text-[#7D715E]" role="status">
              Đang tải cấp bậc và tiến độ…
            </section>
          ) : statusError || !currentTier || !tierStatus ? (
            <section className="flex items-center justify-between gap-3 p-4 border border-[#EAE4D7] rounded-xl bg-white text-xs text-[#7D715E]" role="status">
              <span>Chưa tải được cấp bậc đang áp dụng.</span>
              <button className="px-3 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] font-medium hover:bg-[#FAF8F5]" onClick={retry}>Thử lại</button>
            </section>
          ) : (
            <section className="flex flex-col p-4 sm:p-5 border border-[#EAE4D7] rounded-xl bg-white" aria-labelledby="tier-current-title">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center w-12 h-12 shrink-0 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                    <Crown className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#7D715E]">Cấp bậc hiện tại</p>
                    <h2 id="tier-current-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1612] truncate">{currentTier.name}</h2>
                    <p className="text-xs text-[#7D715E] mt-0.5">
                      Thưởng <strong className="text-[#1A1612] font-semibold">+{Number(currentTier.extraBonusPercentage)}%</strong> cho đơn hàng đủ điều kiện
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-4">
                <div className="flex flex-col gap-1 p-2.5 sm:p-3 border border-[#EAE4D7] rounded-lg bg-white">
                  <span className="text-[11px] text-[#7D715E]">GMV tháng trước</span>
                  <strong className="text-sm sm:text-base font-bold text-[#1A1612] tabular-nums truncate">{currency(currentRevenue)}</strong>
                </div>
                <div className="flex flex-col gap-1 p-2.5 sm:p-3 border border-[#EAE4D7] rounded-lg bg-white">
                  <span className="text-[11px] text-[#7D715E]">Đơn thành công</span>
                  <strong className="text-sm sm:text-base font-bold text-[#1A1612] tabular-nums truncate">{totalOrders.toLocaleString('vi-VN')} đơn</strong>
                </div>
                <div className="flex flex-col gap-1 p-2.5 sm:p-3 border border-[#EAE4D7] rounded-lg bg-white">
                  <span className="text-[11px] text-[#7D715E]">Hoa hồng thưởng</span>
                  <strong className="text-sm sm:text-base font-bold text-[#1A1612] tabular-nums truncate">+{currentTier.extraBonusPercentage || 0}%</strong>
                </div>
              </div>

              <KolTierExplanation status={tierStatus} />
              {nextTier ? (
                <div className="pt-3 border-t border-[#EAE4D7]" id="tier-promotion-progress">
                  <div className="flex items-center justify-between gap-2.5 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-[#7D715E]">Hạng tiếp theo:</span>
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#1A1612]">
                        {nextTier.name}
                        <span className="text-[10px] font-semibold text-[#1A1612] bg-[#FBF5EB] border border-[#EEDFC6] rounded px-1.5 py-0.5">+{nextTier.extraBonusPercentage || 0}% thưởng</span>
                      </h3>
                    </div>
                    <span className="grid place-items-center min-w-[36px] h-7 px-2 border border-[#EAE4D7] rounded-md text-xs font-bold text-[#1A1612]">{progressPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EFE6] overflow-hidden" role="progressbar" aria-label={`Tiến độ lên hạng ${nextTier.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, progressPct))}>
                    <div className="h-full bg-[#C59B58] rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
                  </div>
                  <div className="flex justify-between flex-wrap gap-1 text-[11px] text-[#7D715E] mt-1.5">
                    <span>{currency(currentRevenue)} / {currency(targetSales)}</span>
                    <span>Còn {currency(tierStatus.revenueNeeded)} để đạt ngưỡng</span>
                  </div>
                  {tierStatus.qualifiedTier && Number(tierStatus.qualifiedTier.minRevenueThreshold) > Number(currentTier.minRevenueThreshold) && (
                    <p className="mt-2.5 p-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#7D715E] text-xs">
                      Bạn đã đạt ngưỡng hạng {tierStatus.qualifiedTier.name}. Hạng mới có hiệu lực sau khi được đánh giá cấp bậc.
                    </p>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2 pt-3 border-t border-[#EAE4D7] text-xs text-[#7D715E]">
                  <Check className="w-4 h-4 text-[#059669]" aria-hidden="true" /> Bạn đang ở cấp bậc cao nhất trong hệ thống đối tác.
                </p>
              )}
              <div className="flex items-center justify-between gap-2 pt-3 mt-auto text-xs border-t border-[#EAE4D7]">
                <div className="flex items-center gap-1.5 text-[#7D715E]">
                  <Gift className="w-3.5 h-3.5 text-[#B88E4F]" aria-hidden="true" />
                  <span>Sản phẩm mẫu:</span>
                </div>
                <strong className="text-[#1A1612] font-medium">Theo xét duyệt của Shop</strong>
              </div>
            </section>
          )}

          {/* Policy Panel */}
          <section className="flex flex-col p-4 sm:p-5 border border-[#EAE4D7] rounded-xl bg-white" aria-labelledby="tier-policy-title">
            <header className="flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F]">
                  <Award className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="tier-policy-title" className="text-sm font-semibold text-[#1A1612]">Cấp bậc &amp; quyền lợi</h2>
                  <p className="text-[11px] text-[#7D715E]">Xét hạng theo GMV hợp lệ của tháng trước.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 border border-[#EAE4D7] rounded-md text-[11px] text-[#7D715E]">
                {loading ? 'Đang tải…' : policyError ? 'Chưa tải được' : `${tierPolicies.length} cấp bậc`}
              </span>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="Chính sách cấp bậc">
              {loading || policyError || !tierPolicies.length ? (
                <p className="col-span-full py-6 text-center text-xs text-[#7D715E]">
                  {loading ? 'Đang tải chính sách cấp bậc…' : policyError ? <>Chưa tải được chính sách. <button className="ml-2 px-2 py-0.5 border border-[#EEDFC6] rounded bg-[#FBF5EB] text-[#1A1612]" onClick={retry}>Thử lại</button></> : 'Chưa có chính sách cấp bậc được cấu hình.'}
                </p>
              ) : (
                tierPolicies.map(policy => {
                  const isCurrent = !statusError && currentTier && samePolicy(currentTier, policy);
                  return (
                    <article
                      key={policy.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        isCurrent
                          ? 'border-[#EEDFC6] bg-[#FBF5EB]'
                          : 'border-[#EAE4D7] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                        <h3 className="text-xs font-semibold text-[#1A1612]">{policy.name}</h3>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[#EEDFC6] rounded bg-white text-[#B88E4F] text-[9px] font-medium">
                            <Check className="w-2.5 h-2.5" aria-hidden="true" /> Hiện tại
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <strong className="text-lg font-bold text-[#1A1612] tracking-tight">+{Number(policy.extraBonusPercentage)}%</strong>
                        <span className="text-[10px] text-[#7D715E]">hoa hồng thưởng</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#7D715E]">
                        Từ <strong className="text-[#1A1612] font-medium">{currency(Number(policy.minRevenueThreshold))}</strong>
                      </p>
                    </article>
                  );
                })
              )}
            </div>
            <p className="mt-auto pt-3 border-t border-[#EAE4D7] text-[11px] text-[#7D715E]">
              Hạng có hiệu lực sau khi hệ thống đánh giá. Hạn mức mẫu do từng Shop xét duyệt.
            </p>
          </section>

          {/* Featured Creators */}
          <section className="col-span-full p-4 sm:p-5 border border-[#EAE4D7] rounded-xl bg-white" aria-labelledby="tier-featured-title">
            <header className="flex items-center justify-between flex-wrap gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F]">
                  <Trophy className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="tier-featured-title" className="text-sm font-semibold text-[#1A1612]">Nhà sáng tạo nổi bật tháng này</h2>
                  <p className="text-[11px] text-[#7D715E]">Xếp hạng theo doanh số ghi nhận khi giao / hoàn tất trong tháng.</p>
                </div>
              </div>
              <Link className="inline-flex items-center gap-1 text-xs font-medium text-[#7D715E] hover:text-[#B88E4F] transition-colors" to="/collaborator/leaderboard">
                Xem bảng xếp hạng <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </header>
            {loading ? (
              <p className="py-4 text-center text-xs text-[#7D715E]" role="status">Đang tải nhà sáng tạo nổi bật…</p>
            ) : podiumError ? (
              <div className="py-4 text-center text-xs text-[#7D715E]" role="status">
                Chưa tải được bảng vinh danh. <button className="ml-2 px-2 py-0.5 border border-[#EEDFC6] rounded bg-[#FBF5EB] text-[#1A1612]" onClick={retry}>Thử lại</button>
              </div>
            ) : !podiumEntries.length ? (
              <p className="py-4 text-center text-xs text-[#7D715E]">Chưa có Creator đủ điều kiện vinh danh trong tháng này.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EAE4D7]">
                {podiumEntries.map(({ creator }) => {
                  const rank = creator!.rank;
                  return (
                    <article className="p-3 sm:px-4 flex flex-col justify-between gap-3 min-w-0" key={creator!.collaboratorId}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="relative grid place-items-center w-9 h-9 shrink-0 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F] font-semibold text-xs overflow-hidden" aria-hidden="true">
                          {creator?.fullName?.charAt(0) || rank}
                          {creator?.avatarUrl && <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-semibold text-[#1A1612] truncate">{creator?.fullName || 'Đang cập nhật'}</h3>
                          <p className="text-[11px] text-[#7D715E] truncate">{creator?.tierName || 'KOL Tiếp thị'}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[#EEDFC6] rounded bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-semibold shrink-0">
                          {rank === 1 && <Crown className="w-3 h-3" aria-hidden="true" />} Hạng {rank}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-[#EAE4D7]">
                        <span className="text-[10px] text-[#7D715E]">Doanh số GMV{rank === 1 ? ' xuất sắc' : ''}:</span>
                        <strong className="text-sm font-bold text-[#1A1612] tabular-nums">{currency(Number(creator?.grossRevenue || 0))}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
