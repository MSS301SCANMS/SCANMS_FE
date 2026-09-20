import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  User,
  ShoppingBag,
  Percent,
  Lightbulb,
  ShieldCheck,
  AlertCircle,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Camera,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { triggerGoogleSignIn } from '../../utils/googleAuth';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../utils/toast';

const KOL_AVATAR_PRESETS = [
  { id: 'kol-1', label: 'Thanh lịch', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584512/scanms/avatars/kol-avatar-thang.jpg' },
  { id: 'kol-2', label: 'Tươi tắn', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584513/scanms/avatars/kol-avatar-ha.jpg' },
  { id: 'kol-3', label: 'Trẻ trung', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584515/scanms/avatars/kol-avatar-nhat.jpg' },
  { id: 'kol-4', label: 'Hiện đại', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584517/scanms/avatars/kol-avatar-nam.jpg' },
  { id: 'kol-5', label: 'Đẹp xinh', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584518/scanms/avatars/kol-avatar-depxinh.jpg' },
  { id: 'kol-6', label: 'Năng động', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584519/scanms/avatars/kol-avatar-nghia.jpg' },
];

const SHOP_LOGO_PRESETS = [
  { id: 'shop-1', label: 'Sora Skin', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584519/scanms/logos/shop-sora-skin.jpg' },
  { id: 'shop-2', label: 'Tech Store', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584520/scanms/logos/shop-techstore.jpg' },
  { id: 'shop-3', label: 'Mỹ Phẩm Xanh', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584525/scanms/logos/shop-my-pham-xanh.jpg' },
  { id: 'shop-4', label: 'Store A Flagship', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584523/scanms/logos/shop-store-a.jpg' },
  { id: 'shop-5', label: 'Store B Concept', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584524/scanms/logos/shop-store-b.jpg' },
  { id: 'shop-6', label: 'Official Flagship', url: 'https://res.cloudinary.com/uwha9nbe/image/upload/v1789584522/scanms/logos/shop-flagship.jpg' },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<'kol' | 'shop' | 'customer'>('kol');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [handle, setHandle] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [avatarUrl, setAvatarUrl] = useState(KOL_AVATAR_PRESETS[0].url);
  const [logoUrl, setLogoUrl] = useState(SHOP_LOGO_PRESETS[0].url);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingImage(true);
    try {
      const secureUrl = await uploadService.uploadImage(
        file,
        target === 'avatar' ? 'scanms/avatars' : 'scanms/logos'
      );
      if (target === 'avatar') {
        setAvatarUrl(secureUrl);
        toast.success('Đã tải ảnh đại diện KOL lên Cloudinary thành công!');
      } else {
        setLogoUrl(secureUrl);
        toast.success('Đã tải logo gian hàng lên Cloudinary thành công!');
      }
    } catch (err: any) {
      console.error('Lỗi tải ảnh lên Cloudinary:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên Cloudinary');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Rất yếu', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Khá mạnh', color: 'bg-emerald-500' };
      case 4:
        return { score: 4, label: 'Rất mạnh', color: 'bg-amber-600' };
      default:
        return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200' };
    }
  };

  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }

    if (role === 'kol' && !avatarUrl.trim()) {
      setError('Vui lòng chọn hoặc tải lên ảnh đại diện cho tài khoản KOL / CTV (Bắt buộc).');
      return;
    }

    if (role === 'shop' && !logoUrl.trim()) {
      setError('Vui lòng chọn hoặc tải lên logo đại diện cho Gian hàng (Bắt buộc).');
      return;
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng của SCANMS.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await authService.sendOtp(email);
      setRegisteredEmail(email);
      const otpCode = res?.data?.debugOtp || res?.data?.mockOtp;
      if (otpCode) {
        setMockOtpHint(otpCode);
      }
      setShowOtpModal(true);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const errorMsg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ Backend (cổng 3000). Vui lòng đảm bảo backend đang chạy trên http://localhost:3000.'
          : err?.message || 'Không thể gửi mã xác thực OTP. Vui lòng kiểm tra lại email.');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiRole =
        role === 'kol' ? 'COLLABORATOR' : role === 'shop' ? 'SHOP_MANAGER' : 'COLLABORATOR';

      await authService.register({
        email: registeredEmail,
        password,
        fullName,
        phoneNumber: phone,
        storeName: role === 'shop' ? shopName : undefined,
        role: apiRole,
        otp: otp.trim(),
        avatarUrl: role === 'kol' ? avatarUrl.trim() : undefined,
        logoUrl: role === 'shop' ? logoUrl.trim() : undefined,
      });

      toast.success(
        role === 'shop'
          ? `Kích hoạt tài khoản Gian hàng "${shopName}" thành công! Vui lòng đăng nhập.`
          : 'Kích hoạt tài khoản CTV / KOL thành công! Vui lòng đăng nhập.'
      );
      navigate('/login');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ Backend (cổng 3000).'
          : err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setError(null);
    setLoading(true);
    triggerGoogleSignIn(
      async (idToken: string) => {
        try {
          const apiRole =
            role === 'kol' ? 'COLLABORATOR' : role === 'shop' ? 'SHOP_MANAGER' : 'COLLABORATOR';

          await authService.googleLogin(idToken, apiRole, role === 'shop' ? shopName : undefined);
          toast.success('Đăng ký & xác thực tài khoản Google thành công!');
          navigate('/');
        } catch (err: any) {
          setError(err.message || 'Đăng ký qua Google thất bại');
        } finally {
          setLoading(false);
        }
      },
      (errorMsg: string) => {
        setError(errorMsg);
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-10">

      <div className="max-w-[1520px] mx-auto w-full mb-4 flex flex-wrap justify-between items-center gap-3 text-xs">
        <Link
          to="/marketplace"
          id="btn-back-to-marketplace-register"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-bold hover:bg-[#F3EFE6] transition shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#B88E4F] group-hover:-translate-x-1 transition-transform" />
          <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
          <span>Quay về Sàn Mua Sắm Chính (SCANMS Marketplace)</span>
        </Link>
        <span className="text-[#7D715E] hidden sm:inline font-semibold">
          Cổng Đăng Ký Đối Tác Hệ Thống SCANMS
        </span>
      </div>

      <div className="max-w-[1520px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

        <div className="lg:col-span-6 bg-[#F3EFE6] border border-[#EAE4D7] rounded-3xl p-7 sm:p-10 flex flex-col gap-6 text-left relative overflow-hidden shadow-xs">

          <div
            className="absolute inset-0 pointer-events-none opacity-35"
            style={{
              backgroundImage:
                'radial-gradient(#B88E4F 0.75px, transparent 0.75px), radial-gradient(#B88E4F 0.75px, #F3EFE6 0.75px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px',
            }}
          />

          <div className="relative z-10 flex flex-col gap-5">

            <Link to="/login" className="flex items-center gap-3 no-underline w-fit">
              <div className="w-11 h-11 rounded-xl bg-[#B88E4F] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-amber-100" />
              </div>
              <div>
                <strong className="text-xl font-extrabold text-[#1A1612] tracking-tight block">
                  SCANMS
                </strong>
                <span className="text-[11px] font-bold text-[#B88E4F] uppercase tracking-wider block">
                  HỆ THỐNG QUẢN LÝ MẠNG LƯỚI CTV &amp; TIẾP THỊ
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-[#B88E4F]" />
              <span>Gia nhập đội ngũ CTV bán hàng &amp; Tiếp thị liên kết 2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1612] tracking-tight leading-tight m-0">
              Khởi đầu sự nghiệp <br />
              <span className="text-[#B88E4F]">CTV bán hàng &amp; Affiliate.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#7D715E] leading-relaxed max-w-xl m-0">
              Đăng ký chỉ 1 phút. Nhận ngay kho sản phẩm hoa hồng cao, công cụ tạo link &amp; QR
              tiếp thị tự động và chính sách chi trả hoa hồng tự động 24/7.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4D7] shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#1A1612] block">Kho hàng mở</strong>
                  <span className="text-[11px] text-[#7D715E]">500+ sản phẩm mẫu sẵn có</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4D7] shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#1A1612] block">Hoa hồng linh hoạt</strong>
                  <span className="text-[11px] text-[#7D715E]">Thưởng bậc thang đến 30%</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4D7] shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#1A1612] block">Công cụ thông minh</strong>
                  <span className="text-[11px] text-[#7D715E]">Dynamic QR &amp; Smart Link</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4D7] shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#1A1612] block">Chi trả 24/7</strong>
                  <span className="text-[11px] text-[#7D715E]">Rút tiền VietQR tự động</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 w-full">
          <div className="bg-white rounded-3xl border border-[#EAE4D7] shadow-lg p-6 sm:p-8 flex flex-col gap-5 text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">Tạo tài khoản mới</h2>
              <p className="text-xs sm:text-sm text-[#7D715E] mt-1.5 m-0">
                Chọn vai trò của bạn và hoàn tất biểu mẫu đăng ký.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider block mb-2">
                BẠN THAM GIA VỚI VAI TRÒ
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('kol')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    role === 'kol'
                      ? 'bg-white text-[#B88E4F] shadow-xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>KOL / CTV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('shop')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    role === 'shop'
                      ? 'bg-white text-[#B88E4F] shadow-xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Chủ Shop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    role === 'customer'
                      ? 'bg-white text-[#B88E4F] shadow-xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Khách Mua</span>
                </button>
              </div>

              {role === 'kol' && (
                <p className="text-[11px] text-[#7D715E] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7] mt-2 mb-0">
                  🌟 <strong>Nhà sáng tạo / KOL:</strong> Đăng ký tài khoản nhận link tiếp thị, tạo mã QR, xin mẫu trải nghiệm và hưởng hoa hồng bậc thang tới 30%.
                </p>
              )}
              {role === 'shop' && (
                <p className="text-[11px] text-[#7D715E] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7] mt-2 mb-0">
                  🏪 <strong>Chủ Gian Hàng:</strong> Hệ thống tự động tạo Store cho bạn, cấp quyền đăng bán sản phẩm và cài đặt hoa hồng cho mạng lưới KOL.
                </p>
              )}
              {role === 'customer' && (
                <p className="text-[11px] text-[#7D715E] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7] mt-2 mb-0">
                  🛍️ <strong>Khách Mua Hàng:</strong> Bạn có thể mua hàng 1-chạm không cần tài khoản tại sàn, hoặc tạo tài khoản để quản lý đơn thuận tiện.
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Họ và tên</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số điện thoại</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      required
                      className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Email xác thực</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                  />
                </div>
              </div>

              {role === 'kol' && (
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                    Kênh TikTok / Facebook Handle (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@username_kol"
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                  />
                </div>
              )}

              {role === 'kol' && (
                <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Ảnh đại diện KOL / KOC <strong className="text-rose-600">* (Bắt buộc)</strong></span>
                    </label>
                    <span className="text-[10px] text-[#7D715E] bg-white px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                      Dùng trên Bảng xếp hạng &amp; Video
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#C59B58] ring-offset-2 shrink-0 bg-[#F3EFE6] flex items-center justify-center shadow-xs">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="KOL Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-[#7D715E]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {KOL_AVATAR_PRESETS.map((p) => {
                          const isSelected = avatarUrl === p.url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setAvatarUrl(p.url)}
                              className={`relative group p-0.5 rounded-full border-2 transition cursor-pointer ${
                                isSelected ? 'border-[#C59B58] scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                              title={p.label}
                            >
                              <img src={p.url} alt={p.label} className="w-6 h-6 rounded-full object-cover" />
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#059669] text-white flex items-center justify-center">
                                  <Check className="w-2 h-2" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Hoặc dán URL ảnh trực tiếp..."
                          required
                          className="flex-1 bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1 text-xs text-[#1A1612] focus:border-[#C59B58] outline-none transition"
                        />
                        <label className="cursor-pointer px-2.5 py-1 bg-white border border-[#EAE4D7] hover:border-[#C59B58] text-[#1A1612] text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition">
                          {uploadingImage ? (
                            <Loader2 className="w-3 h-3 text-[#B88E4F] animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 text-[#B88E4F]" />
                          )}
                          <span>{uploadingImage ? 'Đang tải...' : 'Tải ảnh (PNG/JPG)'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            disabled={uploadingImage}
                            onChange={(e) => handleFileUpload(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'shop' && (
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                    Tên Gian Hàng / Thương Hiệu <strong className="text-rose-600">*</strong>
                  </label>
                  <div className="relative flex items-center">
                    <Store className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Ví dụ: Sora Skin Official"
                      required
                      className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    />
                  </div>
                </div>
              )}

              {role === 'shop' && (
                <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Logo đại diện Gian Hàng <strong className="text-rose-600">* (Bắt buộc)</strong></span>
                    </label>
                    <span className="text-[10px] text-[#7D715E] bg-white px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                      Hiển thị toàn sàn &amp; chiến dịch
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#C59B58] ring-offset-2 shrink-0 bg-[#F3EFE6] flex items-center justify-center shadow-xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Shop Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-[#7D715E]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {SHOP_LOGO_PRESETS.map((p) => {
                          const isSelected = logoUrl === p.url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setLogoUrl(p.url)}
                              className={`relative group p-0.5 rounded-lg border-2 transition cursor-pointer ${
                                isSelected ? 'border-[#C59B58] scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                              title={p.label}
                            >
                              <img src={p.url} alt={p.label} className="w-6 h-6 rounded-md object-cover" />
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#059669] text-white flex items-center justify-center">
                                  <Check className="w-2 h-2" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="Hoặc dán URL logo trực tiếp..."
                          required
                          className="flex-1 bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1 text-xs text-[#1A1612] focus:border-[#C59B58] outline-none transition"
                        />
                        <label className="cursor-pointer px-2.5 py-1 bg-white border border-[#EAE4D7] hover:border-[#C59B58] text-[#1A1612] text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition">
                          {uploadingImage ? (
                            <Loader2 className="w-3 h-3 text-[#B88E4F] animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 text-[#B88E4F]" />
                          )}
                          <span>{uploadingImage ? 'Đang tải...' : 'Tải logo (PNG/JPG)'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            disabled={uploadingImage}
                            onChange={(e) => handleFileUpload(e, 'logo')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Mật khẩu</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {password && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-[#7D715E]">
                    <span>Độ mạnh mật khẩu:</span>
                    <span className="font-bold text-[#1A1612]">{passStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${passStrength.score >= 1 ? passStrength.color : 'bg-[#EAE4D7]'}`} />
                    <div className={`h-full flex-1 rounded-full ${passStrength.score >= 2 ? passStrength.color : 'bg-[#EAE4D7]'}`} />
                    <div className={`h-full flex-1 rounded-full ${passStrength.score >= 3 ? passStrength.color : 'bg-[#EAE4D7]'}`} />
                    <div className={`h-full flex-1 rounded-full ${passStrength.score >= 4 ? passStrength.color : 'bg-[#EAE4D7]'}`} />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="agree-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-[#EAE4D7] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer mt-0.5"
                />
                <label htmlFor="agree-checkbox" className="text-xs text-[#7D715E] cursor-pointer select-none">
                  Tôi đồng ý với <span className="font-bold text-[#C59B58]">Điều khoản sử dụng</span> &amp;{' '}
                  <span className="font-bold text-[#C59B58]">Chính sách bảo mật</span> của SCANMS.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Đang gửi mã OTP...' : 'Đăng ký tài khoản KOL / CTV'}</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-[#EAE4D7] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#7D715E] uppercase tracking-wider absolute">
                  Hoặc đăng ký với Google
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleRegister}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] transition cursor-pointer shadow-2xs"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.32 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Đăng ký nhanh qua Google</span>
              </button>

              <div className="text-center text-xs text-[#7D715E] mt-2 flex flex-col gap-2.5">
                <div>
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="font-bold text-[#C59B58] hover:underline">
                    Đăng nhập ngay →
                  </Link>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#C59B58] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-[#1A1612] block truncate">
                        Khách mua hàng trực tiếp
                      </strong>
                      <span className="text-[11px] text-[#7D715E] block truncate">
                        Không cần tài khoản đối tác để mua sắm
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/marketplace"
                    id="btn-goto-shopping-marketplace-register"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F] hover:text-[#92400E] shadow-2xs transition cursor-pointer"
                  >
                    <span>Vào mua sắm</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Xác Thực Mã OTP Email"
        subtitle={`Mã xác thực gồm 6 chữ số đã được gửi tới email ${registeredEmail}`}
        icon={<KeyRound className="w-5 h-5 text-amber-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-900 text-xs flex flex-col gap-1.5">
            {mockOtpHint ? (
              <div>
                <span>Mã OTP xác thực (Dev Mode):</span>{' '}
                <strong className="text-base font-mono font-bold tracking-widest text-amber-950 inline-block ml-1">
                  {mockOtpHint}
                </strong>
              </div>
            ) : (
              <div>Mã xác thực 6 chữ số đã được gửi tới email của bạn.</div>
            )}
            <div className="text-[11px] text-amber-800/85 pt-1 border-t border-amber-200/60">
              💡 <em>Kiểm thử nhanh: Bạn có thể nhập mã master <strong>123456</strong> để kích hoạt ngay.</em>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Nhập mã OTP</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-4 py-2.5 text-center text-xl tracking-widest font-mono font-bold text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full py-3 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Đang xác thực...' : 'Xác thực & Kích hoạt'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </Modal>
    </div>
  );
}
