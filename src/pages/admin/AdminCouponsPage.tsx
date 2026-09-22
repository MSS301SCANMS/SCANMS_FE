import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Store,
  User,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Percent,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  couponService,
  type CouponItem,
  type CouponStatus,
} from '../../services/coupon.service';
import { toast } from '../../utils/toast';

const STATUS_LABELS: Record<CouponStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    bg: 'bg-[#FBF5EB]',
    text: 'text-[#B88E4F]',
    border: 'border-[#EEDFC6]',
  },
  PENDING_APPROVAL: {
    label: 'Chờ Shop duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  PAUSED: {
    label: 'Tạm ngưng',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
  },
  REJECTED: {
    label: 'Đã từ chối',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  EXPIRED: {
    label: 'Hết hạn',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-200',
  },
  BLOCKED: {
    label: 'Đã bị khóa',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  DELETED: {
    label: 'Đã xóa',
    bg: 'bg-stone-100',
    text: 'text-stone-400',
    border: 'border-stone-200',
  },
};

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');


  const [detailCoupon, setDetailCoupon] = useState<CouponItem | null>(null);


  const [blockTarget, setBlockTarget] = useState<CouponItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);


  const [unblockLoading, setUnblockLoading] = useState(false);

  const hasOpenModal = detailCoupon !== null || blockTarget !== null;

  useEffect(() => {
    if (window.self === window.top) return;

    window.parent.postMessage(
      { type: 'SCANMS_MODAL_STATE', open: hasOpenModal },
      window.location.origin,
    );

    return () => {
      if (hasOpenModal) {
        window.parent.postMessage(
          { type: 'SCANMS_MODAL_STATE', open: false },
          window.location.origin,
        );
      }
    };
  }, [hasOpenModal]);

  useEffect(() => {
    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [hasOpenModal]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponService.getAdminCoupons();
      setCoupons(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách coupon toàn sàn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTarget) return;
    if (!blockReason.trim() || blockReason.trim().length < 5) {
      setBlockError('Vui lòng nhập lý do khóa chi tiết (tối thiểu 5 ký tự)');
      return;
    }

    try {
      setBlockLoading(true);
      setBlockError(null);
      await couponService.adminBlockCoupon(blockTarget.id, blockReason.trim());
      setBlockTarget(null);
      setBlockReason('');
      await fetchCoupons();
    } catch (err: any) {
      setBlockError(err.response?.data?.message || 'Không thể khóa coupon');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async (coupon: CouponItem) => {
    if (!window.confirm(`Xác nhận mở khóa cho mã "${coupon.displayCode}"?`)) return;
    try {
      setUnblockLoading(true);
      await couponService.adminUnblockCoupon(coupon.id);
      toast.success('Đã mở khóa mã giảm giá thành công');
      await fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể mở khóa coupon');
    } finally {
      setUnblockLoading(false);
    }
  };


  const filteredCoupons = coupons.filter((c) => {
    const matchSearch =
      c.codeNormalized.includes(searchTerm.trim().toUpperCase()) ||
      (c.store?.name && c.store.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.collaborator?.fullName && c.collaborator.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.collaborator?.email && c.collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' ? true : c.status === statusFilter;
    return matchSearch && matchStatus;
  });


  const totalCount = coupons.length;
  const activeCount = coupons.filter((c) => c.status === 'ACTIVE').length;
  const blockedCount = coupons.filter((c) => c.status === 'BLOCKED').length;
  const totalRedemptions = coupons.reduce((acc, curr) => acc + (curr.usageCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 sm:p-6 lg:p-8 text-[#1A1612]">
      <div className="max-w-[1520px] mx-auto mb-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4D7] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Quản Trị Toàn Sàn (FR-12 Admin)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1612]">
              Quản Trị Coupon & Mã Giảm Giá Toàn Sàn
            </h1>
            <p className="text-sm sm:text-base text-[#7D715E] mt-1">
              Giám sát toàn bộ mã ưu đãi của các KOL và Gian hàng. Khóa mã gian lận hoặc can thiệp xử lý khi có vi phạm chính sách.
            </p>
          </div>
        </div>


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">Tổng coupon toàn sàn</span>
              <Tag className="w-4 h-4 text-[#C59B58]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">{totalCount}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">Đang hoạt động</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">{activeCount}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">Bị khóa vi phạm</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">Tổng lượt sử dụng</span>
              <Percent className="w-4 h-4 text-[#B88E4F]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">{totalRedemptions}</p>
          </div>
        </div>


        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã, tên KOL, email, tên gian hàng..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg focus:outline-none focus:border-[#C59B58] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'ACTIVE', label: 'Đang chạy' },
              { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { key: 'PAUSED', label: 'Tạm ngưng' },
              { key: 'BLOCKED', label: 'Bị khóa' },
              { key: 'EXPIRED', label: 'Hết hạn' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EEDFC6] hover:text-[#1A1612]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>


        {loading ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C59B58] mx-auto mb-3" />
            <p className="text-sm text-[#7D715E]">Đang tải danh sách coupon toàn sàn...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <Tag className="w-10 h-10 text-[#C59B58] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[#1A1612]">Không tìm thấy mã giảm giá phù hợp</h3>
            <p className="text-xs text-[#7D715E] mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái để tra cứu.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EAE4D7] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[#7D715E] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Coupon</th>
                    <th className="py-3 px-4">KOL / CTV</th>
                    <th className="py-3 px-4">Gian Hàng</th>
                    <th className="py-3 px-4">Ưu Đãi</th>
                    <th className="py-3 px-4">Tài Trợ</th>
                    <th className="py-3 px-4">Lượt Dùng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {filteredCoupons.map((coupon) => {
                    const statusCfg = STATUS_LABELS[coupon.status] || STATUS_LABELS.PENDING_APPROVAL;
                    const isDiscountPercent = coupon.discountType === 'PERCENTAGE';
                    const discountVal = Number(coupon.discountValue || 0);

                    return (
                      <tr key={coupon.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1A1612]">
                          <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#EEDFC6] text-[#B88E4F]">
                            {coupon.displayCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#7D715E] shrink-0" />
                            <div>
                              <p className="font-semibold text-[#1A1612] leading-tight">
                                {coupon.collaborator?.fullName || 'N/A'}
                              </p>
                              <p className="text-[11px] text-[#7D715E]">{coupon.collaborator?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                            <span className="font-medium text-[#1A1612]">
                              {coupon.store?.name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#1A1612]">
                            {isDiscountPercent
                              ? `Giảm ${discountVal}%`
                              : `Giảm ${discountVal.toLocaleString('vi-VN')} ₫`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]">
                            {coupon.fundingSource === 'CO_FUNDED'
                              ? `Đồng tài trợ (${coupon.shopFundingRate || 50}% Shop / ${coupon.platformFundingRate || 50}% Sàn)`
                              : coupon.fundingSource === 'PLATFORM_FUNDED'
                              ? '100% SCANMS'
                              : '100% Shop'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#1A1612]">
                            {coupon.usageCount} {coupon.usageLimitTotal ? `/ ${coupon.usageLimitTotal}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailCoupon(coupon)}
                              className="p-1.5 rounded-lg text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] transition-colors cursor-pointer"
                              title="Xem chi tiết chính sách"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {coupon.status === 'BLOCKED' ? (
                              <button
                                onClick={() => handleUnblock(coupon)}
                                disabled={unblockLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors text-[11px] font-semibold cursor-pointer"
                                title="Mở khóa coupon"
                              >
                                <Unlock className="w-3 h-3" />
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setBlockTarget(coupon);
                                  setBlockReason('');
                                  setBlockError(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-[11px] font-semibold cursor-pointer"
                                title="Khóa coupon"
                              >
                                <Lock className="w-3 h-3" />
                                Khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {detailCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EAE4D7] shadow-2xl text-left my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C59B58]" />
                <h3 className="text-lg font-bold text-[#1A1612]">
                  Chi tiết Coupon: {detailCoupon.displayCode}
                </h3>
              </div>
              <button
                onClick={() => setDetailCoupon(null)}
                className="text-[#7D715E] hover:text-[#1A1612] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#7D715E]">
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Mã chuẩn hóa:</span>
                <span className="font-mono font-bold text-[#1A1612]">{detailCoupon.codeNormalized}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Gian hàng:</span>
                <span className="font-bold text-[#1A1612]">{detailCoupon.store?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>KOL sở hữu:</span>
                <span className="font-bold text-[#1A1612]">{detailCoupon.collaborator?.fullName} ({detailCoupon.collaborator?.email})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Loại giảm giá:</span>
                <span className="font-bold text-[#1A1612]">
                  {detailCoupon.discountType === 'PERCENTAGE'
                    ? `Giảm ${detailCoupon.discountValue}%`
                    : `Giảm ${Number(detailCoupon.discountValue).toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
              {detailCoupon.maximumDiscountAmount && (
                <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                  <span>Giảm tối đa:</span>
                  <span className="font-bold text-[#1A1612]">
                    {Number(detailCoupon.maximumDiscountAmount).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              )}
              {detailCoupon.minimumOrderAmount && (
                <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                  <span>Đơn tối thiểu:</span>
                  <span className="font-bold text-[#1A1612]">
                    {Number(detailCoupon.minimumOrderAmount).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Nguồn tài trợ:</span>
                <span className="font-bold text-[#1A1612]">
                  {detailCoupon.fundingSource === 'CO_FUNDED'
                    ? `Đồng tài trợ (${detailCoupon.shopFundingRate || 50}% Shop / ${detailCoupon.platformFundingRate || 50}% Sàn)`
                    : detailCoupon.fundingSource === 'PLATFORM_FUNDED'
                    ? '100% SCANMS tài trợ'
                    : '100% Shop tài trợ'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Lượt dùng / Giới hạn:</span>
                <span className="font-bold text-[#1A1612]">
                  {detailCoupon.usageCount} / {detailCoupon.usageLimitTotal || 'Không giới hạn'} (Mỗi khách: {detailCoupon.usageLimitPerCustomer} lượt)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Ngân sách đã dùng:</span>
                <span className="font-bold text-[#1A1612]">
                  {Number(detailCoupon.budgetUsed || 0).toLocaleString('vi-VN')} ₫
                  {detailCoupon.budgetTotal && ` / ${Number(detailCoupon.budgetTotal).toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                <span>Chính sách cộng dồn:</span>
                <span className="font-medium text-[#1A1612]">
                  Sp giảm giá: {detailCoupon.stackableWithProductDiscount ? '✓' : '✗'} | Voucher Shop: {detailCoupon.stackableWithShopVoucher ? '✓' : '✗'} | Voucher Sàn: {detailCoupon.stackableWithPlatformVoucher ? '✓' : '✗'}
                </span>
              </div>
              {detailCoupon.blockedReason && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <p className="font-semibold">Lý do bị khóa:</p>
                  <p className="mt-0.5">{detailCoupon.blockedReason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailCoupon(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-[#1A1612] text-xs font-semibold hover:bg-[#EAE4D7] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {blockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EAE4D7] shadow-2xl text-left my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-red-600 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#1A1612]">
                Khóa Coupon: {blockTarget.displayCode}
              </h3>
            </div>
            <p className="text-xs text-[#7D715E] mb-4">
              Sau khi khóa, khách hàng sẽ không thể nhập mã này tại trang thanh toán và KOL sẽ nhận được thông báo về lý do khóa vi phạm.
            </p>

            {blockError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {blockError}
              </div>
            )}

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Lý do khóa vi phạm <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện hành vi tự đặt đơn ảo hoặc spam mã qua bot..."
                  className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-red-500 transition"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockTarget(null)}
                  disabled={blockLoading}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={blockLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {blockLoading ? 'Đang xử lý...' : 'Xác nhận khóa mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;

