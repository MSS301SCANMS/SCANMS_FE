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
  Calendar,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Wallet,
  FileText,
  BadgePercent,
  Check,
  Loader2,
} from 'lucide-react';
import { commissionRulesService } from '../../services/commission-rules.service';
import api from '../../services/api';
import { getVietnamCurrentMonthYear } from '../../utils/dateTimeUtils';

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

export const KolBonusProgressPage: React.FC = () => {
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
        setStoreInvitations(Array.isArray(body) ? body.filter((item: any) => item.status === 'PENDING') : []);
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

    async function fetchProgress() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await commissionRulesService.getMyBonusProgress(selectedStoreId, currentYearMonth);
        if (res && (res.validRevenue !== undefined || res.estimatedTotalBonus !== undefined)) {
          setData(res);
        } else {
          throw new Error('Dữ liệu không đúng định dạng');
        }
      } catch {
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
        setLoading(false);
      }
    }

    fetchProgress();
  }, [selectedStoreId, currentYearMonth, isDevMockEnabled, stores]);


  useEffect(() => {
    if (activeTab !== 'history' || !selectedStoreId) return;

    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await commissionRulesService.getMyBonusHistory(selectedStoreId);
        if (Array.isArray(res)) {
          setHistoryList(res);
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch {
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
        setHistoryLoading(false);
      }
    }
    fetchHistory();
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
          bg: '#FFEDD5',
          color: '#9A3412',
          border: '#FDBA74',
          icon: <AlertCircle size={16} color="#9A3412" />,
          label: 'Chờ Shop chốt thưởng',
          desc: 'Kỳ tháng đã kết thúc. Đang chờ Chủ Shop rà soát và tạo bản chốt thưởng.',
        };
      case 'PENDING':
        return {
          bg: '#FFF3DD',
          color: '#C27803',
          border: '#FDE68A',
          icon: <Clock size={16} color="#C27803" />,
          label: 'Chờ duyệt chi trả',
          desc: 'Shop đã chốt bảng thưởng tháng. Đang chờ kế toán/chủ shop duyệt phê duyệt.',
        };
      case 'APPROVED':
        return {
          bg: '#EAF8F0',
          color: '#15803D',
          border: '#BBF7D0',
          icon: <CheckCircle2 size={16} color="#15803D" />,
          label: 'Đã duyệt thưởng',
          desc: 'Khoản thưởng đã được phê duyệt hợp lệ. Tiền sẽ sớm được chuyển vào Ví Khả Dụng.',
        };
      case 'PAID':
        return {
          bg: '#F5E7CC',
          color: '#9E7933',
          border: '#DEBE85',
          icon: <Wallet size={16} color="#9E7933" />,
          label: 'Đã trả vào ví',
          desc: 'Tiền thưởng đã được cộng trực tiếp vào Ví Khả Dụng của bạn. Bạn có thể bấm rút tiền VietQR ngay.',
        };
      case 'REFUND_ADJUSTED':
        return {
          bg: '#FEE2E2',
          color: '#991B1B',
          border: '#FCA5A5',
          icon: <RotateCcw size={16} color="#991B1B" />,
          label: 'Có điều chỉnh hoàn tiền',
          desc: 'Đơn hàng phát sinh hoàn tiền/hủy sau khi giao. Đã khấu trừ đối soát minh bạch vào sổ cái.',
        };
      default:
        return {
          bg: '#F6EFE3',
          color: '#7D6D55',
          border: '#E8DAC4',
          icon: <Clock size={16} color="#7D6D55" />,
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
      progressPercent = Math.min(100, Math.max(5, Math.round((done / span) * 100)));
    } else {
      progressPercent = Math.min(100, Math.round((validRevNum / nextMinNum) * 100));
    }
  }

  const statusInfo = getStatusBadge(data?.settlementStatus || 'ACCUMULATING');

  return (
    <div
      id="kol-bonus-root"
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF6F0',
        padding: '24px 24px 72px',
        fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
        color: '#2C2114',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        html, body {
          scrollbar-width: thin;
          scrollbar-color: rgba(180, 140, 75, 0.45) transparent;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
          background-color: transparent;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: rgba(180, 140, 75, 0.45);
          border-radius: 9999px;
          border: 1.5px solid transparent;
          background-clip: padding-box;
          transition: background-color 0.15s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(158, 121, 51, 0.85);
        }
        ::-webkit-scrollbar-button {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .kol-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .kol-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 600px) {
          .kol-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1260, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {storeInvitations.map((invitation) => (
          <div key={invitation.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 18px', background: '#FFF7E7', border: '1.5px solid #DEBE85', borderRadius: 12, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: 15 }}>{invitation.store?.name} mời bạn vào đội ngũ CTV</strong>
              <div style={{ marginTop: 3, color: '#7D6D55', fontSize: 13 }}>Chấp nhận để xem mốc thưởng và tạo link tiếp thị cho Shop này.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" disabled={invitationLoading === invitation.id} onClick={() => respondToStoreInvitation(invitation.id, false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8C6A8', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Từ chối</button>
              <button type="button" disabled={invitationLoading === invitation.id} onClick={() => respondToStoreInvitation(invitation.id, true)} style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: '#C9A363', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{invitationLoading === invitation.id ? 'Đang xử lý…' : 'Chấp nhận'}</button>
            </div>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            background: '#FFFFFF',
            padding: '16px 22px',
            borderRadius: 14,
            border: '1.5px solid #E8DAC4',
            boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800,
                  background: '#F5E7CC',
                  color: '#9E7933',
                  border: '1px solid #DEBE85',
                }}
              >
                <Sparkles size={13} color="#9E7933" /> DÀNH CHO KOL / CTV
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: '#EAF8F0',
                  color: '#15803D',
                  border: '1px solid #BBF7D0',
                }}
              >
                <ShieldCheck size={13} color="#15803D" /> ĐỐI SOÁT TỰ ĐỘNG
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 850,
                color: '#2C2114',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <Trophy size={24} color="#C9A363" /> Thưởng Doanh Số Tháng (KPI & Lũy Tiến)
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7D6D55', maxWidth: 820, lineHeight: 1.5 }}>
              Chính sách mốc thưởng do Chủ Shop thiết lập. Đạt doanh số càng cao, tiền thưởng cố định và tỷ lệ % vượt mốc càng lớn.
            </p>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#FAF6F0',
                padding: '7px 12px',
                borderRadius: 10,
                border: '1.5px solid #E8DAC4',
              }}
            >
              <Store size={15} color="#9E7933" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                disabled={storesLoading || stores.length === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: '#2C2114',
                  outline: 'none',
                  cursor: stores.length > 0 ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
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
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FAF6F0',
                padding: '6px 11px',
                borderRadius: 10,
                border: '1.5px solid #E8DAC4',
              }}
            >
              <Calendar size={15} color="#9E7933" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: '#2C2114',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, '0');
                  return (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  );
                })}
              </select>
              <span style={{ color: '#E8DAC4' }}>/</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: '#2C2114',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {[Number(currentVnYear) - 1, Number(currentVnYear), Number(currentVnYear) + 1].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>


        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('progress')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeTab === 'progress' ? '1px solid #DEBE85' : '1.5px solid #E8DAC4',
              background:
                activeTab === 'progress'
                  ? 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)'
                  : '#FFFFFF',
              color: activeTab === 'progress' ? '#2C2114' : '#7D6D55',
              boxShadow: activeTab === 'progress' ? '0 3px 10px rgba(201, 163, 99, 0.22)' : 'none',
            }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
            Tiến Độ & Mốc Thưởng Tháng ({selectedMonth}/{selectedYear})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeTab === 'history' ? '1px solid #DEBE85' : '1.5px solid #E8DAC4',
              background:
                activeTab === 'history'
                  ? 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)'
                  : '#FFFFFF',
              color: activeTab === 'history' ? '#2C2114' : '#7D6D55',
              boxShadow: activeTab === 'history' ? '0 3px 10px rgba(201, 163, 99, 0.22)' : 'none',
            }}
          >
            {historyLoading ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
            Lịch Sử Nhận Thưởng
          </button>
        </div>


        {!storesLoading && stores.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '36px 24px',
              border: '1.5px solid #E8DAC4',
              textAlign: 'center',
              boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#FAF6F0',
                border: '1.5px solid #E8DAC4',
                color: '#9E7933',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <Store size={22} color="#9E7933" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: '#2C2114', margin: '0 0 6px' }}>
              Bạn chưa tham gia Shop nào có chính sách thưởng doanh số.
            </h3>
            <p style={{ fontSize: 13, color: '#7D6D55', margin: '0 0 16px', maxWidth: 540, marginInline: 'auto', lineHeight: 1.5 }}>
              Khi bạn liên kết với các Cửa hàng có áp dụng chương trình thưởng doanh số tháng hoặc tạo ra đơn hàng tiếp thị hợp lệ, tiến độ tích lũy và mức thưởng dự kiến sẽ tự động hiển thị tại đây.
            </p>
          </div>
        ) : errorMessage && !data ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '32px 24px',
              border: '1.5px solid #FCA5A5',
              textAlign: 'center',
              boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                fontSize: 22,
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', margin: '0 0 6px' }}>
              Không thể tải dữ liệu thưởng
            </h3>
            <p style={{ fontSize: 13, color: '#7D6D55', margin: '0 0 18px' }}>
              Vui lòng đăng nhập lại hoặc thử lại sau.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                  color: '#2C2114',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 750,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
              <a
                href="/login"
                style={{
                  padding: '8px 18px',
                  background: '#F6EFE3',
                  color: '#7D6D55',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  border: '1px solid #E8DAC4',
                }}
              >
                Đăng nhập lại
              </a>
            </div>
          </div>
        ) : activeTab === 'progress' ? (
          <>

            <div
              style={{
                background: statusInfo.bg,
                border: `1.5px solid ${statusInfo.border}`,
                borderRadius: 13,
                padding: '12px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                color: statusInfo.color,
                boxShadow: '0 2px 10px rgba(110, 84, 39, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: 8,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  {statusInfo.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 850, letterSpacing: 0.6, opacity: 0.85 }}>
                    TRẠNG THÁI KỲ THƯỞNG THÁNG {selectedMonth}/{selectedYear}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    {statusInfo.label}
                    {data?.hasRefundAdjustment && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: '#FEE2E2',
                          color: '#991B1B',
                          border: '1px solid #FCA5A5',
                          fontWeight: 750,
                        }}
                      >
                        Có hoàn tiền
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.9, lineHeight: 1.4 }}>{statusInfo.desc}</div>
                </div>
              </div>

              {data?.settlement?.paidAt && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px 16px',
                    borderRadius: 10,
                    textAlign: 'right',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: 11.5, color: '#7D6D55', fontWeight: 650 }}>Thời gian chi trả:</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#15803D', marginTop: 1 }}>
                    {new Date(data.settlement.paidAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              )}
            </div>


            <div className="kol-kpi-grid">

              <div
                style={{
                  background: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: 13,
                  border: '1.5px solid #E8DAC4',
                  boxShadow: '0 3px 12px rgba(110, 84, 39, 0.04)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 850, color: '#7D6D55', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Doanh Số Hợp Lệ
                  </span>
                  <div style={{ background: '#F5E7CC', padding: 7, borderRadius: 10 }}>
                    <Coins size={17} color="#9E7933" />
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2C2114', letterSpacing: '-0.3px' }}>
                  {formatVnd(data?.validRevenue || '0')}
                </div>
                <div style={{ fontSize: 12, color: '#7D6D55', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  Từ <strong style={{ color: '#2C2114' }}>{data?.validOrdersCount || 0} đơn hàng</strong> thành công
                </div>
              </div>


              <div
                style={{
                  background: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: 13,
                  border: '1.5px solid #E8DAC4',
                  boxShadow: '0 3px 12px rgba(110, 84, 39, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 850, color: '#7D6D55', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Mốc Đã Đạt
                  </span>
                  <div style={{ background: '#F5E7CC', padding: 7, borderRadius: 10 }}>
                    <Award size={17} color="#9E7933" />
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#9E7933', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {data?.currentMilestone ? data.currentMilestone.name : 'Chưa đạt mốc nào'}
                </div>
                <div style={{ fontSize: 12, color: '#7D6D55', marginTop: 6 }}>
                  {data?.currentMilestone
                    ? `Ngưỡng: ${formatVnd(data.currentMilestone.minMonthlyRevenue)}`
                    : 'Cần đạt tối thiểu mốc đầu tiên để nhận thưởng'}
                </div>
              </div>


              <div
                style={{
                  background: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: 13,
                  border: '1.5px solid #E8DAC4',
                  boxShadow: '0 3px 12px rgba(110, 84, 39, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 850, color: '#7D6D55', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Thưởng KPI & Phần Vượt
                  </span>
                  <div style={{ background: '#EFF6FF', padding: 7, borderRadius: 10 }}>
                    <BadgePercent size={17} color="#2563EB" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#1D4ED8' }}>
                    {formatVnd(data?.achievementBonus || '0')}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>+</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#4338CA' }}>
                    {formatVnd(
                      (
                        parseFloat(data?.estimatedTotalBonus || '0') -
                        parseFloat(data?.achievementBonus || '0')
                      ).toString()
                    )}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#7D6D55', marginTop: 6 }}>
                  KPI cố định + Thưởng % phần vượt
                </div>
              </div>


              <div
                style={{
                  background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                  padding: '14px 16px',
                  borderRadius: 13,
                  border: '1px solid #DEBE85',
                  boxShadow: '0 4px 16px rgba(201, 163, 99, 0.25)',
                  color: '#2C2114',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 850, color: '#2C2114', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Tổng Thưởng Dự Kiến
                  </span>
                  <div style={{ background: 'rgba(255, 255, 255, 0.45)', padding: 7, borderRadius: 10 }}>
                    <Trophy size={17} color="#2C2114" />
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2C2114', letterSpacing: '-0.3px' }}>
                  {formatVnd(data?.estimatedTotalBonus || '0')}
                </div>
                <div style={{ fontSize: 12, color: '#4A3B2C', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 750 }}>
                  <Wallet size={14} color="#4A3B2C" /> Sẽ cộng vào Ví sau khi Shop duyệt
                </div>
              </div>
            </div>


            {data?.nextMilestone ? (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1.5px solid #E8DAC4',
                  padding: '16px 20px',
                  boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#F5E7CC', padding: 8, borderRadius: 10 }}>
                      <TrendingUp size={19} color="#9E7933" />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 850, color: '#2C2114' }}>
                        Tiến Độ Tới Mốc Tiếp Theo: {data.nextMilestone.name}
                      </h2>
                      <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#7D6D55' }}>
                        Ngưỡng đạt mốc: <strong style={{ color: '#2C2114' }}>{formatVnd(data.nextMilestone.minMonthlyRevenue)}</strong>.
                        Thưởng thêm: <strong style={{ color: '#15803D' }}>{formatVnd(data.nextMilestone.achievementBonus)}</strong> +{' '}
                        <strong style={{ color: '#C9A363' }}>{data.nextMilestone.bonusPercentage}%</strong> phần vượt.
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11.5, color: '#7D6D55', display: 'block' }}>Còn thiếu</span>
                    <span style={{ fontSize: 19, fontWeight: 900, color: '#DC2626' }}>
                      {formatVnd(data.nextMilestone.missingRevenue)}
                    </span>
                  </div>
                </div>


                <div
                  style={{
                    width: '100%',
                    height: 12,
                    background: '#F6EFE3',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #E8DAC4',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #EAD2A3 0%, #C9A363 50%, #9E7933 100%)',
                      borderRadius: 12,
                      transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#7D6D55', marginTop: 8 }}>
                  <span>
                    Hiện tại: <strong style={{ color: '#2C2114' }}>{formatVnd(data.validRevenue)}</strong>
                  </span>
                  <span style={{ fontWeight: 800, color: '#9E7933' }}>
                    Đã hoàn thành {progressPercent}%
                  </span>
                  <span>
                    Mục tiêu: <strong style={{ color: '#2C2114' }}>{formatVnd(data.nextMilestone.minMonthlyRevenue)}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#EAF8F0',
                  border: '1.5px solid #BBF7D0',
                  borderRadius: 13,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#15803D',
                }}
              >
                <CheckCircle2 size={20} color="#15803D" />
                <div>
                  <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 800 }}>
                    Xuất sắc! Bạn đã đạt mốc thưởng cao nhất của Shop
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#166534' }}>
                    Bạn hiện đang hưởng mức thưởng cao nhất và nhận tối đa tỷ lệ % thưởng phần vượt doanh số.
                  </p>
                </div>
              </div>
            )}


            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1.5px solid #E8DAC4',
                overflow: 'hidden',
                boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #ECE1CD',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 850,
                      color: '#2C2114',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Layers size={18} color="#9E7933" /> Chính Sách & Danh Sách Các Mốc Thưởng Của Shop
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#7D6D55' }}>
                    Các mốc do {data?.storeName} áp dụng trong kỳ tháng {selectedMonth}/{selectedYear}.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 750,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: '#F5E7CC',
                    color: '#9E7933',
                    border: '1px solid #DEBE85',
                  }}
                >
                  {data?.milestones?.length || 0} Mốc Thưởng
                </span>
              </div>

              <div data-scrollable-x="true" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#2C2114' }}>
                  <thead>
                    <tr style={{ background: '#FAF6F0', color: '#7D6D55', borderBottom: '1.5px solid #E8DAC4', textAlign: 'left' }}>
                      <th style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12 }}>Tên Mốc Thưởng</th>
                      <th style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12 }}>Doanh Số Tối Thiểu</th>
                      <th style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12 }}>Thưởng Đạt KPI</th>
                      <th style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12 }}>% Thưởng Phần Vượt</th>
                      <th style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12 }}>Mô Tả / Chi Tiết</th>
                      <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, fontSize: 12 }}>Trạng Thái Của Bạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.milestones && data.milestones.length > 0 ? (
                      data.milestones.map((m, idx) => (
                        <tr
                          key={m.id || idx}
                          style={{
                            borderBottom: '1px solid #ECE1CD',
                            background: m.isReached ? 'rgba(234, 248, 240, 0.45)' : '#FFFFFF',
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 850 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 850,
                                  background: m.isReached ? '#C9A363' : '#F6EFE3',
                                  color: m.isReached ? '#FFFFFF' : '#7D6D55',
                                }}
                              >
                                {idx + 1}
                              </span>
                              {m.name}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 850 }}>
                            {formatVnd(m.minMonthlyRevenue)}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 850, color: '#1D4ED8' }}>
                            {parseFloat(m.achievementBonus) > 0 ? formatVnd(m.achievementBonus) : 'Không'}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 850, color: '#4338CA' }}>
                            +{m.bonusPercentage}%
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#7D6D55', maxWidth: 300, lineHeight: 1.4 }}>
                            {m.description || 'Áp dụng theo doanh số hợp lệ tháng'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {m.isReached ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '3px 10px',
                                  borderRadius: 20,
                                  fontSize: 11.5,
                                  fontWeight: 850,
                                  background: '#EAF8F0',
                                  color: '#15803D',
                                  border: '1px solid #BBF7D0',
                                }}
                              >
                                <Check size={13} color="#15803D" /> ĐÃ ĐẠT
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 10px',
                                  borderRadius: 20,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  background: '#F6EFE3',
                                  color: '#7D6D55',
                                  border: '1px solid #E8DAC4',
                                }}
                              >
                                Chưa đạt
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px 14px', textAlign: 'center', color: '#9E8D77', fontSize: 13 }}>
                          Chưa có mốc thưởng nào được cấu hình cho cửa hàng này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              <div
                style={{
                  padding: '10px 16px',
                  background: '#FAF6F0',
                  borderTop: '1px solid #ECE1CD',
                  fontSize: 12,
                  color: '#7D6D55',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  lineHeight: 1.45,
                }}
              >
                <AlertCircle size={15} color="#C9A363" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: '#2C2114' }}>Nguyên tắc tính thưởng lũy tiến:</strong> Khi vượt qua ngưỡng doanh số, bạn được nhận <strong>Tiền thưởng đạt KPI</strong> của mốc cao nhất đạt được, cộng thêm <strong>% thưởng phần vượt</strong> tính trên số tiền vượt mốc. Tiền thưởng sẽ được Chủ Shop phê duyệt và chuyển vào Ví sau khi kết thúc kỳ đối soát tháng.
                </div>
              </div>
            </div>
          </>
        ) : historyError && historyList.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '32px 24px',
              border: '1.5px solid #FCA5A5',
              textAlign: 'center',
              boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                fontSize: 22,
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', margin: '0 0 6px' }}>
              Không thể tải lịch sử nhận thưởng
            </h3>
            <p style={{ fontSize: 13, color: '#7D6D55', margin: '0 0 18px' }}>
              Vui lòng đăng nhập lại hoặc thử lại sau.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                  color: '#2C2114',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 750,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
              <a
                href="/login"
                style={{
                  padding: '8px 18px',
                  background: '#F6EFE3',
                  color: '#7D6D55',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  border: '1px solid #E8DAC4',
                }}
              >
                Đăng nhập lại
              </a>
            </div>
          </div>
        ) : (

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1.5px solid #E8DAC4',
              overflow: 'hidden',
              boxShadow: '0 3px 14px rgba(110, 84, 39, 0.05)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #ECE1CD',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 850,
                    color: '#2C2114',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileText size={18} color="#9E7933" /> Lịch Sử Các Kỳ Chốt Thưởng Doanh Số
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#7D6D55' }}>
                  Danh sách kết quả chốt thưởng, trạng thái phê duyệt và thời gian giải ngân vào ví.
                </p>
              </div>
            </div>

            <div data-scrollable-x="true" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#2C2114' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', color: '#7D6D55', borderBottom: '1.5px solid #E8DAC4', textAlign: 'left' }}>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Kỳ Tháng</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Cửa Hàng</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Doanh Số Hợp Lệ</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Mốc Áp Dụng</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Thưởng KPI</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Tổng Thưởng</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Trạng Thái</th>
                    <th style={{ padding: '9px 14px', fontSize: 12 }}>Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.length > 0 ? (
                    historyList.map((item) => {
                      const badge = getStatusBadge(item.status);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #ECE1CD' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 850, color: '#9E7933' }}>
                            {item.yearMonth}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 650 }}>
                            {item.storeName}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 850 }}>
                            {formatVnd(item.validRevenue)}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: '#7D6D55' }}>
                            {item.appliedRuleName || 'N/A'}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#1D4ED8' }}>
                            {formatVnd(item.achievementBonus || '0')}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 900, color: '#15803D' }}>
                            {formatVnd(item.bonusAmount)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 20,
                                fontSize: 11.5,
                                fontWeight: 800,
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.icon} {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#7D6D55' }}>
                            {item.paidAt
                              ? new Date(item.paidAt).toLocaleDateString('vi-VN')
                              : item.settledAt
                              ? `Chốt ${new Date(item.settledAt).toLocaleDateString('vi-VN')}`
                              : 'Chưa có'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 14px', textAlign: 'center', color: '#9E8D77', fontSize: 13 }}>
                        Chưa có lượt chốt thưởng nào cho cửa hàng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KolBonusProgressPage;
