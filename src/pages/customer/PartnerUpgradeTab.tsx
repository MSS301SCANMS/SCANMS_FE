import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  ArrowRight,
  Clock3,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
} from 'lucide-react';
import {
  kycService,
  ShopApplicationSaveError,
  type UpgradeStatusResponse,
  type ApplyKolData,
  type ApplyShopData,
} from '../../services/kyc.service';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';

import { KolUpgradeForm, ShopUpgradeForm } from './PartnerUpgradeForms';
import ShopApplicationStatusCard from '../merchant/ShopApplicationStatusCard';
import KolApplicationStatusCard from './KolApplicationStatusCard';

const createEmptyKolForm = (): ApplyKolData => ({
  platform: '' as ApplyKolData['platform'],
  channelName: '',
  channelUrl: '',
  followerCount: '' as unknown as number,
  channelProofUrl: '',
  idCardNumber: '',
  taxCode: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  bio: '',
  frontCardUrl: '',
  backCardUrl: '',
});

const createEmptyShopForm = (): ApplyShopData => ({
  shopName: '',
  description: '',
  warehouseAddress: '',
  businessType: '' as ApplyShopData['businessType'],
  taxCode: '',
  businessLicenseUrl: '',
  brandAuthorizationUrl: '',
  contactPhone: '',
  contactEmail: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  idCardNumber: '',
  frontCardUrl: '',
  backCardUrl: '',
});

function ApplicationBadge({ status }: { status?: string | null }) {
  const verified = status === 'VERIFIED';
  const rejected = status === 'REJECTED';
  const empty = !status || status === 'DRAFT';
  const Icon = verified ? CheckCircle2 : rejected ? CircleAlert : Clock3;
  const label = verified
    ? 'Đã xác minh'
    : rejected
      ? 'Cần nộp lại'
      : status === 'NEEDS_INFO'
        ? 'Cần bổ sung'
        : status === 'DRAFT'
          ? 'Bản nháp'
          : status
            ? 'Chờ xét duyệt'
            : 'Chưa đăng ký';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${
        empty
          ? 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E]'
          : rejected
            ? 'bg-white border-[#F5D8D4] text-[#DC2626]'
            : verified
              ? 'bg-[#FBF5EB] border-[#EEDFC6] text-[#059669]'
              : 'bg-[#FBF5EB] border-[#EEDFC6] text-[#8F682E]'
      }`}
    >
      {!empty && <Icon size={12} />}
      {label}
    </span>
  );
}

export const PartnerUpgradeTab: React.FC<{
  workspace?: 'customer' | 'shop';
  onOpenShop?: () => void;
}> = ({ workspace = 'customer', onOpenShop }) => {
  const isShopWorkspace = workspace === 'shop';
  const navigate = useNavigate();
  const location = useLocation();
  const [activePartnerType, setActivePartnerType] = useState<'kol' | 'shop'>(
    isShopWorkspace || location.pathname.endsWith('/upgrade/shop') ? 'shop' : 'kol',
  );
  const [statusData, setStatusData] = useState<UpgradeStatusResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPendingShop, setEditingPendingShop] = useState(false);
  const [editingKol, setEditingKol] = useState(false);

  const [kolForm, setKolForm] = useState(createEmptyKolForm);
  const [shopForm, setShopForm] = useState(createEmptyShopForm);

  useEffect(() => {
    setKolForm(createEmptyKolForm());
    setShopForm(createEmptyShopForm());
    setEditingPendingShop(false);
    setEditingKol(false);
    if (isShopWorkspace || location.pathname.endsWith('/upgrade/shop'))
      setActivePartnerType('shop');
    if (location.pathname.endsWith('/upgrade/kol')) setActivePartnerType('kol');
  }, [location.pathname, isShopWorkspace]);

  useEffect(() => {
    const clearRestoredForm = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setKolForm(createEmptyKolForm());
      setShopForm(createEmptyShopForm());
    };
    window.addEventListener('pageshow', clearRestoredForm);
    return () => window.removeEventListener('pageshow', clearRestoredForm);
  }, []);

  const selectPartnerType = (type: 'kol' | 'shop') => {
    if (type === activePartnerType) return;
    if (type === 'kol') setKolForm(createEmptyKolForm());
    else setShopForm(createEmptyShopForm());
    setActivePartnerType(type);
  };

  const loadStatus = async () => {
    setLoading(true);
    setStatusError('');
    try {
      const data = await kycService.getMyUpgradeStatus();
      setStatusData(data);
    } catch (err: any) {
      setStatusError(err?.message || 'Không tải được trạng thái hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleKolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!kolForm.platform) {
      toast.error('Vui lòng chọn nền tảng mạng xã hội chính');
      return;
    }
    if (!kolForm.channelUrl?.trim()) {
      toast.error('Vui lòng nhập đường link kênh mạng xã hội');
      return;
    }
    if (!kolForm.idCardNumber?.trim() || kolForm.idCardNumber.length < 9) {
      toast.error('Vui lòng nhập số CCCD/CMND hợp lệ');
      return;
    }
    if (!kolForm.frontCardUrl?.trim() || !kolForm.backCardUrl?.trim()) {
      toast.error('Vui lòng tải lên đầy đủ ảnh CCCD mặt trước và mặt sau');
      return;
    }
    if (!kolForm.bankName?.trim()) {
      toast.error('Vui lòng chọn ngân hàng thụ hưởng');
      return;
    }
    if (!kolForm.bankAccountNumber?.trim() || !kolForm.bankAccountName?.trim()) {
      toast.error(
        'Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng để nhận hoa hồng',
      );
      return;
    }

    setSubmitting(true);
    try {
      await kycService.applyKolUpgrade(kolForm);
      setEditingKol(false);
      toast.success(
        'Đã lưu đầy đủ hồ sơ KOL và giấy tờ. Ban quản trị sẽ xét duyệt hồ sơ của bạn.',
      );
      loadStatus();
      authService.getMe();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Không thể gửi hồ sơ, vui lòng thử lại',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!shopForm.businessType) {
      toast.error('Vui lòng chọn hình thức kinh doanh');
      return;
    }
    if (!shopForm.shopName.trim()) {
      toast.error('Vui lòng nhập tên gian hàng');
      return;
    }
    if (!shopForm.warehouseAddress.trim()) {
      toast.error(
        'Địa chỉ kho xuất hàng là bắt buộc theo Nghị định 85/2021/NĐ-CP',
      );
      return;
    }
    if (!shopForm.taxCode.trim()) {
      toast.error(
        'Vui lòng nhập mã số thuế doanh nghiệp / hộ kinh doanh / cá nhân',
      );
      return;
    }
    if (!shopForm.contactPhone.trim()) {
      toast.error('Vui lòng nhập số hotline hỗ trợ khách hàng');
      return;
    }
    if (!shopForm.contactEmail.trim()) {
      toast.error('Vui lòng nhập email đối soát thanh toán');
      return;
    }
    if (
      !shopForm.idCardNumber?.trim() ||
      !/^\d{9,12}$/.test(shopForm.idCardNumber)
    ) {
      toast.error('Vui lòng nhập số CCCD người đại diện hợp lệ (9 - 12 số)');
      return;
    }
    if (!shopForm.frontCardUrl || !shopForm.backCardUrl) {
      toast.error(
        'Vui lòng tải lên ảnh CCCD mặt trước và mặt sau của người đại diện',
      );
      return;
    }
    if (!shopForm.businessLicenseUrl) {
      toast.error('Vui lòng tải lên giấy phép đăng ký kinh doanh');
      return;
    }
    if (!shopForm.bankName?.trim()) {
      toast.error('Vui lòng chọn ngân hàng nhận tiền doanh thu bán hàng');
      return;
    }
    if (
      !shopForm.bankAccountNumber?.trim() ||
      !shopForm.bankAccountName?.trim()
    ) {
      toast.error(
        'Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản nhận doanh thu',
      );
      return;
    }

    setSubmitting(true);
    try {
      const application = await kycService.applyShopUpgrade(shopForm,
        editingPendingShop ? statusData?.shopApplication?.id : undefined);
      setEditingPendingShop(false);
      setStatusData(current => ({
        userRole: current?.userRole || 'USER',
        kolApplication: current?.kolApplication || null,
        shopApplication: {
          ...application,
          submittedAt: application.onboardingSubmittedAt || '',
          updatedAt: application.updatedAt || '',
        },
      }));
      toast.success(
        editingPendingShop ? 'Đã lưu cập nhật hồ sơ và giấy tờ. Ban quản trị sẽ xét duyệt hồ sơ của bạn.' : 'Đã lưu đầy đủ hồ sơ mở gian hàng và giấy tờ. Ban quản trị sẽ xét duyệt hồ sơ của bạn.',
      );
      void loadStatus();
    } catch (err: any) {
      if (err instanceof ShopApplicationSaveError) {
        // The record exists even if the old server discarded its details; retry by updating its ID.
        setStatusData(current => ({
          userRole: current?.userRole || 'USER',
          kolApplication: current?.kolApplication || null,
          shopApplication: {
            ...err.application,
            submittedAt: err.application.onboardingSubmittedAt || '',
            updatedAt: err.application.updatedAt || '',
          },
        }));
        setEditingPendingShop(true);
      }
      toast.error(
        err?.response?.data?.message ||
            err?.message ||
          'Không thể gửi hồ sơ gian hàng, vui lòng thử lại',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openKolWorkspace = async () => {
    try {
      await authService.enterKolWorkspace(navigate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Chưa thể mở không gian KOL. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-[16px] text-left min-w-0 text-[#1A1612] max-[640px]:gap-[12px]">
        <div className="border border-[#EAE4D7] rounded-[18px] bg-white p-[30px_22px] grid gap-[14px] justify-items-start">
          <RefreshCw className="h-5 w-5 animate-spin text-[#B88E4F]" />
          <p className="m-0 text-[13px] text-[#7D715E] leading-[1.7]">Đang tải hồ sơ đối tác…</p>
        </div>
      </div>
    );
  }

  if (statusError) return (
    <div role="alert" className="grid justify-items-start gap-3 rounded-2xl border border-[#EEDFC6] bg-white p-5 text-sm text-[#7D715E]">
      <p>{statusError}</p>
      <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2 font-semibold text-[#795A2D]">Thử tải lại</button>
    </div>
  );

  const kolApp = statusData?.kolApplication;
  const shopApp = statusData?.shopApplication;
  const shopStatus =
    shopApp?.onboardingStatus ||
    (shopApp?.isVerified ? 'VERIFIED' : shopApp ? 'PENDING_APPROVAL' : null);
  const canSubmitShopApplication =
    !shopStatus || ['DRAFT', 'NEEDS_INFO', 'REJECTED'].includes(shopStatus);
  const choices = [
    {
      type: 'kol' as const,
      title: 'Đối tác KOL',
      icon: Sparkles,
      status: kolApp?.status,
      description:
        kolApp?.status === 'VERIFIED'
          ? 'Tạo liên kết tiếp thị, theo dõi hoa hồng và kết nối với các gian hàng.'
          : kolApp?.status === 'UNVERIFIED'
            ? 'Hồ sơ đã gửi đang được xem xét. Điền thông tin nếu cần cập nhật hồ sơ.'
            : kolApp?.status === 'REJECTED'
              ? 'Kiểm tra ghi chú xét duyệt, bổ sung thông tin và gửi lại hồ sơ.'
              : 'Giới thiệu sản phẩm từ các gian hàng và nhận hoa hồng tiếp thị liên kết.',
      action: kolApp ? 'Cập nhật hồ sơ KOL' : 'Đăng ký KOL',
    },
    {
      type: 'shop' as const,
      title: 'Mở gian hàng',
      icon: Store,
      status: shopStatus,
      description:
        shopStatus === 'VERIFIED'
          ? 'Quản lý sản phẩm, đơn hàng và hợp tác cùng KOL trên SCANMS.'
          : shopStatus === 'NEEDS_INFO' || shopStatus === 'REJECTED'
            ? 'Bổ sung thông tin theo ghi chú xét duyệt và gửi lại hồ sơ gian hàng.'
            : shopStatus === 'PENDING_APPROVAL'
              ? 'Hồ sơ đang chờ xét duyệt. Bạn sẽ nhận thông báo khi có kết quả.'
              : 'Kinh doanh sản phẩm và kết nối với mạng lưới nhà sáng tạo trên SCANMS.',
      action: shopApp ? 'Trạng thái hồ sơ gian hàng' : 'Đăng ký gian hàng',
    },
  ];

  return (
    <div className={`grid gap-[16px] text-left min-w-0 text-[#1A1612] max-[640px]:gap-[12px] ${isShopWorkspace ? '' : 'max-[767px]:pb-[64px]'}`}>
      {!isShopWorkspace && <div className="grid grid-cols-2 gap-[14px] max-[640px]:grid-cols-1 max-[640px]:gap-[10px]" aria-label="Chọn loại đối tác">
        {choices.map((choice) => (
          <article
            key={choice.type}
            className={`flex flex-col p-[18px] border rounded-[16px] bg-white transition-[border-color] duration-150 min-w-0 max-[640px]:p-[15px] ${activePartnerType === choice.type ? 'border-[#C59B58] shadow-[0_0_0_1px_#EEDFC6]' : 'border-[#EAE4D7] hover:border-[#EEDFC6]'}`}
          >
            <button
              type="button"
              className="flex w-full items-start gap-[12px] text-left cursor-pointer bg-transparent border-0 p-0"
              aria-pressed={activePartnerType === choice.type}
              onClick={() => selectPartnerType(choice.type)}
            >
              <span className="w-[40px] h-[40px] border border-[#EEDFC6] rounded-[12px] bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
                <choice.icon size={19} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-[10px] flex-wrap">
                  <strong className="text-[15px] font-[650] leading-[1.5] text-[#1A1612]">{choice.title}</strong>
                  <ApplicationBadge status={choice.status} />
                </span>
                <span className="block mt-[6px] text-[12px] text-[#7D715E] leading-[1.65] min-h-[40px] max-[640px]:min-h-0">
                  {choice.description}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={`flex items-center justify-between w-full mt-[14px] rounded-[10px] border p-[9px_12px] text-[12px] font-[600] cursor-pointer transition ${activePartnerType === choice.type ? 'text-[#8F682E] bg-[#FBF5EB] border-[#EEDFC6]' : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:border-[#C59B58]'}`}
              onClick={() =>
                choice.status === 'VERIFIED'
                  ? choice.type === 'kol'
                    ? void openKolWorkspace()
                    : authService.switchWorkspace(choice.type, navigate)
                  : selectPartnerType(choice.type)
              }
            >
              {choice.status === 'VERIFIED'
                ? choice.type === 'kol'
                  ? 'Vào không gian KOL'
                  : 'Vào quản lý gian hàng'
                : activePartnerType === choice.type
                  ? 'Đang chọn hồ sơ này'
                  : choice.action}
              {activePartnerType === choice.type &&
              choice.status !== 'VERIFIED' ? (
                <CheckCircle2 size={15} />
              ) : (
                <ArrowRight size={15} />
              )}
            </button>
          </article>
        ))}
      </div>}

      {activePartnerType === 'kol' && kolApp && !editingKol ? (
        <KolApplicationStatusCard application={kolApp} onRefresh={() => void loadStatus()} onEdit={() => {
          setKolForm({ ...createEmptyKolForm(), ...kolApp.applicationData });
          setEditingKol(true);
        }} onOpen={() => void openKolWorkspace()} />
      ) : activePartnerType === 'kol' && (
        <KolUpgradeForm
          form={kolForm}
          setForm={setKolForm}
          onSubmit={handleKolSubmit}
          submitting={submitting}
          rejectionReason={
            kolApp?.status === 'REJECTED'
              ? kolApp.socialLinksJson?.rejectionReason
              : undefined
          }
        />
      )}
      {activePartnerType === 'shop' &&
        (canSubmitShopApplication || editingPendingShop ? (
          <ShopUpgradeForm
            form={shopForm}
            setForm={setShopForm}
            onSubmit={handleShopSubmit}
            submitting={submitting}
            reviewNote={
              shopStatus === 'NEEDS_INFO' || shopStatus === 'REJECTED'
                ? shopApp?.onboardingReviewNote
                : undefined
            }
          />
        ) : isShopWorkspace && shopApp ? (
          <ShopApplicationStatusCard application={shopApp}
            onEdit={() => {
              setShopForm({ ...createEmptyShopForm(), ...shopApp.onboardingData, shopName: shopApp.name || '', description: shopApp.description || '' });
              setEditingPendingShop(true);
            }}
            onRefresh={() => void loadStatus()}
            onOpenShop={onOpenShop || (() => authService.switchWorkspace('shop', navigate))}
          />
        ) : (
          <section className="p-[30px_22px] grid gap-[14px] justify-items-start border border-[#EAE4D7] rounded-[18px] bg-white shadow-xs">
            <span className="w-[40px] h-[40px] border border-[#EEDFC6] rounded-[12px] bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
              {shopStatus === 'VERIFIED' ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
            </span>
            <h3 className="m-0 text-[18px] font-[650] text-[#1A1612]">
              {shopStatus === 'VERIFIED'
                ? 'Gian hàng đã được xác minh'
                : 'Hồ sơ đang chờ xét duyệt'}
            </h3>
            <p className="m-0 text-[13px] text-[#7D715E] leading-[1.7] max-w-[680px]">
              {shopStatus === 'VERIFIED'
                ? 'Gian hàng đã được kích hoạt. Bạn có thể vào không gian quản lý để đăng sản phẩm và hợp tác cùng KOL.'
                : 'SCANMS đang kiểm tra hồ sơ của bạn. Kết quả hoặc yêu cầu bổ sung sẽ được gửi qua thông báo.'}
            </p>
            {shopStatus === 'PENDING_APPROVAL' && (
              <>
              {Object.keys(shopApp?.onboardingData || {}).length === 0 && (
                <div role="alert" className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <CircleAlert size={20} className="mt-0.5 shrink-0" />
                  <div><strong>Hồ sơ trên máy chủ chưa có thông tin chi tiết và giấy tờ.</strong><p className="mt-1">Manager hiện chỉ thấy tên gian hàng. Chọn “Bổ sung thông tin hồ sơ” để gửi cập nhật vào hồ sơ này.</p></div>
                </div>
              )}
              <button type="button" className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2.5 text-xs font-semibold text-[#795A2D]" onClick={() => {
                setShopForm({ ...createEmptyShopForm(), ...shopApp?.onboardingData, shopName: shopApp?.name || '', description: shopApp?.description || '' });
                setEditingPendingShop(true);
              }}>Bổ sung thông tin hồ sơ</button>
              </>
            )}
            {shopApp?.onboardingReviewNote && shopStatus !== 'VERIFIED' && (
              <div className="flex items-start gap-[10px] border border-[#EEDFC6] rounded-[12px] p-[12px_14px] bg-[#FBF5EB] text-[12px] text-[#7D715E] leading-[1.7] w-full">
                <CircleAlert size={17} className="text-[#B88E4F] shrink-0 mt-[2px]" />
                <div>
                  <strong className="block text-[#8F682E] font-[600]">Ghi chú xét duyệt</strong>
                  {shopApp.onboardingReviewNote}
                </div>
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-[9px] bg-[#C59B58] hover:bg-[#B88E4F] text-white border border-[#C59B58] rounded-[11px] p-[11px_18px] text-[12px] font-[650] whitespace-nowrap cursor-pointer transition-[background] duration-150 shadow-xs max-[640px]:w-full"
              onClick={() =>
                shopStatus === 'VERIFIED'
                  ? onOpenShop ? onOpenShop() : authService.switchWorkspace('shop', navigate)
                  : void loadStatus()
              }
            >
              {shopStatus === 'VERIFIED' ? <ArrowRight size={15} /> : <RefreshCw size={15} />}
              {shopStatus === 'VERIFIED'
                ? 'Vào quản lý gian hàng'
                : 'Kiểm tra trạng thái'}
            </button>
          </section>
        ))}
    </div>
  );
};
