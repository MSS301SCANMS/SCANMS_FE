import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2,
  ShieldAlert,
  Search,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  MousePointerClick,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';
import type { ReferralLinkItem } from '../../services/referral-links.service';
import { storeService, MissingOwnedStoreError } from '../../services/store.service';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { Select } from '../../components/ui/Select';

export default function StoreReferralLinksPage() {
  const requestSequence = useRef(0);
  const [links, setLinks] = useState<ReferralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string>('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', channel: '' });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedLinkToBlock, setSelectedLinkToBlock] = useState<ReferralLinkItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const fetchStoreLinks = useCallback(async () => {
    const request = ++requestSequence.current;
    setLoading(true); setErrorMsg(null); setLinks([]);
    const deadline = window.setTimeout(() => {
      if (request !== requestSequence.current) return;
      requestSequence.current++;
      setErrorMsg('Máy chủ phản hồi chậm. Vui lòng thử tải lại.');
      setLoading(false);
    }, 20000);
    try {
      const store = await storeService.getMyStore(true);
      if (request !== requestSequence.current) return;
      setStoreId(store.id);
      const res = await referralLinksService.getStoreLinks(store.id, {
        page, limit: 30,
        status: filters.status || undefined,
        channel: filters.channel || undefined,
        search: filters.search || undefined,
      });
      if (request !== requestSequence.current) return;
      setLinks(res.data); setTotalPages(res.meta.totalPages); setTotal(res.meta.total);
    } catch (err: any) {
      if (request !== requestSequence.current) return;
      setLinks([]);
      setErrorMsg(err instanceof MissingOwnedStoreError
        ? 'Gian hàng chưa được kích hoạt. Vui lòng kiểm tra hồ sơ gian hàng.'
        : 'Chưa tải được danh sách liên kết tiếp thị. Vui lòng thử lại.');
    } finally {
      window.clearTimeout(deadline);
      if (request === requestSequence.current) setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void fetchStoreLinks();
    const requests = requestSequence;
    return () => { requests.current++; };
  }, [fetchStoreLinks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { search: search.trim(), status: statusFilter, channel: channelFilter };
    if (page === 1 && JSON.stringify(next) === JSON.stringify(filters)) void fetchStoreLinks();
    else { setPage(1); setFilters(next); }
  };

  const handleResetFilters = () => {
    setSearch(''); setStatusFilter(''); setChannelFilter(''); setPage(1);
    setFilters({ search: '', status: '', channel: '' });
  };

  const handleCopyLink = (link: ReferralLinkItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://scanms.vn';
    const fullUrl = link.shortUrl || `${origin}/r/${link.shortCode}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(fullUrl);
      setCopiedId(link.id);
      toast.success(`Đã sao chép link tiếp thị mã ${link.shortCode}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
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

  const formatCleanLabel = (label: string | null | undefined) => {
    if (!label) return null;
    return label
      .replace(/^Exclusive_Deal:\s*/i, 'Deal: ')
      .replace(/^Link_[^_]+_Store_-_/i, '')
      .replace(/_/g, ' ')
      .trim();
  };

  const hasActiveFilters = Boolean(search || statusFilter || channelFilter);

  return (
    <div className="promotions-links mx-auto flex w-full min-w-0 max-w-[1520px] flex-col gap-4 pb-8 pt-3 font-sans text-[#1A1612] sm:pt-4">
      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-[#EAE4D7] bg-white p-3 shadow-[0_3px_12px_rgba(35,29,21,0.035)] sm:p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_200px_180px_auto] xl:items-center">
          {/* Search Box */}
          <div className="relative w-full min-w-0 md:col-span-2 xl:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
            <input
              type="text"
              placeholder="Tìm mã liên kết, tên sản phẩm hoặc mã KOL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-10 pr-4 text-sm text-[#1A1612] outline-none transition placeholder:text-[#7D715E]/65 focus:border-[#C59B58] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            aria-label="Lọc trạng thái liên kết"
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="h-11 w-full text-sm font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="PAUSED">Tạm ngừng</option>
            <option value="BLOCKED">Đã bị khóa</option>
          </Select>

          {/* Channel Filter */}
          <Select
            value={channelFilter}
            aria-label="Lọc kênh tiếp thị"
            onChange={(e) => {
              setChannelFilter(e.target.value);
            }}
            className="h-11 w-full text-sm font-medium"
          >
            <option value="">Tất cả kênh</option>
            <option value="TIKTOK">TikTok</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="ZALO">Zalo</option>
          </Select>

          {/* Action Buttons */}
          <div className="flex w-full shrink-0 items-center gap-2 md:col-span-2 xl:col-span-1 xl:w-auto">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#C59B58] bg-[#C59B58] px-5 text-sm font-bold text-[#231D15] shadow-2xs transition hover:bg-[#B88E4F] active:scale-[0.98] xl:flex-initial"
            >
              Lọc kết quả
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#8A642C]"
                title="Xóa bộ lọc"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-sm">
        {loading ? (
          <div role="status" className="p-16 text-center text-[#7D715E] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#B88E4F]" />
            <p className="text-sm font-medium">Đang tải danh sách liên kết tiếp thị của Cửa hàng...</p>
          </div>
        ) : errorMsg ? (
          <div role="alert" className="p-12 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">{errorMsg}</p>
            <button type="button" onClick={() => void fetchStoreLinks()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-4 py-2 text-sm font-semibold text-[#795A2D]"><RotateCcw size={16} />Thử tải lại</button>
          </div>
        ) : links.length === 0 ? (
          <div className="p-16 text-center text-[#7D715E]">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center mx-auto text-[#B88E4F] mb-3">
              <Link2 className="w-6 h-6 text-[#B88E4F]" />
            </div>
            <p className="text-base font-bold text-[#1A1612]">{Object.values(filters).some(Boolean) ? 'Không có liên kết khớp bộ lọc' : 'Chưa có liên kết tiếp thị nào'}</p>
            <p className="text-xs text-[#7D715E] mt-1">
              {Object.values(filters).some(Boolean) ? 'Thử thay đổi từ khóa, trạng thái hoặc kênh tiếp thị.' : 'Khi KOL tạo link tiếp thị cho sản phẩm của shop, dữ liệu sẽ hiển thị tại đây.'}
            </p>
            {Object.values(filters).some(Boolean) && <button type="button" onClick={handleResetFilters} className="mt-3 rounded-xl border border-[#EAE4D7] px-4 py-2 text-sm font-semibold">Xóa bộ lọc</button>}
          </div>
        ) : (
          <>
          <div className="relative isolate max-w-full overflow-x-auto" role="region" aria-label="Bảng liên kết tiếp thị, có thể cuộn ngang" tabIndex={0}>
            <table className="w-full min-w-[960px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[18%]" />
                <col />
                <col className="w-[170px]" />
                <col className="w-[60px]" />
                <col className="w-[60px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-[0.08em] text-[#5F5547]">
                  <th className="px-4 py-3.5">
                    <span className="block">KOL tiếp thị</span>
                    <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-[#7D715E]">Hiển thị {links.length} liên kết</span>
                  </th>
                  <th className="px-4 py-3.5">Sản phẩm &amp; chính sách</th>
                  <th className="px-4 py-3.5">Mã link &amp; kênh</th>
                  <th className="whitespace-nowrap px-2 py-3.5 text-center">Nhấp</th>
                  <th className="whitespace-nowrap px-2 py-3.5 text-center">Đơn</th>
                  <th className="whitespace-nowrap px-3 py-3.5">Trạng thái</th>
                  <th className="sticky right-0 z-20 bg-[#FAF8F5] px-3 py-3.5 text-center shadow-[-1px_0_0_#EAE4D7]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0] text-xs">
                {links.map((link) => {
                  const cleanLabel = formatCleanLabel(link.label);
                  const isCopied = copiedId === link.id;
                  const kolInitials = (link.collaborator?.fullName || 'KOL')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase();
                  const productImg = getSafeProductImageUrl(link.product?.imageUrl);

                  return (
                    <tr key={link.id} className="transition-colors hover:bg-[#FBF5EB]/45">
                      {/* 1. KOL Column */}
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-extrabold text-[#8A642C]">
                            {kolInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="line-clamp-2 break-words font-semibold leading-5 text-[#1A1612]" title={link.collaborator?.fullName}>
                              {link.collaborator?.fullName || `KOL ${link.collaboratorId?.slice(-6) || ''}`}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-[#7D715E]" title={link.collaborator?.email}>
                              {link.collaborator?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Product & Commission Column */}
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-xl border border-[#EAE4D7] object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[10px] font-bold text-[#7D715E]">
                              SP
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className="font-semibold text-[#1A1612] line-clamp-2 leading-5"
                              title={link.product?.title}
                            >
                              {link.product?.title || 'Sản phẩm'}
                            </div>
                            <div className="mt-1 text-sm font-bold text-[#8A642C]">
                              {Number(link.product?.price || 0).toLocaleString('vi-VN')} ₫
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                  link.commissionType === 'EXCLUSIVE_DEAL'
                                    ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]'
                                    : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'
                                }`}
                              >
                                {link.commissionType === 'EXCLUSIVE_DEAL' ? (
                                  <>
                                    <Sparkles className="h-3 w-3 shrink-0 text-[#B88E4F]" />
                                    <span className="truncate">Deal độc quyền {link.commissionRate ? `· ${link.commissionRate}%` : ''}</span>
                                  </>
                                ) : (
                                  <span>Công khai {link.commissionRate ? `· ${link.commissionRate}%` : ''}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. ShortCode & Channel Column */}
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <code className="select-all min-w-0 break-all rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 font-mono text-xs font-semibold text-[#1A1612]">
                            {link.shortCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link)}
                            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition ${isCopied ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]' : 'border-transparent text-[#7D715E] hover:border-[#EAE4D7] hover:bg-[#FAF8F5] hover:text-[#8A642C]'}`}
                            title="Sao chép link tiếp thị"
                          >
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] text-[#7D715E]">
                          <span className="shrink-0 rounded-md bg-[#F3EFE6] px-1.5 py-0.5 font-bold text-[#5F5547]">{link.channel || 'Đa kênh'}</span>
                          {cleanLabel && (
                            <>
                              <span className="truncate" title={cleanLabel}>
                                {cleanLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 4. Click Metrics */}
                      <td data-label="Lượt nhấp" className="px-1.5 py-3 text-center">
                        <div className="inline-flex min-w-10 items-center justify-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-2 py-1.5 font-bold text-[#1A1612]">
                          <MousePointerClick className="h-3.5 w-3.5 text-[#8A642C]" />
                          <span>{link.totalClicks || 0}</span>
                        </div>
                      </td>

                      {/* 5. Order Metrics */}
                      <td data-label="Đơn hàng" className="px-1.5 py-3 text-center">
                        <div
                          className={`inline-flex min-w-10 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-bold ${
                            (link.totalOrders || 0) > 0
                              ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]'
                              : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'
                          }`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{link.totalOrders || 0}</span>
                        </div>
                      </td>

                      {/* 6. Status Column (Fixed whitespace-nowrap) */}
                      <td className="px-2 py-3">
                        {link.status === 'BLOCKED' ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 whitespace-nowrap">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Đã bị khóa</span>
                            </span>
                            {link.disabledReason && (
                              <span
                                className="text-[10px] text-rose-600 italic mt-0.5 max-w-[140px] truncate"
                                title={link.disabledReason}
                              >
                                {link.disabledReason}
                              </span>
                            )}
                          </div>
                        ) : link.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-bold text-[#8A642C] whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58]" />
                            <span>Đang hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#F3EFE6] px-2.5 py-1 text-[11px] font-bold text-[#7D715E] whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Tạm ngừng</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Action Column (Fixed whitespace-nowrap) */}
                      <td className="sticky right-0 z-10 bg-white px-2 py-3 text-center shadow-[-1px_0_0_#EAE4D7]">
                        {link.status === 'BLOCKED' ? (
                          <button
                            type="button"
                            onClick={() => handleUnblock(link)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-2 text-xs font-bold text-[#8A642C] shadow-2xs transition hover:bg-[#F3EFE6] whitespace-nowrap cursor-pointer select-none active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mở khóa link</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBlockModal(link)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-100 whitespace-nowrap cursor-pointer select-none active:scale-95"
                            title="Khóa link này nếu phát hiện KOL vi phạm cam kết hoặc spam tiêu cực"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Khóa link</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[#EAE4D7] px-4 py-3 text-sm text-[#7D715E]">
            <span>{total} liên kết · Trang {page}/{totalPages}</span>
            <div className="flex gap-2"><button type="button" onClick={() => setPage(current => current - 1)} disabled={page <= 1} className="rounded-lg border border-[#EAE4D7] px-3 py-2 disabled:opacity-40">Trang trước</button><button type="button" onClick={() => setPage(current => current + 1)} disabled={page >= totalPages} className="rounded-lg border border-[#EAE4D7] px-3 py-2 disabled:opacity-40">Trang sau</button></div>
          </div>
          </>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {isBlockModalOpen && selectedLinkToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-6 animate-in zoom-in-95 duration-200 text-[#1A1612]">
            <div className="flex items-center justify-between mb-4 border-b border-[#EAE4D7] pb-3">
              <h3 className="text-base font-extrabold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Khóa Liên Kết Tiếp Thị Vi Phạm</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 text-[#7D715E] hover:text-[#1A1612] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBlock} className="space-y-4">
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1.5">
                <div>
                  • <strong className="text-[#1A1612]">KOL:</strong> {selectedLinkToBlock.collaborator?.fullName}
                </div>
                <div>
                  • <strong className="text-[#1A1612]">Sản phẩm:</strong> {selectedLinkToBlock.product?.title}
                </div>
                <div>
                  • <strong className="text-[#1A1612]">Mã link:</strong>{' '}
                  <code className="font-mono font-bold text-[#1A1612]">{selectedLinkToBlock.shortCode}</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1612] uppercase tracking-wider mb-1">
                  Lý do khóa link (Tối thiểu 5 ký tự) *
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={255}
                  rows={3}
                  placeholder="Ví dụ: Quảng cáo sai thông tin cam kết của Shop, spam nội dung vi phạm..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-200 outline-none transition"
                />
                <div className="text-[11px] text-[#7D715E] mt-1">
                  Lý do này sẽ được ghi nhận vào hệ thống và hiển thị thông báo cho KOL.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBlock || blockReason.trim().length < 5}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
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
