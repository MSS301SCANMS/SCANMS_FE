import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  Link as LinkIcon,
  Info,
  Building,
  UserCheck,
  Send,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { kycService, type UpgradeStatusResponse, type ApplyKolData, type ApplyShopData } from '../../services/kyc.service';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { BankSelectTrigger } from '../../components/bank/BankSelectTrigger';

export const PartnerUpgradeTab: React.FC = () => {
  const navigate = useNavigate();
  const [activePartnerType, setActivePartnerType] = useState<'kol' | 'shop'>('kol');
  const [statusData, setStatusData] = useState<UpgradeStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // KOL Form State
  const [kolForm, setKolForm] = useState<ApplyKolData>({
    platform: '' as any,
    channelName: '',
    channelUrl: '',
    followerCount: '' as any,
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

  // Shop Form State
  const [shopForm, setShopForm] = useState<ApplyShopData>({
    shopName: '',
    description: '',
    warehouseAddress: '',
    businessType: '' as any,
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

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await kycService.getMyUpgradeStatus();
      setStatusData(data);
      if (data.shopApplication) {
        const documents = data.shopApplication.onboardingData || ({} as Partial<ApplyShopData>);
        setShopForm({
          shopName: data.shopApplication.name,
          description: data.shopApplication.description || documents.description || '',
          warehouseAddress: data.shopApplication.warehouseAddress || '',
          businessType: documents.businessType || 'ENTERPRISE',
          taxCode: documents.taxCode || '',
          businessLicenseUrl: documents.businessLicenseUrl || '',
          brandAuthorizationUrl: documents.brandAuthorizationUrl || '',
          contactPhone: documents.contactPhone || '',
          contactEmail: documents.contactEmail || '',
          bankName: documents.bankName || '',
          bankAccountNumber: documents.bankAccountNumber || '',
          bankAccountName: documents.bankAccountName || '',
          idCardNumber: documents.idCardNumber || '',
          frontCardUrl: documents.frontCardUrl || '',
          backCardUrl: documents.backCardUrl || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load upgrade status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleKolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kolForm.platform) {
      toast.error('Vui lòng chọn nền tảng mạng xã hội chính');
      return;
    }
    if (!kolForm.channelUrl.trim()) {
      toast.error('Vui lòng nhập đường link kênh mạng xã hội');
      return;
    }
    if (!kolForm.idCardNumber.trim() || kolForm.idCardNumber.length < 9) {
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
    if (!kolForm.bankAccountNumber.trim() || !kolForm.bankAccountName.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng để nhận hoa hồng');
      return;
    }

    setSubmitting(true);
    try {
      await kycService.applyKolUpgrade(kolForm);
      toast.success('Gửi hồ sơ đăng ký KOL thành công! Ban Quản Trị SCANMS sẽ xét duyệt trong 24h.');
      loadStatus();
      authService.getMe();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể gửi hồ sơ, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.businessType) {
      toast.error('Vui lòng chọn hình thức kinh doanh');
      return;
    }
    if (!shopForm.shopName.trim()) {
      toast.error('Vui lòng nhập tên gian hàng');
      return;
    }
    if (!shopForm.warehouseAddress.trim()) {
      toast.error('Địa chỉ kho xuất hàng là bắt buộc theo Nghị định 85/2021/NĐ-CP');
      return;
    }
    if (!shopForm.taxCode.trim()) {
      toast.error('Vui lòng nhập mã số thuế doanh nghiệp / hộ kinh doanh / cá nhân');
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
    if (!shopForm.idCardNumber?.trim() || !/^\d{9,12}$/.test(shopForm.idCardNumber)) {
      toast.error('Vui lòng nhập số CCCD người đại diện hợp lệ (9 - 12 số)');
      return;
    }
    if (!shopForm.frontCardUrl || !shopForm.backCardUrl) {
      toast.error('Vui lòng tải lên ảnh CCCD mặt trước và mặt sau của người đại diện');
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
    if (!shopForm.bankAccountNumber?.trim() || !shopForm.bankAccountName?.trim()) {
      toast.error('Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản nhận doanh thu');
      return;
    }

    setSubmitting(true);
    try {
      await kycService.applyShopUpgrade(shopForm);
      toast.success('Gửi hồ sơ mở Gian Hàng thành công! Ban Quản Trị SCANMS sẽ thẩm định giấy phép.');
      loadStatus();
      authService.getMe();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể gửi hồ sơ gian hàng, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  // Nạp dữ liệu mẫu để test nhanh
  const fillSampleKolData = () => {
    setKolForm({
      platform: 'TIKTOK',
      channelName: 'Thành Thắng Lifestyle & Reviews',
      channelUrl: 'https://tiktok.com/@thang.review',
      followerCount: 52000,
      channelProofUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80',
      idCardNumber: '001201009876',
      taxCode: '8099887766',
      bankName: 'Techcombank',
      bankAccountNumber: '19034567890012',
      bankAccountName: 'NGUYEN THANH THANG',
      bio: 'Nhà sáng tạo nội dung chuyên nghiệp mảng mỹ phẩm hữu cơ, thời trang nam và lifestyle cao cấp.',
      frontCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      backCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    });
    toast.info('Đã nạp thông tin mẫu KOL chuẩn để kiểm thử');
  };

  const fillSampleShopData = () => {
    setShopForm({
      shopName: 'Sora Skin Beauty Flagship',
      description: 'Thương hiệu mỹ phẩm dưỡng da chiết xuất thiên nhiên đạt chuẩn cGMP và ISO 22716.',
      warehouseAddress: 'Tổng kho A2, Đường số 3, KCN Tân Bình, Phường Tây Thạnh, Quận Tân Phú, TP. Hồ Chí Minh',
      businessType: 'ENTERPRISE',
      taxCode: '0316789012',
      businessLicenseUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
      brandAuthorizationUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
      contactPhone: '0909123456',
      contactEmail: 'partner@soraskin.vn',
      bankName: 'Vietcombank',
      bankAccountNumber: '0071001234567',
      bankAccountName: 'CONG TY TNHH SORA SKIN',
      idCardNumber: '001201012345',
      frontCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      backCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    });
    toast.info('Đã nạp thông tin mẫu Gian Hàng chuẩn để kiểm thử');
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#EAE4D7] rounded-3xl p-10 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C59B58] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-[#7D715E]">Đang kiểm tra trạng thái hồ sơ đối tác...</span>
      </div>
    );
  }

  const kolApp = statusData?.kolApplication;
  const shopApp = statusData?.shopApplication;
  const shopStatus = shopApp?.onboardingStatus || (shopApp?.isVerified ? 'VERIFIED' : shopApp ? 'PENDING_APPROVAL' : null);
  const canSubmitShopApplication = !shopStatus || ['DRAFT', 'NEEDS_INFO', 'REJECTED'].includes(shopStatus);

  return (
    <div className="flex flex-col gap-3 text-left">
      {/* HEADER BANNER - SIÊU GỌN GÀNG & CÂN XỨNG */}
      <div className="bg-gradient-to-r from-[#F3EFE6] via-[#FAF8F5] to-[#F3EFE6] border border-[#EAE4D7] rounded-xl px-4 py-2.5 shadow-2xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBD08C]/25 text-[#B88E4F] font-black text-[10px] uppercase border border-[#B88E4F]/30">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              Cổng Nâng Cấp Đối Tác
            </span>
            <h2 className="text-sm font-black text-[#1A1612] tracking-tight">
              Mở rộng thu nhập cùng Hệ sinh thái SCANMS
            </h2>
          </div>
          <p className="text-[11px] text-[#7D715E] leading-relaxed">
            Từ tài khoản Khách Hàng, nâng cấp thành <strong>KOL Tiếp Thị Liên Kết</strong> (hoa hồng đến 30%) hoặc <strong>Mở Gian Hàng Kinh Doanh</strong>. Vẫn giữ nguyên 100% tài khoản Khách Hàng và chuyển đổi linh hoạt.
          </p>
        </div>
      </div>

      {/* HIỂN THỊ TRẠNG THÁI HỒ SƠ & BỘ CHỌN LOẠI ĐỐI TÁC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* KOL Status & Selection Card */}
        <div
          onClick={() => setActivePartnerType('kol')}
          className={`rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer ${
            activePartnerType === 'kol'
              ? 'bg-white border-2 border-[#C59B58] shadow-xs'
              : 'bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-white shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
              <strong className="text-[11px] font-black text-[#1A1612] uppercase tracking-wide">Hồ sơ Đối tác KOL</strong>
            </div>
            {kolApp ? (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  kolApp.status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : kolApp.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {kolApp.status === 'VERIFIED'
                  ? '✓ Đã cấp Tích Xanh'
                  : kolApp.status === 'REJECTED'
                  ? '✕ Bị từ chối'
                  : '⏳ Đang chờ Admin duyệt'}
              </span>
            ) : (
              <span className="text-[10px] text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                Chưa nộp đơn
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7D715E] mb-2 leading-relaxed line-clamp-2">
            {kolApp?.status === 'VERIFIED'
              ? 'Tài khoản của bạn đã được kích hoạt tính năng KOL! Bạn có thể tạo link affiliate, theo dõi hoa hồng và yêu cầu mẫu thử miễn phí.'
              : kolApp?.status === 'UNVERIFIED'
              ? 'Hồ sơ chứng minh kênh & định danh của bạn đang được Ban Quản Trị xem xét. Kết quả sẽ phản hồi trong 24h làm việc.'
              : kolApp?.status === 'REJECTED'
              ? 'Hồ sơ chưa đạt tiêu chí (link kênh không truy cập được hoặc chưa đủ thông tin). Vui lòng nộp lại hồ sơ chính xác.'
              : 'Dành cho các nhà sáng tạo nội dung trên TikTok, Facebook, Instagram, YouTube muốn nhận hoa hồng giới thiệu sản phẩm.'}
          </p>
          {kolApp?.status === 'VERIFIED' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                authService.switchWorkspace('kol', navigate);
              }}
              className="w-full py-1.5 px-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <span>Vào Bảng Điều Khiển KOL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePartnerType('kol');
              }}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                activePartnerType === 'kol'
                  ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-[#1A1612] font-black shadow-xs'
                  : 'bg-white text-[#1A1612] border border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#FAF8F5]'
              }`}
            >
              <span>{kolApp ? 'Xem & Cập nhật đơn KOL' : 'Đăng ký Đối tác KOL'}</span>
            </button>
          )}
        </div>

        {/* Shop Status & Selection Card */}
        <div
          onClick={() => setActivePartnerType('shop')}
          className={`rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer ${
            activePartnerType === 'shop'
              ? 'bg-white border-2 border-[#C59B58] shadow-xs'
              : 'bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-white shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
              <strong className="text-[11px] font-black text-[#1A1612] uppercase tracking-wide">Hồ sơ Mở Gian Hàng (Shop)</strong>
            </div>
            {shopApp ? (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  shopStatus === 'VERIFIED'
                    ? 'bg-[#FBF5EB] text-[#8F682E] border-[#EEDFC6]'
                    : shopStatus === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : shopStatus === 'NEEDS_INFO'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-[#F3EFE6] text-[#7D715E] border-[#EAE4D7]'
                }`}
              >
                {shopStatus === 'VERIFIED'
                  ? 'Đã xác minh'
                  : shopStatus === 'NEEDS_INFO'
                  ? 'Cần bổ sung hồ sơ'
                  : shopStatus === 'REJECTED'
                  ? 'Hồ sơ bị từ chối'
                  : shopStatus === 'DRAFT'
                  ? 'Bản nháp — chưa nộp'
                  : 'Chờ duyệt hồ sơ'}
              </span>
            ) : (
              <span className="text-[10px] text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                Chưa nộp đơn
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7D715E] mb-2 leading-relaxed line-clamp-2">
            {shopStatus === 'VERIFIED'
              ? `Gian hàng "${shopApp?.name || 'của bạn'}" đã được cấp Tích Xanh & sẵn sàng đăng bán sản phẩm, mở chiến dịch hoa hồng cho KOL.`
              : shopStatus === 'NEEDS_INFO'
              ? `Gian hàng "${shopApp?.name || 'của bạn'}" cần bổ sung hồ sơ theo ghi chú của Ban Quản Trị.`
              : shopStatus === 'REJECTED'
              ? `Hồ sơ gian hàng "${shopApp?.name || 'của bạn'}" đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại.`
              : shopStatus === 'DRAFT'
              ? `Gian hàng "${shopApp?.name || 'của bạn'}" đang là bản nháp. Hoàn thiện thông tin và giấy tờ để gửi Ban Quản Trị duyệt.`
              : shopApp
              ? `Hồ sơ gian hàng "${shopApp.name}" đã được gửi. Shop chỉ được đăng sản phẩm sau khi Ban Quản Trị xác minh.`
              : 'Dành cho các doanh nghiệp, hộ kinh doanh, nhà phân phối chính hãng muốn tiếp cận hàng ngàn KOL để bùng nổ doanh số.'}
          </p>
          {shopStatus === 'VERIFIED' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                authService.switchWorkspace('shop', navigate);
              }}
              className="w-full py-1.5 px-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <span>Vào Cổng Quản Lý Gian Hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePartnerType('shop');
              }}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                activePartnerType === 'shop'
                  ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-[#1A1612] font-black shadow-xs'
                  : 'bg-white text-[#1A1612] border border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#FAF8F5]'
              }`}
            >
              <span>{shopStatus === 'DRAFT' ? 'Hoàn thiện hồ sơ Shop' : shopApp ? 'Xem & Cập nhật đơn Shop' : 'Đăng ký mở Gian Hàng'}</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: FORM NÂNG CẤP LÊN KOL */}
      {activePartnerType === 'kol' && (
        <form onSubmit={handleKolSubmit} className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1A1612] tracking-tight">
                  Hồ sơ Chứng Minh Kênh Sáng Tạo &amp; Thông Tin Định Danh KOL
                </h3>
                <p className="text-[11px] text-[#7D715E]">
                  Cung cấp link mạng xã hội và ảnh chụp màn hình studio để chứng minh quyền sở hữu kênh.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillSampleKolData}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] text-[11px] font-bold text-[#B88E4F] transition cursor-pointer shadow-2xs shrink-0"
            >
              ⚡ Nạp dữ liệu mẫu thử nghiệm
            </button>
          </div>

          {/* CHỨNG MINH KÊNH MẠNG XÃ HỘI */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              1. Bằng chứng sở hữu kênh truyền thông
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Nền tảng chính *</label>
                <CustomSelect
                  value={kolForm.platform}
                  onChange={(val) => setKolForm({ ...kolForm, platform: val as any })}
                  options={[
                    { value: 'TIKTOK', label: '🎵 TikTok Video / Live' },
                    { value: 'FACEBOOK', label: '📘 Facebook Fanpage / Profile' },
                    { value: 'YOUTUBE', label: '▶️ YouTube Channel' },
                    { value: 'INSTAGRAM', label: '📷 Instagram Creator' },
                    { value: 'LEMON8', label: '🍋 Lemon8 Beauty' },
                    { value: 'OTHER', label: '🌐 Nền tảng khác' },
                  ]}
                  placeholder="-- Chọn Nền tảng --"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên kênh hiển thị *</label>
                <input
                  type="text"
                  placeholder="VD: Thành Thắng Reviews"
                  value={kolForm.channelName}
                  onChange={(e) => setKolForm({ ...kolForm, channelName: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số lượng Followers (Người theo dõi) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="VD: 15000"
                  value={kolForm.followerCount ? kolForm.followerCount : ''}
                  onChange={(e) => setKolForm({ ...kolForm, followerCount: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Đường dẫn liên kết kênh (URL Profile / Kênh) *
              </label>
              <input
                type="url"
                placeholder="https://tiktok.com/@your_channel hoặc https://facebook.com/yourpage"
                value={kolForm.channelUrl}
                onChange={(e) => setKolForm({ ...kolForm, channelUrl: e.target.value })}
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <ImageUploadDropzone
              label="Ảnh chụp màn hình trang quản trị kênh (TikTok Studio / Meta Business Suite)"
              helperText="💡 Admin sẽ đối chiếu ảnh chụp màn hình quyền quản trị với URL kênh để đảm bảo tính chính chủ, tránh mạo danh KOL."
              value={kolForm.channelProofUrl}
              onChange={(url) => setKolForm({ ...kolForm, channelProofUrl: url })}
              iconType="camera"
              folder="scanms/kyc/proofs"
            />
          </div>

          {/* ĐỊNH DANH CCCD & THUẾ TNCN */}
          <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              2. Định danh cá nhân & Kê khai thuế TNCN
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số CCCD / CMND (12 số) *</label>
                <input
                  type="text"
                  placeholder="VD: 001201012345"
                  value={kolForm.idCardNumber}
                  onChange={(e) => setKolForm({ ...kolForm, idCardNumber: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Mã số thuế cá nhân (MST)</label>
                <input
                  type="text"
                  placeholder="VD: 8012345678 (Tùy chọn)"
                  value={kolForm.taxCode}
                  onChange={(e) => setKolForm({ ...kolForm, taxCode: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadDropzone
                label="Ảnh mặt trước CCCD *"
                helperText="Chụp rõ nét, đủ 4 góc, tối đa 5MB"
                value={kolForm.frontCardUrl}
                onChange={(url) => setKolForm({ ...kolForm, frontCardUrl: url })}
                iconType="idcard"
                folder="scanms/kyc/idcards"
                required
              />
              <ImageUploadDropzone
                label="Ảnh mặt sau CCCD *"
                helperText="Chụp rõ nét mã QR và nơi cấp"
                value={kolForm.backCardUrl}
                onChange={(url) => setKolForm({ ...kolForm, backCardUrl: url })}
                iconType="idcard"
                folder="scanms/kyc/idcards"
                required
              />
            </div>
          </div>

          {/* TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG */}
          <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              3. Tài khoản ngân hàng nhận hoa hồng đối soát
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên ngân hàng *</label>
                <BankSelectTrigger
                  value={kolForm.bankName}
                  onChange={(val) => setKolForm({ ...kolForm, bankName: val })}
                  placeholder="-- Chọn ngân hàng thụ hưởng --"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  placeholder="VD: 0123456789"
                  value={kolForm.bankAccountNumber}
                  onChange={(e) => setKolForm({ ...kolForm, bankAccountNumber: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên chủ tài khoản (In hoa) *</label>
                <input
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={kolForm.bankAccountName}
                  onChange={(e) => setKolForm({ ...kolForm, bankAccountName: e.target.value.toUpperCase() })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono font-bold outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Định hướng phong cách &amp; Ngành hàng thế mạnh</label>
              <textarea
                rows={2}
                placeholder="VD: Review chuyên sâu mỹ phẩm dưỡng ẩm, đồ công nghệ gia dụng, thời trang tối giản..."
                value={kolForm.bio}
                onChange={(e) => setKolForm({ ...kolForm, bio: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-[#1A1612] font-black text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi hồ sơ...' : 'Nộp Đơn Đăng Ký Nâng Cấp KOL'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FORM MỞ GIAN HÀNG (SHOP MANAGER) */}
      {activePartnerType === 'shop' && (
        canSubmitShopApplication ? (
        <form onSubmit={handleShopSubmit} className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {(shopStatus === 'NEEDS_INFO' || shopStatus === 'REJECTED') && shopApp?.onboardingReviewNote && (
            <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
              <strong className="mb-1 block text-[#8F682E]">
                {shopStatus === 'NEEDS_INFO' ? 'Ban Quản Trị yêu cầu bạn bổ sung:' : 'Lý do hồ sơ bị từ chối:'}
              </strong>
              {shopApp.onboardingReviewNote}
            </div>
          )}
          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F] shadow-2xs">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1A1612] tracking-tight">
                  Hồ sơ Đăng Ký Mở Gian Hàng &amp; Thẩm Định Kho Hàng
                </h3>
                <p className="text-[11px] text-[#7D715E]">
                  Tuân thủ Nghị định 85/2021/NĐ-CP về thông tin người bán và kiểm định nguồn gốc xuất xứ sản phẩm.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillSampleShopData}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] text-[11px] font-bold text-[#B88E4F] transition cursor-pointer shadow-2xs shrink-0"
            >
              ⚡ Nạp dữ liệu mẫu thử nghiệm
            </button>
          </div>

          {/* CHÍNH SÁCH PHÁP LÝ & GIẢI THÍCH NGHỊ ĐỊNH 85 */}
          <div className="py-2.5 px-3 sm:py-3 sm:px-3.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] text-[#7D715E] leading-relaxed space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-[#B88E4F]">
              <Info className="w-3.5 h-3.5 shrink-0 text-[#B88E4F]" />
              <span className="font-black">Quy chuẩn Thẩm định Hai Cấp (Two-Tier Compliance) trên Sàn SCANMS:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>
                <strong className="text-[#1A1612]">Cấp 1 - Thẩm định Gian Hàng:</strong> Xác thực giấy phép kinh doanh, mã số thuế và kho hàng xuất khẩu.
              </li>
              <li>
                <strong className="text-[#1A1612]">Cấp 2 - Thẩm định Nguồn Gốc Sản Phẩm:</strong> Đối với hàng hóa có điều kiện (Mỹ phẩm, Thực phẩm, Điện tử), khi Shop đăng sản phẩm sẽ ở trạng thái Chờ duyệt (Pending) và bắt buộc tải lên <em>Phiếu công bố lưu hành mỹ phẩm</em> hoặc <em>Hóa đơn VAT đầu vào</em> để Admin cấp Tích Xanh lưu hành trên Marketplace.
              </li>
            </ul>
          </div>

          {/* THÔNG TIN DOANH NGHIỆP / GIAN HÀNG */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              1. Thông tin gian hàng &amp; Chủ thể kinh doanh
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên Gian Hàng / Thương hiệu *</label>
                <input
                  type="text"
                  placeholder="VD: Sora Skin Beauty Official"
                  value={shopForm.shopName}
                  onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-bold outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Hình thức kinh doanh *</label>
                <CustomSelect
                  value={shopForm.businessType}
                  onChange={(val) => setShopForm({ ...shopForm, businessType: val as any })}
                  options={[
                    { value: 'ENTERPRISE', label: 'Doanh nghiệp / Công ty' },
                    { value: 'HOUSEHOLD', label: 'Hộ kinh doanh cá thể' },
                    { value: 'INDIVIDUAL', label: 'Cá nhân kinh doanh' },
                  ]}
                  placeholder="-- Chọn hình thức --"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Địa chỉ Kho xuất hàng thực tế (Bắt buộc theo Nghị định 85/2021/NĐ-CP) *
              </label>
              <input
                type="text"
                placeholder="Số nhà, Tên đường, Cụm kho, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                value={shopForm.warehouseAddress}
                onChange={(e) => setShopForm({ ...shopForm, warehouseAddress: e.target.value })}
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
              />
              <p className="text-[10.5px] text-[#7D715E] mt-1">
                Địa chỉ kho để đối soát với các đơn vị vận chuyển (GHTK, GHN, Viettel Post) và khai báo cơ quan thuế.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Mã số thuế Doanh nghiệp / HKD *</label>
                <input
                  type="text"
                  placeholder="VD: 0315891234"
                  value={shopForm.taxCode}
                  onChange={(e) => setShopForm({ ...shopForm, taxCode: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số hotline CSKH / Tiếp nhận đơn *</label>
                <input
                  type="tel"
                  placeholder="VD: 0988776655"
                  value={shopForm.contactPhone}
                  onChange={(e) => setShopForm({ ...shopForm, contactPhone: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Email đối soát thanh toán *</label>
                <input
                  type="email"
                  placeholder="VD: accounting@soraskin.vn"
                  value={shopForm.contactEmail}
                  onChange={(e) => setShopForm({ ...shopForm, contactEmail: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>
          </div>

          {/* CHỨNG TỪ PHÁP LÝ NGUỒN HÀNG & ĐỊNH DANH */}
          <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              2. Chứng từ pháp lý &amp; Định danh chủ thể kinh doanh
            </h4>

            <div className="py-2.5 px-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] text-[#7D715E] leading-relaxed">
              <strong className="text-[#1A1612]">Hồ sơ bắt buộc:</strong> CCCD của người đại diện (đối với doanh nghiệp/hộ kinh doanh là người đại diện pháp luật), giấy phép đăng ký kinh doanh, mã số thuế và tài khoản ngân hàng nhận doanh thu.
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Số CCCD người đại diện (9 - 12 số) *
              </label>
              <input
                type="text"
                placeholder="VD: 001201012345"
                maxLength={12}
                value={shopForm.idCardNumber || ''}
                onChange={(e) => setShopForm({ ...shopForm, idCardNumber: e.target.value.replace(/\D/g, '') })}
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadDropzone
                label="Ảnh CCCD người đại diện — mặt trước *"
                helperText="Ảnh rõ nét, đủ bốn góc, tối đa 5MB"
                value={shopForm.frontCardUrl || ''}
                onChange={(url) => setShopForm({ ...shopForm, frontCardUrl: url })}
                iconType="idcard"
                folder="scanms/kyc/shop_idcards"
                required
              />
              <ImageUploadDropzone
                label="Ảnh CCCD người đại diện — mặt sau *"
                helperText="Ảnh rõ nét, đủ bốn góc, tối đa 5MB"
                value={shopForm.backCardUrl || ''}
                onChange={(url) => setShopForm({ ...shopForm, backCardUrl: url })}
                iconType="idcard"
                folder="scanms/kyc/shop_idcards"
                required
              />
              <ImageUploadDropzone
                label="Giấy phép đăng ký kinh doanh *"
                helperText="Ảnh chụp hoặc bản scan rõ nét"
                value={shopForm.businessLicenseUrl || ''}
                onChange={(url) => setShopForm({ ...shopForm, businessLicenseUrl: url })}
                iconType="file"
                folder="scanms/kyc/licenses"
                required
              />
              <ImageUploadDropzone
                label="Giấy ủy quyền thương hiệu / Hợp đồng NPP (Tùy chọn)"
                helperText="Chứng từ đại lý phân phối hoặc nguồn gốc hàng hóa (nếu có)"
                value={shopForm.brandAuthorizationUrl || ''}
                onChange={(url) => setShopForm({ ...shopForm, brandAuthorizationUrl: url })}
                iconType="file"
                folder="scanms/kyc/authorizations"
              />
            </div>
          </div>

          {/* TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG DOANH THU */}
          <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                3. Tài khoản ngân hàng nhận doanh thu bán hàng
              </h4>
              <span className="text-[10px] text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-full border border-[#EEDFC6] font-bold">
                Đối soát &amp; Chuyển tiền định kỳ
              </span>
            </div>

            <p className="text-[11px] text-[#7D715E] leading-relaxed">
              Doanh thu từ các đơn hàng thành công (sau khi trừ phí sàn và hoa hồng trả cho KOL) sẽ được SCANMS tự động đối soát và chuyển về tài khoản này theo chu kỳ thanh toán.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên ngân hàng thụ hưởng *</label>
                <BankSelectTrigger
                  value={shopForm.bankName}
                  onChange={(val) => setShopForm({ ...shopForm, bankName: val })}
                  placeholder="-- Chọn ngân hàng --"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  placeholder="VD: 0123456789"
                  value={shopForm.bankAccountNumber}
                  onChange={(e) => setShopForm({ ...shopForm, bankAccountNumber: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Tên chủ tài khoản (In hoa) *
                </label>
                <input
                  type="text"
                  placeholder={
                    shopForm.businessType === 'ENTERPRISE'
                      ? 'VD: CONG TY TNHH SORA SKIN'
                      : 'VD: NGUYEN VAN A'
                  }
                  value={shopForm.bankAccountName}
                  onChange={(e) => setShopForm({ ...shopForm, bankAccountName: e.target.value.toUpperCase() })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono font-bold outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Giới thiệu ngắn về Gian Hàng</label>
              <textarea
                rows={2}
                placeholder="Mô tả ngành hàng chủ đạo, cam kết chất lượng và định hướng phát triển trên SCANMS..."
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-[#1A1612] font-black text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Mở Gian Hàng'}</span>
            </button>
          </div>
        </form>
        ) : (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-[#1A1612]">
              <Store className="h-4 w-4 text-[#B88E4F]" />
              {shopStatus === 'VERIFIED' ? 'Gian hàng đã được xác minh' : 'Hồ sơ đang chờ Ban Quản Trị duyệt'}
            </div>
            <p className="text-xs text-[#7D715E]">
              {shopStatus === 'VERIFIED'
                ? 'Gian hàng đã được kích hoạt. Bạn có thể vào cổng quản lý để đăng sản phẩm.'
                : 'Bạn sẽ nhận thông báo khi hồ sơ được duyệt hoặc cần bổ sung. Trong thời gian chờ, chưa thể đăng sản phẩm hay nhập kho.'}
            </p>
            {shopApp?.onboardingReviewNote && shopStatus !== 'VERIFIED' && (
              <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
                <strong className="mb-1 block text-[#8F682E]">Ghi chú từ Ban Quản Trị</strong>
                {shopApp.onboardingReviewNote}
              </div>
            )}
            <button
              type="button"
              onClick={() => loadStatus()}
              className="rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs font-bold text-[#7D715E] hover:border-[#C59B58]"
            >
              Làm mới trạng thái
            </button>
          </div>
        )
      )}
    </div>
  );
};
