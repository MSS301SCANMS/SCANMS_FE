import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CreditCard,
  QrCode,
  Building2,
  User,
  FileText,
  Send,
  CheckCircle2,
  ChevronDown,
  Share2,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { kycService, type KycProfile } from '../../services/kyc.service';
import { socialService, type SocialChannel } from '../../services/social.service';
import { uploadService } from '../../services/upload.service';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function KycSubmissionPage() {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Social form modal/inline
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newPlatform, setNewPlatform] = useState('TIKTOK');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [newFollowers, setNewFollowers] = useState<number>(10000);
  const [addingChannel, setAddingChannel] = useState(false);

  const defaultName = currentUser?.fullName
    ? currentUser.fullName
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
    : '';

  const [idCardNumber, setIdCardNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [bankName, setBankName] = useState('MBBank (Quân Đội)');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState(defaultName);
  const [bio, setBio] = useState('');
  const [frontCardUrl, setFrontCardUrl] = useState<string>('');
  const [backCardUrl, setBackCardUrl] = useState<string>('');

  useEffect(() => {
    loadKyc();
    loadSocialChannels();
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
      if (p.socialLinksJson?.frontCardUrl) setFrontCardUrl(p.socialLinksJson.frontCardUrl);
      if (p.socialLinksJson?.backCardUrl) setBackCardUrl(p.socialLinksJson.backCardUrl);
    } catch (err) {
      console.error('Lỗi tải KYC:', err);
    }
  };

  const loadSocialChannels = async () => {
    try {
      const channels = await socialService.getMyChannels();
      setSocialChannels(channels || []);
    } catch (err) {
      console.error('Lỗi tải kênh mạng xã hội:', err);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB', 'error');
      return;
    }

    if (type === 'front') setUploadingFront(true);
    else setUploadingBack(true);

    try {
      // Thử upload lên server / Cloudinary
      try {
        const uploadedUrl = await uploadService.uploadImage(file, 'scanms/kyc');
        if (type === 'front') setFrontCardUrl(uploadedUrl);
        else setBackCardUrl(uploadedUrl);
        showToast(`Đã tải lên ảnh ${type === 'front' ? 'mặt trước' : 'mặt sau'} CCCD thành công`);
      } catch (uploadErr) {
        // Fallback đọc FileReader Data URL nếu upload server tạm thời bận
        console.warn('Fallback FileReader for preview & direct saving:', uploadErr);
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          if (type === 'front') setFrontCardUrl(dataUrl);
          else setBackCardUrl(dataUrl);
          showToast(`Đã lưu ảnh ${type === 'front' ? 'mặt trước' : 'mặt sau'} CCCD`);
        };
        reader.readAsDataURL(file);
      }
    } finally {
      if (type === 'front') setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelUrl.trim()) {
      showToast('Vui lòng nhập đường dẫn liên kết kênh', 'error');
      return;
    }

    setAddingChannel(true);
    try {
      await socialService.addChannel({
        platformName: newPlatform,
        channelName: newChannelName.trim() || `${newPlatform} Creator`,
        channelUrl: newChannelUrl.trim(),
        followerCount: Number(newFollowers) || 0,
        isPrimary: socialChannels.length === 0, // Kênh đầu tiên tự động là kênh chính
      });
      showToast('Đã thêm kênh truyền thông thành công');
      setShowAddChannel(false);
      setNewChannelName('');
      setNewChannelUrl('');
      loadSocialChannels();
    } catch (err: any) {
      showToast(err.message || 'Lỗi thêm kênh truyền thông', 'error');
    } finally {
      setAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa kênh này khỏi hồ sơ?')) return;
    try {
      await socialService.deleteChannel(id);
      showToast('Đã xóa kênh thành công');
      loadSocialChannels();
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa kênh', 'error');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await socialService.setPrimary(id);
      showToast('Đã cập nhật kênh chính');
      loadSocialChannels();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật kênh chính', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontCardUrl || !backCardUrl) {
      showToast('Vui lòng tải lên đầy đủ 2 mặt ảnh CCCD/Hộ chiếu trước khi nộp hồ sơ', 'error');
      return;
    }

    setSaving(true);
    try {
      await kycService.submitKyc({
        idCardNumber: idCardNumber.trim(),
        taxCode: taxCode.trim(),
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim().toUpperCase(),
        bio: bio.trim(),
        frontCardUrl,
        backCardUrl,
      });
      showToast('Nộp hồ sơ định danh KYC thành công! Vui lòng chờ Ban Quản Trị phê duyệt.');
      loadKyc();
    } catch (err: any) {
      showToast(err.message || 'Lỗi nộp hồ sơ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const rawStatus = profile?.kycStatus || (profile as any)?.status || 'UNVERIFIED';
  const hasSubmitted = Boolean(profile?.idCardNumber);
  const isVerified = rawStatus === 'VERIFIED';
  const isRejected = rawStatus === 'REJECTED';
  const isPending = (rawStatus === 'UNVERIFIED' && hasSubmitted) || rawStatus === 'PENDING';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto text-left">
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 border ${
            toastMsg.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-[#1A1612] text-[#F3EFE6] border-[#B88E4F]'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Hồ Sơ Định Danh & Năng Lực KOL (KYC)
          </h1>
          {isVerified && (
            <span className="inline-flex items-center gap-1 bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] text-xs font-black px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B88E4F]" /> TÍCH XANH CHÍNH THỨC
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#7D715E] mt-1.5 m-0">
          Hoàn tất định danh Pháp lý (CCCD, Thuế TNCN, Ngân hàng) & Năng lực Truyền thông (TikTok, YouTube, FB) để mở khóa quyền xin hàng mẫu miễn phí và rút hoa hồng.
        </p>
      </header>

      {/* Trạng thái xác minh */}
      <Card
        className={`p-5 sm:p-6 border transition rounded-2xl ${
          isVerified
            ? 'bg-[#FBF5EB] border-[#EAE4D7]'
            : isRejected
            ? 'bg-rose-50 border-rose-200'
            : isPending
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-[#EAE4D7]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isVerified
                ? 'bg-[#EAE4D7] text-[#B88E4F]'
                : isRejected
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isRejected ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <strong className="text-sm sm:text-base font-extrabold text-[#1A1612]">
                {isVerified
                  ? 'Hồ sơ đã được Ban Quản Trị SCANMS phê duyệt chính thức'
                  : isRejected
                  ? 'Hồ sơ bị từ chối phê duyệt'
                  : isPending
                  ? 'Hồ sơ đang được Ban Quản Trị thẩm định đối soát'
                  : 'Chưa hoàn tất nộp hồ sơ định danh'}
              </strong>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : isPending
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {isVerified ? 'ĐÃ DUYỆT' : isRejected ? 'TỪ CHỐI' : isPending ? 'CHỜ DUYỆT' : 'CHƯA NỘP'}
              </span>
            </div>
            <p className="text-xs text-[#7D715E] leading-relaxed m-0">
              {isVerified
                ? 'Tài khoản của bạn đã đạt chuẩn đối tác uy tín, mở khóa quyền xin hàng mẫu từ tất cả gian hàng và được phép rút tiền hoa hồng 24/7.'
                : isRejected
                ? 'Thông tin định danh chưa hợp lệ hoặc hình ảnh CCCD không rõ. Vui lòng kiểm tra lại số liệu và gửi lại hồ sơ.'
                : isPending
                ? 'Đội ngũ kiểm soát gian lận và Admin sàn đang kiểm tra ảnh CCCD và các kênh sáng tạo nội dung của bạn. Kết quả sẽ có trong vòng 2-4 giờ.'
                : 'Vui lòng điền thông tin chính xác, tải ảnh 2 mặt CCCD và liên kết ít nhất 1 kênh mạng xã hội bên dưới.'}
            </p>
          </div>
        </div>
      </Card>

      {/* KHỐI 1: ĐỊNH DANH NĂNG LỰC TRUYỀN THÔNG (FR-07 - ĐA KÊNH MẠNG XÃ HỘI) */}
      <Card className="p-6 bg-white border border-[#EAE4D7] rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE4D7]">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#B88E4F]" />
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">
                Kênh Truyền Thông & Sáng Tạo (FR-07)
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#7D715E]">
                {socialChannels.length} Kênh đã kết nối
              </span>
            </div>
            <p className="text-xs text-[#7D715E] mt-1 m-0">
              Chủ Shop sẽ xem qua các kênh này trước khi đồng ý duyệt gửi hàng mẫu miễn phí cho bạn.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddChannel(!showAddChannel)}
            icon={<Plus className="w-3.5 h-3.5 text-[#B88E4F]" />}
            className="border-[#C59B58] text-[#B88E4F] hover:bg-[#FBF5EB]"
          >
            {showAddChannel ? 'Đóng form' : '+ Thêm kênh mới'}
          </Button>
        </div>

        {/* Form thêm kênh */}
        {showAddChannel && (
          <form onSubmit={handleAddChannel} className="mt-4 p-4 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#1A1612] uppercase tracking-wider m-0">
              Thêm Kênh Mạng Xã Hội Mới
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#7D715E] block mb-1">Nền tảng</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full bg-white border border-[#EAE4D7] rounded-lg px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                >
                  <option value="TIKTOK">TikTok</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="THREADS">Threads</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#7D715E] block mb-1">Tên Kênh / Handle (@username)</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="VD: @thangskincare"
                  className="w-full bg-white border border-[#EAE4D7] rounded-lg px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#7D715E] block mb-1">Số Người Theo Dõi (Followers)</label>
                <input
                  type="number"
                  value={newFollowers}
                  onChange={(e) => setNewFollowers(Number(e.target.value))}
                  placeholder="VD: 25000"
                  className="w-full bg-white border border-[#EAE4D7] rounded-lg px-3 py-2 text-xs font-mono font-semibold text-[#1A1612] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#7D715E] block mb-1">Đường dẫn liên kết kênh (URL chính chủ)</label>
              <input
                type="url"
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                placeholder="VD: https://www.tiktok.com/@thangskincare"
                className="w-full bg-white border border-[#EAE4D7] rounded-lg px-3 py-2 text-xs text-[#1A1612] outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddChannel(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                loading={addingChannel}
              >
                Lưu kênh
              </Button>
            </div>
          </form>
        )}

        {/* Danh sách kênh */}
        <div className="mt-4">
          {socialChannels.length === 0 ? (
            <div className="p-6 text-center bg-[#FAF8F5] border border-dashed border-[#EAE4D7] rounded-xl">
              <Share2 className="w-8 h-8 text-[#B88E4F] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-[#1A1612] m-0">Chưa liên kết kênh mạng xã hội nào</p>
              <p className="text-[11px] text-[#7D715E] mt-1 m-0">
                Hãy thêm ít nhất 1 kênh TikTok hoặc YouTube để Shop tin tưởng gửi hàng mẫu miễn phí cho bạn.
              </p>
              <Button
                type="button"
                variant="gold"
                size="sm"
                className="mt-3"
                onClick={() => setShowAddChannel(true)}
              >
                + Thêm kênh TikTok / YouTube
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialChannels.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl flex items-center justify-between gap-3 hover:border-[#B88E4F] transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center font-bold text-xs text-[#B88E4F] shrink-0 shadow-sm">
                      {c.platformName === 'TIKTOK'
                        ? '🎵'
                        : c.platformName === 'YOUTUBE'
                        ? '▶️'
                        : c.platformName === 'INSTAGRAM'
                        ? '📸'
                        : '🌐'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#1A1612] truncate">
                          {c.channelName || c.platformName}
                        </span>
                        {c.isPrimary && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] px-1.5 py-0.2 rounded-full shrink-0">
                            <Star className="w-2.5 h-2.5 fill-[#B88E4F]" /> Kênh chính
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7D715E] font-medium m-0">
                        {Number(c.followerCount).toLocaleString('vi-VN')} người theo dõi
                      </p>
                      <a
                        href={c.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#B88E4F] hover:underline inline-flex items-center gap-1 truncate max-w-full"
                      >
                        {c.channelUrl} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!c.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(c.id)}
                        className="p-1.5 text-stone-400 hover:text-[#B88E4F] hover:bg-white rounded-lg transition"
                        title="Đặt làm kênh chính"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(c.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="Xóa kênh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* KHỐI 2: TẢI ẢNH CCCD 2 MẶT (ĐỐI SOÁT PHÁP LÝ) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#1A1612] m-0">
              Ảnh Chụp Căn Cước Công Dân / Hộ Chiếu (2 Mặt)
            </h2>
            <p className="text-xs text-[#7D715E] mt-0.5 m-0">
              Hình ảnh được mã hóa bảo mật, chỉ dùng để Admin đối chiếu tài khoản ngân hàng và cấp Tích Xanh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mặt trước */}
          <Card className="p-4 bg-white border border-[#EAE4D7] rounded-2xl">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-bold text-[#1A1612]">Ảnh CCCD Mặt Trước</span>
              <span className="text-[11px] text-[#B88E4F] font-bold">
                {frontCardUrl ? '✓ Đã tải lên' : 'Chưa tải'}
              </span>
            </div>
            <label className="h-40 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE4D7] hover:border-[#B88E4F] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition overflow-hidden relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isVerified || uploadingFront}
                onChange={(e) => handleImageUpload(e, 'front')}
              />
              {uploadingFront ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#B88E4F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-[#1A1612]">Đang tải ảnh lên...</span>
                </div>
              ) : frontCardUrl ? (
                <img
                  src={frontCardUrl}
                  alt="CCCD Mặt trước"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <CreditCard className="w-8 h-8 text-[#B88E4F] mb-1 group-hover:scale-110 transition" />
                  <strong className="text-xs text-[#1A1612]">
                    Bấm để tải ảnh CCCD Mặt Trước
                  </strong>
                  <span className="text-[10px] text-[#7D715E] mt-0.5">Rõ nét, đủ 4 góc, tối đa 5MB</span>
                </>
              )}
            </label>
          </Card>

          {/* Mặt sau */}
          <Card className="p-4 bg-white border border-[#EAE4D7] rounded-2xl">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-bold text-[#1A1612]">Ảnh CCCD Mặt Sau</span>
              <span className="text-[11px] text-[#B88E4F] font-bold">
                {backCardUrl ? '✓ Đã tải lên' : 'Chưa tải'}
              </span>
            </div>
            <label className="h-40 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE4D7] hover:border-[#B88E4F] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition overflow-hidden relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isVerified || uploadingBack}
                onChange={(e) => handleImageUpload(e, 'back')}
              />
              {uploadingBack ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#B88E4F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-[#1A1612]">Đang tải ảnh lên...</span>
                </div>
              ) : backCardUrl ? (
                <img
                  src={backCardUrl}
                  alt="CCCD Mặt sau"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <QrCode className="w-8 h-8 text-[#B88E4F] mb-1 group-hover:scale-110 transition" />
                  <strong className="text-xs text-[#1A1612]">
                    Bấm để tải ảnh CCCD Mặt Sau
                  </strong>
                  <span className="text-[10px] text-[#7D715E] mt-0.5">Hiển thị rõ mã QR và nơi cấp</span>
                </>
              )}
            </label>
          </Card>
        </div>
      </div>

      {/* KHỐI 3: THÔNG TIN ĐỊNH DANH PHÁP LÝ & TÀI CHÍNH (FR-05) */}
      <Card className="p-6 sm:p-7 bg-white border border-[#EAE4D7] rounded-2xl">
        <h2 className="text-base font-extrabold text-[#1A1612] mb-4 pb-3 border-b border-[#EAE4D7]">
          Thông Tin Pháp Lý & Ngân Hàng Thụ Hưởng
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Số Căn Cước Công Dân (12 số) *
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                placeholder="VD: 079201008899"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Mã Số Thuế Cá Nhân (MST) *
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="VD: 8594028193"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
              <span className="text-[10px] text-[#7D715E] mt-1 block">
                Để phục vụ việc khấu trừ thuế TNCN theo quy định pháp luật.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B88E4F]" />
                Ngân Hàng Thụ Hưởng *
              </label>
              <div className="relative">
                <select
                  disabled={isVerified}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-semibold text-[#1A1612] appearance-none outline-none disabled:opacity-80"
                >
                  <option value="MBBank (Quân Đội)">MBBank (Quân Đội)</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="ACB">ACB</option>
                  <option value="VPBank">VPBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="TPBank">TPBank</option>
                  <option value="VietinBank">VietinBank</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                Số Tài Khoản Ngân Hàng *
              </label>
              <input
                type="text"
                disabled={isVerified}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="VD: 999988887777"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#1A1612] outline-none disabled:opacity-80"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B88E4F]" />
              Tên Chủ Tài Khoản (Bắt buộc trùng khớp CCCD 100%) *
            </label>
            <input
              type="text"
              disabled={isVerified}
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN THANH THANG"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1A1612] outline-none disabled:opacity-80 uppercase"
              required
            />
            <span className="text-[10px] text-[#7D715E] mt-1 block">
              Tên tài khoản phải viết hoa không dấu, trùng với họ tên trên CCCD để đảm bảo tính hợp pháp khi nhận hoa hồng.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#B88E4F]" />
              Giới thiệu bản thân & Thế mạnh nội dung
            </label>
            <textarea
              disabled={isVerified}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ về lĩnh vực review của bạn (chăm sóc da mụn, mỹ phẩm thuần chay, phong cách sống...)"
              rows={3}
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] outline-none disabled:opacity-80 resize-none font-sans"
            />
          </div>

          {!isVerified && (
            <div className="pt-3 border-t border-[#EAE4D7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-[11px] text-[#7D715E]">
                Bằng cách nộp hồ sơ, bạn cam kết các thông tin và tài khoản truyền thông là chính chủ.
              </div>
              <Button
                type="submit"
                variant="gold"
                size="md"
                icon={<Send className="w-3.5 h-3.5" />}
                loading={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Thẩm Định KYC'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
