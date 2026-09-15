import { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  Star,
  Wallet,
  Search,
  Plus,
  RotateCcw,
  ExternalLink,
  Trash2,
  CheckCircle2,
  X,
  Link2,
  Video,
  ChevronDown,
} from 'lucide-react';
import { socialService, type SocialChannel } from '../../services/social.service';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function SocialChannelsPage() {
  const currentUser = authService.getCurrentUser();
  const isThang = currentUser?.fullName?.includes('Thắng') || currentUser?.email === 'kol1@scanms.vn';
  const ownerName = isThang ? 'Thắng' : 'Nhật';
  const ownerHandle = isThang ? 'thang' : 'nhat';

  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [platformName, setPlatformName] = useState('TIKTOK');
  const [channelName, setChannelName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [followerCount, setFollowerCount] = useState<number>(50000);
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const list = await socialService.getMyChannels();
      setChannels(list);
    } catch (err) {
      console.error('Lỗi tải kênh MXH:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await socialService.addChannel({
        platformName,
        channelName,
        channelUrl,
        followerCount: Number(followerCount),
        isPrimary,
      });
      showToast('Đã liên kết kênh mạng xã hội thành công!');
      setShowModal(false);
      setChannelName('');
      setChannelUrl('');
      setFollowerCount(50000);
      setIsPrimary(false);
      loadChannels();
    } catch (err: any) {
      showToast(err.message || 'Lỗi liên kết kênh');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối kênh này?')) return;
    try {
      await socialService.deleteChannel(id);
      showToast('Đã xóa kênh mạng xã hội.');
      loadChannels();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa kênh');
    }
  };

  const displayChannels = channels.length > 0 ? channels : [
    {
      id: 'c1',
      platformName: 'TIKTOK',
      channelName: `${ownerName} Review Mỹ Phẩm & Skincare`,
      channelUrl: `https://tiktok.com/@${ownerHandle}affiliate.official`,
      followerCount: 184200,
      isPrimary: true,
      verifiedAt: '2026-09-01',
    },
    {
      id: 'c2',
      platformName: 'FACEBOOK',
      channelName: `${ownerName} Review Hàng Chính Hãng`,
      channelUrl: `https://facebook.com/${ownerHandle}reviewofficial`,
      followerCount: 68450,
      isPrimary: false,
      verifiedAt: '2026-09-02',
    },
    {
      id: 'c3',
      platformName: 'YOUTUBE',
      channelName: `${ownerName} Tech & Lifestyle Affiliate`,
      channelUrl: `https://youtube.com/@${ownerHandle}channelvn`,
      followerCount: 48200,
      isPrimary: false,
      verifiedAt: null,
    },
    {
      id: 'c4',
      platformName: 'INSTAGRAM',
      channelName: `${ownerName} Creator & Deals`,
      channelUrl: `https://instagram.com/${ownerHandle}.deals`,
      followerCount: 24500,
      isPrimary: false,
      verifiedAt: null,
    },
    {
      id: 'c5',
      platformName: 'THREADS',
      channelName: `${ownerName} Daily Skincare Blog`,
      channelUrl: 'https://threads.net/@thang.daily',
      followerCount: 16800,
      isPrimary: false,
      verifiedAt: null,
    },
  ];

  const filtered = displayChannels.filter((c) => {
    const matchSearch =
      (c.channelName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.channelUrl || '').toLowerCase().includes(search.toLowerCase());
    const matchPlatform =
      filterPlatform === 'ALL' || c.platformName === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const getPlatformBadge = (plat: string) => {
    switch (plat.toUpperCase()) {
      case 'TIKTOK':
        return <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">TikTok</span>;
      case 'FACEBOOK':
        return <span className="px-2 py-0.5 rounded-md bg-[#1877f2] text-white text-[10px] font-bold">Facebook</span>;
      case 'YOUTUBE':
        return <span className="px-2 py-0.5 rounded-md bg-[#ff0000] text-white text-[10px] font-bold">YouTube</span>;
      case 'INSTAGRAM':
        return <span className="px-2 py-0.5 rounded-md bg-[#e1306c] text-white text-[10px] font-bold">Instagram</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-[#7D715E] text-white text-[10px] font-bold">{plat}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">

      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
              Kênh mạng xã hội của KOL / CTV
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7]">
              {filtered.length} / {displayChannels.length} kênh
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
              Attribution Tracking v2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7D715E] m-0 max-w-3xl">
            Quản lý đa kênh truyền thông của bạn (TikTok, Facebook, YouTube, Instagram, Threads). Hệ thống tự động phân tách link tiếp thị và báo cáo chuyển đổi theo từng kênh phân phối.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={loadChannels}
          >
            Khôi phục mẫu
          </Button>
          <Button
            variant="gold"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowModal(true)}
          >
            Thêm kênh mới
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between gap-2 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#7D715E] font-medium">Tổng kênh liên kết</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-extrabold text-[#1A1612]">
            5 <span className="text-sm font-normal text-[#7D715E]">kênh</span>
          </strong>
          <span className="text-[11px] text-emerald-600 font-semibold">2 kênh đã xác minh API / tick xanh</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-2 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#7D715E] font-medium">Tổng lượt tiếp cận (Followers)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-extrabold text-[#1A1612]">368.7K</strong>
          <span className="text-[11px] text-[#7D715E]">Độ phủ trên 5 nền tảng MXH</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-2 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#7D715E] font-medium">Kênh chính hoạt động</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <strong className="text-base font-extrabold text-[#1A1612] truncate">@{ownerHandle}affiliate.official</strong>
          <span className="text-[11px] text-[#7D715E]">TikTok • 184.2K followers</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-2 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#7D715E] font-medium">Tổng GMV từ các kênh</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-extrabold text-[#B88E4F]">380.800.000 ₫</strong>
          <span className="text-[11px] text-[#7D715E]">Hoa hồng ròng: 50.950.000 ₫</span>
        </Card>
      </div>

      <Card className="p-3.5 bg-white flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-[#A49B8B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hiển thị, handle (@username) hoặc lĩnh vực..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#7D715E]">Nền tảng:</span>
          <div className="relative">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
            >
              <option value="ALL">Tất cả nền tảng</option>
              <option value="TIKTOK">TikTok</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c, idx) => (
          <Card key={c.id || idx} className="p-5 flex flex-col justify-between gap-4 bg-white">

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm font-bold text-[#1A1612]">{c.channelName}</strong>
                    {c.isPrimary && (
                      <span title="Kênh chính">
                        <Star className="w-3.5 h-3.5 text-[#B88E4F] fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getPlatformBadge(c.platformName)}
                    <span className="text-xs text-[#7D715E]">
                      {c.followerCount ? `${(c.followerCount / 1000).toFixed(1)}K followers` : c.channelUrl}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {(c as any).verifiedAt ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác minh
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#7D715E] border border-[#EAE4D7]">
                    Tự khai báo
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7] text-center">
              <div>
                <span className="text-[11px] text-[#7D715E] block">Lượt Click</span>
                <strong className="text-xs font-bold text-[#1A1612]">
                  {idx === 0 ? '14.280' : idx === 1 ? '8.910' : idx === 2 ? '4.320' : '2.180'}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#7D715E] block">Đơn / CVR</span>
                <strong className="text-xs font-bold text-[#B88E4F]">
                  {idx === 0 ? '864 (6.05%)' : idx === 1 ? '490 (5.5%)' : idx === 2 ? '215 (4.9%)' : '110 (5.0%)'}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#7D715E] block">GMV Bán</span>
                <strong className="text-xs font-bold text-[#1A1612]">
                  {idx === 0 ? '182.5 tr ₫' : idx === 1 ? '98.4 tr ₫' : idx === 2 ? '62.1 tr ₫' : '23.6 tr ₫'}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#7D715E] block">Hoa hồng</span>
                <strong className="text-xs font-bold text-emerald-600">
                  {idx === 0 ? '24.65 tr ₫' : idx === 1 ? '12.8 tr ₫' : idx === 2 ? '8.45 tr ₫' : '3.10 tr ₫'}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  icon={<Link2 className="w-3.5 h-3.5" />}
                  onClick={() => window.location.href = '/collaborator/links'}
                >
                  Tạo link
                </Button>
                <a
                  href={c.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] transition"
                >
                  <span>Xem kênh</span>
                  <ExternalLink className="w-3 h-3 text-[#7D715E]" />
                </a>
              </div>

              {c.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Xóa kênh"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#EAE4D7] shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-extrabold text-[#1A1612] m-0">
                Thêm Kênh Mạng Xã Hội Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#7D715E] hover:text-[#1A1612] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                  Nền tảng truyền thông
                </label>
                <select
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                >
                  <option value="TIKTOK">TikTok (Khuyên dùng cho video ngắn)</option>
                  <option value="FACEBOOK">Facebook (Fanpage / Group)</option>
                  <option value="YOUTUBE">YouTube (Shorts &amp; Video dài)</option>
                  <option value="INSTAGRAM">Instagram (Reels / Story)</option>
                  <option value="THREADS">Threads</option>
                  <option value="ZALO">Zalo Official Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                  Tên hiển thị kênh
                </label>
                <input
                  type="text"
                  placeholder="VD: Tuấn Review Skincare"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                  Đường dẫn (URL) hoặc Handle (@username)
                </label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@tuanaffiliate"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
                  Lượng người theo dõi (Followers)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-[#EAE4D7] text-[#B88E4F] focus:ring-[#B88E4F]"
                />
                <span className="text-xs font-medium text-[#1A1612]">
                  Đặt làm kênh truyền thông chính thức (Primary channel)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                >
                  Xác nhận liên kết
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
