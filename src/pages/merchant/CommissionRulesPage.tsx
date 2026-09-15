import React, { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Calculator,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Award,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import {
  commissionRulesService,
} from '../../services/commission-rules.service';
import type {
  CommissionRule,
  BonusPreviewResult,
  SettlementHistoryItem,
} from '../../services/commission-rules.service';
import { getVietnamCurrentMonthYear } from '../../utils/dateTimeUtils';

export const CommissionRulesPage: React.FC = () => {
  const { year: currentVnYear, month: currentVnMonth } = getVietnamCurrentMonthYear();
  const [storeId, setStoreId] = useState<string>(
    () => localStorage.getItem('current_store_id') || '',
  );
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<CommissionRule | null>(null);


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minMonthlyRevenue: '',
    achievementBonus: '0',
    bonusPercentage: '',
    isActive: true,
  });


  const [simRevenue, setSimRevenue] = useState<string>('120000000');
  const [simResult, setSimResult] = useState<BonusPreviewResult | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);


  const [selectedYear, setSelectedYear] = useState<string>(currentVnYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentVnMonth);
  const settleYearMonth = `${selectedYear}-${selectedMonth}`;
  const [settleKolId, setSettleKolId] = useState<string>('');
  const [settleResult, setSettleResult] = useState<any | null>(null);
  const [settleLoading, setSettleLoading] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<SettlementHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);


  const ruleNameInputId = useId();
  const ruleDescInputId = useId();
  const ruleRevenueInputId = useId();
  const ruleAchieveInputId = useId();
  const ruleBonusInputId = useId();
  const simRevenueInputId = useId();
  const settleMonthInputId = useId();
  const settleKolInputId = useId();

  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u)?.role || '';
    } catch {}
    return '';
  });

  const isReadOnlyAdmin = currentUserRole === 'SYSTEM_ADMIN';


  const loadRules = useCallback(async (targetStoreId?: string) => {
    const sId = targetStoreId || storeId;
    if (!sId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await commissionRulesService.getRules(sId);
      setRules(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải danh sách mốc thưởng');
    } finally {
      setLoading(false);
    }
  }, [storeId]);


  const loadHistory = useCallback(async (targetMonth?: string, targetStoreId?: string) => {
    const sId = targetStoreId || storeId;
    if (!sId) {
      setHistoryLoading(false);
      return;
    }
    try {
      setHistoryLoading(true);
      const queryMonth = targetMonth || settleYearMonth;
      const history = await commissionRulesService.getSettlementHistory(
        sId,
        queryMonth,
      );
      setHistoryList(history);
    } catch (err: any) {
      console.error('Không thể tải lịch sử chốt thưởng', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [settleYearMonth, storeId]);


  useEffect(() => {
    let isCurrent = true;
    async function verifyAuthAndLoadStore() {
      try {
        let token = localStorage.getItem('token');
        let user: any = null;
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) user = JSON.parse(userStr);
        } catch {}


        if (import.meta.env.DEV && (!token || user?.role === 'COLLABORATOR')) {
          try {
            const loginRes: any = await api.post('/auth/login', {
              email: 'shop@scanms.vn',
              password: 'Password@123',
            });
            const newToken = loginRes?.data?.accessToken || loginRes?.accessToken;
            const shopUser = loginRes?.data?.user || loginRes?.user;
            if (newToken && shopUser) {
              localStorage.setItem('token', newToken);
              localStorage.setItem('user', JSON.stringify(shopUser));
              token = newToken;
              user = shopUser;
            }
          } catch {}
        }

        if (!token) {
          const fallbackStoreId = 'a7e7bd20-bebc-44c9-a98b-004de44cf773';
          setStoreId(fallbackStoreId);
          loadRules(fallbackStoreId);
          loadHistory(settleYearMonth, fallbackStoreId);
          setLoading(false);
          return;
        }
        const res: any = await api.get('/auth/me');
        const authUser = res?.data || res || user;
        if (isCurrent && authUser) {
          if (authUser.role) {
            setCurrentUserRole(authUser.role);
            localStorage.setItem('user', JSON.stringify(authUser));
          }

          const myStore =
            authUser.stores?.find((s: any) => s.id === storeId) ||
            authUser.stores?.[0] ||
            authUser.stores?.find((s: any) => s.id === 'a7e7bd20-bebc-44c9-a98b-004de44cf773');
          const effectiveStoreId =
            myStore?.id ||
            authUser.storeId ||
            'a7e7bd20-bebc-44c9-a98b-004de44cf773';

          if (effectiveStoreId) {
            setStoreId(effectiveStoreId);
            localStorage.setItem('current_store_id', effectiveStoreId);
            loadRules(effectiveStoreId);
            loadHistory(settleYearMonth, effectiveStoreId);
          } else {
            setRules([]);
            setHistoryList([]);
            setErrorMsg('Tài khoản này chưa có cửa hàng để quản lý mốc thưởng.');
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.warn('Xác thực auth/me thất bại:', err?.message);
        if (isCurrent) {
          const fallbackStoreId = 'a7e7bd20-bebc-44c9-a98b-004de44cf773';
          setStoreId(fallbackStoreId);
          loadRules(fallbackStoreId);
          loadHistory(settleYearMonth, fallbackStoreId);
          setLoading(false);
        }
      }
    }
    verifyAuthAndLoadStore();
    return () => {
      isCurrent = false;
    };
  }, [loadHistory, loadRules, settleYearMonth, storeId]);

  const isAnyModalOpen = Boolean(isCreateOpen || editingRule || deletingRule);



  const renderModalPortal = (children: React.ReactNode) => {
    let targetMount: Element | null = null;
    try {
      if (typeof window !== 'undefined') {
        if (window.parent && window.parent.document) {
          targetMount = window.parent.document.getElementById('modal-root') || window.parent.document.body;
        }
        if (!targetMount) {
          targetMount = document.getElementById('modal-root') || document.body;
        }
      }
    } catch {
      targetMount = typeof document !== 'undefined' ? document.body : null;
    }
    if (!targetMount) return children;
    return createPortal(children, targetMount);
  };


  useEffect(() => {
    if (!isAnyModalOpen) return;
    try {
      const targetDoc = (typeof window !== 'undefined' && window.parent?.document) || document;
      const originalOverflow = targetDoc.body.style.overflow;
      targetDoc.body.style.overflow = 'hidden';
      return () => {
        targetDoc.body.style.overflow = originalOverflow;
      };
    } catch {}
  }, [isAnyModalOpen]);


  useEffect(() => {
    if (window.parent && window.parent !== window) {
      const sendHeight = () => {
        const rootEl = document.body;
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
  }, [loading, rules, historyList, storeId]);


  const runSimulation = useCallback(async (revenueVal: string) => {
    if (!storeId || !revenueVal || isNaN(Number(revenueVal)) || Number(revenueVal) < 0) {
      setSimResult(null);
      return;
    }
    try {
      setSimLoading(true);
      const res = await commissionRulesService.previewBonus(storeId, revenueVal);
      setSimResult(res);
    } catch (err: any) {
      console.error('Lỗi mô phỏng:', err);
    } finally {
      setSimLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (loading || !storeId) return;
    const timer = setTimeout(() => {
      runSimulation(simRevenue);
    }, 400);
    return () => clearTimeout(timer);
  }, [simRevenue, rules, runSimulation, loading, storeId]);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await commissionRulesService.createRule(storeId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        minMonthlyRevenue: formData.minMonthlyRevenue.trim(),
        achievementBonus: formData.achievementBonus.trim() || '0',
        bonusPercentage: formData.bonusPercentage.trim(),
        isActive: formData.isActive,
      });
      setSuccessMsg('Tạo mốc thưởng doanh số mới thành công!');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        minMonthlyRevenue: '',
        achievementBonus: '0',
        bonusPercentage: '',
        isActive: true,
      });
      loadRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Tạo mốc thưởng thất bại');
    }
  };


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    try {
      setErrorMsg(null);
      await commissionRulesService.updateRule(storeId, editingRule.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        minMonthlyRevenue: formData.minMonthlyRevenue.trim(),
        achievementBonus: formData.achievementBonus.trim() || '0',
        bonusPercentage: formData.bonusPercentage.trim(),
        isActive: formData.isActive,
      });
      setSuccessMsg('Cập nhật mốc thưởng thành công!');
      setEditingRule(null);
      loadRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cập nhật mốc thưởng thất bại');
    }
  };


  const handleToggleStatus = async (rule: CommissionRule) => {
    try {
      setErrorMsg(null);
      const res = await commissionRulesService.updateStatus(
        storeId,
        rule.id,
        !rule.isActive,
      );
      setSuccessMsg(res.message);
      loadRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cập nhật trạng thái thất bại');
    }
  };


  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      setErrorMsg(null);
      await commissionRulesService.deleteRule(storeId, deletingRule.id);
      setSuccessMsg('Đã xóa mềm mốc thưởng thành công (bảo toàn lịch sử)');
      setDeletingRule(null);
      loadRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xóa mốc thưởng thất bại');
    }
  };


  const handleSettleBonus = async () => {
    if (!settleKolId.trim()) {
      setErrorMsg('Vui lòng nhập UUID của Cộng tác viên / KOL để chốt thưởng');
      return;
    }
    try {
      setSettleLoading(true);
      setErrorMsg(null);
      const res = await commissionRulesService.settleMonthlyBonus(
        storeId,
        settleKolId.trim(),
        settleYearMonth,
      );
      setSettleResult(res);
      setSuccessMsg(res.message);
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Chốt thưởng tháng thất bại');
    } finally {
      setSettleLoading(false);
    }
  };


  const handleApprove = async (settlementId: string) => {
    try {
      setErrorMsg(null);
      const res = await commissionRulesService.approveSettlement(storeId, settlementId);
      setSuccessMsg(res.message || 'Đã duyệt kỳ thưởng thành công');
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Duyệt thưởng thất bại');
    }
  };


  const handlePayout = async (settlementId: string) => {
    try {
      setErrorMsg(null);
      const res = await commissionRulesService.payoutSettlement(storeId, settlementId);
      setSuccessMsg(res.message || 'Đã chi trả tiền thưởng vào ví thành công');
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Chi trả vào ví thất bại');
    }
  };

  const formatVND = (amount: string | number) => {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="app-container" style={{ padding: '24px 26px 48px 26px', width: '100%', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        html, body {
          scrollbar-width: thin;
          scrollbar-color: rgba(180, 140, 75, 0.45) transparent;
          overflow-y: auto !important;
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
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#F5E7CC', border: '1.5px solid #DEBE85', padding: '12px 14px', borderRadius: 14, color: '#9E7933', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(201, 163, 99, 0.2)' }}>
              <Trophy size={28} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 850, color: '#2C2114', letterSpacing: '-0.5px' }}>
                Cấu Hình Mốc Thưởng Doanh Số Tháng
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#7D6D55', fontSize: 15.5, lineHeight: 1.4 }}>
                Thưởng cố định đạt KPI + Thưởng phần vượt lũy tiến từng khoảng doanh số.
              </p>
            </div>
          </div>
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              loadRules();
              loadHistory(settleYearMonth);
            }}
            style={{
              background: '#F6EFE3',
              border: '1px solid #E8DAC4',
              borderRadius: 10,
              padding: '10px 20px',
              color: '#2C2114',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 14.5,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(110, 84, 39, 0.06)',
            }}
          >
            <RefreshCw size={16} /> Làm mới dữ liệu
          </button>
        </div>
      </div>


      {isReadOnlyAdmin && (
        <div style={{
          background: '#EFF6FF',
          border: '1.5px solid #93C5FD',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          color: '#1E40AF',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.5,
          boxShadow: '0 2px 10px rgba(59, 130, 246, 0.08)',
        }}>
          <AlertCircle size={22} color="#2563EB" style={{ flexShrink: 0 }} />
          <div>
            <strong>Chế độ Quản trị viên (System Admin Read-only Audit):</strong> Bạn đang truy cập với vai trò <strong>SYSTEM_ADMIN</strong>. Bạn có quyền xem toàn bộ chính sách và lịch sử chốt thưởng của Shop; các thao tác tạo, sửa, xóa, chốt và chi trả thưởng chỉ dành riêng cho Chủ Gian Hàng (SHOP_MANAGER).
          </div>
        </div>
      )}


      {errorMsg && (
        <div style={{
          background: '#FDEBED',
          border: '1px solid #FCA5A5',
          color: '#B83A42',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 650, fontSize: 14.5 }}>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} style={{ background: 'transparent', border: 'none', color: '#B83A42', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#EAF8F0',
          border: '1px solid #BBF7D0',
          color: '#15803D',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 700, fontSize: 14.5 }}>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'transparent', border: 'none', color: '#15803D', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 16, padding: '18px 22px', boxShadow: '0 3px 12px rgba(110, 84, 39, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7D6D55', fontSize: 14.5, fontWeight: 650, marginBottom: 6 }}>
            <span>Số mốc cấu hình</span>
            <Award size={19} color="#C9A363" />
          </div>
          <div style={{ fontSize: 27, fontWeight: 850, color: '#2C2114' }}>{rules.length} mốc</div>
          <div style={{ fontSize: 13.5, color: '#9E8D77', marginTop: 4 }}>{rules.filter(r => r.isActive).length} đang áp dụng</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 16, padding: '18px 22px', boxShadow: '0 3px 12px rgba(110, 84, 39, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7D6D55', fontSize: 14.5, fontWeight: 650, marginBottom: 6 }}>
            <span>Cơ chế tính thưởng</span>
            <Layers size={19} color="#C9A363" />
          </div>
          <div style={{ fontSize: 21, fontWeight: 850, color: '#9E7933' }}>Lũy Tiến Khoảng</div>
          <div style={{ fontSize: 13.5, color: '#9E8D77', marginTop: 4 }}>+ Thưởng cố định đạt KPI</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 16, padding: '18px 22px', boxShadow: '0 3px 12px rgba(110, 84, 39, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7D6D55', fontSize: 14.5, fontWeight: 650, marginBottom: 6 }}>
            <span>Tỷ lệ phần vượt max</span>
            <TrendingUp size={19} color="#C9A363" />
          </div>
          <div style={{ fontSize: 27, fontWeight: 850, color: '#C9A363' }}>
            {rules.length > 0 ? `${rules[rules.length - 1].bonusPercentage}%` : '0%'}
          </div>
          <div style={{ fontSize: 13.5, color: '#9E8D77', marginTop: 4 }}>Tính trên phần doanh số vượt</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 16, padding: '18px 22px', boxShadow: '0 3px 12px rgba(110, 84, 39, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7D6D55', fontSize: 14.5, fontWeight: 650, marginBottom: 6 }}>
            <span>Chống trùng & Snapshot</span>
            <CheckCircle2 size={19} color="#15803D" />
          </div>
          <div style={{ fontSize: 21, fontWeight: 850, color: '#15803D' }}>Idempotent</div>
          <div style={{ fontSize: 13.5, color: '#9E8D77', marginTop: 4 }}>Bảo toàn đối soát lịch sử</div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1.18fr 1fr', gap: 22 }}>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 18, padding: '26px 28px', boxShadow: '0 4px 18px rgba(110, 84, 39, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: '#2C2114' }}>
                Danh Sách Mốc Thưởng Doanh Số
              </h2>
              <div style={{ fontSize: 14.5, color: '#7D6D55', marginTop: 3 }}>
                Sắp xếp tăng dần theo doanh số tối thiểu
              </div>
            </div>
            {!isReadOnlyAdmin && (
              <button
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    minMonthlyRevenue: '',
                    achievementBonus: '0',
                    bonusPercentage: '',
                    isActive: true,
                  });
                  setIsCreateOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                  color: '#2C2114',
                  border: '1px solid #DEBE85',
                  borderRadius: 11,
                  padding: '11px 20px',
                  fontWeight: 750,
                  fontSize: 14.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 3px 12px rgba(201, 163, 99, 0.25)',
                }}
              >
                <Plus size={17} /> Thêm Mốc Thưởng
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#7D6D55', fontSize: 15 }}>Đang tải danh sách mốc thưởng...</div>
          ) : rules.length === 0 ? (
            <div style={{ padding: 52, textAlign: 'center', border: '1.5px dashed #E8DAC4', borderRadius: 14, background: '#FAF6F0' }}>
              <Award size={42} color="#C9A363" style={{ marginBottom: 14 }} />
              <p style={{ margin: 0, color: '#2C2114', fontWeight: 750, fontSize: 16.5 }}>Chưa có mốc thưởng nào được cấu hình</p>
              <p style={{ margin: '8px 0 20px 0', color: '#7D6D55', fontSize: 14.5 }}>
                Tạo mốc đầu tiên để kích thích các CTV/KOL đẩy mạnh doanh số bán hàng trong tháng.
              </p>
              {!isReadOnlyAdmin && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                    color: '#2C2114',
                    border: '1px solid #DEBE85',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontWeight: 750,
                    fontSize: 14.5,
                  }}
                >
                  + Tạo Mốc Ngay
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  style={{
                    background: rule.isActive ? '#FFFFFF' : '#F6EFE3',
                    border: rule.isActive ? '1.5px solid #E8DAC4' : '1px solid #ECE1CD',
                    borderRadius: 16,
                    padding: '20px 22px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 18,
                    boxShadow: '0 2px 10px rgba(110, 84, 39, 0.04)',
                    opacity: rule.isActive ? 1 : 0.75,
                    transition: 'all 0.2s',
                  }}
                >

                  <div style={{
                    width: 46,
                    height: 46,
                    flexShrink: 0,
                    borderRadius: 12,
                    background: rule.isActive ? '#F5E7CC' : '#ECE1CD',
                    color: rule.isActive ? '#9E7933' : '#7D6D55',
                    border: '1.5px solid #DEBE85',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 850,
                    fontSize: 16,
                  }}>
                    #{idx + 1}
                  </div>


                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 18.5, color: '#2C2114', wordBreak: 'break-word', marginBottom: 10 }}>
                      {rule.name}
                    </div>


                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 13,
                        padding: '4px 12px',
                        borderRadius: 7,
                        background: rule.isActive ? '#EAF8F0' : '#FFF3DD',
                        color: rule.isActive ? '#15803D' : '#C27803',
                        border: rule.isActive ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}>
                        {rule.isActive ? 'Đang áp dụng' : 'Tạm ngừng'}
                      </span>

                      <span style={{
                        fontSize: 12.5,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#F6EFE3',
                        border: '1px solid #E8DAC4',
                        color: '#7D6D55',
                        fontWeight: 650,
                        whiteSpace: 'nowrap',
                      }}>
                        v{rule.version}
                      </span>

                      <span style={{
                        background: '#F5E7CC',
                        color: '#9E7933',
                        border: '1px solid #DEBE85',
                        borderRadius: 14,
                        padding: '4px 14px',
                        fontSize: 13,
                        fontWeight: 750,
                        whiteSpace: 'nowrap',
                      }}>
                        Vượt: +{rule.bonusPercentage}%
                      </span>
                    </div>

                    {rule.description && (
                      <div style={{ fontSize: 14.5, color: '#7D6D55', marginBottom: 10, lineHeight: 1.5 }}>
                        {rule.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 14.5, color: '#7D6D55' }}>
                      <span>
                        Đạt KPI từ: <strong style={{ color: '#9E7933', fontSize: 16 }}>{formatVND(rule.minMonthlyRevenue)}</strong>
                      </span>
                      <span>
                        Thưởng đạt KPI: <strong style={{ color: '#15803D', fontSize: 16 }}>{formatVND(rule.achievementBonus)}</strong>
                      </span>
                    </div>
                  </div>


                  {!isReadOnlyAdmin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleStatus(rule)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: rule.isActive ? '#15803D' : '#C27803',
                          padding: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={rule.isActive ? 'Tạm ngừng mốc' : 'Kích hoạt mốc'}
                      >
                        {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setFormData({
                            name: rule.name,
                            description: rule.description || '',
                            minMonthlyRevenue: rule.minMonthlyRevenue,
                            achievementBonus: rule.achievementBonus,
                            bonusPercentage: rule.bonusPercentage,
                            isActive: rule.isActive,
                          });
                        }}
                        style={{
                          background: '#F6EFE3',
                          border: '1px solid #E8DAC4',
                          color: '#7D6D55',
                          borderRadius: 9,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Chỉnh sửa mốc"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => setDeletingRule(rule)}
                        style={{
                          background: '#FDEBED',
                          border: '1px solid #FCA5A5',
                          color: '#B83A42',
                          borderRadius: 9,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Xóa mềm mốc"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#9E8D77', fontStyle: 'italic', paddingRight: 8 }}>
                      Chỉ đọc
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 18, padding: '26px 28px', boxShadow: '0 4px 18px rgba(110, 84, 39, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Calculator size={24} color="#C9A363" />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: '#2C2114' }}>
                Mô Phỏng Thưởng Lũy Tiến {simLoading && <span style={{ fontSize: 14, color: '#7D6D55', fontWeight: 400 }}>(Đang tính...)</span>}
              </h2>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor={simRevenueInputId} style={{ display: 'block', fontSize: 14.5, color: '#7D6D55', fontWeight: 700, marginBottom: 8 }}>
                Doanh số hợp lệ tháng của CTV (VND):
              </label>
              <input
                id={simRevenueInputId}
                type="number"
                value={simRevenue}
                onChange={(e) => setSimRevenue(e.target.value)}
                placeholder="120000000"
                style={{
                  width: '100%',
                  background: '#FAF6F0',
                  border: '1.5px solid #E8DAC4',
                  borderRadius: 12,
                  padding: '13px 18px',
                  color: '#2C2114',
                  fontSize: 18.5,
                  fontWeight: 800,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {simResult && (
              <div style={{ background: '#FAF6F0', border: '1px solid #E8DAC4', borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14.5, color: '#7D6D55' }}>Mốc cao nhất đạt:</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: simResult.highestReachedRule ? '#9E7933' : '#9E8D77' }}>
                    {simResult.highestReachedRule ? simResult.highestReachedRule.name : 'Chưa đạt KPI'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14.5, color: '#7D6D55' }}>Thưởng cố định đạt KPI:</span>
                  <span style={{ fontWeight: 800, color: '#15803D', fontSize: 17 }}>
                    {formatVND(simResult.achievementBonus)}
                  </span>
                </div>


                {simResult.rangeBonuses.length > 0 && (
                  <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed #E8DAC4' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: '#7D6D55', marginBottom: 8 }}>
                      Chi tiết thưởng phần vượt theo từng khoảng:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {simResult.rangeBonuses.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, background: '#FFFFFF', border: '1px solid #ECE1CD', padding: '9px 12px', borderRadius: 8 }}>
                          <span style={{ color: '#2C2114', fontWeight: 550 }}>
                            Khoảng {Number(item.from) / 1000000}tr - {Number(item.to) / 1000000}tr ({item.rate}%):
                          </span>
                          <span style={{ fontWeight: 800, color: '#9E7933' }}>
                            +{formatVND(item.bonus)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingTop: 12, borderTop: '1px solid #E8DAC4' }}>
                  <span style={{ fontSize: 16.5, fontWeight: 800, color: '#2C2114' }}>Tổng Tiền Thưởng:</span>
                  <span style={{ fontSize: 26, fontWeight: 850, color: '#15803D' }}>
                    {formatVND(simResult.totalBonus)}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: '#7D6D55', background: '#FFFFFF', border: '1px solid #E8DAC4', padding: '10px 14px', borderRadius: 8, lineHeight: 1.5 }}>
                  {simResult.formula}
                </div>
              </div>
            )}
          </div>


          <div style={{ background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 18, padding: '26px 28px', boxShadow: '0 4px 18px rgba(110, 84, 39, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <History size={24} color="#C9A363" />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: '#2C2114' }}>
                Chốt Thưởng Tháng (Idempotent)
              </h2>
            </div>


            <div style={{ marginBottom: 18 }}>
              <label htmlFor={settleMonthInputId} style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: '#7D6D55', marginBottom: 8 }}>
                Kỳ chốt thưởng tháng (Tiếng Việt):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                <div>
                  <select
                    id={settleMonthInputId}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#FAF6F0',
                      border: '1.5px solid #E8DAC4',
                      borderRadius: 11,
                      padding: '12px 16px',
                      color: '#2C2114',
                      fontSize: 15,
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="01">Tháng 01</option>
                    <option value="02">Tháng 02</option>
                    <option value="03">Tháng 03</option>
                    <option value="04">Tháng 04</option>
                    <option value="05">Tháng 05</option>
                    <option value="06">Tháng 06</option>
                    <option value="07">Tháng 07</option>
                    <option value="08">Tháng 08</option>
                    <option value="09">Tháng 09</option>
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                  </select>
                </div>

                <div>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Năm (VD: 2026)"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#FAF6F0',
                      border: '1.5px solid #E8DAC4',
                      borderRadius: 11,
                      padding: '12px 16px',
                      color: '#2C2114',
                      fontSize: 15,
                      fontWeight: 650,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: '#9E8D77', marginTop: 7 }}>
                📅 Đang chọn: <strong style={{ color: '#9E7933' }}>Tháng {selectedMonth}/{selectedYear}</strong> (Kỳ hệ thống: <code>{settleYearMonth}</code>)
              </div>
            </div>


            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label htmlFor={settleKolInputId} style={{ fontSize: 14.5, fontWeight: 700, color: '#7D6D55' }}>
                  Cộng Tác Viên / KOL nhận thưởng:
                </label>
                {settleKolId ? (
                  <span style={{ fontSize: 13, color: '#9E7933', fontWeight: 700 }}>
                    KOL: {settleKolId.slice(0, 8)}...
                  </span>
                ) : null}
              </div>
              <input
                id={settleKolInputId}
                type="text"
                value={settleKolId}
                onChange={(e) => setSettleKolId(e.target.value)}
                placeholder="Nhập UUID hoặc mã định danh của CTV/KOL..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAF6F0',
                  border: '1.5px solid #E8DAC4',
                  borderRadius: 11,
                  padding: '12px 16px',
                  color: '#2C2114',
                  fontSize: 15,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              {import.meta.env.DEV && (
                <div style={{ display: 'flex', gap: 10, marginTop: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#9E8D77' }}>[Dev] Gợi ý:</span>
                  <button
                    type="button"
                    onClick={() => setSettleKolId('237a7208-1c74-4322-96b2-51d810660723')}
                    style={{
                      background: settleKolId === '237a7208-1c74-4322-96b2-51d810660723' ? '#EFE2CC' : '#FAF6F0',
                      border: '1px solid #DEBE85',
                      borderRadius: 7,
                      padding: '4px 12px',
                      fontSize: 13,
                      color: '#7D6D55',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                    title="Điền UUID mẫu KOL Nguyễn Thành Thắng"
                  >
                    Nguyễn Thành Thắng (kol1@scanms.vn)
                  </button>
                  {settleKolId && (
                    <button
                      type="button"
                      onClick={() => setSettleKolId('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9E8D77',
                        fontSize: 13,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      Xóa trống để tự nhập
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isReadOnlyAdmin ? (
              <button
                onClick={handleSettleBonus}
                disabled={settleLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)',
                  color: '#2C2114',
                  border: '1px solid #DEBE85',
                  borderRadius: 13,
                  padding: '15px 0',
                  fontWeight: 800,
                  fontSize: 15.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(201, 163, 99, 0.28)',
                }}
              >
                {settleLoading ? 'Đang quét đơn COMPLETED & chốt thưởng...' : 'Thực Hiện Chốt Thưởng Tháng'}
              </button>
            ) : (
              <div style={{
                padding: '14px 18px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 12,
                color: '#1E40AF',
                fontSize: 13.5,
                textAlign: 'center',
                fontWeight: 650,
                lineHeight: 1.5,
              }}>
                🛡️ Tài khoản SYSTEM_ADMIN chỉ có quyền kiểm tra đối soát (Read-only Audit). Chức năng chốt kỳ thưởng chỉ dành cho Chủ Gian Hàng.
              </div>
            )}

            {settleResult && (
              <div style={{
                marginTop: 16,
                padding: '15px 18px',
                borderRadius: 12,
                fontSize: 14,
                background: settleResult.isAlreadySettled ? '#FFF3DD' : '#EAF8F0',
                border: settleResult.isAlreadySettled ? '1px solid #FDE68A' : '1px solid #BBF7D0',
                color: settleResult.isAlreadySettled ? '#C27803' : '#15803D',
              }}>
                <div style={{ fontWeight: 750 }}>{settleResult.message}</div>
                <div style={{ marginTop: 5, color: '#2C2114', fontWeight: 600 }}>
                  Doanh số hợp lệ: {formatVND(settleResult.settlement.validRevenue)} | Thưởng: {formatVND(settleResult.settlement.bonusAmount)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div style={{ marginTop: 26, background: '#FFFFFF', border: '1.5px solid #E8DAC4', borderRadius: 18, padding: '26px 28px', boxShadow: '0 4px 18px rgba(110, 84, 39, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: '#2C2114' }}>
            Lịch Sử Chốt Thưởng Tháng ({historyList.length} lượt chốt - Tháng {selectedMonth}/{selectedYear})
          </h2>
          <button
            onClick={() => loadHistory()}
            style={{
              background: '#F6EFE3',
              border: '1px solid #E8DAC4',
              borderRadius: 10,
              padding: '9px 18px',
              color: '#7D6D55',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={15} /> Tải lại lịch sử
          </button>
        </div>

        {historyLoading ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#7D6D55', fontSize: 14 }}>Đang tải lịch sử...</div>
        ) : historyList.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#9E8D77', fontSize: 14 }}>
            Chưa có lượt chốt thưởng nào cho kỳ Tháng {selectedMonth}/{selectedYear}.
          </div>
        ) : (
          <div data-scrollable-x="true" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, color: '#2C2114' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #E8DAC4', color: '#7D6D55', background: '#FAF6F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>Kỳ Tháng</th>
                  <th style={{ padding: '12px 14px' }}>Cộng Tác Viên</th>
                  <th style={{ padding: '12px 14px' }}>Doanh Số Hợp Lệ</th>
                  <th style={{ padding: '12px 14px' }}>Mốc Đạt</th>
                  <th style={{ padding: '12px 14px' }}>Số Tiền Thưởng</th>
                  <th style={{ padding: '12px 14px' }}>Snapshot Chi Tiết</th>
                  <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 14px' }}>Thao Tác</th>
                  <th style={{ padding: '12px 14px' }}>Thời Gian Chốt</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #ECE1CD' }}>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ fontWeight: 700, color: '#9E7933' }}>
                        Tháng {item.yearMonth.split('-')[1]}/{item.yearMonth.split('-')[0]}
                      </span>
                      <div style={{ fontSize: 12, color: '#9E8D77' }}>Kỳ: {item.yearMonth}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontWeight: 650 }}>{item.collaboratorName}</div>
                      <div style={{ fontSize: 12, color: '#7D6D55' }}>{item.collaboratorEmail}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontWeight: 650 }}>{formatVND(item.validRevenue)}</td>
                    <td style={{ padding: '13px 14px', color: '#9E7933', fontWeight: 650 }}>{item.appliedRuleName}</td>
                    <td style={{ padding: '13px 14px', fontWeight: 750, color: '#15803D' }}>{formatVND(item.bonusAmount)}</td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#7D6D55' }}>
                      {item.ruleSnapshot?.formula || 'Đã lưu snapshot đầy đủ'}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        background: item.status === 'PAID' ? '#EAF8F0' : item.status === 'APPROVED' ? '#F5E7CC' : '#FFF3DD',
                        color: item.status === 'PAID' ? '#15803D' : item.status === 'APPROVED' ? '#9E7933' : '#C27803',
                        border: item.status === 'PAID' ? '1px solid #BBF7D0' : item.status === 'APPROVED' ? '1px solid #DEBE85' : '1px solid #FDE68A',
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      {isReadOnlyAdmin ? (
                        item.status === 'PAID' ? (
                          <span style={{ color: '#15803D', fontWeight: 700 }}>Đã vào ví</span>
                        ) : (
                          <span style={{ color: '#9E8D77', fontSize: 12, fontStyle: 'italic' }}>Chỉ xem (Admin)</span>
                        )
                      ) : (
                        <>
                          {item.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              style={{
                                border: '1px solid #DEBE85',
                                borderRadius: 8,
                                padding: '7px 14px',
                                background: '#F5E7CC',
                                color: '#9E7933',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Duyệt
                            </button>
                          )}
                          {item.status === 'APPROVED' && (
                            <button
                              onClick={() => handlePayout(item.id)}
                              style={{
                                border: '1px solid #BBF7D0',
                                borderRadius: 8,
                                padding: '7px 14px',
                                background: '#EAF8F0',
                                color: '#15803D',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Chi trả
                            </button>
                          )}
                          {item.status === 'PAID' && <span style={{ color: '#15803D', fontWeight: 700 }}>Đã vào ví</span>}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', color: '#7D6D55', fontSize: 12.5 }}>
                      {new Date(item.settledAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {isCreateOpen && renderModalPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44, 33, 20, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            zIndex: 99999,
            overscrollBehavior: 'contain',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E8DAC4',
            borderRadius: 20,
            padding: '30px 36px',
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 24px 60px -10px rgba(110, 84, 39, 0.28)',
            margin: 'auto',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#2C2114' }}>Thêm Mốc Thưởng Doanh Số</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{
                  background: '#FAF6F0',
                  border: '1px solid #E8DAC4',
                  borderRadius: 8,
                  color: '#7D6D55',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor={ruleNameInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Tên mốc thưởng *</label>
                <input
                  id={ruleNameInputId}
                  type="text"
                  required
                  maxLength={150}
                  placeholder="Ví dụ: Mốc Bạc (>= 50 Triệu)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor={ruleDescInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Mô tả chính sách</label>
                <input
                  id={ruleDescInputId}
                  type="text"
                  maxLength={500}
                  placeholder="Mô tả quyền lợi hoặc điều kiện áp dụng"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label htmlFor={ruleRevenueInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Doanh số tối thiểu (VND) *</label>
                  <input
                    id={ruleRevenueInputId}
                    type="number"
                    required
                    placeholder="50000000"
                    value={formData.minMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, minMonthlyRevenue: e.target.value })}
                    style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>

                <div>
                  <label htmlFor={ruleAchieveInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Thưởng đạt KPI (VND)</label>
                  <input
                    id={ruleAchieveInputId}
                    type="number"
                    placeholder="500000"
                    value={formData.achievementBonus}
                    onChange={(e) => setFormData({ ...formData, achievementBonus: e.target.value })}
                    style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor={ruleBonusInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Tỷ lệ thưởng phần vượt (%) *</label>
                <input
                  id={ruleBonusInputId}
                  type="number"
                  step="0.01"
                  required
                  placeholder="2.00"
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
                <div style={{ fontSize: 12.5, color: '#9E8D77', marginTop: 6, lineHeight: 1.45 }}>
                  Công thức: Đạt KPI thưởng cố định + phần vượt mốc tính theo tỷ lệ này.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{ background: '#F6EFE3', border: '1px solid #E8DAC4', color: '#7D6D55', borderRadius: 10, padding: '12px 24px', fontWeight: 650, cursor: 'pointer', fontSize: 14.5 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)', border: '1px solid #DEBE85', color: '#2C2114', borderRadius: 10, padding: '12px 28px', fontWeight: 750, cursor: 'pointer', boxShadow: '0 3px 10px rgba(201, 163, 99, 0.3)', fontSize: 14.5 }}
                >
                  Lưu Mốc Thưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {editingRule && renderModalPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingRule(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44, 33, 20, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            zIndex: 99999,
            overscrollBehavior: 'contain',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E8DAC4',
            borderRadius: 20,
            padding: '30px 36px',
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 24px 60px -10px rgba(110, 84, 39, 0.28)',
            margin: 'auto',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#2C2114' }}>Chỉnh Sửa Mốc Thưởng (v{editingRule.version})</h3>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                style={{
                  background: '#FAF6F0',
                  border: '1px solid #E8DAC4',
                  borderRadius: 8,
                  color: '#7D6D55',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Tên mốc thưởng *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Mô tả chính sách</label>
                <input
                  type="text"
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Doanh số tối thiểu (VND) *</label>
                  <input
                    type="number"
                    required
                    value={formData.minMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, minMonthlyRevenue: e.target.value })}
                    style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Thưởng đạt KPI (VND)</label>
                  <input
                    type="number"
                    value={formData.achievementBonus}
                    onChange={(e) => setFormData({ ...formData, achievementBonus: e.target.value })}
                    style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D6D55', marginBottom: 6 }}>Tỷ lệ thưởng phần vượt (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
                  style={{ width: '100%', background: '#FAF6F0', border: '1.5px solid #E8DAC4', borderRadius: 10, padding: '12px 15px', color: '#2C2114', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#C9A363', cursor: 'pointer' }}
                />
                <label htmlFor="editIsActive" style={{ fontSize: 14, color: '#2C2114', cursor: 'pointer', fontWeight: 650 }}>
                  Kích hoạt áp dụng mốc thưởng này ngay
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  style={{ background: '#F6EFE3', border: '1px solid #E8DAC4', color: '#7D6D55', borderRadius: 10, padding: '12px 24px', fontWeight: 650, cursor: 'pointer', fontSize: 14.5 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #DEBE85 0%, #C9A363 100%)', border: '1px solid #DEBE85', color: '#2C2114', borderRadius: 10, padding: '12px 30px', fontWeight: 750, cursor: 'pointer', boxShadow: '0 3px 12px rgba(201, 163, 99, 0.32)', fontSize: 14.5 }}
                >
                  Cập Nhật Mốc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {deletingRule && renderModalPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingRule(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44, 33, 20, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            zIndex: 99999,
            overscrollBehavior: 'contain',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #FCA5A5',
            borderRadius: 20,
            padding: '28px 34px',
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 24px 60px -10px rgba(184, 58, 66, 0.25)',
            margin: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ background: '#FDEBED', padding: 12, borderRadius: 12, color: '#B83A42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19.5, fontWeight: 750, color: '#2C2114' }}>Xác Nhận Xóa Mốc Thưởng</h3>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: 14.5, color: '#7D6D55', lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn xóa mốc <strong style={{ color: '#2C2114' }}>"{deletingRule.name}"</strong>?
              Hệ thống sẽ thực hiện <strong>xóa mềm</strong> để bảo toàn toàn bộ dữ liệu lịch sử đối soát thưởng các tháng trước.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setDeletingRule(null)}
                style={{ background: '#F6EFE3', border: '1px solid #E8DAC4', color: '#7D6D55', borderRadius: 10, padding: '10px 20px', fontWeight: 650, cursor: 'pointer', fontSize: 14 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{ background: '#DC2626', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 24px', fontWeight: 650, cursor: 'pointer', fontSize: 14 }}
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionRulesPage;
