import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  User,
  Mail,
  Lock,
  Gift,
  AtSign,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { GoogleOfficialButton } from '../../components/auth/GoogleOfficialButton';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import { toast } from '../../utils/toast';
import { registrationErrorMessage } from '../../utils/registration-error';
import { loginDestination } from '../../utils/workspace-access';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedRedirect = searchParams.get('redirect');
  const initialRef = searchParams.get('ref') || '';
  const returnTo =
    requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\')
      ? requestedRedirect
      : null;
  const loginUrl = returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : '/login';

  // Các trường khớp với BE RegisterRequest: username, email, password, firstName, lastName.
  const [username, setUsername] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(initialRef);
  const [showReferralInput, setShowReferralInput] = useState(Boolean(initialRef));
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (!lastName.trim() || !firstName.trim()) {
      setError('Vui lòng nhập đầy đủ họ và tên.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng của SCANMS.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authService.register({
        username: username.trim(),
        email: normalizedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      toast.success('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');

      try {
        await authService.login(normalizedEmail, password);
        const destination = loginDestination(authService.getCurrentUser(), returnTo || '/customer/orders');
        authService.setActiveWorkspace(destination.workspace);
        navigate(destination.path);
      } catch {
        const dest = returnTo
          ? `/login?registered=email&email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(returnTo)}`
          : `/login?registered=email&email=${encodeURIComponent(normalizedEmail)}`;
        navigate(dest);
      }
    } catch (err: any) {
      setError(registrationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleRegisterSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      await authService.googleLogin(idToken, 'CUSTOMER');
      toast.success('Đăng ký & xác thực Google thành công!');
      const destination = loginDestination(authService.getCurrentUser(), returnTo || '/customer/orders');
      authService.setActiveWorkspace(destination.workspace);
      navigate(destination.path);
    } catch (err: any) {
      setError(err.message || 'Đăng ký qua Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#1A1612] flex flex-col justify-between py-4 px-4 sm:px-8 lg:px-14 selection:bg-[#EEDFC6] selection:text-[#1A1612]">
      <header className="max-w-[1240px] mx-auto w-full flex justify-between items-center py-2">
        <Link to="/marketplace" className="hover:opacity-95 transition-opacity">
          <ScanMSLogo size="md" showSubtitle={true} />
        </Link>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE4D7] text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] hover:border-[#C59B58] transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C59B58]" />
          <span>Sàn mua sắm</span>
        </Link>
      </header>

      <main className="max-w-[1180px] mx-auto w-full my-auto py-2 sm:py-3">
        <div
          className="w-full rounded-[28px] sm:rounded-[32px] border-2 border-[#EEDFC6] shadow-[0_24px_70px_rgba(197,155,88,0.16),0_10px_30px_rgba(26,22,18,0.06)] ring-1 ring-[#C59B58]/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:h-[660px] relative bg-[#FAF8F5]"
          style={{
            backgroundImage: "url('/assets/auth_luxury_card_inner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* CỘT TRÁI: MỞ RỘNG (7 COLS = ~58%) - KHÔNG GIAN SẢN PHẨM & SLOGAN HOÀNG GIA */}
          <div className="relative w-full h-[280px] sm:h-[340px] lg:h-full lg:col-span-7 overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-12">
            {/* Top-Left Section: Glassmorphic Badge & Slogan */}
            <div className="relative z-20 space-y-3.5 max-w-md">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#EEDFC6] text-[#1A1612] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                <span>Sàn Thương Mại Đối Tác</span>
              </div>

              <h1 className="font-display italic text-2xl sm:text-3xl lg:text-[36px] leading-[1.18] tracking-tight drop-shadow-xs text-[#1A1612]">
                Kết nối gian hàng,<br />
                <span className="font-display italic text-[#B88E4F]">
                  lan tỏa giá trị.
                </span>
              </h1>
            </div>

            {/* Dưới chân để thoáng cho các sản phẩm và hộp quà travertine */}
            <div className="relative z-20" />
          </div>

          {/* CỘT PHẢI: FORM ĐĂNG KÝ GIAO DIỆN SANG TRỌNG (5 COLS = ~42%) */}
          <div className="relative w-full h-full lg:col-span-5 p-6 sm:p-8 lg:py-7 lg:pr-8 lg:pl-10 xl:pl-12 flex flex-col justify-between text-left overflow-y-auto">
            {/* Header: Tiêu đề căn giữa, phong cách hoàng gia như mockup */}
            <div className="relative z-20 text-center">
              <h2 className="font-display text-3xl sm:text-[34px] font-black tracking-tight text-[#1A1612]">
                Đăng <span className="font-display text-[#B88E4F]">ký</span>
              </h2>
            </div>

            {/* Google Button */}
            <div className="w-full">
              <GoogleOfficialButton
                onSuccess={onGoogleRegisterSuccess}
                onError={(err) => setError(err)}
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-[#EAE4D7] w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-[#7D715E] uppercase tracking-wider absolute">
                hoặc email
              </span>
            </div>

            {error && (
              <div role="alert" className="p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-xs text-[#DC2626] font-medium">
                {error}
                {error.includes('đã') && <div className="mt-2 flex gap-4">
                  <Link className="underline" to={`${loginUrl}${returnTo ? '&' : '?'}email=${encodeURIComponent(email.trim())}`}>Đăng nhập</Link>
                  <button type="button" className="underline" onClick={() => setForgotPasswordOpen(true)}>Quên mật khẩu</button>
                </div>}
              </div>
            )}

            {/* Form inputs */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Tên đăng nhập */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                  className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                />
                <AtSign className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
              </div>

              {/* Họ & Tên */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Họ"
                    className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                  />
                  <User className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Tên"
                    className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-4 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Địa chỉ Email"
                  autoComplete="email"
                  className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                />
                <Mail className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mật khẩu"
                    autoComplete="new-password"
                    className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-9 pr-8 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#A69986] absolute left-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-[#A69986] hover:text-[#1A1612] p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    className="w-full h-10.5 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-9 pr-8 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#A69986] absolute left-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-[#A69986] hover:text-[#1A1612] p-0.5 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mã giới thiệu đối tác (Collapsible) — chỉ hiển thị UI, BE hiện chưa xử lý trường này */}
              <div className="pt-0.5">
                {!showReferralInput ? (
                  <button
                    type="button"
                    onClick={() => setShowReferralInput(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B88E4F] hover:text-[#C59B58] transition cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Có mã giới thiệu đối tác?</span>
                  </button>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Mã giới thiệu đối tác (Tùy chọn)"
                      className="w-full h-9 bg-[#FBF5EB] border border-[#EEDFC6] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:bg-white focus:ring-3 focus:ring-[#C59B58]/12 rounded-xl pl-9 pr-3 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#9E917F]"
                    />
                    <Gift className="w-3.5 h-3.5 text-[#C59B58] absolute left-3 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Điều khoản sử dụng */}
              <div className="text-[11px] text-[#7D715E] pt-0.5 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#EAE4D7] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="cursor-pointer leading-snug">
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="text-[#B88E4F] hover:underline font-semibold">Điều khoản</Link> và{' '}
                  <Link to="/privacy" className="text-[#B88E4F] hover:underline font-semibold">Chính sách</Link> của SCANMS.
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 btn-gold-glossy disabled:opacity-50"
              >
                <span>{loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}</span>
              </button>
            </form>

            {/* Bottom switch link */}
            <div className="text-center pt-2 border-t border-[#EAE4D7] text-xs text-[#7D715E]">
              Đã có tài khoản?{' '}
              <Link to={loginUrl} className="font-bold text-[#B88E4F] hover:underline">
                Đăng nhập ngay →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <ForgotPasswordModal isOpen={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} defaultEmail={email.trim()} />
      <footer className="max-w-[1240px] mx-auto w-full pt-3 text-center text-xs text-[#7D715E] font-medium flex flex-wrap items-center justify-center gap-4">
        <span>© 2026 SCANMS Corporation</span>
        <span>•</span>
        <Link to="/marketplace" className="hover:underline">Sàn Thương Mại</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:underline">Chính sách bảo mật</Link>
        <span>•</span>
        <Link to="/terms" className="hover:underline">Điều khoản dịch vụ</Link>
      </footer>
    </div>
  );
}
