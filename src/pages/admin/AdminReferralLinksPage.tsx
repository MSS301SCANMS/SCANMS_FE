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
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Clock3,
  LockKeyhole,
  UnlockKeyhole,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';
import type { ReferralLinkItem } from '../../services/referral-links.service';
import { toast } from '../../utils/toast';
import { Select } from '../../components/ui/Select';

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
  const [totalPages, setTotalPages] = useState(1);


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
      setTotalPages(Math.max(1, Number(res.meta.totalPages) || 1));
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.status === 403) {
        setErrorMsg('Bạn không có quyền quản trị cấp sàn (SYSTEM_ADMIN hoặc SYSTEM_MANAGER) để truy cập dữ liệu liên kết tiếp thị này.');
      } else {
        setErrorMsg(err.message || 'Lỗi khi tải danh sách liên kết tiếp thị toàn sàn');
      }
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

  const handleCopy = async (shortCode: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(shortCode);
      toast.success('Đã sao chép liên kết');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Không thể sao chép liên kết. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    if (!isBlockModalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingBlock) setIsBlockModalOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isBlockModalOpen, isSubmittingBlock]);

  return (
    <div className="grid gap-4 min-w-0 text-[#1A1612]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <article className="flex items-center gap-3 min-w-0 p-4 border border-[#EAE4D7] rounded-xl bg-white shadow-sm">
          <span className="hidden sm:grid place-items-center w-8.5 h-8.5 shrink-0 border border-[#EEDFC6] rounded-lg text-[#B88E4F] bg-white"><Link2 size={18} /></span>
          <div><p className="text-[#7D715E] text-xs leading-relaxed">{search || statusFilter || channelFilter ? 'Liên kết phù hợp' : 'Liên kết trên sàn'}</p><strong className="block mt-1 text-2xl font-semibold tabular-nums text-[#1A1612]">{totalLinks.toLocaleString('vi-VN')}</strong></div>
        </article>
        <article className="flex items-center gap-3 min-w-0 p-4 border border-[#EAE4D7] rounded-xl bg-white shadow-sm">
          <span className="hidden sm:grid place-items-center w-8.5 h-8.5 shrink-0 border border-[#EEDFC6] rounded-lg text-[#B88E4F] bg-white"><TrendingUp size={18} /></span>
          <div><p className="text-[#7D715E] text-xs leading-relaxed">Lượt nhấp ghi nhận{totalPages > 1 ? ' · trang ' + page : ''}</p><strong className="block mt-1 text-2xl font-semibold tabular-nums text-[#1A1612]">{links.reduce((sum, link) => sum + (link.totalClicks || 0), 0).toLocaleString('vi-VN')}</strong></div>
        </article>
        <article className="flex items-center gap-3 min-w-0 p-4 border border-[#EAE4D7] rounded-xl bg-white shadow-sm">
          <span className="hidden sm:grid place-items-center w-8.5 h-8.5 shrink-0 border border-[#EEDFC6] rounded-lg text-[#B88E4F] bg-white"><ShoppingBag size={18} /></span>
          <div><p className="text-[#7D715E] text-xs leading-relaxed">Đơn hàng chuyển đổi{totalPages > 1 ? ' · trang ' + page : ''}</p><strong className="block mt-1 text-2xl font-semibold tabular-nums text-[#1A1612]">{links.reduce((sum, link) => sum + (link.totalOrders || 0), 0).toLocaleString('vi-VN')}</strong></div>
        </article>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_auto] gap-3.5 items-center p-3.5 border border-[#EAE4D7] rounded-xl bg-white">
        <form onSubmit={handleSearch} className="flex gap-2 min-w-0">
          <div className="relative min-w-0 flex-1">
            <Search size={15} aria-hidden="true" className="absolute left-3 top-3 text-[#7D715E] pointer-events-none" />
            <input id="admin-referral-search" aria-label="Tìm liên kết tiếp thị" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã link, sản phẩm hoặc nhãn…" className="w-full h-[38px] pl-8.5 pr-2.5 py-2 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#FBF5EB]" />
          </div>
          <button type="submit" className="px-3.5 py-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-medium hover:border-[#C59B58] transition-colors cursor-pointer">Tìm</button>
        </form>
        <div className="grid grid-cols-2 md:grid-cols-[172px_140px_auto] items-center gap-2.5">
          <Select aria-label="Lọc trạng thái liên kết" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="w-full">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="BLOCKED">Bị khóa</option>
            <option value="EXPIRED">Hết hạn</option>
          </Select>
          <Select aria-label="Lọc kênh tiếp thị" value={channelFilter} onChange={(event) => { setChannelFilter(event.target.value); setPage(1); }} className="w-full">
            <option value="">Tất cả kênh</option>
            <option value="TIKTOK">TikTok</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="ZALO">Zalo</option>
            <option value="OTHER">Khác</option>
          </Select>
          <button type="button" className="inline-flex justify-center items-center gap-1.5 h-[38px] px-3 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs whitespace-nowrap hover:border-[#C59B58] hover:text-[#B88E4F] transition-colors cursor-pointer col-span-2 md:col-span-1 justify-self-end md:justify-self-auto" onClick={() => fetchAdminLinks()} disabled={loading} title="Làm mới dữ liệu">
            <RefreshCw size={14} className={loading ? 'animate-spin' : 'text-[#B88E4F]'} /> Làm mới
          </button>
        </div>
      </div>

      <section className="min-w-0 overflow-hidden border border-[#EAE4D7] rounded-xl bg-white" aria-label="Danh sách liên kết tiếp thị">
        {errorMsg ? (
          <div className="flex items-start gap-2.5 p-5 text-[#DC2626] text-xs leading-relaxed" role="alert"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-5 text-[#7D715E] text-center" role="status"><Loader2 size={24} className="animate-spin text-[#B88E4F]" /><p className="text-xs">Đang tải liên kết tiếp thị…</p></div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-5 text-[#7D715E] text-center"><Link2 size={28} className="text-[#B88E4F]" /><h3 className="text-sm font-semibold text-[#1A1612]">Không tìm thấy liên kết</h3><p className="text-xs">Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả.</p></div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto" role="region" tabIndex={0} aria-label="Bảng liên kết tiếp thị">
              <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
                <caption className="sr-only">Liên kết tiếp thị trên sàn SCANMS</caption>
                <colgroup>
                  <col style={{ width: '170px' }} /><col /><col style={{ width: '180px' }} /><col style={{ width: '110px' }} />
                  <col style={{ width: '90px' }} /><col style={{ width: '60px' }} /><col style={{ width: '115px' }} /><col style={{ width: '105px' }} />
                </colgroup>
                <thead className="bg-[#FAF8F5]"><tr>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap">Mã link</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap">Sản phẩm & gian hàng</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap">KOL tiếp thị</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap">Kênh / UTM</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap text-center">Nhấp</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap text-center">Đơn</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap">Trạng thái</th>
                  <th scope="col" className="h-11 px-3 py-2.5 border-b border-[#EAE4D7] text-[#7D715E] text-xs font-medium whitespace-nowrap text-right">Thao tác</th>
                </tr></thead>
                <tbody>
                  {links.map((link) => {
                    const fullUrl = window.location.origin + '/r/' + link.shortCode;
                    const statusLabel = link.status === 'BLOCKED' ? 'Bị khóa' : link.status === 'PAUSED' ? 'Tạm dừng' : link.status === 'EXPIRED' ? 'Hết hạn' : 'Hoạt động';
                    return (
                      <tr key={link.id} className="hover:bg-[#FBF5EB] transition-colors border-b border-[#EAE4D7] last:border-b-0">
                        <td className="p-3 text-xs align-middle">
                          <div className="flex items-center gap-1.5">
                            <code className="px-1.5 py-0.5 border border-[#EAE4D7] rounded bg-white text-xs font-mono font-medium">{link.shortCode}</code>
                            <button type="button" onClick={() => { void handleCopy(link.shortCode, fullUrl); }} aria-label={'Sao chép liên kết ' + link.shortCode} title="Sao chép liên kết" className="grid place-items-center w-6 h-6 shrink-0 rounded text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] cursor-pointer">
                              {copiedCode === link.shortCode ? <CheckCircle2 size={14} className="text-[#059669]" /> : <Copy size={14} />}
                            </button>
                            <a href={fullUrl} target="_blank" rel="noreferrer" aria-label={'Mở liên kết ' + link.shortCode + ' trong tab mới'} title="Mở liên kết" className="grid place-items-center w-6 h-6 shrink-0 rounded text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] cursor-pointer"><ExternalLink size={13} /></a>
                          </div>
                          {link.label && <p className="mt-1 truncate text-[#7D715E] text-[10px]" title={link.label}>{link.label.replaceAll('_', ' ')}</p>}
                          <p className="mt-0.5 truncate text-[#7D715E] text-[10px]">{new Date(link.createdAt).toLocaleDateString('vi-VN')}</p>
                        </td>
                        <td className="p-3 text-xs align-middle">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {link.product?.imageUrl && <img src={link.product.imageUrl} alt={link.product.title} onError={(event) => { event.currentTarget.classList.add('hidden'); event.currentTarget.nextElementSibling?.classList.remove('hidden'); }} className="w-9 h-9 shrink-0 border border-[#EAE4D7] rounded-lg bg-white object-contain" />}
                            <span className={'grid place-items-center w-9 h-9 shrink-0 border border-[#EAE4D7] rounded-lg bg-white text-[#B88E4F] ' + (link.product?.imageUrl ? 'hidden' : '')}><ShoppingBag size={18} /></span>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-xs font-medium leading-relaxed" title={link.product?.title}>{link.product?.title || 'Sản phẩm không rõ'}</p>
                              <p className="flex items-center gap-1 mt-1 text-[#7D715E] text-[10px]"><Store size={11} className="text-[#B88E4F] shrink-0" /><span title={link.store?.name} className="truncate">{link.store?.name || 'Gian hàng'}</span></p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs align-middle">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="grid place-items-center w-7 h-7 shrink-0 border border-[#EEDFC6] rounded-full bg-white text-[#B88E4F] text-xs font-medium">{link.collaborator?.fullName?.charAt(0) || <User size={14} />}</span>
                            <div className="min-w-0"><p className="line-clamp-2 text-xs font-medium leading-relaxed" title={link.collaborator?.fullName}>{link.collaborator?.fullName || 'Ẩn danh'}</p><p className="truncate text-[#7D715E] text-[10px]" title={link.collaborator?.email}>{link.collaborator?.email || ''}</p></div>
                          </div>
                        </td>
                        <td className="p-3 text-xs align-middle">
                          <span className="inline-block max-w-full px-1.5 py-0.5 border border-[#EAE4D7] rounded bg-white text-[#7D715E] text-[10px] leading-normal">{link.channel || 'Chưa xác định'}</span>
                          {link.utmSource && <p className="mt-0.5 truncate text-[#7D715E] text-[10px]" title={link.utmSource}>Nguồn: {link.utmSource}</p>}
                        </td>
                        <td className="p-3 text-xs align-middle text-center tabular-nums">
                          <strong className="text-xs font-semibold">{(link.totalClicks || 0).toLocaleString('vi-VN')}</strong><p className="text-[10px] text-[#7D715E]">{(link.uniqueClicks || 0).toLocaleString('vi-VN')} duy nhất</p>
                        </td>
                        <td className="p-3 text-xs align-middle text-center tabular-nums"><strong className="text-xs font-semibold">{(link.totalOrders || 0).toLocaleString('vi-VN')}</strong></td>
                        <td className="p-3 text-xs align-middle">
                          <span className={'inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] leading-tight whitespace-nowrap ' + (link.status === 'BLOCKED' ? 'border-red-200 bg-red-50/50 text-[#DC2626]' : 'border-[#EAE4D7] bg-white text-[#7D715E]')}>
                            {link.status === 'BLOCKED' ? <ShieldAlert size={12} className="text-[#DC2626] shrink-0" /> : link.status === 'PAUSED' ? <Clock3 size={12} className="text-[#B88E4F] shrink-0" /> : link.status !== 'EXPIRED' ? <CheckCircle2 size={12} className="text-[#059669] shrink-0" /> : null}
                            {statusLabel}
                          </span>
                          {link.status === 'BLOCKED' && link.disabledReason && <p className="line-clamp-2 mt-1 text-[#DC2626] text-[10px]" title={link.disabledReason}>{link.disabledReason}</p>}
                        </td>
                        <td className="p-3 text-xs align-middle text-right">
                          {link.status === 'BLOCKED' ? (
                            <button type="button" className="inline-flex justify-center items-center gap-1 min-h-[28px] px-2 py-1 border border-[#EEDFC6] rounded-md bg-white text-[#7D715E] text-[10px] font-medium whitespace-nowrap hover:bg-[#FBF5EB] hover:text-[#B88E4F] transition-colors cursor-pointer" onClick={() => handleUnblock(link)}><UnlockKeyhole size={13} /> Mở khóa</button>
                          ) : (
                            <button type="button" className="inline-flex justify-center items-center gap-1 min-h-[28px] px-2 py-1 border border-red-200 rounded-md bg-white text-[#DC2626] text-[10px] font-medium whitespace-nowrap hover:bg-red-50 transition-colors cursor-pointer" onClick={() => handleOpenBlockModal(link)}><LockKeyhole size={13} /> Khóa link</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2.5 p-3 border-t border-[#EAE4D7] text-[#7D715E] text-xs">
              <span>{links.length} / {totalLinks.toLocaleString('vi-VN')} liên kết · Trang {page}</span>
              {totalPages > 1 && <div className="flex items-center gap-2.5">
                <button type="button" aria-label="Trang trước" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="grid place-items-center w-7 h-7 border border-[#EAE4D7] rounded bg-white text-[#7D715E] hover:border-[#C59B58] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                <span>{page} / {totalPages}</span>
                <button type="button" aria-label="Trang tiếp" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="grid place-items-center w-7 h-7 border border-[#EAE4D7] rounded bg-white text-[#7D715E] hover:border-[#C59B58] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
              </div>}
            </div>
          </>
        )}
      </section>

      {isBlockModalOpen && selectedLinkToBlock && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-[#231D15]/35 backdrop-blur-[3px]">
          <div className="w-full max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto p-4 border border-[#EAE4D7] rounded-2xl bg-white shadow-xl text-[#1A1612]" role="dialog" aria-modal="true" aria-labelledby="admin-referral-block-title">
            <header className="flex items-center justify-between gap-3 pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2"><ShieldAlert size={18} className="text-[#DC2626] shrink-0" /><h3 id="admin-referral-block-title" className="text-sm font-semibold">Khóa liên kết tiếp thị</h3></div>
              <button type="button" aria-label="Đóng cửa sổ" disabled={isSubmittingBlock} onClick={() => setIsBlockModalOpen(false)} className="p-1 text-[#7D715E] hover:text-[#1A1612] cursor-pointer"><X size={18} /></button>
            </header>
            <p className="my-3 p-2.5 border-l-2 border-[#EEDFC6] text-[#7D715E] text-xs leading-relaxed bg-[#FAF8F5]/60">Sau khi khóa, khách hàng không thể mở sản phẩm qua link này và các lượt truy cập mới không được ghi nhận hoa hồng.</p>
            <div className="flex justify-between gap-2.5 mb-3.5 p-2.5 border border-[#EAE4D7] rounded-lg text-xs"><span>Mã link</span><code className="font-mono font-medium text-[#B88E4F]">{selectedLinkToBlock.shortCode}</code></div>
            <label htmlFor="admin-referral-block-reason" className="block mb-1.5 text-xs font-medium">Lý do khóa <span className="text-[#DC2626]">*</span></label>
            <textarea id="admin-referral-block-reason" rows={3} value={blockReason} onChange={(event) => setBlockReason(event.target.value)} placeholder="Mô tả vi phạm cần xử lý…" className="w-full min-h-[80px] p-2.5 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs leading-relaxed resize-y outline-none focus:border-[#C59B58]" />
            <footer className="flex justify-end gap-2 mt-3.5">
              <button type="button" disabled={isSubmittingBlock} onClick={() => setIsBlockModalOpen(false)} className="inline-flex items-center justify-center min-h-[32px] px-3 py-1.5 border border-[#EAE4D7] rounded-lg text-[#7D715E] text-xs hover:bg-[#FAF8F5] cursor-pointer">Hủy bỏ</button>
              <button type="button" className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3.5 py-1.5 border border-[#DC2626] rounded-lg bg-[#DC2626] text-white text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50" onClick={handleConfirmBlock} disabled={isSubmittingBlock || !blockReason.trim()}>
                {isSubmittingBlock ? <><Loader2 size={13} className="animate-spin" /> Đang khóa…</> : 'Xác nhận khóa'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
