import { Clock3, CheckCircle2, CircleAlert, RefreshCw, Pencil } from 'lucide-react';
import type { UpgradeStatusResponse } from '../../services/kyc.service';
import { safeReturnMedia } from '../../services/shop-returns.service';

export default function KolApplicationStatusCard({ application, onEdit, onRefresh, onOpen }: {
  application: NonNullable<UpgradeStatusResponse['kolApplication']>;
  onEdit: () => void; onRefresh: () => void; onOpen: () => void;
}) {
  const data = application.applicationData || {};
  const verified = application.status === 'VERIFIED';
  const rejected = application.status === 'REJECTED';
  const hasDetails = !!data.idCardNumber && !!data.frontCardUrl && !!data.backCardUrl && !!data.bankName && !!data.bankAccountNumber && !!data.bankAccountName && !!data.channelUrl;
  const Icon = verified ? CheckCircle2 : rejected ? CircleAlert : Clock3;
  return <section aria-label="Hồ sơ KOL đã nộp" className="overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white text-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE4D7] p-5">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Icon size={21} /></span><div><h2 className="m-0 text-base font-semibold">{verified ? 'Hồ sơ KOL đã được duyệt' : rejected ? 'Hồ sơ cần cập nhật và gửi lại' : 'Hồ sơ KOL đang chờ xét duyệt'}</h2><p className="mb-0 mt-1 text-xs text-[#7D715E]">{application.submittedAt ? `Ngày nộp: ${new Date(application.submittedAt).toLocaleString('vi-VN')}` : 'Chưa ghi nhận ngày nộp'}</p></div></div>
      <button type="button" onClick={onRefresh} aria-label="Kiểm tra trạng thái KOL" className="inline-flex items-center gap-2 rounded-lg border border-[#EAE4D7] px-3 py-2 text-xs text-[#795A2D]"><RefreshCw size={14} />Kiểm tra trạng thái</button>
    </div>
    {!hasDetails && !verified && <div role="alert" className="mx-5 mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900"><strong>Hồ sơ cũ mới lưu trạng thái, chưa có đủ thông tin và giấy tờ.</strong><p className="m-0">Chọn “Bổ sung hồ sơ KOL” để cập nhật vào hồ sơ đang có. Các dữ liệu chưa được máy chủ lưu trước đây cần được nhập lại.</p></div>}
    {application.socialLinksJson?.rejectionReason && <p className="mx-5 mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">Lý do từ chối: {application.socialLinksJson.rejectionReason}</p>}
    {Object.keys(data).length > 0 && <div className="grid gap-5 p-5 md:grid-cols-2">
      <div className="min-w-0"><h3 className="mb-3 mt-0 text-sm font-semibold">Kênh truyền thông</h3><dl className="m-0 grid gap-3 text-xs">{[['Nền tảng', data.platform], ['Tên kênh', data.channelName], ['Người theo dõi', data.followerCount == null ? '' : Number(data.followerCount).toLocaleString('vi-VN')], ['Liên kết kênh', data.channelUrl]].map(([label, value]) => <div key={label} className="grid min-w-0 gap-1"><dt className="text-[#7D715E]">{label}</dt><dd className="m-0 break-all leading-5">{value || 'Chưa cung cấp'}</dd></div>)}</dl></div>
      <div className="min-w-0"><h3 className="mb-3 mt-0 text-sm font-semibold">Định danh và tài khoản nhận hoa hồng</h3><dl className="m-0 grid gap-3 text-xs">{[['Số CCCD', data.idCardNumber], ['Ngân hàng', data.bankName], ['Số tài khoản', data.bankAccountNumber], ['Tên chủ tài khoản', data.bankAccountName]].map(([label, value]) => <div key={label}><dt className="text-[#7D715E]">{label}</dt><dd className="m-0 mt-1 break-words leading-5">{value || 'Chưa cung cấp'}</dd></div>)}</dl></div>
      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-3">{[['CCCD mặt trước', data.frontCardUrl], ['CCCD mặt sau', data.backCardUrl], ['Ảnh xác minh kênh', data.channelProofUrl]].map(([label, url]) => {
        const safe = safeReturnMedia(url);
        return <div key={label} className="min-w-0"><span className="mb-2 block text-xs text-[#7D715E]">{label}</span>{safe ? <a href={safe} target="_blank" rel="noreferrer" aria-label={`Xem ${label}`} className="block overflow-hidden rounded-lg border border-[#EAE4D7]"><img src={safe} alt={label} className="h-32 w-full bg-[#FAF8F5] object-contain" /></a> : <div className="grid h-32 place-items-center rounded-lg border border-dashed border-[#EAE4D7] text-xs text-[#7D715E]">Chưa đính kèm</div>}</div>;
      })}</div>
    </div>}
    <div className="flex flex-wrap items-center gap-3 p-5">
      {verified ? <button type="button" onClick={onOpen} className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2.5 text-xs font-semibold text-[#795A2D]">Vào không gian KOL</button> : <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2.5 text-xs font-semibold text-[#795A2D]"><Pencil size={14} />{hasDetails ? 'Cập nhật hồ sơ KOL' : 'Bổ sung hồ sơ KOL'}</button>}
      {!verified && <span className="text-xs text-[#7D715E]">Thông tin đã lưu được dùng để manager xét duyệt.</span>}
    </div>
  </section>;
}
