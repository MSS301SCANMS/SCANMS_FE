import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Crown,
  ChevronDown,
  Check,
  ArrowLeft,
  UserRound,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';
import { GoogleOfficialButton } from '../../components/auth/GoogleOfficialButton';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import { ShoppingScene } from '../../components/auth/ShoppingScene';
import { AnimatedPasswordField, type PasswordAuthState } from '../../components/auth/AnimatedPasswordField';
import './LoginPage.css';
import { getDemoLogin } from '../../utils/demo-login';
import { getRememberedIdentifier, getRememberedLoginRole, rememberLoginIdentifier } from '../../utils/remembered-login';
import { safeLoginReturn } from '../../utils/login-return';

type RoleType = 'customer' | 'kol' | 'shop' | 'manager' | 'admin';

interface RoleOption {
  id: RoleType;
  label: string;
  icon: any;
  email: string;
  badge: string;
}

const ROLES: RoleOption[] = [
  { id: 'customer', label: 'Khách mua', icon: ShoppingBag, email: 'customer01@seed.scanms.test', badge: 'Nguyễn Văn An (Có 2 đơn hàng)' },
  { id: 'kol', label: 'KOL/KOC', icon: Sparkles, email: 'kol01@seed.scanms.test', badge: 'Hà My Skincare (Kênh TikTok, Bạc)' },
  { id: 'shop', label: 'Chủ Shop', icon: Store, email: 'shop01@seed.scanms.test', badge: 'Cỏ Mềm Official (Kho GHN, 2 SP)' },
  { id: 'manager', label: 'Vận hành', icon: ShieldCheck, email: 'manager@scanms.vn', badge: 'Ban Vận Hành & Tuân Thủ (Manager)' },
  { id: 'admin', label: 'Quản trị', icon: Crown, email: 'admin@seed.scanms.test', badge: 'Quản Trị Viên Toàn Hệ Thống (Admin)' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Nhận redirect và email sau khi đăng ký
  const requestedRedirect = searchParams.get('redirect');
  const registeredProvider = searchParams.get('registered');
  const registeredEmail = searchParams.get('email');
  const returnTo = safeLoginReturn(requestedRedirect);
  const registerUrl = returnTo ? `/register?redirect=${encodeURIComponent(returnTo)}` : '/register';

  const [role, setRole] = useState<RoleType>(() => {
    const requestedRole = searchParams.get('role')?.toLowerCase();
    const normalizedRole = requestedRole === 'collaborator' ? 'kol' : requestedRole;
    if (ROLES.some(option => option.id === normalizedRole)) return normalizedRole as RoleType;
    return registeredEmail ? 'customer' : getRememberedLoginRole();
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [identifier, setIdentifier] = useState(() => registeredEmail || getRememberedIdentifier(role) || getDemoLogin(role)?.identifier || '');
  const [password, setPassword] = useState(() => registeredEmail || getRememberedIdentifier(role) ? '' : getDemoLogin(role)?.password || '');
  const [passwordAuthState, setPasswordAuthState] = useState<PasswordAuthState>('idle');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (registeredProvider === 'email' && registeredEmail) {
      setIdentifier(registeredEmail);
      setPassword('');
      toast.success(`Đăng ký tài khoản ${registeredEmail} thành công! Vui lòng nhập mật khẩu để đăng nhập.`);
    }
  }, [registeredProvider, registeredEmail]);

  const activeRole = ROLES.find((x) => x.id === role) || ROLES[0];
  const ActiveRoleIcon = activeRole.icon;
  const demoLogin = Boolean(getDemoLogin(role)?.identifier && identifier === getDemoLogin(role)?.identifier);

  const handleRoleSelect = (selectedRole: RoleType) => {
    if (loading || passwordAuthState === 'success') return;
    if (selectedRole !== role) {
      const account = getDemoLogin(selectedRole);
      const remembered = getRememberedIdentifier(selectedRole);
      setIdentifier(remembered || account?.identifier || '');
      setPassword(remembered ? '' : account?.password || '');
    }
    setPasswordAuthState('idle');
    setRole(selectedRole);
    setError(null);
    setIsRoleDropdownOpen(false);
  };

  const navigateAfterLogin = (userRole?: string, _fromGoogle = false) => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    const current = authService.getCurrentUser();
    const role = userRole || current?.role;
    const workspaces = authService.getUserAvailableWorkspaces(current).map((w) => w.key);

    if (role === 'SHOP_MANAGER' || role === 'SHOP_OWNER' || workspaces.includes('shop')) {
      navigate('/merchant/dashboard');
    } else if (role === 'SYSTEM_MANAGER') {
      navigate('/admin/ops-dashboard');
    } else if (role === 'SYSTEM_ADMIN') {
      navigate('/admin/dashboard');
    } else if (role === 'COLLABORATOR' || workspaces.includes('kol')) {
      navigate('/collaborator/dashboard');
    } else {
      // Customer (kể cả Google) → sàn mua sắm
      navigate('/marketplace');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || passwordAuthState === 'success') return;
    setError(null);
    setLoading(true);
    setPasswordAuthState('checking');
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const submittedIdentifier = String(formData.get('username') || identifier).trim();
    const submittedPassword = String(formData.get('password') || password);

    try {
      const res: any = await authService.login(submittedIdentifier, submittedPassword);
      const user = res?.user || res?.data?.user || authService.getCurrentUser();
      const loginRole: RoleType = ({
        CUSTOMER: 'customer',
        COLLABORATOR: 'kol',
        SHOP_MANAGER: 'shop',
        SHOP_OWNER: 'shop',
        SYSTEM_MANAGER: 'manager',
        SYSTEM_ADMIN: 'admin',
      } as Record<string, RoleType>)[user?.role] || role;
      rememberLoginIdentifier(loginRole, submittedIdentifier, rememberMe);
      setPasswordAuthState('success');
      toast.success(`Đăng nhập thành công! Chào mừng ${user?.fullName || user?.email}`);

      setTimeout(() => {
        navigateAfterLogin(user?.role, false);
      }, 350);
    } catch (err: any) {
      setPasswordAuthState('error');
      const errorMsg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ Backend.'
          : err?.message || 'Email, số điện thoại hoặc mật khẩu không chính xác.');
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
      const user = res?.user || res?.data?.user || authService.getCurrentUser();
      toast.success(`Đăng nhập Google thành công! Chào mừng ${user?.fullName || user?.email}`);
      navigateAfterLogin(user?.role, true);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanms-login-page selection:bg-[#EEDFC6] selection:text-[#1A1612]">
      <header className="login-page-header">
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

      <main className="login-page-main">
        <div className="login-experience">
          <section className="login-showcase" aria-label="Kết nối mua sắm cùng SCANMS">
            <div className="login-showcase-copy">
              <div className="login-showcase-eyebrow"><Sparkles size={14} /><span>Sàn Thương Mại Đối Tác</span></div>
              <h1 className="font-display">Kết nối gian hàng,<br /><span>lan tỏa giá trị.</span></h1>
            </div>
            <ShoppingScene quiet={isForgotPasswordOpen} />
          </section>

          <div className="login-form-panel">
            <div className="login-form-heading">
              <h2 className="font-display">Đăng <span>nhập</span></h2>
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <label id="login-role-label" className="block text-xs font-bold text-[#1A1612] mb-1">
                Vai trò đăng nhập:
              </label>
              <button
                type="button"
                aria-labelledby="login-role-label login-role-value"
                aria-expanded={isRoleDropdownOpen}
                aria-controls="login-role-options"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsRoleDropdownOpen(false); }}
                className="w-full h-11 px-3.5 bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-3 focus:ring-[#C59B58]/12 rounded-xl flex items-center justify-between transition shadow-2xs cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EAE4D7] flex items-center justify-center text-[#C59B58] shadow-2xs shrink-0">
                    <ActiveRoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span id="login-role-value" className="text-xs font-black text-[#1A1612]">
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
                  <div id="login-role-options" onKeyDown={(e) => { if (e.key === 'Escape') { setIsRoleDropdownOpen(false); document.querySelector<HTMLButtonElement>('[aria-controls="login-role-options"]')?.focus(); } }} className="login-role-options absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-[#EAE4D7] rounded-xl shadow-[0_16px_40px_rgba(26,22,18,0.12)] p-1.5 space-y-1">
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
                                {r.label} · <span className="text-[#7D715E] font-normal">{r.badge}</span>
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
                hoặc email / số điện thoại
              </span>
            </div>

            {error && (
              <div role="alert" className="p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-xs text-[#DC2626] font-medium">
                {error}
              </div>
            )}

            {/* Form inputs */}
            {searchParams.get('sessionChanged') === '1' && <p role="status" className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2.5 text-xs leading-relaxed text-[#7D715E]">
              Tài khoản đã được thay đổi ở tab khác. Đăng nhập tài khoản {activeRole.label} để tiếp tục trang vừa mở.
            </p>}
            <form key={role} name="scanms-login" autoComplete="on" onSubmit={handleSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <label htmlFor="login-identifier" className="sr-only">Email hoặc số điện thoại đã đăng ký</label>
                <input
                  id="login-identifier"
                  name="username"
                  type="text"
                  autoComplete={demoLogin ? 'off' : `section-${role} username`}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={254}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setPasswordAuthState('idle'); }}
                  required
                  placeholder="Email hoặc số điện thoại đã đăng ký"
                  className="w-full h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/12 rounded-xl pl-10 pr-4 text-xs font-medium text-[#1A1612] outline-hidden transition placeholder:text-[#A69986]"
                />
                <UserRound className="w-4 h-4 text-[#A69986] absolute left-3.5 pointer-events-none" />
              </div>

              <label className="sr-only" htmlFor="login-password">Mật khẩu</label>
              <AnimatedPasswordField
                autoComplete="current-password"
                name="password"
                value={password}
                state={passwordAuthState}
                onChange={(value) => { setPassword(value); setPasswordAuthState('idle'); }}
              />

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

              <button
                type="submit"
                disabled={loading || passwordAuthState === 'success'}
                className="login-submit disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập an toàn'}</span>
              </button>
            </form>

            {/* Bottom switch link */}
            <div className="login-register-link">
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
