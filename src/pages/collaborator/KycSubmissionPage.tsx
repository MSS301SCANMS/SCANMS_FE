import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CreditCard,
  QrCode,
  Building2,
  User,
  FileText,
  Send,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { kycService, type KycProfile } from '../../services/kyc.service';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function KycSubmissionPage() {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const defaultName = currentUser?.fullName
    ? currentUser.fullName
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
    : 'NGUYEN THANH THANG';

  const [idCardNumber, setIdCardNumber] = useState('079201008899');
  const [taxCode, setTaxCode] = useState('8594028193');
  const [bankName, setBankName] = useState('MBBank (Quân Đội)');
  const [bankAccountNumber, setBankAccountNumber] = useState('999988887777');
  const [bankAccountName, setBankAccountName] = useState(defaultName);
  const [bio, setBio] = useState('KOL chuyên review Skincare & Mỹ phẩm chính hãng');

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    try {
      const p = await kycService.getMyKyc();
      setProfile(p);
      if (p.idCardNumber) setIdCardNumber(p.idCardNumber);
      if (p.taxCode) setTaxCode(p.taxCode);
      if (p.bankName) setBankName(p.bankName);
      if (p.bankAccountNumber) setBankAccountNumber(p.bankAccountNumber);
      if (p.bankAccountName) setBankAccountName(p.bankAccountName);
      if (p.bio) setBio(p.bio);
    } catch (err) {
      console.error('Lỗi tải KYC:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await kycService.submitKyc({
        idCardNumber,
        taxCode,
        bankName,
        bankAccountNumber,
        bankAccountName,
        bio,
      });
      showToast('Nộp hồ sơ định danh KYC thành công! Vui lòng chờ phê duyệt.');
      loadKyc();
    } catch (err: any) {
      showToast(err.message || 'Lỗi nộp hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const status = profile?.kycStatus || (profile as any)?.status || 'VERIFIED';
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
          Xác Minh Định Danh Tài Chính (KYC)
        </h1>
        <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
          Theo quy định thuế TNCN và chính sách chống gian lận, bạn cần định danh tài khoản trước khi yêu cầu rút hoa hồng.
        </p>
      </header>

      <Card
        className={`p-5 sm:p-6 border transition ${
          isVerified
            ? 'bg-[#FBF5EB] border-[#EEDFC6]'
            : 'bg-white border-[#EAE4D7]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isVerified
                ? 'bg-[#EEDFC6] text-[#B88E4F]'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <strong className="text-sm sm:text-base font-extrabold text-[#1A1612]">
                {isVerified
                  ? 'Hồ sơ đã được xác minh thành công (Cấp độ 2)'
                  : isPending
                  ? 'Hồ sơ đang chờ phê duyệt từ Ban Quản Trị'
                  : 'Chưa hoàn tất định danh tài chính'}
              </strong>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isVerified ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
              </span>
            </div>
            <p className="text-xs text-[#7D715E] leading-relaxed m-0">
              {isVerified
                ? 'Tài khoản của bạn đã đủ điều kiện rút tiền tự động qua VietQR 24/7 và hưởng hạn mức rút tối đa không giới hạn.'
                : 'Hồ sơ đã được tiếp nhận. Đội ngũ kiểm soát gian lận sẽ thẩm định thông tin trong vòng 2-4 giờ làm việc.'}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 bg-white border border-[#EAE4D7]">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-[#1A1612]">Ảnh CCCD Mặt Trước</span>
            <span className="text-[11px] text-emerald-600 font-bold">✓ Hợp lệ</span>
          </div>
          <div className="h-32 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE4D7] flex flex-col items-center justify-center p-3 text-center">
            <CreditCard className="w-7 h-7 text-[#B88E4F] mb-1" />
            <strong className="text-xs text-[#1A1612]">CCCD_MatTruoc_{idCardNumber}.jpg</strong>
            <span className="text-[10px] text-[#7D715E] mt-0.5">Đã quét OCR: 079201008899</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-[#EAE4D7]">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-[#1A1612]">Ảnh CCCD Mặt Sau</span>
            <span className="text-[11px] text-emerald-600 font-bold">✓ Hợp lệ</span>
          </div>
          <div className="h-32 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE4D7] flex flex-col items-center justify-center p-3 text-center">
            <QrCode className="w-7 h-7 text-[#B88E4F] mb-1" />
            <strong className="text-xs text-[#1A1612]">CCCD_MatSau_VanTay.jpg</strong>
            <span className="text-[10px] text-[#7D715E] mt-0.5">Chip &amp; Mã QR bảo mật</span>
          </div>
        </Card>
      </div>

      <Card className="p-6 sm:p-7 bg-white border border-[#EAE4D7]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Số CMND / CCCD (12 số)
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                placeholder="VD: 079201008899"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Mã số thuế cá nhân (MST)
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="VD: 8594028193"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B88E4F]" />
                Ngân hàng thụ hưởng
              </label>
              <div className="relative">
                <select
                  disabled={isVerified}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-[#1A1612] appearance-none outline-none disabled:opacity-80"
                >
                  <option value="MBBank (Quân Đội)">MBBank (Quân Đội)</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="ACB">ACB</option>
                  <option value="VPBank">VPBank</option>
                  <option value="BIDV">BIDV</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="VD: 999988887777"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B88E4F]" />
              Tên chủ tài khoản (In hoa không dấu)
            </label>
            <input
              type="text"
              disabled={isVerified}
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN THANH THANG"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs font-bold text-[#1A1612] outline-none disabled:opacity-80 uppercase"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#B88E4F]" />
              Giới thiệu bản thân / Lĩnh vực sáng tạo nội dung
            </label>
            <textarea
              disabled={isVerified}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ về thế mạnh kênh và lĩnh vực review của bạn..."
              rows={3}
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] outline-none disabled:opacity-80 resize-none font-sans"
            />
          </div>

          {!isVerified && (
            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                size="md"
                icon={<Send className="w-3.5 h-3.5" />}
                loading={saving}
              >
                {saving ? 'Đang gửi...' : 'Nộp hồ sơ thẩm định KYC'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
