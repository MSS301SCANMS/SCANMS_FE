import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Link as LinkIcon,
  UserCheck,
  Building,
  Send,
  ShieldAlert,
  Clock,
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
  Star,
  ChevronDown,
  Camera,
  Check,
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

interface KycSubmissionPageProps {
  loadedData?: { profile: KycProfile; channels: SocialChannel[] };
  isRefreshing?: boolean;
}

const KycSubmissionPage = forwardRef<{ refresh: () => Promise<void> }, KycSubmissionPageProps>(function KycSubmissionPage({ loadedData, isRefreshing = false }, ref) {
  const formRef = useRef<HTMLFormElement>(null);
  const loadSequence = useRef(0);
  const revealSection = (section: string) => {
    const panel = formRef.current?.querySelector<HTMLDetailsElement>(`details[data-profile-section="${section}"]`);
    if (panel) panel.open = true;
  };
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
    if (loadedData) {
      applyProfileData(loadedData.profile, loadedData.channels);
      setLoading(false);
      setLoadError('');
      return;
    }
    void loadProfile().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Không thể tải hồ sơ KYC.');
    });
    return () => { loadSequence.current++; };
  }, [loadedData]);

  const applyProfileData = (p: KycProfile, channels: SocialChannel[]) => {
    const primary = channels.find((channel) => channel.isPrimary) || channels[0];
    const links = p.socialLinksJson;
    setProfile(p);
    setSocialChannels(channels);
    setIdCardNumber(p.idCardNumber ?? '');
    setTaxCode(p.taxCode ?? '');
    setBankName(p.bankName ?? '');
    setBankAccountNumber(p.bankAccountNumber ?? '');
    setBankAccountName(p.bankAccountName ?? defaultName);
    setBio(p.bio ?? '');
    setFrontCardUrl(links?.frontCardUrl ?? '');
    setBackCardUrl(links?.backCardUrl ?? '');
    setChannelProofUrl(links?.channelProofUrl ?? '');
    setPlatform((links?.platform || primary?.platformName || 'TIKTOK') as typeof platform);
    setChannelName(links?.channelName || primary?.channelName || '');
    setChannelUrl(links?.channelUrl || primary?.channelUrl || '');
    setFollowerCount(links?.followerCount ?? primary?.followerCount ?? '');
  };

  const loadProfile = async (forceRefresh = false) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError('');
    try {
      const [p, channels] = await Promise.all([
        kycService.getMyKyc({ forceRefresh }),
        socialService.getMyChannels({ forceRefresh }),
      ]);
      if (sequence !== loadSequence.current) return;
      if (!p || !Array.isArray(channels)) throw new Error('Dữ liệu hồ sơ KYC không hợp lệ.');
      applyProfileData(p, channels);
    } catch (err: unknown) {
      if (sequence === loadSequence.current) {
        setLoadError(err instanceof Error ? err.message : 'Không thể tải hồ sơ KYC.');
      }
      throw err;
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
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
      toast.error(err instanceof Error ? err.message : 'Không thể tải các kênh đã kết nối.');
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => loadProfile(true),
  }));

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
    if (loading || isRefreshing || saving) return;

    if (!platform) {
      revealSection('channel');
      toast.error('Vui lòng chọn nền tảng mạng xã hội chính');
      return;
    }
    if (!channelUrl.trim()) {
      revealSection('channel');
      toast.error('Vui lòng nhập đường link kênh mạng xã hội');
      return;
    }
    if (!idCardNumber.trim() || idCardNumber.length < 9) {
      revealSection('identity');
      toast.error('Vui lòng nhập số CCCD/CMND hợp lệ (từ 9 đến 12 số)');
      return;
    }
    if (!taxCode.trim()) {
      revealSection('identity');
      toast.error('Vui lòng nhập Mã số thuế cá nhân (MST) để hoàn tất hồ sơ');
      return;
    }
    if (!bankName?.trim()) {
      revealSection('bank');
      toast.error('Vui lòng chọn ngân hàng thụ hưởng nhận hoa hồng');
      return;
    }
    if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
      revealSection('bank');
      toast.error('Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản ngân hàng');
      return;
    }
    if (!frontCardUrl || !backCardUrl) {
      revealSection('identity');
      toast.error('Vui lòng tải lên đầy đủ 2 mặt ảnh CCCD/Hộ chiếu');
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
        channelProofUrl,
        platform,
        channelName: channelName.trim() || `${platform} Creator`,
        channelUrl: channelUrl.trim(),
        followerCount: followerCount ? Number(followerCount) : 0,
      });

      toast.success('Lưu & Cập nhật hồ sơ định danh KYC thành công!');
      await loadProfile(true);
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
  const channelComplete = Boolean(channelName.trim() && channelUrl.trim() && followerCount !== '');
  const identityComplete = Boolean(idCardNumber.length >= 9 && taxCode.trim() && frontCardUrl && backCardUrl);
  const bankComplete = Boolean(bankName.trim() && bankAccountNumber.trim() && bankAccountName.trim());

  if (loading && !profile) {
    return (
      <section className="flex items-center gap-2 p-3 sm:px-3.5 border border-[#EAE4D7] rounded-xl bg-white text-[#7D715E] text-xs" role="status" aria-busy="true">
        <Loader2 size={16} className="animate-spin text-[#B88E4F] shrink-0" aria-hidden="true" />
        <span>Đang tải dữ liệu hồ sơ KYC…</span>
      </section>
    );
  }

  if (!profile && loadError) {
    return <section className="p-3 border border-red-200 rounded-xl bg-white text-red-600 text-xs" role="alert">{loadError}</section>;
  }

  return (
    <div className="flex flex-col gap-3.5 w-full text-left" aria-busy={loading || isRefreshing}>
      {loading && (
        <section className="flex items-center gap-2 p-3 sm:px-3.5 border border-[#EAE4D7] rounded-xl bg-white text-[#7D715E] text-xs" role="status">
          <Loader2 size={16} className="animate-spin text-[#B88E4F] shrink-0" aria-hidden="true" />
          <span>Đang tải dữ liệu hồ sơ KYC…</span>
        </section>
      )}
      {/* 1. KHỐI TRẠNG THÁI XÁC MINH CỦA HỆ THỐNG */}
      {!isVerified && (
      <Card
        className={`p-4 sm:p-5 border transition rounded-2xl w-full ${
          isRejected
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
                isRejected
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isRejected ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <strong className="text-sm sm:text-base font-extrabold text-[#1A1612]">
                  {isRejected
                    ? 'Hồ sơ bị từ chối'
                    : isPending
                    ? 'Hồ sơ đang chờ duyệt'
                    : 'Chưa gửi hồ sơ định danh'}
                </strong>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : isPending
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {isRejected ? 'Từ chối' : isPending ? 'Chờ duyệt' : 'Chưa nộp'}
                </span>
              </div>
              <p className="text-xs text-[#7D715E] leading-relaxed m-0">
                {isRejected
                  ? 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và gửi lại.'
                  : isPending
                  ? 'Hồ sơ đang được xem xét (kết quả trong 24h làm việc).'
                  : 'Vui lòng cung cấp thông tin CCCD và kênh mạng xã hội bên dưới.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* 2. FORM ĐỊNH DANH */}
      <form
        ref={formRef}
        inert={loading || isRefreshing}
        onSubmit={handleSubmit}
        onInvalidCapture={(event) => {
          let panel = (event.target as HTMLElement).closest<HTMLDetailsElement>('details');
          while (panel) {
            panel.open = true;
            panel = panel.parentElement?.closest<HTMLDetailsElement>('details') ?? null;
          }
        }}
        className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 w-full"
      >
        {/* 1. BẰNG CHỨNG SỞ HỮU KÊNH TRUYỀN THÔNG (CHUẨN IMAGE 2) */}
        <details className="border border-[#EAE4D7] rounded-xl bg-white overflow-hidden open:border-[#EEDFC6] group" data-profile-section="channel" open>
          <summary className="flex items-center gap-2.5 p-3 rounded-xl list-none cursor-pointer hover:bg-[#FAF8F5] group-open:rounded-b-none group-open:border-b group-open:border-[#EEDFC6] group-open:bg-[#FBF5EB] select-none transition-colors [&::-webkit-details-marker]:hidden">
            <span className="grid place-items-center w-[30px] h-[30px] shrink-0 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#B88E4F] group-open:bg-white group-open:border-[#EEDFC6]"><LinkIcon size={15} /></span>
            <span className="flex flex-col gap-0.5 min-w-0 flex-1"><strong className="text-sm font-semibold text-[#1A1612]">Kênh sáng tạo</strong><span className="text-[11px] text-[#7D715E] truncate">{channelName || 'Thông tin kênh chính của bạn'}</span></span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#EEDFC6] rounded-md bg-[#FBF5EB] text-[#B88E4F] text-[10px] whitespace-nowrap data-[complete=true]:border-[#EAE4D7] data-[complete=true]:bg-white data-[complete=true]:text-[#7D715E]" data-complete={channelComplete}>{channelComplete ? <><Check size={12} /> Đã điền</> : 'Cần bổ sung'}</span>
            <ChevronDown size={15} className="text-[#B88E4F] shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="kyc-platform" className="text-xs font-bold text-[#1A1612] block mb-1.5">Nền tảng chính *</label>
              <CustomSelect
                id="kyc-platform"
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
              <label htmlFor="kyc-channel-name" className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên kênh hiển thị *</label>
              <input
                id="kyc-channel-name"
                type="text"
                placeholder="VD: Thành Thắng Reviews"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label htmlFor="kyc-followers" className="text-xs font-bold text-[#1A1612] block mb-1.5">Số người theo dõi *</label>
              <input
                id="kyc-followers"
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
            <label htmlFor="kyc-channel-url" className="text-xs font-bold text-[#1A1612] block mb-1.5">
              Liên kết kênh *
            </label>
            <input
              id="kyc-channel-url"
              type="url"
              placeholder="https://tiktok.com/@your_channel hoặc https://facebook.com/yourpage"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              required
              className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-2.5">
          <details className="border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] overflow-hidden group/inline [&::-webkit-details-marker]:hidden">
            <summary className="flex items-center gap-2 min-h-[36px] px-2.5 py-2 text-xs text-[#7D715E] list-none cursor-pointer select-none hover:bg-[#F3EFE6]/50 [&::-webkit-details-marker]:hidden"><Camera size={14} className="text-[#B88E4F]" /><span>Ảnh quản trị kênh</span><span className="ml-auto text-[10px] whitespace-nowrap text-[#7D715E]">{channelProofUrl ? 'Đã đính kèm' : 'Chưa đính kèm'}</span><ChevronDown size={14} className="text-[#B88E4F] shrink-0 transition-transform group-open/inline:rotate-180" /></summary>
            <div className="p-2.5 pt-0">
          <ImageUploadDropzone
            label="Ảnh trang quản trị kênh"
            helperText="Ảnh TikTok Studio hoặc Meta Business Suite thể hiện tên kênh và quyền quản trị."
            value={channelProofUrl}
            onChange={(url) => setChannelProofUrl(url)}
            iconType="camera"
            folder="scanms/kyc/proofs"
          />
            </div>
          </details>

          {/* DANH SÁCH CÁC KÊNH PHỤ ĐÃ KẾT NỐI (NẾU CÓ) */}
          {socialChannels.length > 0 && (
            <details className="border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] overflow-hidden group/inline [&::-webkit-details-marker]:hidden">
              <summary className="flex items-center gap-2 min-h-[36px] px-2.5 py-2 text-xs text-[#7D715E] list-none cursor-pointer select-none hover:bg-[#F3EFE6]/50 [&::-webkit-details-marker]:hidden"><LinkIcon size={14} className="text-[#B88E4F]" /><span>Kênh đã kết nối</span><span className="ml-auto text-[10px] whitespace-nowrap text-[#7D715E]">{socialChannels.length} kênh</span><ChevronDown size={14} className="text-[#B88E4F] shrink-0 transition-transform group-open/inline:rotate-180" /></summary>
            <div className="p-2.5 pt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7D715E]">
                  Quản lý các kênh của bạn
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddOtherChannel(!showAddOtherChannel)}
                  aria-expanded={showAddOtherChannel}
                  className="text-[11px] text-[#B88E4F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {showAddOtherChannel ? 'Đóng' : 'Thêm kênh phụ'}
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
                      <strong className="text-xs text-[#1A1612]">{c.channelName}</strong>
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
                        aria-label={`Mở kênh ${c.channelName || c.platformName}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {!c.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(c.id)}
                          className="p-1 text-stone-400 hover:text-[#B88E4F] hover:bg-white rounded cursor-pointer"
                          title="Đặt làm kênh chính"
                          aria-label={`Đặt ${c.channelName || c.platformName} làm kênh chính`}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setChannelToDelete(c)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-white rounded cursor-pointer"
                        title="Xóa kênh"
                        aria-label={`Xóa kênh ${c.channelName || c.platformName}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </details>
          )}
          </div>
          </div>
        </details>

        {/* 2. ĐỊNH DANH CÁ NHÂN & KÊ KHAI THUẾ TNCN (CHUẨN IMAGE 2) */}
        <details className="border border-[#EAE4D7] rounded-xl bg-white overflow-hidden open:border-[#EEDFC6] group" data-profile-section="identity">
          <summary className="flex items-center gap-2.5 p-3 rounded-xl list-none cursor-pointer hover:bg-[#FAF8F5] group-open:rounded-b-none group-open:border-b group-open:border-[#EEDFC6] group-open:bg-[#FBF5EB] select-none transition-colors [&::-webkit-details-marker]:hidden">
            <span className="grid place-items-center w-[30px] h-[30px] shrink-0 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#B88E4F] group-open:bg-white group-open:border-[#EEDFC6]"><UserCheck size={15} /></span>
            <span className="flex flex-col gap-0.5 min-w-0 flex-1"><strong className="text-sm font-semibold text-[#1A1612]">Định danh & mã số thuế</strong><span className="text-[11px] text-[#7D715E] truncate">CCCD và ảnh hai mặt giấy tờ</span></span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#EEDFC6] rounded-md bg-[#FBF5EB] text-[#B88E4F] text-[10px] whitespace-nowrap data-[complete=true]:border-[#EAE4D7] data-[complete=true]:bg-white data-[complete=true]:text-[#7D715E]" data-complete={identityComplete}>{identityComplete ? <><Check size={12} /> Đã điền</> : 'Cần bổ sung'}</span>
            <ChevronDown size={15} className="text-[#B88E4F] shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="kyc-id-number" className="text-xs font-bold text-[#1A1612] block mb-1.5">Số CCCD / CMND (12 số) *</label>
              <input
                id="kyc-id-number"
                type="text"
                placeholder="VD: 001201012345"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label htmlFor="kyc-tax-code" className="text-xs font-bold text-[#1A1612] block mb-1.5">Mã số thuế cá nhân *</label>
              <input
                id="kyc-tax-code"
                type="text"
                placeholder="VD: 8012345678"
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
        </details>

        {/* 3. TÀI KHOẢN NGÂN HÀNG NHẬN HOA HỒNG ĐỐI SOÁT (CHUẨN IMAGE 2) */}
        <details className="border border-[#EAE4D7] rounded-xl bg-white overflow-hidden open:border-[#EEDFC6] group" data-profile-section="bank">
          <summary className="flex items-center gap-2.5 p-3 rounded-xl list-none cursor-pointer hover:bg-[#FAF8F5] group-open:rounded-b-none group-open:border-b group-open:border-[#EEDFC6] group-open:bg-[#FBF5EB] select-none transition-colors [&::-webkit-details-marker]:hidden">
            <span className="grid place-items-center w-[30px] h-[30px] shrink-0 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#B88E4F] group-open:bg-white group-open:border-[#EEDFC6]"><Building size={15} /></span>
            <span className="flex flex-col gap-0.5 min-w-0 flex-1"><strong className="text-sm font-semibold text-[#1A1612]">Ngân hàng & hồ sơ giới thiệu</strong><span className="text-[11px] text-[#7D715E] truncate">{bankName || 'Tài khoản nhận hoa hồng và ngành hàng thế mạnh'}</span></span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#EEDFC6] rounded-md bg-[#FBF5EB] text-[#B88E4F] text-[10px] whitespace-nowrap data-[complete=true]:border-[#EAE4D7] data-[complete=true]:bg-white data-[complete=true]:text-[#7D715E]" data-complete={bankComplete}>{bankComplete ? <><Check size={12} /> Đã điền</> : 'Cần bổ sung'}</span>
            <ChevronDown size={15} className="text-[#B88E4F] shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên ngân hàng *</label>
              <BankSelectTrigger
                className="w-full"
                value={bankName}
                onChange={(val) => setBankName(val)}
                placeholder="-- Chọn ngân hàng thụ hưởng --"
                required
              />
            </div>

            <div>
              <label htmlFor="kyc-bank-number" className="text-xs font-bold text-[#1A1612] block mb-1.5">Số tài khoản ngân hàng *</label>
              <input
                id="kyc-bank-number"
                type="text"
                placeholder="VD: 0123456789"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.trim())}
                required
                className="w-full h-10 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2 text-xs text-[#1A1612] font-mono outline-none focus:border-[#C59B58] transition"
              />
            </div>

            <div>
              <label htmlFor="kyc-bank-owner" className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên chủ tài khoản (In hoa) *</label>
              <input
                id="kyc-bank-owner"
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
        </details>

        {/* NÚT LƯU & CẬP NHẬT HỒ SƠ KYC */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-3 border-t border-[#EAE4D7]">
          <span className="text-xs text-[#7D715E]">Mở từng mục để xem hoặc cập nhật thông tin.</span>
          <button
            type="submit"
            disabled={saving || loading || isRefreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[36px] px-4 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1A1612]" />
            ) : (
              <Send className="w-4 h-4 text-[#B88E4F]" />
            )}
            <span>
              {saving
                ? 'Đang lưu hồ sơ...'
                : isVerified
                ? 'Lưu hồ sơ'
                : 'Gửi hồ sơ KYC'}
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
});

export default KycSubmissionPage;
