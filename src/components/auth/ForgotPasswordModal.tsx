import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onPasswordResetSuccess?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step >= 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await authService.sendForgotPasswordOtp(email.trim());
      toast.success(res?.message || 'Mã xác thực đã được gửi về email của bạn');
      setStep(2);
      setCountdown(300);
      setCanResend(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Mã OTP phải có đúng 6 chữ số');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await authService.verifyResetOtp(email.trim(), otp.trim());
      toast.success(res?.message || 'Mã xác thực hợp lệ');
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã xác thực không chính xác hoặc đã hết hạn';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend && countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await authService.sendForgotPasswordOtp(email.trim());
      toast.success('Đã gửi lại mã OTP mới về email của bạn');
      setCountdown(300);
      setCanResend(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi gửi lại mã OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success(res?.message || 'Đặt lại mật khẩu thành công!');
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email.trim());
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1612]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-[28px] border border-[#EAE4D7] shadow-2xl p-6 sm:p-8 text-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1A1612] m-0">Khôi phục mật khẩu</h3>
            <p className="text-xs text-[#7D715E] m-0 font-medium">Bảo mật xác thực qua OTP Email 2 lớp</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-6 px-1">
          <div className="flex items-center gap-1.5 flex-1">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 1 ? 'bg-[#B88E4F] text-white' : 'bg-[#F3EFE6] text-[#7D715E]'
              }`}
            >
              1
            </span>
            <span className="text-[11px] font-bold text-[#1A1612]">Email</span>
          </div>
          <div className={`h-[2px] flex-1 ${step >= 2 ? 'bg-[#B88E4F]' : 'bg-[#EAE4D7]'}`} />
          <div className="flex items-center gap-1.5 flex-1">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 2 ? 'bg-[#B88E4F] text-white' : 'bg-[#F3EFE6] text-[#7D715E]'
              }`}
            >
              2
            </span>
            <span className="text-[11px] font-bold text-[#1A1612]">Mã OTP</span>
          </div>
          <div className={`h-[2px] flex-1 ${step >= 3 ? 'bg-[#B88E4F]' : 'bg-[#EAE4D7]'}`} />
          <div className="flex items-center gap-1.5 flex-1">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 3 ? 'bg-[#B88E4F] text-white' : 'bg-[#F3EFE6] text-[#7D715E]'
              }`}
            >
              3
            </span>
            <span className="text-[11px] font-bold text-[#1A1612]">Mật khẩu</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1612] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Email tài khoản đã đăng ký</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@scanms.vn"
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1612] font-medium focus:bg-white focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/15 outline-none transition"
              />
              <span className="text-[11px] text-[#7D715E] block mt-1">
                Hệ thống sẽ gửi mã OTP 6 chữ số đến địa chỉ email này để xác minh.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                <>
                  <span>Gửi mã OTP xác thực</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mã OTP 6 chữ số</span>
                </label>
                <span className="text-[11px] font-bold text-[#B88E4F] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatCountdown(countdown)}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-center text-lg tracking-[8px] font-extrabold text-[#B88E4F] focus:bg-white focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/15 outline-none transition"
              />
              <div className="flex items-center justify-between mt-2 text-[11px] text-[#7D715E]">
                <span>Gửi tới: <strong className="text-[#1A1612]">{email}</strong></span>
                <button
                  type="button"
                  disabled={!canResend && countdown > 0}
                  onClick={handleResendOtp}
                  className="font-bold text-[#B88E4F] hover:underline cursor-pointer disabled:opacity-40"
                >
                  Gửi lại mã
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Xác nhận mã OTP</span>}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1612] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Mật khẩu mới (Băm Argon2id)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  required
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[#1A1612] font-medium focus:bg-white focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/15 outline-none transition"
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
              <label className="block text-xs font-bold text-[#1A1612] mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Xác nhận mật khẩu mới</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                required
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1612] font-medium focus:bg-white focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/15 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đổi mật khẩu &amp; Đăng nhập ngay</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
