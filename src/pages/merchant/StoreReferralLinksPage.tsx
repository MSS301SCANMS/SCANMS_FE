import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2,
  Store,
  ShieldAlert,
  Search,
  User,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';
import type { ReferralLinkItem } from '../../services/referral-links.service';
import api from '../../services/api';
import { toast } from '../../utils/toast';

export default function StoreReferralLinksPage() {
  const initStartedRef = useRef(false);
  const [links, setLinks] = useState<ReferralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('Gian Hàng Của Bạn');


  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);


  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedLinkToBlock, setSelectedLinkToBlock] = useState<ReferralLinkItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);


  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    async function initStore() {
      try {
        const res: any = await api.get('/auth/me');
        const user = res?.data || res;

        if (user?.stores && user.stores.length > 0) {
          setStoreId(user.stores[0].id);
          setStoreName(user.stores[0].name);
        } else {

          const storeRes: any = await api.get('/collaborator/stores');
          const stores = storeRes?.data || storeRes || [];
          if (stores.length > 0) {
            setStoreId(stores[0].id);
            setStoreName(stores[0].name);
          }
        }
      } catch (err: any) {
        console.error('Lỗi khi lấy storeId:', err);
      }
    }
    initStore();
  }, []);

  const fetchStoreLinks = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await referralLinksService.getStoreLinks(storeId, {
        page,
        limit: 20,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        search: search.trim() || undefined,
      });
      setLinks(res.data);
      setTotalLinks(res.meta.total);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải danh sách liên kết tiếp thị');
    } finally {
      setLoading(false);
    }
  }, [storeId, page, statusFilter, channelFilter, search]);

  useEffect(() => {
    fetchStoreLinks();
  }, [fetchStoreLinks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStoreLinks();
  };


  const handleOpenBlockModal = (link: ReferralLinkItem) => {
    setSelectedLinkToBlock(link);
    setBlockReason('');
    setIsBlockModalOpen(true);
  };


  const handleConfirmBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLinkToBlock || !storeId || blockReason.trim().length < 5) {
      toast.warning('Vui lòng nhập lý do khóa tối thiểu 5 ký tự');
      return;
    }

    setIsSubmittingBlock(true);
    try {
      await referralLinksService.blockLink(storeId, selectedLinkToBlock.id, blockReason.trim());
      setIsBlockModalOpen(false);
      setSelectedLinkToBlock(null);
      toast.success('Đã khóa liên kết tiếp thị thành công');
      fetchStoreLinks();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi khóa liên kết');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblock = async (link: ReferralLinkItem) => {
    if (!confirm('Bạn có chắc chắn muốn mở khóa cho liên kết tiếp thị này hoạt động trở lại?')) return;
    try {
      await referralLinksService.unblockLink(storeId, link.id);
      toast.success('Đã mở khóa liên kết tiếp thị thành công');
      fetchStoreLinks();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi mở khóa liên kết');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] font-sans pb-16">

      <div className="bg-[#F3EFE6] border-b border-[#EAE4D7]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-[#B88E4F] text-sm font-bold mb-1">
            <Store className="w-4 h-4" />
            <span>Dành cho Chủ Cửa hàng (Shop Manager)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A1612] flex items-center gap-3">
            Quản Lý Liên Kết Tiếp Thị Sản Phẩm
          </h1>
          <p className="mt-1 text-sm text-[#7D715E] max-w-2xl">
            Theo dõi tất cả KOL đang quảng bá sản phẩm của gian hàng <strong className="text-[#1A1612]">{storeName}</strong> ({totalLinks} liên kết). Bạn có quyền tạm khóa các liên kết vi phạm nội dung hoặc chính sách giá.
          </p>
        </div>
      </div>

      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        <div className="bg-white rounded-2xl border border-[#EAE4D7] p-4 shadow-xs mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                placeholder="Tìm theo mã shortCode, tên sản phẩm hoặc tên KOL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-sm text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-sm text-[#1A1612] outline-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PAUSED">Tạm ngừng</option>
              <option value="BLOCKED">Đã bị khóa</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-sm text-[#1A1612] outline-none cursor-pointer"
            >
              <option value="">Tất cả kênh</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="ZALO">Zalo</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-sm font-bold transition-colors shadow-xs cursor-pointer"
            >
              Lọc kết quả
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE4D7] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-[#7D715E]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#B88E4F]" />
              <p className="text-sm">Đang tải danh sách liên kết tiếp thị của Cửa hàng...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-12 text-center text-rose-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">{errorMsg}</p>
            </div>
          ) : links.length === 0 ? (
            <div className="p-16 text-center text-[#7D715E]">
              <Link2 className="w-12 h-12 mx-auto mb-3 text-[#EAE4D7]" />
              <p className="text-base font-bold text-[#1A1612]">Chưa có liên kết tiếp thị nào cho Cửa hàng</p>
              <p className="text-xs text-[#7D715E] mt-1">Khi KOL tạo link cho sản phẩm của bạn, dữ liệu sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F3EFE6] border-b border-[#EAE4D7] text-[11px] font-bold text-[#7D715E] uppercase tracking-wider">
                    <th className="py-3.5 px-4">KOL Tiếp thị</th>
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4">Mã rút gọn &amp; Kênh</th>
                    <th className="py-3.5 px-4 text-center">Lượt nhấp</th>
                    <th className="py-3.5 px-4 text-center">Đơn hàng</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Hành động của Shop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{link.collaborator?.fullName || 'Cộng tác viên'}</span>
                        </div>
                        <div className="text-xs text-slate-400">{link.collaborator?.email}</div>
                      </td>


                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800 max-w-[200px] truncate" title={link.product?.title}>
                          {link.product?.title}
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold">
                          {Number(link.product?.price || 0).toLocaleString('vi-VN')} đ
                        </div>
                      </td>


                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {link.shortCode}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {link.channel || 'Đa kênh'} {link.label ? `• "${link.label}"` : ''}
                        </div>
                      </td>


                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        {link.totalClicks}
                      </td>


                      <td className="py-4 px-4 text-center font-bold text-purple-700">
                        {link.totalOrders}
                      </td>


                      <td className="py-4 px-4">
                        {link.status === 'BLOCKED' ? (
                          <div className="text-xs text-rose-700 font-semibold">
                            <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block">
                              Đã bị khóa
                            </span>
                            {link.disabledReason && (
                              <div className="text-[11px] text-rose-600 italic mt-0.5 max-w-[180px] truncate" title={link.disabledReason}>
                                Lý do khóa: {link.disabledReason}
                              </div>
                            )}
                          </div>
                        ) : link.status === 'ACTIVE' ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Tạm ngừng
                          </span>
                        )}
                      </td>


                      <td className="py-4 px-4 text-right">
                        {link.status === 'BLOCKED' ? (
                          <button
                            onClick={() => handleUnblock(link)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                          >
                            Mở khóa link
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenBlockModal(link)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Khóa link vi phạm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {isBlockModalOpen && selectedLinkToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Khóa Liên Kết Tiếp Thị Vi Phạm
              </h3>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 text-[#7D715E] hover:text-[#1A1612] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBlock} className="space-y-4">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1">
                <div>• <strong className="text-[#1A1612]">KOL:</strong> {selectedLinkToBlock.collaborator?.fullName}</div>
                <div>• <strong className="text-[#1A1612]">Sản phẩm:</strong> {selectedLinkToBlock.product?.title}</div>
                <div>• <strong className="text-[#1A1612]">Mã link:</strong> {selectedLinkToBlock.shortCode}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1612] uppercase tracking-wider mb-1">
                  Lý do khóa link (Bắt buộc, tối thiểu 5 ký tự) *
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={255}
                  rows={3}
                  placeholder="Ví dụ: Quảng cáo sai thông tin cam kết của Shop, nội dung spam tiêu cực..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none"
                />
                <div className="text-[11px] text-[#7D715E] mt-1">
                  Lý do này sẽ được ghi nhận vào Audit Log và hiển thị cho KOL trong trang quản lý.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7D715E] hover:bg-[#F3EFE6] rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBlock || blockReason.trim().length < 5}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmittingBlock ? 'Đang xử lý...' : 'Xác nhận khóa link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

