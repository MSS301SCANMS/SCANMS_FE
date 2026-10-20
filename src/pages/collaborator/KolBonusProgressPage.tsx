import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Store,
  Layers,
  RotateCcw,
  Wallet,
  FileText,
  BadgePercent,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { commissionRulesService } from '../../services/commission-rules.service';
import api from '../../services/api';
import { getVietnamCurrentMonthYear } from '@/utils/date-time.utils';
import { Select } from '../../components/ui/Select';

interface MilestoneItem {
  id: string;
  name: string;
  minMonthlyRevenue: string;
  achievementBonus: string;
  bonusPercentage: string;
  description?: string;
  isReached: boolean;
}

interface BonusProgressData {
  storeId: string;
  storeName: string;
  storeLogo?: string;
  collaboratorId: string;
  yearMonth: string;
  validRevenue: string;
  validOrdersCount: number;
  currentMilestone: {
    id: string;
    name: string;
    minMonthlyRevenue: string;
    achievementBonus: string;
  } | null;
  achievementBonus: string;
  rangeBonuses: Array<{
    from: string;
    to: string;
    rate: string;
    revenue: string;
    bonus: string;
  }>;
  estimatedTotalBonus: string;
  nextMilestone: {
    id: string;
    name: string;
    minMonthlyRevenue: string;
    achievementBonus: string;
    bonusPercentage: string;
    missingRevenue: string;
  } | null;
  milestones: MilestoneItem[];
  settlementStatus: string;
  hasRefundAdjustment: boolean;
  settlement?: {
    id: string;
    status: string;
    bonusAmount: string;
    settledAt: string;
    approvedAt?: string;
    paidAt?: string;
  } | null;
  adjustments?: {
    hasAdjustment: boolean;
    totalAdjustmentAmount: string;
    items: Array<{
      id: string;
      amount: string;
      reason: string;
      status: string;
      createdAt: string;
    }>;
  };
}

export const KolBonusProgressPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { year: currentVnYear, month: currentVnMonth } = getVietnamCurrentMonthYear();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(currentVnYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentVnMonth);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [storesLoading, setStoresLoading] = useState<boolean>(true);
  const [storeInvitations, setStoreInvitations] = useState<any[]>([]);
  const [invitationLoading, setInvitationLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'progress' | 'history'>('progress');
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<BonusProgressData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const isDevMockEnabled = import.meta.env.VITE_ENABLE_MOCK_DEMO === 'true';
  const currentYearMonth = `${selectedYear}-${selectedMonth}`;



  useEffect(() => {
    const handleAuthSync = (event: MessageEvent) => {
      if (event.data?.type === 'SCANMS_AUTH_SYNC') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handleAuthSync);
    return () => window.removeEventListener('message', handleAuthSync);
  }, []);


  useEffect(() => {
    let isMounted = true;
    async function loadStores() {
      setStoresLoading(true);
      try {
        const res = await commissionRulesService.getCollaboratorStores(false);
        if (isMounted) {
          if (Array.isArray(res) && res.length > 0) {
            setStores(res.map((s: any) => ({ id: s.id, name: s.name })));
            setSelectedStoreId(res[0].id);
          } else {
            setStores([]);
            setSelectedStoreId('');
          }
        }
      } catch {
        if (isMounted) {
          setStores([]);
          setSelectedStoreId('');
        }
      } finally {
        if (isMounted) {
          setStoresLoading(false);
        }
      }
    }
    loadStores();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    api.get('/store-collaborators/my-invitations')
      .then((res: any) => {
        const body = res?.data || res;
        setStoreInvitations(Array.isArray(body) ? body.filter((item: any) => item.status === 'PENDING' && !item.requestedByKol) : []);
      })
      .catch(() => setStoreInvitations([]));
  }, []);

  const respondToStoreInvitation = async (id: string, accept: boolean) => {
    setInvitationLoading(id);
    try {
      await api.patch(`/store-collaborators/${id}/${accept ? 'accept' : 'reject'}`, {});
      setStoreInvitations((items) => items.filter((item) => item.id !== id));
      if (accept) window.location.reload();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Không thể xử lý lời mời của Shop');
    } finally {
      setInvitationLoading(null);
    }
  };


  useEffect(() => {
    if (window.parent && window.parent !== window) {
      const sendHeight = () => {
        const rootEl = document.getElementById('kol-bonus-root') || document.body;
        const h = Math.max(rootEl.scrollHeight, document.documentElement.scrollHeight, 680);
        window.parent.postMessage({ type: 'SCANMS_IFRAME_RESIZE', height: h }, '*');
        window.parent.postMessage({ type: 'SCANMS_RESIZE_IFRAME', height: h }, '*');
      };
      sendHeight();
      const observer = new ResizeObserver(() => sendHeight());
      observer.observe(document.body);
      const timer = setTimeout(sendHeight, 200);
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    }
  }, [loading, data, errorMessage, activeTab, historyList, historyLoading, selectedStoreId]);


  useEffect(() => {
    if (!selectedStoreId) {
      setLoading(false);
      setData(null);
      return;
    }

    let active = true;
    async function fetchProgress() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await commissionRulesService.getMyBonusProgress(selectedStoreId, currentYearMonth);
        if (!active) return;
        if (res && (res.validRevenue !== undefined || res.estimatedTotalBonus !== undefined)) {
          setData(res);
        } else {
          throw new Error('Dữ liệu không đúng định dạng');
        }
      } catch {
        if (!active) return;
        if (isDevMockEnabled) {
          setData({
            storeId: selectedStoreId,
            storeName: stores.find((s) => s.id === selectedStoreId)?.name || 'Cửa hàng liên kết',
            collaboratorId: 'kol-current',
            yearMonth: currentYearMonth,
            validRevenue: '60000000',
            validOrdersCount: 28,
            currentMilestone: {
              id: 'm1',
              name: 'Mốc Bạc 50 Triệu',
              minMonthlyRevenue: '50000000',
              achievementBonus: '500000',
            },
            achievementBonus: '500000',
            rangeBonuses: [
              {
                from: '50000000',
                to: '60000000',
                rate: '2',
                revenue: '10000000',
                bonus: '200000',
              },
            ],
            estimatedTotalBonus: '700000',
            nextMilestone: {
              id: 'm2',
              name: 'Mốc Vàng 100 Triệu',
              minMonthlyRevenue: '100000000',
              achievementBonus: '1500000',
              bonusPercentage: '3',
              missingRevenue: '40000000',
            },
            milestones: [
              {
                id: 'm1',
                name: 'Mốc Bạc 50 Triệu',
                minMonthlyRevenue: '50000000',
                achievementBonus: '500000',
                bonusPercentage: '2',
                description: 'Đạt doanh số 50 triệu thưởng nóng 500.000đ + 2% phần vượt',
                isReached: true,
              },
              {
                id: 'm2',
                name: 'Mốc Vàng 100 Triệu',
                minMonthlyRevenue: '100000000',
                achievementBonus: '1500000',
                bonusPercentage: '3',
                description: 'Đạt doanh số 100 triệu thưởng nóng 1.500.000đ + 3% phần vượt',
                isReached: false,
              },
            ],
            settlementStatus: 'ACCUMULATING',
            hasRefundAdjustment: false,
            settlement: null,
          });
        } else {
          setData(null);
          setErrorMessage('Không thể tải dữ liệu thưởng. Vui lòng đăng nhập lại hoặc thử lại sau.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProgress();
    return () => { active = false; };
  }, [selectedStoreId, currentYearMonth, isDevMockEnabled, stores]);


  useEffect(() => {
    if (activeTab !== 'history' || !selectedStoreId) return;

    let active = true;
    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await commissionRulesService.getMyBonusHistory(selectedStoreId);
        if (!active) return;
        if (Array.isArray(res)) {
          setHistoryList(res);
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch {
        if (!active) return;
        if (isDevMockEnabled) {
          setHistoryList([
            {
              id: 'settle-aug',
              yearMonth: '2026-08',
              storeName: stores.find((s) => s.id === selectedStoreId)?.name || 'Cửa hàng liên kết',
              validRevenue: '58000000',
              appliedRuleName: 'Mốc Bạc 50 Triệu',
              achievementBonus: '500000',
              bonusAmount: '660000',
              status: 'PAID',
              settledAt: '2026-09-01T02:00:00Z',
              approvedAt: '2026-09-02T10:15:00Z',
              paidAt: '2026-09-03T14:30:00Z',
              hasRefundAdjustment: false,
            },
          ]);
        } else {
          setHistoryList([]);
          setHistoryError('Không thể tải lịch sử nhận thưởng. Vui lòng đăng nhập lại hoặc thử lại sau.');
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    }
    fetchHistory();
    return () => { active = false; };
  }, [activeTab, selectedStoreId, isDevMockEnabled, stores]);

  const formatVnd = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCUMULATING':
        return {
          bg: '#FEF9C3',
          color: '#854D0E',
          border: '#FDE047',
          icon: <Clock size={16} color="#854D0E" />,
          label: 'Đang tích lũy doanh số',
          desc: 'Kỳ tháng hiện tại đang tiếp diễn. Doanh số tiếp tục được cộng dồn từ các đơn hàng thành công.',
        };
      case 'PENDING_SETTLEMENT':
        return {
          bg: '#FBF5EB',
          color: '#9A3412',
          border: '#FDBA74',
          icon: <AlertCircle size={16} color="#9A3412" />,
          label: 'Chờ Shop chốt thưởng',
          desc: 'Kỳ tháng đã kết thúc. Đang chờ Chủ Shop rà soát và tạo bản chốt thưởng.',
        };
      case 'PENDING':
        return {
          bg: '#FBF5EB',
          color: '#B88E4F',
          border: '#C59B58',
          icon: <Clock size={16} color="#B88E4F" />,
          label: 'Chờ duyệt chi trả',
          desc: 'Shop đã chốt bảng thưởng tháng. Đang chờ kế toán/chủ shop duyệt phê duyệt.',
        };
      case 'APPROVED':
        return {
          bg: '#FBF5EB',
          color: '#15803d',
          border: '#EAE4D7',
          icon: <CheckCircle2 size={16} color="#15803d" />,
          label: 'Đã duyệt thưởng',
          desc: 'Khoản thưởng đã được phê duyệt hợp lệ. Tiền sẽ sớm được chuyển vào Ví Khả Dụng.',
        };
      case 'PAID':
        return {
          bg: '#ECE1CD',
          color: '#B88E4F',
          border: '#DEBE85',
          icon: <Wallet size={16} color="#B88E4F" />,
          label: 'Đã trả vào ví',
          desc: 'Tiền thưởng đã được cộng trực tiếp vào Ví Khả Dụng của bạn. Bạn có thể bấm rút tiền VietQR ngay.',
        };
      case 'REFUND_ADJUSTED':
        return {
          bg: '#FEE2E2',
          color: '#991B1B',
          border: '#DC2626',
          icon: <RotateCcw size={16} color="#991B1B" />,
          label: 'Có điều chỉnh hoàn tiền',
          desc: 'Đơn hàng phát sinh hoàn tiền/hủy sau khi giao. Đã khấu trừ đối soát minh bạch vào sổ cái.',
        };
      default:
        return {
          bg: '#F6EFE3',
          color: '#7D715E',
          border: '#EAE4D7',
          icon: <Clock size={16} color="#7D715E" />,
          label: status,
          desc: 'Trạng thái tính thưởng kỳ hiện tại',
        };
    }
  };

  const validRevNum = parseFloat(data?.validRevenue || '0');
  const nextMinNum = parseFloat(data?.nextMilestone?.minMonthlyRevenue || '0');
  const prevMinNum = parseFloat(data?.currentMilestone?.minMonthlyRevenue || '0');


  let progressPercent = 100;
  if (data?.nextMilestone && nextMinNum > 0) {
    if (nextMinNum > prevMinNum) {
      const span = nextMinNum - prevMinNum;
      const done = Math.max(0, validRevNum - prevMinNum);
      progressPercent = Math.min(100, Math.max(0, Math.round((done / span) * 100)));
    } else {
      progressPercent = Math.min(100, Math.max(0, Math.round((validRevNum / nextMinNum) * 100)));
    }
  }

  return (
    <div
      id="kol-bonus-root"
      className={`min-w-0 text-[#1A1612] ${
        embedded ? '' : 'min-h-screen bg-[#FAF8F5] p-4 sm:p-6 pb-20'
      }`}
    >
      <div className="flex flex-col gap-3.5 w-full min-w-0 mx-auto">
        {storeInvitations.map((invitation) => (
          <div key={invitation.id} className="flex justify-between items-center gap-3 p-3 sm:px-4.5 bg-[#FFF7E7] border border-[#DEBE85] rounded-xl flex-wrap">
            <div>
              <strong className="text-sm sm:text-base font-bold text-[#1A1612]">{invitation.store?.name} mời bạn vào đội ngũ CTV</strong>
              <div className="mt-0.5 text-xs text-[#7D715E]">Chấp nhận để xem mốc thưởng và tạo link tiếp thị cho Shop này.</div>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={invitationLoading === invitation.id} onClick={() => respondToStoreInvitation(invitation.id, false)} className="px-3 py-1.5 rounded-lg border border-[#D8C6A8] bg-white font-semibold text-xs text-[#1A1612] hover:bg-[#FAF8F5] cursor-pointer">Từ chối</button>
              <button type="button" disabled={invitationLoading === invitation.id} onClick={() => respondToStoreInvitation(invitation.id, true)} className="px-3 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#C59B58] text-white font-bold text-xs hover:bg-[#B88E4F] cursor-pointer">{invitationLoading === invitation.id ? 'Đang xử lý…' : 'Chấp nhận'}</button>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 border border-[#EAE4D7] rounded-2xl bg-white shadow-sm">
          <header className="w-full flex items-center justify-between gap-2.5 pb-3 border-b border-[#EAE4D7]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] shrink-0">
                <BadgePercent size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#1A1612]">Thưởng doanh số</h2>
                <p className="text-[11px] text-[#7D715E]">Tháng {Number(selectedMonth)}/{selectedYear} · Theo chính sách từng gian hàng</p>
              </div>
            </div>
            {data && !loading && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#EAE4D7] rounded-md bg-[#FAF8F5] text-[11px] font-medium text-[#7D715E]">
                {getStatusBadge(data.settlementStatus).icon}
                {getStatusBadge(data.settlementStatus).label}
              </span>
            )}
          </header>
          <div className="flex items-center gap-1.5 p-1 border border-[#EAE4D7] rounded-xl bg-[#FAF8F5]" role="group" aria-label="Nội dung thưởng doanh số">
            <button
              type="button"
              aria-pressed={activeTab === 'progress'}
              onClick={() => setActiveTab('progress')}
              className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'progress'
                  ? 'bg-white text-[#1A1612] shadow-sm'
                  : 'text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              {loading ? <Loader2 size={14} className="animate-spin text-[#B88E4F]" /> : <TrendingUp size={14} className="text-[#B88E4F]" />}
              Tiến độ &amp; mốc thưởng
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-[#1A1612] shadow-sm'
                  : 'text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              {historyLoading ? <Loader2 size={14} className="animate-spin text-[#B88E4F]" /> : <Clock size={14} className="text-[#B88E4F]" />}
              Lịch sử nhận thưởng
            </button>
          </div>
          <div className="flex items-center flex-wrap gap-2 min-w-0 sm:ml-auto">
            <Select
              aria-label="Gian hàng tính thưởng"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={storesLoading || stores.length === 0}
              className="w-48 text-xs font-medium"
            >
              {stores.length === 0 ? (
                <option value="">Chưa có Shop liên kết</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </Select>

            <Select
              aria-label="Tháng tính thưởng"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-32 text-xs font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                );
              })}
            </Select>

            <Select
              aria-label="Năm tính thưởng"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-32 text-xs font-medium"
            >
              {[Number(currentVnYear) - 1, Number(currentVnYear), Number(currentVnYear) + 1].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {storesLoading || (activeTab === 'progress' && loading) || (activeTab === 'history' && historyLoading) ? (
          <section className="flex items-center gap-2 p-6 border border-[#EAE4D7] rounded-2xl bg-white text-xs text-[#7D715E]" role="status">
            <Loader2 className="animate-spin text-[#B88E4F]" size={18} aria-hidden="true" />
            Đang tải {activeTab === 'progress' ? 'tiến độ thưởng' : 'lịch sử nhận thưởng'}…
          </section>
        ) : !storesLoading && stores.length === 0 ? (
          <div className="p-8 border border-[#EAE4D7] rounded-2xl bg-white text-center shadow-sm">
            <div className="grid place-items-center w-12 h-12 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F] mx-auto mb-3">
              <Store size={22} />
            </div>
            <h3 className="text-base font-bold text-[#1A1612] mb-1.5">
              Bạn chưa tham gia Shop nào có chính sách thưởng doanh số.
            </h3>
            <p className="text-xs text-[#7D715E] max-w-lg mx-auto leading-relaxed">
              Khi bạn liên kết với các Cửa hàng có áp dụng chương trình thưởng doanh số tháng hoặc tạo ra đơn hàng tiếp thị hợp lệ, tiến độ tích lũy và mức thưởng dự kiến sẽ tự động hiển thị tại đây.
            </p>
          </div>
        ) : errorMessage && !data ? (
          <div className="p-8 border border-red-200 rounded-2xl bg-white text-center shadow-sm">
            <div className="grid place-items-center w-11 h-11 rounded-full bg-red-50 text-red-600 mx-auto mb-3 text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-red-700 mb-1.5">
              Không thể tải dữ liệu thưởng
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Vui lòng đăng nhập lại hoặc thử lại sau.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-[#EEDFC6] rounded-lg bg-[#C59B58] text-white font-bold text-xs hover:bg-[#B88E4F] transition-colors"
              >
                Thử lại
              </button>
              <a
                href="/login"
                className="px-4 py-2 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#7D715E] font-medium text-xs hover:text-[#1A1612] transition-colors"
              >
                Đăng nhập lại
              </a>
            </div>
          </div>
        ) : activeTab === 'progress' ? (
          <>
            <section className="border border-[#EAE4D7] rounded-2xl bg-white overflow-hidden p-2" aria-label="Tổng quan thưởng doanh số" aria-busy={loading}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <article className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-[#EAE4D7] bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium text-[#7D715E]">Doanh số hợp lệ</h2>
                    <span className="grid place-items-center w-6 h-6 rounded-md bg-[#FBF5EB] text-[#B88E4F] shrink-0"><Coins size={14} aria-hidden="true" /></span>
                  </div>
                  <strong className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1612] tabular-nums">{formatVnd(data?.validRevenue || '0')}</strong>
                  <p className="text-[11px] text-[#7D715E] mt-auto"><span>Từ <strong className="text-[#1A1612] font-semibold">{data?.validOrdersCount || 0} đơn hàng</strong> thành công</span></p>
                </article>

                <article className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-[#EAE4D7] bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium text-[#7D715E]">Mốc đã đạt</h2>
                    <span className="grid place-items-center w-6 h-6 rounded-md bg-[#FBF5EB] text-[#B88E4F] shrink-0"><Award size={14} aria-hidden="true" /></span>
                  </div>
                  <strong className="text-sm sm:text-base font-bold text-[#1A1612] truncate">{data?.currentMilestone?.name || 'Chưa đạt mốc nào'}</strong>
                  <p className="text-[11px] text-[#7D715E] mt-auto">{data?.currentMilestone ? `Ngưỡng: ${formatVnd(data.currentMilestone.minMonthlyRevenue)}` : 'Đạt mốc đầu tiên để nhận thưởng'}</p>
                </article>

                <article className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-[#EAE4D7] bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium text-[#7D715E]">Thưởng KPI &amp; phần vượt</h2>
                    <span className="grid place-items-center w-6 h-6 rounded-md bg-[#FBF5EB] text-[#B88E4F] shrink-0"><BadgePercent size={14} aria-hidden="true" /></span>
                  </div>
                  <div className="flex items-baseline flex-wrap gap-1 text-xs text-[#7D715E]">
                    <strong className="text-base sm:text-lg font-bold text-[#1A1612] tabular-nums">{formatVnd(data?.achievementBonus || '0')}</strong>
                    <span>+</span>
                    <strong className="text-base sm:text-lg font-bold text-[#1A1612] tabular-nums">{formatVnd(parseFloat(data?.estimatedTotalBonus || '0') - parseFloat(data?.achievementBonus || '0'))}</strong>
                  </div>
                  <p className="text-[11px] text-[#7D715E] mt-auto">KPI cố định + phần vượt</p>
                </article>

                <article className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium text-[#7D715E]">Tổng thưởng dự kiến</h2>
                    <span className="grid place-items-center w-6 h-6 rounded-md bg-white text-[#B88E4F] shrink-0"><Trophy size={14} aria-hidden="true" /></span>
                  </div>
                  <strong className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1612] tabular-nums">{formatVnd(data?.estimatedTotalBonus || '0')}</strong>
                  <p className="flex items-center gap-1.5 text-[11px] text-[#7D715E] mt-auto">
                    <Wallet size={13} className="text-[#B88E4F]" aria-hidden="true" />
                    <span>{data ? getStatusBadge(data.settlementStatus).label : 'Chưa có dữ liệu'}</span>
                  </p>
                </article>
              </div>
            </section>

            {data?.nextMilestone ? (
              <section className="p-4 sm:p-5 border border-[#EAE4D7] rounded-2xl bg-white" aria-labelledby="bonus-progress-title">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] shrink-0"><TrendingUp size={16} aria-hidden="true" /></span>
                    <div>
                      <h2 id="bonus-progress-title" className="text-sm font-semibold text-[#1A1612]">Mốc tiếp theo: {data.nextMilestone.name}</h2>
                      <p className="text-[11px] text-[#7D715E]">Tích lũy doanh số để mở mốc thưởng mới.</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-[#7D715E]">Doanh số còn thiếu</span>
                    <strong className="text-sm sm:text-base font-bold text-[#1A1612] tabular-nums">{formatVnd(data.nextMilestone.missingRevenue)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)] gap-5 items-center">
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2 text-xs text-[#7D715E] mb-1.5">
                      <span>Tiến độ đạt mốc</span>
                      <strong className="text-sm font-bold text-[#1A1612]">{progressPercent}%</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[#F3EFE6] overflow-hidden" role="progressbar" aria-label="Tiến độ tới mốc tiếp theo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                      <div className="h-full bg-[#C59B58] rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between flex-wrap gap-2 text-[11px] text-[#7D715E] mt-2">
                      <span><strong className="text-[#1A1612] font-semibold">{formatVnd(data.validRevenue)}</strong> / {formatVnd(data.nextMilestone.minMonthlyRevenue)}</span>
                      <span>Doanh số mục tiêu</span>
                    </div>
                  </div>

                  <aside className="p-3 sm:px-4 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB]" aria-label="Quyền lợi tại mốc tiếp theo">
                    <span className="block text-[11px] font-medium text-[#7D715E]">Quyền lợi tại mốc {data.nextMilestone.name}</span>
                    <dl className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <dt className="text-[10px] text-[#7D715E]">Thưởng KPI</dt>
                        <dd className="text-sm font-bold text-[#1A1612] mt-0.5">{formatVnd(data.nextMilestone.achievementBonus)}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-[#7D715E]">Phần vượt mốc</dt>
                        <dd className="text-sm font-bold text-[#1A1612] mt-0.5">+{data.nextMilestone.bonusPercentage}%</dd>
                      </div>
                    </dl>
                  </aside>
                </div>

                {data.milestones.length > 1 && (
                  <ol className="flex flex-wrap gap-3 sm:gap-6 mt-4 pt-4 border-t border-[#EAE4D7] list-none" aria-label="Lộ trình mốc thưởng">
                    {data.milestones.map((milestone, index) => (
                      <li key={milestone.id} className="flex items-center gap-2 text-xs text-[#7D715E]">
                        <span className={`grid place-items-center w-6 h-6 rounded-full border text-[11px] font-semibold ${
                          milestone.isReached
                            ? 'border-[#059669] text-[#059669] bg-emerald-50'
                            : milestone.id === data.nextMilestone?.id
                            ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612]'
                            : 'border-[#EAE4D7] text-[#7D715E]'
                        }`}>
                          {milestone.isReached ? <Check size={12} aria-hidden="true" /> : index + 1}
                        </span>
                        <div>
                          <strong className="block text-xs font-semibold text-[#1A1612]">{milestone.name}</strong>
                          <small className="block text-[10px] text-[#7D715E]">{formatVnd(milestone.minMonthlyRevenue)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ) : (
              <section className="p-4 sm:p-5 border border-[#EAE4D7] rounded-2xl bg-white">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] shrink-0">
                    {data?.milestones?.length ? <CheckCircle2 size={16} aria-hidden="true" /> : <Layers size={16} aria-hidden="true" />}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1A1612]">{loading ? 'Đang tải tiến độ thưởng…' : data?.milestones?.length ? 'Bạn đã đạt mốc thưởng cao nhất' : 'Chưa có mốc thưởng được thiết lập'}</h2>
                    <p className="text-xs text-[#7D715E] mt-0.5">{data?.milestones?.length ? 'Tiếp tục tích lũy doanh số để nhận thưởng phần vượt theo chính sách gian hàng.' : 'Các mốc thưởng sẽ hiển thị khi gian hàng cập nhật chính sách.'}</p>
                  </div>
                </div>
              </section>
            )}

            <details className="border border-[#EAE4D7] rounded-2xl bg-white overflow-hidden group">
              <summary className="flex items-center justify-between gap-3 p-4 list-none cursor-pointer hover:bg-[#FAF8F5] transition-colors [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] shrink-0">
                    <Layers size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1A1612]">Chính sách &amp; mốc thưởng</h2>
                    <p className="text-[11px] text-[#7D715E]">{data?.milestones?.length || 0} mốc · {data?.storeName || stores.find(store => store.id === selectedStoreId)?.name} · Tháng {selectedMonth}/{selectedYear}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#7D715E]">
                  <span className="group-open:hidden">Xem các mốc</span>
                  <span className="hidden group-open:inline">Thu gọn</span>
                  <ChevronDown size={14} className="text-[#B88E4F] transition-transform group-open:rotate-180" aria-hidden="true" />
                </span>
              </summary>
              <div className="p-4 pt-0 border-t border-[#EAE4D7]" aria-label="Danh sách mốc thưởng">
                {data?.milestones?.length ? (
                  data.milestones.map((m, idx) => (
                    <article key={m.id || idx} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-3 py-3 border-b last:border-b-0 border-[#EAE4D7]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid place-items-center w-6 h-6 rounded-md border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-semibold text-[#7D715E] shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-[#1A1612] truncate">{m.name}</h3>
                          <p className="text-[11px] text-[#7D715E]">{m.description || 'Áp dụng theo doanh số hợp lệ tháng'}</p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-[10px] text-[#7D715E]">Doanh số tối thiểu</dt>
                          <dd className="font-semibold text-[#1A1612] tabular-nums mt-0.5">{formatVnd(m.minMonthlyRevenue)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-[#7D715E]">Thưởng KPI</dt>
                          <dd className="font-semibold text-[#1A1612] tabular-nums mt-0.5">{formatVnd(m.achievementBonus)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-[#7D715E]">Phần vượt</dt>
                          <dd className="font-semibold text-[#1A1612] tabular-nums mt-0.5">+{m.bonusPercentage}%</dd>
                        </div>
                      </dl>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[10px] font-medium justify-self-start md:justify-self-end ${
                        m.isReached
                          ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612]'
                          : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'
                      }`}>
                        {m.isReached && <Check size={11} className="text-[#059669]" aria-hidden="true" />}
                        {m.isReached ? 'Đã đạt' : 'Chưa đạt'}
                      </span>
                    </article>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-[#7D715E]">Chưa có mốc thưởng nào được cấu hình cho gian hàng này.</p>
                )}
              </div>
              <details className="p-3 border-t border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#7D715E] [&::-webkit-details-marker]:hidden">
                <summary className="font-medium text-[#1A1612] cursor-pointer">Cách tính thưởng lũy tiến</summary>
                <p className="mt-1.5 leading-relaxed">Khi vượt qua ngưỡng doanh số, bạn được nhận <strong>tiền thưởng đạt KPI</strong> của mốc cao nhất đạt được, cộng thêm <strong>% thưởng phần vượt</strong> tính trên số tiền vượt mốc. Tiền thưởng sẽ được chủ gian hàng phê duyệt và chuyển vào ví sau khi kết thúc kỳ đối soát tháng.</p>
              </details>
            </details>
          </>
        ) : historyError && historyList.length === 0 ? (
          <div className="p-8 border border-red-200 rounded-2xl bg-white text-center shadow-sm">
            <div className="grid place-items-center w-11 h-11 rounded-full bg-red-50 text-red-600 mx-auto mb-3 text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-red-700 mb-1.5">
              Không thể tải lịch sử nhận thưởng
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Vui lòng đăng nhập lại hoặc thử lại sau.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-[#EEDFC6] rounded-lg bg-[#C59B58] text-white font-bold text-xs hover:bg-[#B88E4F] transition-colors"
              >
                Thử lại
              </button>
              <a
                href="/login"
                className="px-4 py-2 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#7D715E] font-medium text-xs hover:text-[#1A1612] transition-colors"
              >
                Đăng nhập lại
              </a>
            </div>
          </div>
        ) : (
          <section className="border border-[#EAE4D7] rounded-2xl bg-white overflow-hidden shadow-sm" aria-labelledby="bonus-history-title" aria-busy={historyLoading}>
            <header className="flex items-center justify-between gap-3 p-4 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] shrink-0"><FileText size={16} aria-hidden="true" /></span>
                <div>
                  <h2 id="bonus-history-title" className="text-sm font-semibold text-[#1A1612]">Lịch sử nhận thưởng</h2>
                  <p className="text-[11px] text-[#7D715E]">Kết quả chốt thưởng, trạng thái phê duyệt và thời gian chuyển vào ví.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 border border-[#EAE4D7] rounded-md text-[11px] text-[#7D715E]">{historyList.length} kỳ thưởng</span>
            </header>
            <div className="overflow-x-auto" data-scrollable-x="true" role="region" aria-label="Lịch sử các kỳ thưởng" tabIndex={0}>
              <table className="w-full min-w-[800px] text-xs text-left">
                <thead className="bg-[#FAF8F5] text-[#7D715E] border-b border-[#EAE4D7]">
                  <tr>
                    <th scope="col" className="p-3 font-medium">Kỳ tháng</th>
                    <th scope="col" className="p-3 font-medium">Gian hàng</th>
                    <th scope="col" className="p-3 font-medium text-right">Doanh số hợp lệ</th>
                    <th scope="col" className="p-3 font-medium">Mốc áp dụng</th>
                    <th scope="col" className="p-3 font-medium text-right">Thưởng KPI</th>
                    <th scope="col" className="p-3 font-medium text-right">Tổng thưởng</th>
                    <th scope="col" className="p-3 font-medium">Trạng thái</th>
                    <th scope="col" className="p-3 font-medium">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {historyList.length ? historyList.map(item => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                        <td className="p-3 font-medium text-[#1A1612]">{item.yearMonth}</td>
                        <td className="p-3 text-[#1A1612]">{item.storeName}</td>
                        <td className="p-3 text-right font-medium text-[#1A1612] tabular-nums">{formatVnd(item.validRevenue)}</td>
                        <td className="p-3 text-[#7D715E]">{item.appliedRuleName || 'N/A'}</td>
                        <td className="p-3 text-right font-medium text-[#1A1612] tabular-nums">{formatVnd(item.achievementBonus || '0')}</td>
                        <td className="p-3 text-right font-bold text-[#1A1612] tabular-nums">{formatVnd(item.bonusAmount)}</td>
                        <td className="p-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#EAE4D7] rounded bg-[#FAF8F5] text-[10px] font-medium text-[#7D715E]">{badge.icon}{badge.label}</span></td>
                        <td className="p-3 text-[#7D715E] text-[11px]">{item.paidAt ? new Date(item.paidAt).toLocaleDateString('vi-VN') : item.settledAt ? `Chốt ${new Date(item.settledAt).toLocaleDateString('vi-VN')}` : 'Chưa có'}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-xs text-[#7D715E]">
                        {historyLoading ? 'Đang tải lịch sử nhận thưởng…' : 'Chưa có lượt chốt thưởng nào cho gian hàng này.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default KolBonusProgressPage;
