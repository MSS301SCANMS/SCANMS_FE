import React, { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import {
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
import {
  commissionRulesService,
} from '../../services/commission-rules.service';
import type {
  CommissionRule,
  BonusPreviewResult,
  SettlementHistoryItem,
} from '../../services/commission-rules.service';
import { useMe } from '../../hooks/useAuth';
import { useCommissionRules, useSettlementHistory } from '../../hooks/useCommissionRules';
import { getVietnamCurrentMonthYear } from '../../utils/dateTimeUtils';
import { Select } from '../../components/ui/Select';

export const CommissionRulesPage: React.FC = () => {
  const { year: currentVnYear, month: currentVnMonth } = getVietnamCurrentMonthYear();

  // ─── Auth hook — lấy storeId từ server, không cần api.get('/auth/me') thủ công ───
  const meQuery = useMe();
  const [storeId, setStoreId] = useState<string>(
    () => localStorage.getItem('current_store_id') || '',
  );

  // Khi meQuery trả về, cập nhật storeId
  useEffect(() => {
    const authUser = meQuery.data;
    if (!authUser) return;
    const myStore = authUser.stores?.find((s: any) => s.id === storeId) || authUser.stores?.[0];
    const effectiveStoreId = myStore?.id || storeId;
    if (effectiveStoreId && effectiveStoreId !== storeId) {
      setStoreId(effectiveStoreId);
      localStorage.setItem('current_store_id', effectiveStoreId);
    }
  }, [meQuery.data]);

  const currentUserRole = meQuery.data?.role ?? (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.role || ''; } catch { return ''; }
  })();

  // ─── Data từ hooks (thay thế loadRules / loadHistory) ────────────────────
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

  // ─── Hooks thay thế loadRules / loadHistory ───────────────────────────────
  const rulesQuery    = useCommissionRules(storeId);
  const historyQuery  = useSettlementHistory(storeId, settleYearMonth);

  const rules        = rulesQuery.data  ?? [];
  const loading      = rulesQuery.isLoading;
  const historyList: SettlementHistoryItem[] = (historyQuery.data as SettlementHistoryItem[]) ?? [];
  const historyLoading = historyQuery.isLoading;

  const loadRules  = () => rulesQuery.refetch();
  const loadHistory = () => historyQuery.refetch();


  const ruleNameInputId = useId();
  const ruleDescInputId = useId();
  const ruleRevenueInputId = useId();
  const ruleAchieveInputId = useId();
  const ruleBonusInputId = useId();
  const simRevenueInputId = useId();
  const settleMonthInputId = useId();
  const settleKolInputId = useId();

  const isReadOnlyAdmin = currentUserRole === 'SYSTEM_ADMIN';

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
    <div className="mx-auto box-border flex w-full max-w-[1520px] flex-col gap-5 pb-10 pt-4 font-sans sm:pt-5">




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
          background: '#FEE2E2',
          border: '1px solid #DC2626',
          color: '#991B1B',
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
          <button onClick={() => setErrorMsg(null)} style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#FBF5EB',
          border: '1px solid #EAE4D7',
          color: '#B88E4F',
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
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'transparent', border: 'none', color: '#B88E4F', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}


      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <article className="flex min-h-[142px] flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_12px_rgba(35,29,21,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#7D715E]">
            <span>Số mốc cấu hình</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Award size={18} /></span>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[#1A1612]">{rules.length} mốc</div>
            <div className="mt-1 text-xs text-[#7D715E]">{rules.filter(r => r.isActive).length} đang áp dụng</div>
          </div>
        </article>

        <article className="flex min-h-[142px] flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_12px_rgba(35,29,21,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#7D715E]">
            <span>Cơ chế tính thưởng</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Layers size={18} /></span>
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-[#8A642C]">Lũy tiến theo khoảng</div>
            <div className="mt-1 text-xs text-[#7D715E]">Cộng thưởng cố định khi đạt KPI</div>
          </div>
        </article>

        <article className="flex min-h-[142px] flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_12px_rgba(35,29,21,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#7D715E]">
            <span>Tỷ lệ phần vượt cao nhất</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><TrendingUp size={18} /></span>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[#8A642C]">
              {rules.length > 0 ? `${rules[rules.length - 1].bonusPercentage}%` : '0%'}
            </div>
            <div className="mt-1 text-xs text-[#7D715E]">Áp dụng trên doanh số vượt mốc</div>
          </div>
        </article>

        <article className="flex min-h-[142px] flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_12px_rgba(35,29,21,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#7D715E]">
            <span>Đối soát thưởng</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#059669]"><CheckCircle2 size={18} /></span>
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-[#8A642C]">Có lưu snapshot</div>
            <div className="mt-1 text-xs text-[#7D715E]">Giữ nguyên lịch sử chốt thưởng</div>
          </div>
        </article>
      </div>


      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 xl:gap-5">

        <section className="min-w-0 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_4px_18px_rgba(35,29,21,0.04)] sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#1A1612] sm:text-xl">
                Mốc thưởng doanh số
              </h2>
              <div className="mt-1 text-xs text-[#7D715E] sm:text-sm">
                Xếp theo doanh số tối thiểu từ thấp đến cao
              </div>
            </div>
            {!isReadOnlyAdmin && (
              <button
                type="button"
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
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#C59B58] bg-[#C59B58] px-4 text-sm font-bold text-[#231D15] shadow-sm transition hover:bg-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40 sm:self-auto"
              >
                <Plus size={17} /> Thêm mốc
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] px-4 py-12 text-center text-sm text-[#7D715E]">Đang tải danh sách mốc thưởng...</div>
          ) : rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] px-5 py-12 text-center">
              <Award size={38} className="mx-auto mb-3 text-[#C59B58]" />
              <p className="m-0 text-base font-bold text-[#1A1612]">Chưa có mốc thưởng nào</p>
              <p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-relaxed text-[#7D715E]">
                Tạo mốc đầu tiên để kích thích các CTV/KOL đẩy mạnh doanh số bán hàng trong tháng.
              </p>
              {!isReadOnlyAdmin && (
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C59B58] bg-[#C59B58] px-4 text-sm font-bold text-[#231D15] transition hover:bg-[#B88E4F]"
                >
                  <Plus size={16} /> Tạo mốc ngay
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border p-3.5 shadow-[0_2px_10px_rgba(35,29,21,0.035)] transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 ${rule.isActive ? 'border-[#EAE4D7] bg-white' : 'border-[#ECE1CD] bg-[#FAF8F5] opacity-80'}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-sm font-extrabold text-[#8A642C] sm:h-11 sm:w-11">
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="m-0 min-w-0 break-words text-base font-bold leading-snug text-[#1A1612] sm:text-lg">
                        {rule.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${rule.isActive ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]' : 'border-[#EAE4D7] bg-[#F3EFE6] text-[#7D715E]'}`}>
                        {rule.isActive ? 'Đang áp dụng' : 'Tạm ngừng'}
                        </span>
                        <span className="whitespace-nowrap rounded-full border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 text-[10px] font-semibold text-[#7D715E] sm:text-[11px]">
                        v{rule.version}
                        </span>
                        <span className="whitespace-nowrap rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-bold text-[#8A642C] sm:text-[11px]">
                        Vượt: +{rule.bonusPercentage}%
                        </span>
                      </div>
                    </div>

                    {rule.description && (
                      <p className="mb-0 mt-2 text-xs leading-relaxed text-[#7D715E] sm:text-sm">
                        {rule.description}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[#F0EAE0] pt-3 sm:grid-cols-2 sm:gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7D715E]">Doanh số đạt KPI từ</div>
                        <div className="mt-0.5 break-words text-sm font-bold text-[#8A642C]">{formatVND(rule.minMonthlyRevenue)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7D715E]">Thưởng cố định đạt KPI</div>
                        <div className="mt-0.5 break-words text-sm font-bold text-[#8A642C]">{formatVND(rule.achievementBonus)}</div>
                      </div>
                    </div>
                  </div>

                  {!isReadOnlyAdmin ? (
                    <div className="col-span-2 flex items-center justify-end gap-1.5 border-t border-[#F0EAE0] pt-2.5 sm:col-span-1 sm:row-span-2 sm:border-0 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(rule)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C] transition hover:bg-[#F3EFE6]"
                        title={rule.isActive ? 'Tạm ngừng mốc' : 'Kích hoạt mốc'}
                      >
                        {rule.isActive ? <ToggleRight size={21} /> : <ToggleLeft size={21} />}
                      </button>

                      <button
                        type="button"
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
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#8A642C]"
                        title="Chỉnh sửa mốc"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingRule(rule)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                        title="Xóa mềm mốc"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="col-span-2 self-center text-right text-xs italic text-[#7D715E] sm:col-span-1 sm:row-span-2">
                      Chỉ đọc
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>


        <div className="flex min-w-0 flex-col gap-4">

          <section className="min-w-0 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_4px_18px_rgba(35,29,21,0.04)] sm:p-5 lg:p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-[#F0EAE0] pb-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Calculator size={19} /></span>
              <div className="min-w-0">
                <h2 className="m-0 text-base font-extrabold tracking-tight text-[#1A1612] sm:text-lg">Mô phỏng thưởng lũy tiến</h2>
                <p className="m-0 mt-1 text-xs text-[#7D715E]">Nhập doanh số để xem mức thưởng dự kiến</p>
              </div>
              {simLoading && <span className="ml-auto shrink-0 text-xs font-medium text-[#7D715E]">Đang tính...</span>}
            </div>

            <div className="mb-3">
              <label htmlFor={simRevenueInputId} className="mb-1.5 block text-xs font-semibold text-[#5F5547] sm:text-sm">
                Doanh số hợp lệ tháng của CTV (₫)
              </label>
              <input
                id={simRevenueInputId}
                type="number"
                value={simRevenue}
                onChange={(e) => setSimRevenue(e.target.value)}
                placeholder="120000000"
                className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 text-base font-bold text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
              />
            </div>

            {simResult && (
              <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5">
                    <span className="block text-[11px] text-[#7D715E]">Mốc cao nhất đạt</span>
                    <span className="mt-1 block truncate text-sm font-bold text-[#8A642C]" title={simResult.highestReachedRule?.name || 'Chưa đạt KPI'}>
                      {simResult.highestReachedRule ? simResult.highestReachedRule.name : 'Chưa đạt KPI'}
                    </span>
                  </div>
                  <div className="min-w-0 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2.5">
                    <span className="block text-[11px] text-[#7D715E]">Tổng tiền thưởng</span>
                    <span className="mt-1 block truncate text-sm font-extrabold text-[#8A642C]" title={formatVND(simResult.totalBonus)}>
                      {formatVND(simResult.totalBonus)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-xs">
                  <span className="text-[#7D715E]">Thưởng cố định đạt KPI</span>
                  <span className="shrink-0 font-bold text-[#8A642C]">{formatVND(simResult.achievementBonus)}</span>
                </div>

                {simResult.rangeBonuses.length > 0 && (
                  <details className="mt-2 rounded-xl border border-[#EAE4D7] bg-white">
                    <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-[#5F5547] marker:text-[#B88E4F]">
                      Xem chi tiết phần vượt ({simResult.rangeBonuses.length} khoảng)
                    </summary>
                    <div className="grid gap-1.5 border-t border-[#F0EAE0] px-3 py-2.5">
                      {simResult.rangeBonuses.map((item, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs">
                          <span className="min-w-0 text-[#1A1612]">Khoảng {Number(item.from) / 1000000}tr - {Number(item.to) / 1000000}tr ({item.rate}%)</span>
                          <span className="font-bold text-[#8A642C]">+{formatVND(item.bonus)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <details className="mt-2 rounded-xl border border-[#EAE4D7] bg-white">
                  <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-[#5F5547] marker:text-[#B88E4F]">Cách tính khoản thưởng</summary>
                  <p className="m-0 break-words border-t border-[#F0EAE0] px-3 py-2.5 text-xs leading-relaxed text-[#7D715E]">{simResult.formula}</p>
                </details>
              </div>
            )}
          </section>


          <section className="min-w-0 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_4px_18px_rgba(35,29,21,0.04)] sm:p-5 lg:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-[#F0EAE0] pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><History size={19} /></span>
              <div>
                <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#1A1612] sm:text-xl">Chốt thưởng tháng</h2>
                <p className="m-0 mt-1 text-xs text-[#7D715E]">Chọn kỳ và đối tác để ghi nhận thưởng</p>
              </div>
            </div>


            <div className="mb-4">
              <label htmlFor={settleMonthInputId} className="mb-2 block text-xs font-semibold text-[#5F5547] sm:text-sm">
                Kỳ chốt thưởng tháng
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Select
                    id={settleMonthInputId}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full text-base font-semibold"
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
                  </Select>
                </div>

                <div>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Năm (VD: 2026)"
                    className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 text-sm font-semibold text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-[#7D715E]">
                Đang chọn <strong className="text-[#8A642C]">Tháng {selectedMonth}/{selectedYear}</strong> <span className="text-[#A99D8A]">· Kỳ hệ thống: <code className="rounded bg-[#FAF8F5] px-1.5 py-0.5">{settleYearMonth}</code></span>
              </div>
            </div>


            <div className="mb-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={settleKolInputId} className="text-xs font-semibold text-[#5F5547] sm:text-sm">
                  Cộng tác viên / KOL nhận thưởng
                </label>
                {settleKolId ? (
                  <span className="rounded-full bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-bold text-[#8A642C]">
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
                className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 text-sm font-medium text-[#1A1612] outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
              />
              {import.meta.env.DEV && (
                <div style={{ display: 'flex', gap: 10, marginTop: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#7D715E' }}>[Dev] Gợi ý:</span>
                  <button
                    type="button"
                    onClick={() => setSettleKolId('237a7208-1c74-4322-96b2-51d810660723')}
                    style={{
                      background: settleKolId === '237a7208-1c74-4322-96b2-51d810660723' ? '#EFE2CC' : '#FAF8F5',
                      border: '1px solid #DEBE85',
                      borderRadius: 7,
                      padding: '4px 12px',
                      fontSize: 13,
                      color: '#7D715E',
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
                        color: '#7D715E',
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
                type="button"
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#C59B58] bg-[#C59B58] px-4 text-sm font-bold text-[#231D15] shadow-sm transition hover:bg-[#B88E4F] disabled:cursor-wait disabled:opacity-60"
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
              <div className="mt-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 text-sm text-[#8A642C]">
                <div className="font-bold">{settleResult.message}</div>
                <div className="mt-1 text-xs font-medium text-[#1A1612]">
                  Doanh số hợp lệ: {formatVND(settleResult.settlement.validRevenue)} | Thưởng: {formatVND(settleResult.settlement.bonusAmount)}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>


      <section className="min-w-0 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_4px_18px_rgba(35,29,21,0.04)] sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-[#F0EAE0] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#1A1612] sm:text-xl">Lịch sử chốt thưởng</h2>
            <p className="m-0 mt-1 text-xs text-[#7D715E]">{historyList.length} lượt chốt · Tháng {selectedMonth}/{selectedYear}</p>
          </div>
          <button
            type="button"
            onClick={() => loadHistory()}
            className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 text-xs font-semibold text-[#5F5547] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] sm:self-auto"
          >
            <RefreshCw size={15} /> Tải lại
          </button>
        </div>

        {historyLoading ? (
          <div className="rounded-xl bg-[#FAF8F5] px-4 py-10 text-center text-sm text-[#7D715E]">Đang tải lịch sử...</div>
        ) : historyList.length === 0 ? (
          <div className="rounded-xl bg-[#FAF8F5] px-4 py-10 text-center text-sm text-[#7D715E]">
            Chưa có lượt chốt thưởng nào cho kỳ Tháng {selectedMonth}/{selectedYear}.
          </div>
        ) : (
          <div data-scrollable-x="true" className="overflow-x-auto rounded-xl border border-[#EAE4D7]">
            <table className="w-full min-w-[1120px] border-collapse text-left text-xs text-[#1A1612]">
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#F3EFE6] text-[10px] font-bold uppercase tracking-wide text-[#5F5547]">
                  <th className="px-3.5 py-3">Kỳ tháng</th>
                  <th className="px-3.5 py-3">Cộng tác viên</th>
                  <th className="px-3.5 py-3">Doanh số hợp lệ</th>
                  <th className="px-3.5 py-3">Mốc đạt</th>
                  <th className="px-3.5 py-3">Số tiền thưởng</th>
                  <th className="px-3.5 py-3">Chi tiết snapshot</th>
                  <th className="px-3.5 py-3">Trạng thái</th>
                  <th className="px-3.5 py-3">Thao tác</th>
                  <th className="px-3.5 py-3">Thời gian chốt</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item) => (
                  <tr key={item.id} className="border-b border-[#F0EAE0] last:border-b-0 hover:bg-[#FBF5EB]/50">
                    <td className="px-3.5 py-3.5">
                      <span className="font-bold text-[#8A642C]">
                        Tháng {item.yearMonth.split('-')[1]}/{item.yearMonth.split('-')[0]}
                      </span>
                      <div className="mt-1 text-[10px] text-[#7D715E]">Kỳ: {item.yearMonth}</div>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <div className="font-semibold">{item.collaboratorName}</div>
                      <div className="mt-1 text-[10px] text-[#7D715E]">{item.collaboratorEmail}</div>
                    </td>
                    <td className="px-3.5 py-3.5 font-semibold">{formatVND(item.validRevenue)}</td>
                    <td className="px-3.5 py-3.5 font-semibold text-[#8A642C]">{item.appliedRuleName}</td>
                    <td className="px-3.5 py-3.5 font-bold text-[#8A642C]">{formatVND(item.bonusAmount)}</td>
                    <td className="px-3.5 py-3.5 text-[11px] text-[#7D715E]">
                      {item.ruleSnapshot?.formula || 'Đã lưu snapshot đầy đủ'}
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: item.status === 'PAID' ? '#FBF5EB' : item.status === 'APPROVED' ? '#ECE1CD' : '#FBF5EB',
                        color: item.status === 'PAID' ? '#B88E4F' : item.status === 'APPROVED' ? '#B88E4F' : '#B88E4F',
                        border: item.status === 'PAID' ? '1px solid #EAE4D7' : item.status === 'APPROVED' ? '1px solid #DEBE85' : '1px solid #C59B58',
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5">
                      {isReadOnlyAdmin ? (
                        item.status === 'PAID' ? (
                          <span style={{ color: '#B88E4F', fontWeight: 700 }}>Đã vào ví</span>
                        ) : (
                          <span style={{ color: '#7D715E', fontSize: 12, fontStyle: 'italic' }}>Chỉ xem (Admin)</span>
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
                                background: '#ECE1CD',
                                color: '#B88E4F',
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
                                border: '1px solid #EAE4D7',
                                borderRadius: 8,
                                padding: '7px 14px',
                                background: '#FBF5EB',
                                color: '#B88E4F',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Chi trả
                            </button>
                          )}
                          {item.status === 'PAID' && <span style={{ color: '#B88E4F', fontWeight: 700 }}>Đã vào ví</span>}
                        </>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5 text-[11px] text-[#7D715E]">
                      {new Date(item.settledAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>


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
            border: '1.5px solid #EAE4D7',
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
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#1A1612' }}>Thêm Mốc Thưởng Doanh Số</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #EAE4D7',
                  borderRadius: 8,
                  color: '#7D715E',
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
                <label htmlFor={ruleNameInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Tên mốc thưởng *</label>
                <input
                  id={ruleNameInputId}
                  type="text"
                  required
                  maxLength={150}
                  placeholder="Ví dụ: Mốc Bạc (>= 50 Triệu)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor={ruleDescInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Mô tả chính sách</label>
                <input
                  id={ruleDescInputId}
                  type="text"
                  maxLength={500}
                  placeholder="Mô tả quyền lợi hoặc điều kiện áp dụng"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label htmlFor={ruleRevenueInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Doanh số tối thiểu (VND) *</label>
                  <input
                    id={ruleRevenueInputId}
                    type="number"
                    required
                    placeholder="50000000"
                    value={formData.minMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, minMonthlyRevenue: e.target.value })}
                    style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>

                <div>
                  <label htmlFor={ruleAchieveInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Thưởng đạt KPI (VND)</label>
                  <input
                    id={ruleAchieveInputId}
                    type="number"
                    placeholder="500000"
                    value={formData.achievementBonus}
                    onChange={(e) => setFormData({ ...formData, achievementBonus: e.target.value })}
                    style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor={ruleBonusInputId} style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Tỷ lệ thưởng phần vượt (%) *</label>
                <input
                  id={ruleBonusInputId}
                  type="number"
                  step="0.01"
                  required
                  placeholder="2.00"
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
                <div style={{ fontSize: 12.5, color: '#7D715E', marginTop: 6, lineHeight: 1.45 }}>
                  Công thức: Đạt KPI thưởng cố định + phần vượt mốc tính theo tỷ lệ này.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{ background: '#F6EFE3', border: '1px solid #EAE4D7', color: '#7D715E', borderRadius: 10, padding: '12px 24px', fontWeight: 650, cursor: 'pointer', fontSize: 14.5 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #DEBE85 0%, #DEBE85 100%)', border: '1px solid #DEBE85', color: '#1A1612', borderRadius: 10, padding: '12px 28px', fontWeight: 750, cursor: 'pointer', boxShadow: '0 3px 10px rgba(201, 163, 99, 0.3)', fontSize: 14.5 }}
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
            border: '1.5px solid #EAE4D7',
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
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#1A1612' }}>Chỉnh Sửa Mốc Thưởng (v{editingRule.version})</h3>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #EAE4D7',
                  borderRadius: 8,
                  color: '#7D715E',
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
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Tên mốc thưởng *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Mô tả chính sách</label>
                <input
                  type="text"
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Doanh số tối thiểu (VND) *</label>
                  <input
                    type="number"
                    required
                    value={formData.minMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, minMonthlyRevenue: e.target.value })}
                    style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Thưởng đạt KPI (VND)</label>
                  <input
                    type="number"
                    value={formData.achievementBonus}
                    onChange={(e) => setFormData({ ...formData, achievementBonus: e.target.value })}
                    style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 650, color: '#7D715E', marginBottom: 6 }}>Tỷ lệ thưởng phần vượt (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
                  style={{ width: '100%', background: '#FAF8F5', border: '1.5px solid #EAE4D7', borderRadius: 10, padding: '12px 15px', color: '#1A1612', boxSizing: 'border-box', fontSize: 14.5, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#EBD08C', cursor: 'pointer' }}
                />
                <label htmlFor="editIsActive" style={{ fontSize: 14, color: '#1A1612', cursor: 'pointer', fontWeight: 650 }}>
                  Kích hoạt áp dụng mốc thưởng này ngay
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  style={{ background: '#F6EFE3', border: '1px solid #EAE4D7', color: '#7D715E', borderRadius: 10, padding: '12px 24px', fontWeight: 650, cursor: 'pointer', fontSize: 14.5 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #DEBE85 0%, #DEBE85 100%)', border: '1px solid #DEBE85', color: '#1A1612', borderRadius: 10, padding: '12px 30px', fontWeight: 750, cursor: 'pointer', boxShadow: '0 3px 12px rgba(201, 163, 99, 0.32)', fontSize: 14.5 }}
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
            border: '1.5px solid #DC2626',
            borderRadius: 20,
            padding: '28px 34px',
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 24px 60px -10px rgba(184, 58, 66, 0.25)',
            margin: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ background: '#FEE2E2', padding: 12, borderRadius: 12, color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19.5, fontWeight: 750, color: '#1A1612' }}>Xác Nhận Xóa Mốc Thưởng</h3>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: 14.5, color: '#7D715E', lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn xóa mốc <strong style={{ color: '#1A1612' }}>"{deletingRule.name}"</strong>?
              Hệ thống sẽ thực hiện <strong>xóa mềm</strong> để bảo toàn toàn bộ dữ liệu lịch sử đối soát thưởng các tháng trước.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setDeletingRule(null)}
                style={{ background: '#F6EFE3', border: '1px solid #EAE4D7', color: '#7D715E', borderRadius: 10, padding: '10px 20px', fontWeight: 650, cursor: 'pointer', fontSize: 14 }}
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
