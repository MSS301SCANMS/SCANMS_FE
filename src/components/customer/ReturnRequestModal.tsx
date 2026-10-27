import { useMemo, useState } from 'react';
import { AlertTriangle, ImagePlus, Loader2, Upload, Video, X } from 'lucide-react';
import { customerService, type CustomerOrder, type CustomerReturnRequest } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { Select } from '../ui/Select';

interface Props {
  order: CustomerOrder;
  onClose: () => void;
  onSubmitted: (request: CustomerReturnRequest) => void;
}

const reasons: Array<{ value: CustomerReturnRequest['reason']; label: string }> = [
  { value: 'DAMAGED', label: 'Sản phẩm hư hỏng' },
  { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm' },
  { value: 'EXPIRED', label: 'Sản phẩm hết hạn' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export function ReturnRequestModal({ order, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState<CustomerReturnRequest['reason']>('DAMAGED');
  const [details, setDetails] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);

  const daysLeft = useMemo(() => {
    const anchor = new Date(order.deliveredAt || order.completedAt || 0).getTime();
    return Math.max(0, Math.ceil((anchor + 14 * 24 * 60 * 60 * 1000 - Date.now()) / 86400000));
  }, [order.deliveredAt, order.completedAt]);

  const close = () => {
    const saved = [...completed.current.values()].at(-1);
    if (saved) onSubmitted(saved);
    else onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (images.length === 0 || !video) {
      toast.error('Vui lòng cung cấp ít nhất 1 ảnh và video mở hộp');
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls = savedEvidence.current?.imageUrls || await Promise.all(
        images.map((file) => uploadService.uploadImage(file, `scanms/returns/${order.id}/images`)),
      );
      const unboxingVideoUrl = await uploadService.uploadVideo(video, `scanms/returns/${order.id}/video`);
      const result = await customerService.createReturnRequest(order.id, {
        reason,
        details: details.trim() || undefined,
        imageUrls,
        unboxingVideoUrl,
      });
      toast.success('Đã gửi yêu cầu trả hàng/hoàn tiền tới gian hàng');
      onSubmitted([...completed.current.values()].at(-1)!);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể gửi yêu cầu trả hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#231D15]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onChange={() => { requestKey.current = crypto.randomUUID(); savedEvidence.current = null; }} onSubmit={submit} className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-[#EAE4D7] shadow-2xl p-6 text-left">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE4D7]">
          <div>
            <h2 className="text-lg font-black text-[#1A1612]">Yêu cầu trả hàng / hoàn tiền</h2>
            <p className="text-xs text-[#7D715E] mt-1">Đơn #{order.externalOrderSn} · còn khoảng {daysLeft} ngày trong thời hạn 14 ngày</p>
          </div>
          <button type="button" onClick={close} disabled={submitting} className="p-2 rounded-full bg-[#F3EFE6] text-[#7D715E]" aria-label="Đóng"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] p-3 flex gap-2 text-xs text-[#7D715E]">
          <AlertTriangle className="w-4 h-4 text-[#B88E4F] shrink-0" />
          <span>Ảnh tình trạng sản phẩm và video mở hộp là bằng chứng bắt buộc. SCANMS lưu hồ sơ để gian hàng xử lý minh bạch.</span>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-xs font-bold text-[#1A1612]">Lý do
            <div className="mt-1.5">
              <Select value={reason} onChange={(e) => setReason(e.target.value as CustomerReturnRequest['reason'])} className="w-full text-xs font-medium">
                {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </div>
          </label>
          <label className="block text-xs font-bold text-[#1A1612]">Mô tả chi tiết
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={2000} placeholder="Mô tả lỗi, tình trạng bao bì và mong muốn xử lý..." className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 outline-none focus:border-[#C59B58]" />
          </label>

          <label className="block rounded-2xl border border-dashed border-[#C59B58] bg-[#FBF5EB]/60 p-4 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-bold text-[#1A1612]"><ImagePlus className="w-4 h-4 text-[#B88E4F]" /> Ảnh bằng chứng (bắt buộc, tối đa 5)</span>
            <span className="block text-[11px] text-[#7D715E] mt-1">JPG, PNG hoặc WEBP · tối đa 5MB/ảnh</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { setImages(Array.from(e.target.files || []).slice(0, 5)); savedEvidence.current = null; }} />
            {images.length > 0 && <span className="block mt-2 text-xs text-[#B88E4F] font-bold">Đã chọn {images.length} ảnh</span>}
          </label>

          <label className="block rounded-2xl border border-dashed border-[#C59B58] bg-[#FBF5EB]/60 p-4 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-bold text-[#1A1612]"><Video className="w-4 h-4 text-[#B88E4F]" /> Video mở hộp (bắt buộc)</span>
            <span className="block text-[11px] text-[#7D715E] mt-1">MP4, MOV hoặc WEBM · tối đa 100MB</span>
            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => { setVideo(e.target.files?.[0] || null); savedEvidence.current = null; }} />
            {video && <span className="block mt-2 text-xs text-[#B88E4F] font-bold truncate">{video.name}</span>}
          </label>
        </div>

        {requestStarted && !submitting && <p role="status" className="mt-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">Đã gửi {completedIds.length}/{submission.current?.length || selectedIds.length} yêu cầu. Bấm thử lại để tiếp tục gửi các sản phẩm còn lại; những yêu cầu đã gửi sẽ được giữ nguyên.</p>}

        <div className="flex gap-2 mt-6 pt-4 border-t border-[#EAE4D7]">
          <button type="button" onClick={close} disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#F3EFE6] text-[#7D715E] text-xs font-bold">Đóng</button>
          <button type="submit" disabled={submitting || !selectedIds.length || !images.length || !video} className="flex-[2] py-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {submitting ? 'Đang gửi yêu cầu...' : requestStarted ? 'Thử lại sản phẩm chưa gửi' : `Gửi yêu cầu (${selectedIds.length} sản phẩm)`}
          </button>
        </div>
      </form>
    </div>
  );
}
