import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  UserCheck,
  Building,
  Send,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
  Star,
} from 'lucide-react';
import { kycService, type KycProfile } from '../../services/kyc.service';
import { socialService, type SocialChannel } from '../../services/social.service';
import { authService } from '../../services/auth.service';
import { Card } from '../../components/ui/Card';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Select } from '../../components/ui/Select';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { BankSelectTrigger } from '../../components/bank/BankSelectTrigger';
import { toast } from '../../utils/toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function KycSubmissionPage() {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([]);
  const [_loading, setLoading] = useState(true); void _loading;
  const [saving, setSaving] = useState(false);

  // Social Channels & Primary Channel (Matching PartnerUpgradeTab - Image 2)
  const [platform, setPlatform] = useState<'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'LEMON8' | 'OTHER'>('TIKTOK');
  const [channelName, setChannelName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [followerCount, setFollowerCount] = useState<number | ''>('');
  const [channelProofUrl, setChannelProofUrl] = useState<string>('');

  // Additional connected channels management
  const [showAddOtherChannel, setShowAddOtherChannel] = useState(false);
  const [otherPlatform, setOtherPlatform] = useState('YOUTUBE');
  const [otherChannelName, setOtherChannelName] = useState('');
  const [otherChannelUrl, setOtherChannelUrl] = useState('');
  const [otherFollowers, setOtherFollowers] = useState<number | ''>('');
  const [addingOtherChannel, setAddingOtherChannel] = useState(false);

  const defaultName = currentUser?.fullName
    ? currentUser.fullName
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
    : '';

  // KYC CCCD & Legal
  const [idCardNumber, setIdCardNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [frontCardUrl, setFrontCardUrl] = useState<string>('');
  const [backCardUrl, setBackCardUrl] = useState<string>('');

  // Bank Info & Bio
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState(defaultName);
  const [bio, setBio] = useState('');

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
      if (p.socialLinksJson?.channelProofUrl) setChannelProofUrl(p.socialLinksJson.channelProofUrl);
      if (p.socialLinksJson?.platform) setPlatform(p.socialLinksJson.platform as any);
      if (p.socialLinksJson?.channelName) setChannelName(p.socialLinksJson.channelName);
      if (p.socialLinksJson?.channelUrl) setChannelUrl(p.socialLinksJson.channelUrl);
      if (p.socialLinksJson?.followerCount) setFollowerCount(p.socialLinksJson.followerCount);
    } catch (err) {
      console.error('Lỗi tải KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialChannels = async () => {
    try {
      const channels = await socialService.getMyChannels();
      setSocialChannels(channels || []);
      const primary = channels?.find((c) => c.isPrimary) || channels?.[0];
      if (primary) {
        setPlatform((prev) => (prev ? prev : (primary.platformName as any) || 'TIKTOK'));
        setChannelName((prev) => (prev ? prev : primary.channelName || ''));
        setChannelUrl((prev) => (prev ? prev : primary.channelUrl || ''));
        setFollowerCount((prev) => (prev !== '' ? prev : primary.followerCount || ''));
      }
    } catch (err) {
      console.error('Lỗi tải kênh mạng xã hội:', err);
    }
  };

  // Nạp dữ liệu mẫu nhanh chuẩn Image 2 để kiểm thử
  const fillSampleKolData = () => {
    setPlatform('TIKTOK');
    setChannelName('Thành Thắng Reviews');
    setFollowerCount(15000);
    setChannelUrl('https://tiktok.com/@thangtechreview');
    setChannelProofUrl('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80');
    setIdCardNumber('001201012345');
    setTaxCode('8012345678');
    setFrontCardUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80');
    setBackCardUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80');
    setBankName('Techcombank');
    setBankAccountNumber('19034567890012');
    setBankAccountName('NGUYEN THANH THANG');
    setBio('Review chuyên sâu mỹ phẩm dưỡng ẩm, đồ công nghệ gia dụng, thời trang tối giản và phong cách sống.');
    toast.info('Đã nạp đầy đủ thông tin mẫu chuẩn KOL để kiểm thử');
  };

  const handleAddOtherChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherChannelUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn liên kết kênh');
      return;
    }

    setAddingOtherChannel(true);
    try {
      await socialService.addChannel({
        platformName: otherPlatform,
        channelName: otherChannelName.trim() || `${otherPlatform} Creator`,
        channelUrl: otherChannelUrl.trim(),
        followerCount: Number(otherFollowers) || 0,
        isPrimary: socialChannels.length === 0,
      });
      toast.success('Đã thêm kênh phụ thành công');
      setShowAddOtherChannel(false);
      setOtherChannelName('');
      setOtherChannelUrl('');
      setOtherFollowers('');
      loadSocialChannels();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thêm kênh');
    } finally {
      setAddingOtherChannel(false);
    }
  };

  const [channelToDelete, setChannelToDelete] = useState<SocialChannel | null>(null);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);

  const handleConfirmDeleteChannel = async () => {
    if (!channelToDelete?.id) return;
    setIsDeletingChannel(true);
    try {
      await socialService.deleteChannel(channelToDelete.id);
      toast.success('Đã xóa kênh mạng xã hội khỏi danh sách');
      setChannelToDelete(null);
      loadSocialChannels();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa kênh');
    } finally {
      setIsDeletingChannel(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await socialService.setPrimary(id);
      toast.success('Đã chọn làm kênh chính');
      loadSocialChannels();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform) {
      toast.error('Vui lòng chọn nền tảng mạng xã hội chính');
      return;
    }
    if (!channelUrl.trim()) {
      toast.error('Vui lòng nhập đường link kênh mạng xã hội');
      return;
    }
    if (!idCardNumber.trim() || idCardNumber.length < 9) {
      toast.error('Vui lòng nhập số CCCD/CMND hợp lệ (từ 9 đến 12 số)');
      return;
    }
    if (!bankName?.trim()) {
      toast.error('Vui lòng chọn ngân hàng thụ hưởng nhận hoa hồng');
      return;
    }
    if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
      toast.error('Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản ngân hàng');
      return;
    }
    if (!frontCardUrl || !backCardUrl) {
      toast.error('Vui lòng tải lên đầy đủ 2 mặt ảnh CCCD/Hộ chiếu');
      return;
    }

    setSaving(true);
    try {
      await kycService.submitKyc({
        idCardNumber: idCardNumber.trim(),
        taxCode: taxCode.trim() || '8012345678',
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim().toUpperCase(),
        bio: bio.trim(),
        frontCardUrl,
        backCardUrl,
        channelProofUrl,
        platform,
        channelName: channelName.trim() || `${platform} Creator`,
        channelUrl: channelUrl.trim(),
        followerCount: followerCount ? Number(followerCount) : 0,
      });

      toast.success('Lưu & Cập nhật hồ sơ định danh KYC thành công!');
      await loadKyc();
      await loadSocialChannels();
      await authService.getMe();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể lưu hồ sơ, vui lòng thử lại');
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
    <div className="flex flex-col gap-6 w-full text-left">
      {/* 1. KHỐI TRẠNG THÁI XÁC MINH CỦA HỆ THỐNG */}
      <Card
        className={`p-4 sm:p-5 border transition rounded-2xl w-full ${
          isVerified
            ? 'bg-[#FBF5EB] border-[#EEDFC6]'
            : isRejected
            ? 'bg-rose-50 border-rose-200'
            : isPending
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-[#EAE4D7]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isVerified
                  ? 'bg-[#EBD08C] text-[#231D15]'
                  : isRejected
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="w-5 h-5" />
              ) : isRejected ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
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
                {isVerified && (
                  <span className="inline-flex items-center gap-1 bg-white border border-[#EEDFC6] text-[#B88E4F] text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-[#B88E4F]" /> TÍCH XANH CHÍNH THỨC
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7D715E] leading-relaxed m-0">
                {isVerified
                  ? 'Tài khoản của bạn đã đạt chuẩn đối tác uy tín. Bạn có thể cập nhật lại tài khoản ngân hàng, mã số thuế hoặc ảnh CCCD mới bất cứ lúc nào bên dưới.'
                  : isRejected
                  ? 'Thông tin định danh chưa hợp lệ hoặc hình ảnh CCCD không rõ. Vui lòng kiểm tra lại số liệu và gửi lại hồ sơ.'
                  : isPending
                  ? 'Đội ngũ kiểm soát gian lận và Admin sàn đang kiểm tra ảnh CCCD và các kênh sáng tạo nội dung của bạn.'
                  : 'Vui lòng điền thông tin chính xác, tải ảnh 2 mặt CCCD và liên kết kênh mạng xã hội bên dưới.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. FORM ĐỊNH DANH TOÀN DIỆN (CHÍNH XÁC THEO GIAO DIỆN ẢNH 2 BÊN USER) */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 w-full">
        {/* BANNER TIÊU ĐỀ + NẠP DỮ LIỆU MẪU (CHUẨN IMAGE 2) */}
        <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#1A1612] tracking-tight m-0">
                Hồ sơ Chứng Minh Kênh Sáng Tạo &amp; Thông Tin Định Danh KOL
              </h3>
              <p className="text-[11px] text-[#7D715E] mt-0.5 m-0">
                Cung cấp link mạng xã hội và ảnh chụp màn hình studio để chứng minh quyền sở hữu kênh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fillSampleKolData}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] text-[11px] font-bold text-[#B88E4F] transition cursor-pointer shadow-2xs shrink-0"
          >
            ⚡ Nạp dữ liệu mẫu thử nghiệm
          </button>
        </div>

        {/* 1. BẰNG CHỨNG SỞ HỮU KÊNH TRUYỀN THÔNG (CHUẨN IMAGE 2) */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5 m-0">
            <LinkIcon className="w-3.5 h-3.5" />
            1. Bằng chứng sở hữu kênh truyền thông
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Nền tảng chính *</label>
              <CustomSelect
                value={platform}
                onChange={(val) => setPlatform(val as any)}
                options={[
                  { value: 'TIKTOK', label: '🎵 TikTok Video / Live' },
                  { value: 'FACEBOOK', label: '📘 Facebook Fanpage / Profile' },
                  { value: 'YOUTUBE', label: '▶️ YouTube Channel' },
                  { value: 'INSTAGRAM', label: '📷 Instagram Creator' },
                  { value: 'LEMON8', label: '🍋 Lemon8 Beauty' },
                  { value: 'OTHER', label: '🌐 Nền tảng khác' },
                ]}
                placeholder="-- Chọn Nền tảng --"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên kênh hiển thị *</label>
              <input
                type="text"
                placeholder="VD: Thành Thắng Reviews"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số lượng Followers (Người theo dõi) *</label>
              <input
                type="number"
                min="0"
                placeholder="VD: 15000"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
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
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              required
              className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
            />
          </div>

          <ImageUploadDropzone
            label="Ảnh chụp màn hình trang quản trị kênh (TikTok Studio / Meta Business Suite)"
            helperText="💡 Admin sẽ đối chiếu ảnh chụp màn hình quyền quản trị với URL kênh để đảm bảo tính chính chủ, tránh mạo danh KOL."
            value={channelProofUrl}
            onChange={(url) => setChannelProofUrl(url)}
            iconType="camera"
            folder="scanms/kyc/proofs"
          />

          {/* DANH SÁCH CÁC KÊNH PHỤ ĐÃ KẾT NỐI (NẾU CÓ) */}
          {socialChannels.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7D715E]">
                  Mạng lưới kênh đã kết nối ({socialChannels.length} kênh):
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddOtherChannel(!showAddOtherChannel)}
                  className="text-[11px] text-[#B88E4F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {showAddOtherChannel ? 'Đóng' : '+ Thêm kênh phụ khác'}
                </button>
              </div>

              {/* Form thêm kênh phụ nhanh */}
              {showAddOtherChannel && (
                <div className="mb-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select
                      value={otherPlatform}
                      onChange={(e) => setOtherPlatform(e.target.value)}
                      className="w-full"
                    >
                      <option value="TIKTOK">🎵 TikTok</option>
                      <option value="YOUTUBE">▶️ YouTube</option>
                      <option value="FACEBOOK">📘 Facebook</option>
                      <option value="INSTAGRAM">📷 Instagram</option>
                      <option value="LEMON8">🍋 Lemon8</option>
                      <option value="OTHER">🌐 Khác</option>
                    </Select>
                    <input
                      type="text"
                      placeholder="Tên kênh / Handle"
                      value={otherChannelName}
                      onChange={(e) => setOtherChannelName(e.target.value)}
                      className="bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1612] outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Số Followers"
                      value={otherFollowers}
                      onChange={(e) => setOtherFollowers(e.target.value === '' ? '' : Number(e.target.value))}
                      className="bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1612] outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="URL kênh (https://...)"
                      value={otherChannelUrl}
                      onChange={(e) => setOtherChannelUrl(e.target.value)}
                      className="flex-1 bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1612] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddOtherChannel}
                      disabled={addingOtherChannel}
                      className="px-3 py-1.5 bg-[#C59B58] text-white rounded-lg text-xs font-bold hover:bg-[#B88E4F] transition shrink-0 cursor-pointer"
                    >
                      {addingOtherChannel ? 'Lưu...' : 'Lưu kênh'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {socialChannels.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">
                        {c.platformName === 'TIKTOK' ? '🎵' : c.platformName === 'YOUTUBE' ? '▶️' : c.platformName === 'FACEBOOK' ? '📘' : '📷'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs text-[#1A1612] truncate">{c.channelName}</strong>
                          {c.isPrimary && (
                            <span className="text-[9px] font-bold bg-[#EBD08C] text-[#231D15] px-1 py-0.2 rounded shrink-0">
                              Chính
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#7D715E] block truncate">
                          {Number(c.followerCount).toLocaleString('vi-VN')} followers
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={c.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#B88E4F] hover:bg-white rounded"
                        title="Mở link"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {!c.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(c.id)}
                          className="p-1 text-stone-400 hover:text-[#B88E4F] hover:bg-white rounded cursor-pointer"
                          title="Đặt làm kênh chính"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setChannelToDelete(c)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-white rounded cursor-pointer"
                        title="Xóa kênh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. ĐỊNH DANH CÁ NHÂN & KÊ KHAI THUẾ TNCN (CHUẨN IMAGE 2) */}
        <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
          <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5 m-0">
            <UserCheck className="w-3.5 h-3.5" />
            2. Định danh cá nhân &amp; Kê khai thuế TNCN
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số CCCD / CMND (12 số) *</label>
              <input
                type="text"
                placeholder="VD: 001201012345"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Mã số thuế cá nhân (MST)</label>
              <input
                type="text"
                placeholder="VD: 8012345678 (Tùy chọn)"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadDropzone
              label="Ảnh mặt trước CCCD"
              helperText="Chụp rõ nét, đủ 4 góc, tối đa 5MB"
              value={frontCardUrl}
              onChange={(url) => setFrontCardUrl(url)}
              iconType="idcard"
              folder="scanms/kyc/idcards"
              required
            />
            <ImageUploadDropzone
              label="Ảnh mặt sau CCCD"
              helperText="Chụp rõ nét mã QR và nơi cấp"
              value={backCardUrl}
              onChange={(url) => setBackCardUrl(url)}
              iconType="idcard"
              folder="scanms/kyc/idcards"
              required
            />
          </div>
        </div>

        {/* 3. TÀI KHOẢN NGÂN HÀNG NHẬN HOA HỒNG ĐỐI SOÁT (CHUẨN IMAGE 2) */}
        <div className="space-y-4 pt-4 border-t border-[#EAE4D7]">
          <h4 className="text-xs font-black text-[#B88E4F] uppercase tracking-wider flex items-center gap-1.5 m-0">
            <Building className="w-3.5 h-3.5" />
            3. Tài khoản ngân hàng nhận hoa hồng đối soát
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên ngân hàng *</label>
              <BankSelectTrigger
                value={bankName}
                onChange={(val) => setBankName(val)}
                placeholder="-- Chọn ngân hàng thụ hưởng --"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Số tài khoản ngân hàng *</label>
              <input
                type="text"
                placeholder="VD: 0123456789"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.trim())}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên chủ tài khoản (In hoa) *</label>
              <input
                type="text"
                placeholder="VD: NGUYEN VAN A"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono font-bold outline-none focus:border-[#C59B58] transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Định hướng phong cách &amp; Ngành hàng thế mạnh</label>
            <textarea
              rows={2}
              placeholder="VD: Review chuyên sâu mỹ phẩm dưỡng ẩm, đồ công nghệ gia dụng, thời trang tối giản..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
            />
          </div>
        </div>

        {/* NÚT LƯU & CẬP NHẬT HỒ SƠ KYC */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-[#1A1612] font-black text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1A1612]" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {saving
                ? 'Đang lưu hồ sơ...'
                : isVerified
                ? 'Lưu & Cập Nhật Hồ Sơ Định Danh'
                : 'Nộp Hồ Sơ Thẩm Định KYC'}
            </span>
          </button>
        </div>
      </form>

      {/* Modal Xác nhận Xóa kênh mạng xã hội chuẩn SCANMS */}
      <ConfirmModal
        isOpen={Boolean(channelToDelete)}
        onClose={() => !isDeletingChannel && setChannelToDelete(null)}
        onConfirm={handleConfirmDeleteChannel}
        isLoading={isDeletingChannel}
        title="Xóa kênh khỏi hồ sơ KYC"
        message={`Bạn có chắc chắn muốn xóa kênh "${channelToDelete?.channelName || 'này'}" khỏi hồ sơ định danh KYC?`}
        confirmText="Xác nhận xóa"
        variant="danger"
      />
    </div>
  );
}
