import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Crown,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  ArrowLeft,
  Mail,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';
import { GoogleOfficialButton } from '../../components/auth/GoogleOfficialButton';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';

type RoleType = 'customer' | 'kol' | 'shop' | 'manager' | 'admin';

interface RoleOption {
  id: RoleType;
  label: string;
  icon: any;
  email: string;
  badge: string;
}

const ROLES: RoleOption[] = [
  { id: 'customer', label: 'Khách', icon: ShoppingBag, email: 'customer@scanms.vn', badge: 'Khách mua hàng' },
  { id: 'kol', label: 'KOL/CTV', icon: Sparkles, email: 'kol1@scanms.vn', badge: 'KOL / CTV Tiếp thị' },
  { id: 'shop', label: 'Chủ Shop', icon: Store, email: 'shop@scanms.vn', badge: 'Chủ Gian Hàng' },
  { id: 'manager', label: 'Vận hành', icon: ShieldCheck, email: 'manager@scanms.vn', badge: 'Vận hành (System Manager)' },
  { id: 'admin', label: 'Quản trị', icon: Crown, email: 'admin@scanms.vn', badge: 'Quản trị viên (Admin)' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Nhận redirect và email sau khi đăng ký
  const requestedRedirect = searchParams.get('redirect');
  const registeredProvider = searchParams.get('registered');
  const registeredEmail = searchParams.get('email');
  const returnTo =
    requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\')
      ? requestedRedirect
      : null;
  const registerUrl = returnTo ? `/register?redirect=${encodeURIComponent(returnTo)}` : '/register';

  const [role, setRole] = useState<RoleType>('customer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [email, setEmail] = useState(registeredEmail || 'customer@scanms.vn');
  const [password, setPassword] = useState(registeredEmail ? '' : 'Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (registeredProvider === 'email' && registeredEmail) {
      setEmail(registeredEmail);
      setPassword('');
      toast.success(`Đăng ký tài khoản ${registeredEmail} thành công! Vui lòng nhập mật khẩu để đăng nhập.`);
    }
  }, [registeredProvider, registeredEmail]);

  const activeRole = ROLES.find((x) => x.id === role) || ROLES[0];
  const ActiveRoleIcon = activeRole.icon;

  const handleRoleSelect = (selectedRole: RoleType) => {
    setRole(selectedRole);
    const r = ROLES.find((x) => x.id === selectedRole);
    if (r) {
      setEmail(r.email);
      setPassword('Password@123');
    }
    setError(null);
    setIsRoleDropdownOpen(false);
  };

  const navigateAfterLogin = (userRole?: string) => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (userRole === 'SHOP_MANAGER') {
      navigate('/merchant/dashboard');
    } else if (userRole === 'SYSTEM_ADMIN') {
      navigate('/admin/analytics');
    } else if (userRole === 'SYSTEM_MANAGER') {
      navigate('/admin/users');
    } else if (userRole === 'CUSTOMER') {
      navigate('/customer/orders');
    } else {
      navigate('/collaborator/dashboard');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await authService.login(email, password);
      const user = res?.data?.user || res?.user;
      toast.success(`Đăng nhập thành công! Chào mừng ${user?.fullName || user?.email}`);

      setTimeout(() => {
        navigateAfterLogin(user?.role);
      }, 350);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ Backend.'
          : err?.message || 'Email hoặc mật khẩu không chính xác.');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleTokenSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const apiRole =
        role === 'kol'
          ? 'COLLABORATOR'
          : role === 'shop'
          ? 'SHOP_MANAGER'
          : role === 'customer'
          ? 'CUSTOMER'
          : role === 'manager'
          ? 'SYSTEM_MANAGER'
          : 'SYSTEM_ADMIN';
      const res: any = await authService.googleLogin(idToken, apiRole);
      const user = res?.data?.user || res?.user;
      toast.success(`Đăng nhập Google thành công! Chào mừng ${user?.fullName || user?.email}`);
      navigateAfterLogin(user?.role);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại');
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
          className="w-full rounded-[28px] sm:rounded-[32px] border-2 border-[#EEDFC6] shadow-[0_24px_70px_rgba(197,155,88,0.16),0_10px_30px_rgba(26,22,18,0.06)] ring-1 ring-[#C59B58]/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:h-[620px] relative bg-[#FAF8F5]"
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

          {/* CỘT PHẢI: FORM ĐĂNG NHẬP GIAO DIỆN SANG TRỌNG (5 COLS = ~42%) */}
          <div className="relative w-full h-full lg:col-span-5 p-6 sm:p-8 lg:py-7 lg:pr-8 lg:pl-10 xl:pl-12 flex flex-col justify-between text-left">
            {/* Header: Tiêu đề căn giữa, phong cách hoàng gia như mockup */}
            <div className="relative z-20 text-center">
              <h2 className="font-display text-3xl sm:text-[34px] font-black tracking-tight text-[#1A1612]">
                Đăng <span className="font-display text-[#B88E4F]">nhập</span>
              </h2>
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#1A1612] mb-1">
                Vai trò đăng nhập:
              </label>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full h-11 px-3.5 bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-3 focus:ring-[#C59B58]/12 rounded-xl flex items-center justify-between transition shadow-2xs cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EAE4D7] flex items-center justify-center text-[#C59B58] shadow-2xs shrink-0">
                    <ActiveRoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black text-[#1A1612]">
                      {activeRole.label}
                    </span>
                    <span className="text-[11px] text-[#7D715E] font-medium hidden sm:inline">
                      • {activeRole.badge}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#7D715E] transition-transform duration-200 ${
                    isRoleDropdownOpen ? 'rotate-180 text-[#C59B58]' : ''
                  }`}
                />
              </button>

              {isRoleDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsRoleDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-[#EAE4D7] rounded-xl shadow-[0_16px_40px_rgba(26,22,18,0.12)] p-1.5 space-y-1">
                    {ROLES.map((r) => {
                      const isSelected = role === r.id;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleRoleSelect(r.id)}
                          className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#FBF5EB] text-[#1A1612] font-bold border border-[#EEDFC6]'
                              : 'hover:bg-[#FAF8F5] text-[#1A1612] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#C59B58] text-white shadow-xs'
                                  : 'bg-[#F3EFE6] text-[#7D715E]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight">
                                {r.label} — <span className="text-[#7D715E] font-normal">{r.badge}</span>
                              </div>
                              <div className="text-[10px] text-[#7D715E] font-mono">
                                {r.email}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#C59B58] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Social sign-in options */}
            <div className="w-full">
              <GoogleOfficialButton
                onSuccess={onGoogleTokenSuccess}
                onError={(err) => setError(err)}
                className="h-11"
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
              <div className="p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-xs text-[#DC2626] font-medium">
                {error}
              </div>
            )}

            {/* Form inputs */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email tài khoản"
                  className="w-full h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#A69986]"
                />
                <Mail className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mật khẩu"
                  className="w-full h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-11 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#A69986]"
                />
                <Lock className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#A69986] hover:text-[#1A1612] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-[#7D715E] hover:text-[#1A1612]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#EAE4D7] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                  />
                  <span>Ghi nhớ</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="font-medium text-[#B88E4F] hover:text-[#C59B58] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit button: Exact match to user mockup */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 btn-gold-glossy disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập an toàn'}</span>
              </button>
            </form>

            {/* Bottom switch link */}
            <div className="text-center pt-2 border-t border-[#EAE4D7] text-xs text-[#7D715E]">
              Chưa có tài khoản đối tác?{' '}
              <Link to={registerUrl} className="font-bold text-[#B88E4F] hover:underline">
                Đăng ký ngay →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-[1240px] mx-auto w-full pt-3 text-center text-xs text-[#7D715E] font-medium flex flex-wrap items-center justify-center gap-4">
        <span>© 2026 SCANMS Corporation</span>
        <span>•</span>
        <Link to="/marketplace" className="hover:underline">Sàn Thương Mại</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:underline">Chính sách bảo mật</Link>
        <span>•</span>
        <Link to="/terms" className="hover:underline">Điều khoản dịch vụ</Link>
      </footer>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
