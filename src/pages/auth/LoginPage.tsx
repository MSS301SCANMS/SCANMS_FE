import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Store,
  ShieldCheck,
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  QrCode,
  Network,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { triggerGoogleSignIn } from '../../utils/googleAuth';
import { toast } from '../../utils/toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'kol' | 'shop' | 'admin'>('kol');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const DEMO_ACCOUNTS = [
    {
      role: 'kol' as const,
      name: 'Nguyễn Thành Thắng',
      title: 'Top KOL Vàng (Leader)',
      email: 'kol1@scanms.vn',
      password: 'Password@123',
    },
    {
      role: 'kol' as const,
      name: 'Trần Văn Nhật',
      title: 'KOL Hạng Vàng',
      email: 'demo@scanms.vn',
      password: 'Password@123',
    },
    {
      role: 'shop' as const,
      name: 'Sora Skin Official',
      title: 'Chủ Gian Hàng',
      email: 'shop@scanms.vn',
      password: 'Password@123',
    },
    {
      role: 'admin' as const,
      name: 'Nguyễn Quản Trị',
      title: 'Super Admin',
      email: 'admin@scanms.vn',
      password: 'Password@123',
    },
  ];

  const handleRoleChange = (selectedRole: 'kol' | 'shop' | 'admin') => {
    setRole(selectedRole);
  };

  const handleQuickLogin = async (
    targetRole: 'kol' | 'shop' | 'admin',
    targetEmail: string,
    targetPass: string = 'Password@123',
    autoSubmit: boolean = false
  ) => {
    setRole(targetRole);
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);

    if (autoSubmit) {
      setLoading(true);
      try {
        const res: any = await authService.login(targetEmail, targetPass);
        const user = res.data?.user || res.user;

        setSuccessNotice(`Đăng nhập thành công với vai trò ${user?.fullName || targetEmail}!`);

        setTimeout(() => {
          if (user?.role === 'SHOP_MANAGER') {
            navigate('/merchant/dashboard');
          } else if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'SYSTEM_MANAGER') {
            navigate('/admin/analytics');
          } else {
            navigate('/collaborator/dashboard');
          }
        }, 500);
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
            ? 'Không thể kết nối đến máy chủ Backend (cổng 3000). Vui lòng đảm bảo backend đang chạy trên http://localhost:3000.'
            : err?.message || 'Đăng nhập không thành công');
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const res: any = await authService.login(email, password);
      const user = res?.data?.user || res?.user;

      setSuccessNotice('Đăng nhập thành công! Đang chuyển hướng...');

      setTimeout(() => {
        if (user?.role === 'SHOP_MANAGER') {
          navigate('/merchant/dashboard');
        } else if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'SYSTEM_MANAGER') {
          navigate('/admin/analytics');
        } else {
          navigate('/collaborator/dashboard');
        }
      }, 600);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ Backend (cổng 3000). Vui lòng đảm bảo backend đang chạy trên http://localhost:3000.'
          : err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu.');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setLoading(true);
    triggerGoogleSignIn(
      async (idToken: string) => {
        try {
          const apiRole =
            role === 'kol' ? 'COLLABORATOR' : role === 'shop' ? 'SHOP_MANAGER' : 'SYSTEM_ADMIN';
          const res: any = await authService.googleLogin(idToken, apiRole);
          const user = res?.data?.user || res?.user;
          if (user?.role === 'SHOP_MANAGER') {
            navigate('/merchant/dashboard');
          } else if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'SYSTEM_MANAGER') {
            navigate('/admin/analytics');
          } else {
            navigate('/collaborator/dashboard');
          }
        } catch (err: any) {
          setError(err.message || 'Đăng nhập Google thất bại');
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
          id="btn-back-to-marketplace"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-bold hover:bg-[#F3EFE6] transition shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#B88E4F] group-hover:-translate-x-1 transition-transform" />
          <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
          <span>Quay về Sàn Mua Sắm Chính (SCANMS Marketplace)</span>
        </Link>
        <span className="text-[#7D715E] hidden sm:inline font-semibold">
          Cổng Đăng Nhập Quản Trị Hệ Thống SCANMS
        </span>
      </div>

      <div className="max-w-[1520px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

        <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#EAE4D7] rounded-3xl p-7 sm:p-10 flex flex-col justify-between gap-6 text-left relative overflow-hidden shadow-xs">

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

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#B88E4F] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-amber-100" />
              </div>
              <div>
                <strong className="text-xl font-extrabold text-[#1A1612] tracking-tight block">
                  SCANMS
                </strong>
                <span className="text-[11px] font-bold text-[#B88E4F] uppercase tracking-wider block">
                  QUẢN LÝ ĐỘI NGŨ CTV &amp; TIẾP THỊ LIÊN KẾT
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-[#B88E4F]" />
              <span>Chuẩn Đề Án FA26SE032 • Quản Trị Mạng Lưới CTV Toàn Diện</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1612] tracking-tight leading-tight m-0">
              Quản trị mạng lưới CTV &amp;{' '}
              <span className="text-[#B88E4F]">bứt phá doanh số tiếp thị.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#7D715E] leading-relaxed max-w-2xl m-0">
              Không gian hợp nhất kết nối hàng ngàn cộng tác viên bán hàng, phát hành link &amp; QR
              định danh, đối soát hoa hồng minh bạch và mở rộng kênh phân phối vượt trội.
            </p>

            <div className="bg-white/95 backdrop-blur-xs p-5 rounded-2xl border border-[#EAE4D7] shadow-xs flex flex-col gap-3 my-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B88E4F]">
                  <QrCode className="w-4 h-4" />
                  <span>• CÔNG NGHỆ ĐỊNH DANH</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                  QR Động 1 Chạm
                </span>
              </div>
              <strong className="text-base font-extrabold text-[#1A1612]">
                Dynamic QR &amp; Smart Link
              </strong>
              <p className="text-xs text-[#7D715E] m-0">
                Tự động gắn mã CTV &amp; tracking đa kênh. Phân bổ hoa hồng chính xác theo cơ chế Last-Click.
              </p>

              <div className="pt-2 border-t border-[#EAE4D7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-[#B88E4F]">
                  <Network className="w-4 h-4" />
                  <span>Sơ Đồ Phân Cấp &amp; Đối Soát Tự Động 100%</span>
                </div>
                <span className="text-[11px] text-[#7D715E] font-semibold">Cookie 30 Ngày</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1A1612] border border-[#EAE4D7] text-xs font-bold shadow-2xs">
                <span className="text-[#B88E4F] font-black">✓</span> Định Danh CTV Đa Kênh
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1A1612] border border-[#EAE4D7] text-xs font-bold shadow-2xs">
                <span className="text-[#B88E4F] font-black">✓</span> QR Động 1 Chạm
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1A1612] border border-[#EAE4D7] text-xs font-bold shadow-2xs">
                <span className="text-[#B88E4F] font-black">✓</span> Đối Soát Tự Động 100%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-[#EAE4D7] text-center shadow-2xs">
                <strong className="text-xs sm:text-sm font-extrabold text-[#1A1612] block">Đa Nền Tảng</strong>
                <span className="text-[11px] text-[#7D715E]">TikTok, Shopee, Web</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EAE4D7] text-center shadow-2xs">
                <strong className="text-xs sm:text-sm font-extrabold text-[#1A1612] block">Đối Soát 100%</strong>
                <span className="text-[11px] text-[#7D715E]">Tự động khớp đơn</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EAE4D7] text-center shadow-2xs">
                <strong className="text-xs sm:text-sm font-extrabold text-[#1A1612] block">Cookie 30 Ngày</strong>
                <span className="text-[11px] text-[#7D715E]">Lưu vết Last-Click</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[#EAE4D7] flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-[#7D715E]">
            <div className="flex items-center gap-3">
              <span>• Hệ thống hoạt động 99.98% SLA</span>
              <span>🛡 Mã hóa JWT &amp; Bcrypt</span>
              <span>🔒 RBAC 5 vai trò</span>
            </div>
            <span>© 2026 SCANMS — Mạng Lưới Tiếp Thị Liên Kết</span>
          </div>
        </div>

        <div className="lg:col-span-5 w-full flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-[#EAE4D7] shadow-lg p-6 sm:p-8 flex flex-col gap-5 text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
                Chào mừng trở lại
              </h2>
              <p className="text-xs sm:text-sm text-[#7D715E] mt-1.5 m-0">
                Chọn vai trò và đăng nhập vào không gian của bạn.
              </p>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl">
                <button
                  type="button"
                  onClick={() => handleRoleChange('kol')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                  onClick={() => handleRoleChange('shop')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                  onClick={() => handleRoleChange('admin')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    role === 'admin'
                      ? 'bg-white text-[#B88E4F] shadow-xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Quản trị Sàn</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
            {successNotice && (
              <div className="p-3 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl text-[#B88E4F] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#B88E4F]" />
                <span>{successNotice}</span>
              </div>
            )}

            <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-extrabold text-[#B88E4F] uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#B88E4F] fill-current" />
                  Tài khoản mẫu thử nghiệm (Tuỳ chọn)
                </span>
                <span className="text-[10px] text-[#7D715E] font-medium">
                  Mật khẩu chung: <code className="font-bold text-[#1A1612]">Password@123</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => handleQuickLogin(acc.role, acc.email, acc.password, false)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-[#FBF5EB] border-[#B88E4F] ring-1 ring-[#B88E4F]/40'
                          : 'bg-white border-[#EAE4D7] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="text-xs font-bold text-[#1A1612] truncate block">
                          {acc.name}
                        </strong>
                        <span className="text-[10px] text-[#7D715E] truncate block">
                          {acc.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(acc.role, acc.email, acc.password, true);
                        }}
                        className="px-2 py-0.5 bg-[#B88E4F] hover:bg-[#9E7933] text-white rounded text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                        title="Đăng nhập ngay"
                      >
                        Vào
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Email đăng nhập</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'shop'
                      ? 'shop@example.com'
                      : role === 'admin'
                      ? 'admin@scanms.vn'
                      : 'kol@example.com'
                  }
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Mật khẩu</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.')}
                    className="text-xs font-semibold text-[#B88E4F] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[#1A1612] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
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

              <div className="flex items-center gap-2">
                <input
                  id="remember-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#EAE4D7] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                />
                <label htmlFor="remember-checkbox" className="text-xs text-[#7D715E] cursor-pointer select-none">
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Đang xử lý...' : 'Đăng nhập an toàn'}</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-[#EAE4D7] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#7D715E] uppercase tracking-wider absolute">
                  HOẶC ĐĂNG NHẬP NHANH
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] transition cursor-pointer shadow-2xs"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.32 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info('Đăng nhập TikTok Open API đang được bảo trì.')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] transition cursor-pointer shadow-2xs"
                >
                  <span className="font-extrabold text-sm">🎵</span>
                  <span>TikTok</span>
                </button>
              </div>

              <div className="text-center text-xs text-[#7D715E] mt-2 flex flex-col gap-3">
                <div>
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="font-bold text-[#C59B58] hover:underline">
                    Đăng ký thành viên ngay →
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
                        Không cần đăng nhập để đặt mua sản phẩm
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/marketplace"
                    id="btn-goto-shopping-marketplace"
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
    </div>
  );
}
