import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  ShieldAlert,
  Search,
  User,
  Store,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';
import type { ReferralLinkItem } from '../../services/referral-links.service';
import { toast } from '../../utils/toast';

export default function AdminReferralLinksPage() {
  const [links, setLinks] = useState<ReferralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);


  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);


  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedLinkToBlock, setSelectedLinkToBlock] = useState<ReferralLinkItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const fetchAdminLinks = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await referralLinksService.getAdminReferralLinks({
        page,
        limit: 20,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        search: search.trim() || undefined,
      });
      setLinks(res.data);
      setTotalLinks(res.meta.total);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải danh sách liên kết tiếp thị toàn sàn');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, channelFilter, search]);

  useEffect(() => {
    fetchAdminLinks();
  }, [fetchAdminLinks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAdminLinks();
  };


  const handleOpenBlockModal = (link: ReferralLinkItem) => {
    setSelectedLinkToBlock(link);
    setBlockReason('');
    setIsBlockModalOpen(true);
  };


  const handleConfirmBlock = async () => {
    if (!selectedLinkToBlock || !blockReason.trim()) return;
    setIsSubmittingBlock(true);
    try {
      await referralLinksService.blockLinkByAdmin(selectedLinkToBlock.id, blockReason.trim());
      setIsBlockModalOpen(false);
      setSelectedLinkToBlock(null);
      setBlockReason('');
      toast.success('Đã khóa liên kết tiếp thị vi phạm thành công');
      fetchAdminLinks();
    } catch (err: any) {
      toast.error(err.message || 'Không thể khóa liên kết tiếp thị này');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblock = async (link: ReferralLinkItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa liên kết ${link.shortCode} không?`)) return;
    try {
      await referralLinksService.unblockLinkByAdmin(link.id);
      toast.success('Đã mở khóa liên kết tiếp thị thành công');
      fetchAdminLinks();
    } catch (err: any) {
      toast.error(err.message || 'Không thể mở khóa liên kết tiếp thị');
    }
  };

  const handleCopy = (shortCode: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(shortCode);
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                System Administrator
              </span>
              <span className="text-xs text-slate-400">FR-10 Quản trị toàn sàn</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-6 h-6 text-indigo-600" />
              Quản Trị Liên Kết Tiếp Thị Toàn Hệ Thống
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kiểm duyệt, giám sát lưu lượng click, theo dõi chuyển đổi đơn hàng và xử lý vi phạm liên kết trên toàn sàn.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdminLinks()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng liên kết toàn hệ thống</p>
              <h3 className="text-xl font-bold text-slate-900">{totalLinks.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng lượt click ghi nhận</p>
              <h3 className="text-xl font-bold text-slate-900">
                {links.reduce((acc, l) => acc + (l.totalClicks || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng đơn hàng chuyển đổi</p>
              <h3 className="text-xl font-bold text-slate-900">
                {links.reduce((acc, l) => acc + (l.totalOrders || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearch} className="w-full md:w-96 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã rút gọn, tên sản phẩm, nhãn..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="PAUSED">Tạm dừng (PAUSED)</option>
                <option value="BLOCKED">Bị khóa vi phạm (BLOCKED)</option>
                <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
              </select>
            </div>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả kênh</option>
              <option value="TIKTOK">TikTok</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="ZALO">Zalo</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>


        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {errorMsg && (
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Đang tải dữ liệu liên kết tiếp thị...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="py-16 text-center">
              <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Không tìm thấy liên kết nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Hiện tại không có liên kết tiếp thị nào phù hợp với điều kiện tìm kiếm và bộ lọc của bạn.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mã & Liên kết rút gọn</th>
                    <th className="px-6 py-4">Sản phẩm & Cửa hàng</th>
                    <th className="px-6 py-4">Cộng tác viên (KOL)</th>
                    <th className="px-6 py-4">Kênh / UTM</th>
                    <th className="px-6 py-4 text-center">Lượt Click</th>
                    <th className="px-6 py-4 text-center">Đơn Hàng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((link) => {
                    const fullUrl = `${window.location.origin}/r/${link.shortCode}`;
                    return (
                      <tr key={link.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">
                              {link.shortCode}
                            </span>
                            <button
                              onClick={() => handleCopy(link.shortCode, fullUrl)}
                              title="Sao chép liên kết"
                              className="text-slate-400 hover:text-indigo-600 transition"
                            >
                              {copiedCode === link.shortCode ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Mở liên kết trong tab mới"
                              className="text-slate-400 hover:text-indigo-600 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          {link.label && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              Nhãn: {link.label}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tạo: {new Date(link.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {link.product?.imageUrl ? (
                              <img
                                src={link.product.imageUrl}
                                alt={link.product.title}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                                {link.product?.title || 'Sản phẩm không rõ'}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <Store className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{link.store?.name || 'Cửa hàng'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                              {link.collaborator?.fullName?.charAt(0) || <User className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {link.collaborator?.fullName || 'Ẩn danh'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {link.collaborator?.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {link.channel || 'Chưa định danh'}
                          </span>
                          {link.utmSource && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              src: {link.utmSource}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-slate-900">{link.totalClicks}</span>
                          <p className="text-[11px] text-slate-400">({link.uniqueClicks} unique)</p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {link.totalOrders || 0}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {link.status === 'BLOCKED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Bị khóa
                            </span>
                          ) : link.status === 'PAUSED' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              Tạm dừng
                            </span>
                          ) : link.status === 'EXPIRED' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Hết hạn
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              Hoạt động
                            </span>
                          )}
                          {link.status === 'BLOCKED' && link.disabledReason && (
                            <p className="text-[11px] text-red-600 mt-1 line-clamp-1" title={link.disabledReason}>
                              Lý do: {link.disabledReason}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {link.status === 'BLOCKED' ? (
                            <button
                              onClick={() => handleUnblock(link)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBlockModal(link)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                            >
                              Khóa vi phạm
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {isBlockModalOpen && selectedLinkToBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">Khóa Liên Kết Vi Phạm</h3>
                </div>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 leading-relaxed">
                  Cảnh báo: Khóa liên kết sẽ vô hiệu hóa hoàn toàn mã rút gọn này trên toàn hệ thống (HTTP 410 Gone). Khách truy cập sẽ không thể mở sản phẩm và không được tính hoa hồng.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã rút gọn đang xử lý:
                  </label>
                  <p className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 p-2 rounded-lg">
                    {selectedLinkToBlock.shortCode}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lý do khóa vi phạm <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Nhập lý do chi tiết (VD: Quảng cáo sai sự thật, spam link trái quy định...)"
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    disabled={isSubmittingBlock}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBlock}
                    disabled={isSubmittingBlock || !blockReason.trim()}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition inline-flex items-center gap-2 shadow-sm"
                  >
                    {isSubmittingBlock ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang khóa...
                      </>
                    ) : (
                      'Xác nhận khóa'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
