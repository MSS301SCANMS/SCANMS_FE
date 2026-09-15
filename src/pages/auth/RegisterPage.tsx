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
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { triggerGoogleSignIn } from '../../utils/googleAuth';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../utils/toast';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng của SCANMS.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await authService.sendOtp(email);
      setRegisteredEmail(email);
      if (res?.data?.mockOtp) {
        setMockOtpHint(res.data.mockOtp);
      }
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã xác thực OTP. Vui lòng kiểm tra lại email.');
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
        otp,
      });

      toast.success('Kích hoạt tài khoản SCANMS thành công! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
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

      <div className="max-w-7xl mx-auto w-full mb-4 flex flex-wrap justify-between items-center gap-3 text-xs">
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

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

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

              {role === 'shop' && (
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên Gian Hàng / Doanh Nghiệp</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Sora Skin Official"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                  />
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
          {mockOtpHint && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              Mã OTP Demo thử nghiệm:{' '}
              <strong className="text-sm font-mono tracking-widest text-amber-900 block mt-0.5">
                {mockOtpHint}
              </strong>
            </div>
          )}

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
