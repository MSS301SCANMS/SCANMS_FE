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

export const PartnerUpgradeTab: React.FC = () => {
  const navigate = useNavigate();
  const [activePartnerType, setActivePartnerType] = useState<'kol' | 'shop'>('kol');
  const [statusData, setStatusData] = useState<UpgradeStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // KOL Form State
  const [kolForm, setKolForm] = useState<ApplyKolData>({
    platform: 'TIKTOK',
    channelName: '',
    channelUrl: '',
    followerCount: 15000,
    channelProofUrl: '',
    idCardNumber: '',
    taxCode: '',
    bankName: 'Vietcombank',
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
    businessType: 'ENTERPRISE',
    taxCode: '',
    businessLicenseUrl: '',
    brandAuthorizationUrl: '',
    contactPhone: '',
    contactEmail: '',
  });

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await kycService.getMyUpgradeStatus();
      setStatusData(data);
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
    if (!kolForm.channelUrl.trim()) {
      toast.error('Vui lòng nhập đường link kênh mạng xã hội');
      return;
    }
    if (!kolForm.idCardNumber.trim() || kolForm.idCardNumber.length < 9) {
      toast.error('Vui lòng nhập số CCCD/CMND hợp lệ');
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
    if (!shopForm.shopName.trim()) {
      toast.error('Vui lòng nhập tên gian hàng');
      return;
    }
    if (!shopForm.warehouseAddress.trim()) {
      toast.error('Địa chỉ kho xuất hàng là bắt buộc theo Nghị định 85/2021/NĐ-CP');
      return;
    }
    if (!shopForm.taxCode.trim()) {
      toast.error('Vui lòng nhập mã số thuế doanh nghiệp / hộ kinh doanh');
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

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-[#F3EFE6] via-[#FAF8F5] to-[#F3EFE6] border border-[#EAE4D7] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBD08C]/15 text-[#B88E4F] font-bold text-xs border border-[#B88E4F]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Cổng Nâng Cấp Đối Tác SCANMS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1612] tracking-tight mb-2">
            Mở rộng thu nhập cùng Hệ sinh thái SCANMS
          </h2>
          <p className="text-xs sm:text-sm text-[#7D715E] leading-relaxed">
            Từ tài khoản Khách Hàng, bạn có thể nộp hồ sơ nâng cấp thành <strong>KOL Tiếp Thị Liên Kết</strong> (hưởng hoa hồng đến 30%) hoặc <strong>Mở Gian Hàng Kinh Doanh</strong>. Sau khi nâng cấp, bạn <strong>vẫn giữ nguyên 100% tài khoản Khách Hàng</strong> và có thể chuyển đổi linh hoạt bất kỳ lúc nào!
          </p>
        </div>
      </div>

      {/* HIỂN THỊ TRẠNG THÁI HỒ SƠ HIỆN CÓ (NẾU CÓ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KOL Status Box */}
        <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B88E4F]" />
              <strong className="text-xs font-black text-[#1A1612] uppercase">Hồ sơ Đối tác KOL</strong>
            </div>
            {kolApp ? (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
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
              <span className="text-[11px] text-[#7D715E] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EAE4D7]">
                Chưa nộp đơn
              </span>
            )}
          </div>
          <p className="text-xs text-[#7D715E] mb-3">
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
              onClick={() => authService.switchWorkspace('kol', navigate)}
              className="w-full py-2 px-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Vào Bảng Điều Khiển KOL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePartnerType('kol')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                activePartnerType === 'kol'
                  ? 'bg-[#FBF5EB] text-[#B88E4F] border-[#EAE4D7]'
                  : 'bg-white text-[#1A1612] border-[#EAE4D7] hover:bg-[#FAF8F5]'
              }`}
            >
              <span>{kolApp ? 'Xem & Cập nhật đơn KOL' : 'Đăng ký ngay bây giờ'}</span>
            </button>
          )}
        </div>

        {/* Shop Status Box */}
        <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#B88E4F]" />
              <strong className="text-xs font-black text-[#1A1612] uppercase">Hồ sơ Mở Gian Hàng (Shop)</strong>
            </div>
            {shopApp ? (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  shopApp.isVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {shopApp.isVerified ? '✓ Gian Hàng Xác Minh' : '⏳ Chờ thẩm định GPKD'}
              </span>
            ) : (
              <span className="text-[11px] text-[#7D715E] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EAE4D7]">
                Chưa nộp đơn
              </span>
            )}
          </div>
          <p className="text-xs text-[#7D715E] mb-3">
            {shopApp?.isVerified
              ? `Gian hàng "${shopApp.name}" đã được cấp Tích Xanh & sẵn sàng đăng bán sản phẩm, mở chiến dịch hoa hồng cho KOL.`
              : shopApp
              ? `Gian hàng "${shopApp.name}" đã nộp địa chỉ kho và giấy phép. Admin đang thẩm định tính xác thực theo Nghị định 85/2021/NĐ-CP.`
              : 'Dành cho các doanh nghiệp, hộ kinh doanh, nhà phân phối chính hãng muốn tiếp cận hàng ngàn KOL để bùng nổ doanh số.'}
          </p>
          {shopApp?.isVerified ? (
            <button
              type="button"
              onClick={() => authService.switchWorkspace('shop', navigate)}
              className="w-full py-2 px-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Vào Cổng Quản Lý Gian Hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePartnerType('shop')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                activePartnerType === 'shop'
                  ? 'bg-[#FBF5EB] text-[#B88E4F] border-[#EAE4D7]'
                  : 'bg-white text-[#1A1612] border-[#EAE4D7] hover:bg-[#FAF8F5]'
              }`}
            >
              <span>{shopApp ? 'Xem & Cập nhật đơn Shop' : 'Đăng ký mở Gian Hàng'}</span>
            </button>
          )}
        </div>
      </div>

      {/* FORM SELECTION TABS */}
      <div className="flex border-b border-[#EAE4D7] gap-3">
        <button
          type="button"
          onClick={() => setActivePartnerType('kol')}
          className={`pb-3 px-4 text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activePartnerType === 'kol'
              ? 'border-[#B88E4F] text-[#B88E4F]'
              : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Biểu mẫu Đăng ký KOL / Affiliate</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePartnerType('shop')}
          className={`pb-3 px-4 text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activePartnerType === 'shop'
              ? 'border-[#B88E4F] text-[#B88E4F]'
              : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Biểu mẫu Đăng ký Gian Hàng (Shop Manager)</span>
        </button>
      </div>

      {/* TAB 1: FORM NÂNG CẤP LÊN KOL */}
      {activePartnerType === 'kol' && (
        <form onSubmit={handleKolSubmit} className="bg-white border border-[#EAE4D7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE4D7]">
            <div>
              <h3 className="text-base font-black text-[#1A1612] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B88E4F]" />
                <span>Hồ sơ Chứng Minh Kênh Sáng Tạo & Thông Tin Định Danh KOL</span>
              </h3>
              <p className="text-xs text-[#7D715E] mt-0.5">
                Cung cấp link mạng xã hội và ảnh chụp màn hình studio để chứng minh quyền sở hữu kênh.
              </p>
            </div>
            <button
              type="button"
              onClick={fillSampleKolData}
              className="px-3 py-1.5 rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-xs font-bold text-[#B88E4F] transition cursor-pointer"
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
                <select
                  value={kolForm.platform}
                  onChange={(e: any) => setKolForm({ ...kolForm, platform: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-semibold outline-none focus:border-[#C59B58] transition"
                >
                  <option value="TIKTOK">🎵 TikTok Video / Live</option>
                  <option value="FACEBOOK">📘 Facebook Fanpage / Profile</option>
                  <option value="YOUTUBE">▶️ YouTube Channel</option>
                  <option value="INSTAGRAM">📷 Instagram Creator</option>
                  <option value="LEMON8">🍋 Lemon8 Beauty</option>
                  <option value="OTHER">🌐 Nền tảng khác</option>
                </select>
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
                  value={kolForm.followerCount}
                  onChange={(e) => setKolForm({ ...kolForm, followerCount: Number(e.target.value) })}
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

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Ảnh chụp màn hình trang quản trị kênh (TikTok Studio / Meta Business Suite)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  placeholder="Dán link ảnh bằng chứng (Cloudinary, Imgur, hoặc CDN)..."
                  value={kolForm.channelProofUrl}
                  onChange={(e) => setKolForm({ ...kolForm, channelProofUrl: e.target.value })}
                  className="flex-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>
              <p className="text-[11px] text-[#7D715E] mt-1">
                💡 Admin sẽ đối chiếu ảnh chụp màn hình quyền quản trị với URL kênh để đảm bảo tính chính chủ, tránh mạo danh KOL.
              </p>
            </div>
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
                  placeholder="001201012345"
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
                  placeholder="8012345678 (Tùy chọn)"
                  value={kolForm.taxCode}
                  onChange={(e) => setKolForm({ ...kolForm, taxCode: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ảnh mặt trước CCCD</label>
                <input
                  type="url"
                  placeholder="Link ảnh mặt trước CCCD..."
                  value={kolForm.frontCardUrl}
                  onChange={(e) => setKolForm({ ...kolForm, frontCardUrl: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ảnh mặt sau CCCD</label>
                <input
                  type="url"
                  placeholder="Link ảnh mặt sau CCCD..."
                  value={kolForm.backCardUrl}
                  onChange={(e) => setKolForm({ ...kolForm, backCardUrl: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>
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
                <input
                  type="text"
                  placeholder="VD: Vietcombank, Techcombank, MB Bank"
                  value={kolForm.bankName}
                  onChange={(e) => setKolForm({ ...kolForm, bankName: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
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
              className="px-6 py-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi hồ sơ...' : 'Nộp Đơn Đăng Ký Nâng Cấp KOL'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FORM MỞ GIAN HÀNG (SHOP MANAGER) */}
      {activePartnerType === 'shop' && (
        <form onSubmit={handleShopSubmit} className="bg-white border border-[#EAE4D7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE4D7]">
            <div>
              <h3 className="text-base font-black text-[#1A1612] flex items-center gap-2">
                <Store className="w-4 h-4 text-[#B88E4F]" />
                <span>Hồ sơ Đăng Ký Mở Gian Hàng &amp; Thẩm Định Kho Hàng</span>
              </h3>
              <p className="text-xs text-[#7D715E] mt-0.5">
                Tuân thủ Nghị định 85/2021/NĐ-CP về thông tin người bán và kiểm định nguồn gốc xuất xứ sản phẩm.
              </p>
            </div>
            <button
              type="button"
              onClick={fillSampleShopData}
              className="px-3 py-1.5 rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-xs font-bold text-[#B88E4F] transition cursor-pointer"
            >
              ⚡ Nạp dữ liệu mẫu thử nghiệm
            </button>
          </div>

          {/* CHÍNH SÁCH PHÁP LÝ & GIẢI THÍCH NGHỊ ĐỊNH 85 */}
          <div className="p-4 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] text-xs text-[#7D715E] leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#B88E4F]">
              <Info className="w-4 h-4 shrink-0 text-[#B88E4F]" />
              <span>Quy chuẩn Thẩm định Hai Cấp (Two-Tier Compliance) trên Sàn SCANMS:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Cấp 1 - Thẩm định Gian Hàng:</strong> Xác thực giấy phép kinh doanh, mã số thuế và kho hàng xuất khẩu.
              </li>
              <li>
                <strong>Cấp 2 - Thẩm định Nguồn Gốc Sản Phẩm:</strong> Đối với hàng hóa có điều kiện (Mỹ phẩm, Thực phẩm, Điện tử), khi Shop đăng sản phẩm sẽ ở trạng thái Chờ duyệt (Pending) và bắt buộc tải lên <em>Phiếu công bố lưu hành mỹ phẩm</em> hoặc <em>Hóa đơn VAT đầu vào</em> để Admin cấp Tích Xanh lưu hành trên Marketplace.
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
                <select
                  value={shopForm.businessType}
                  onChange={(e: any) => setShopForm({ ...shopForm, businessType: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-semibold outline-none focus:border-[#C59B58] transition"
                >
                  <option value="ENTERPRISE">Doanh nghiệp / Công ty</option>
                  <option value="HOUSEHOLD">Hộ kinh doanh cá thể</option>
                  <option value="INDIVIDUAL">Cá nhân kinh doanh</option>
                </select>
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
                  placeholder="0988776655"
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
                  placeholder="accounting@soraskin.vn"
                  value={shopForm.contactEmail}
                  onChange={(e) => setShopForm({ ...shopForm, contactEmail: e.target.value })}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
                />
              </div>
            </div>
          </div>

          {/* CHỨNG TỪ PHÁP LÝ NGUỒN HÀNG */}
          <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
            <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              2. Chứng từ pháp lý &amp; Ủy quyền phân phối
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Link Giấy phép ĐKKD / Giấy chứng nhận đăng ký doanh nghiệp
                </label>
                <input
                  type="url"
                  placeholder="Dán link ảnh hoặc PDF Giấy phép kinh doanh..."
                  value={shopForm.businessLicenseUrl}
                  onChange={(e) => setShopForm({ ...shopForm, businessLicenseUrl: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Giấy ủy quyền thương hiệu / Hợp đồng phân phối chính ngạch
                </label>
                <input
                  type="url"
                  placeholder="Dán link giấy ủy quyền nhãn hàng hoặc hợp đồng NPP..."
                  value={shopForm.brandAuthorizationUrl}
                  onChange={(e) => setShopForm({ ...shopForm, brandAuthorizationUrl: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
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
              className="px-6 py-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Mở Gian Hàng'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
