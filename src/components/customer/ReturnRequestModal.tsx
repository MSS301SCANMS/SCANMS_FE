import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ImagePlus, Loader2, Upload, Video, X } from 'lucide-react';
import { customerService, type CustomerOrder, type CustomerReturnRequest } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { Select } from '../ui/Select';
import { orderDisplayCode } from '../../utils/order-display-code';

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
  const eligible = order.orderItems.filter(item => (item.returnableQuantity ?? item.quantity) > 0);
  const [selectedIds, setSelectedIds] = useState<string[]>(eligible[0] ? [eligible[0].id] : []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const allCheckbox = useRef<HTMLInputElement>(null);
  const allSelected = eligible.length > 0 && selectedIds.length === eligible.length;
  const [requestStarted, setRequestStarted] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  type ReturnInput = Parameters<typeof customerService.createReturnRequest>[1];
  const submission = useRef<ReturnInput[] | null>(null);
  const completed = useRef(new Map<string, CustomerReturnRequest>());
  const savedEvidence = useRef<{ imageUrls: string[]; unboxingVideoUrl: string } | null>(null);
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
    if (submitting) return;
    const selected = eligible.filter(item => selectedIds.includes(item.id));
    if (!selected.length || selected.some(item => {
      const quantity = quantities[item.id] ?? 1;
      return !Number.isInteger(quantity) || quantity < 1 || quantity > (item.returnableQuantity ?? item.quantity);
    })) { toast.error('Chọn sản phẩm và số lượng hợp lệ'); return; }
    if (images.length === 0 || !video) {
      toast.error('Vui lòng cung cấp ít nhất 1 ảnh và video mở hộp');
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls = savedEvidence.current?.imageUrls || await Promise.all(
        images.map((file) => uploadService.uploadImage(file, `scanms/returns/${order.id}/images`)),
      );
      const unboxingVideoUrl = savedEvidence.current?.unboxingVideoUrl || await uploadService.uploadVideo(video, `scanms/returns/${order.id}/video`);
      savedEvidence.current = { imageUrls, unboxingVideoUrl };
      if (!submission.current) {
        submission.current = selected.map(item => ({
          orderItemId: item.id,
          quantity: quantities[item.id] ?? 1,
          idempotencyKey: crypto.randomUUID(),
          reason,
          details: details.trim() || undefined,
          imageUrls,
          unboxingVideoUrl,
        }));
        setRequestStarted(true);
      }
      // Persist each item's key and completed response so a partial retry never creates it twice.
      for (const input of submission.current) {
        const id = input.orderItemId!;
        if (completed.current.has(id)) continue;
        const result = await customerService.createReturnRequest(order.id, input);
        completed.current.set(id, result.returnRequest);
        setCompletedIds([...completed.current.keys()]);
      }
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
      <form onSubmit={submit} className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-[#EAE4D7] shadow-2xl p-6 text-left">
        <div className="sticky -top-6 z-20 -mx-6 -mt-6 flex items-start justify-between gap-4 border-b border-[#EAE4D7] bg-white px-6 pb-4 pt-6">
          <div>
            <h2 className="text-lg font-black text-[#1A1612]">Yêu cầu trả hàng / hoàn tiền</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#91816B]">Mã đơn hàng</span>
              <span className="rounded-md border border-[#EAE4D7] bg-[#FFFCF7] px-2 py-1 font-medium tracking-wide text-[#795A2D]">{orderDisplayCode(order.externalOrderSn)}</span>
            </div>
            <p className="mb-0 mt-2 text-[11px] leading-5 text-[#91816B]">Còn khoảng {daysLeft} ngày để gửi yêu cầu trả hàng.</p>
          </div>
          <button type="button" onClick={close} disabled={submitting} className="shrink-0 p-2 rounded-full bg-[#F3EFE6] text-[#7D715E]" aria-label="Đóng"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] p-3 flex gap-2 text-xs text-[#7D715E]">
          <AlertTriangle className="w-4 h-4 text-[#B88E4F] shrink-0" />
          <span>Ảnh tình trạng sản phẩm và video mở hộp là bằng chứng bắt buộc. SCANMS lưu hồ sơ để gian hàng xử lý minh bạch.</span>
        </div>

        <fieldset disabled={submitting || requestStarted} className="mt-4 space-y-4 min-w-0">
          <fieldset className="min-w-0">
            <legend className="text-xs font-bold">Sản phẩm cần trả</legend>
            <label className="flex items-center gap-2 mt-3 mb-2 text-xs font-bold cursor-pointer">
              <input ref={allCheckbox} type="checkbox" checked={allSelected} disabled={!eligible.length} onChange={e => setSelectedIds(e.target.checked ? eligible.map(item => item.id) : [])} className="h-4 w-4 accent-[#B88E4F]" />
              Chọn tất cả ({eligible.length})
            </label>
            <div className="space-y-2">
              {eligible.map(item => {
                const title = item.product?.title || item.productId;
                const selected = selectedIds.includes(item.id);
                return <div key={item.id} className={`rounded-xl border p-3 ${selected ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7]'}`}>
                  <label className="flex items-start gap-3 text-xs cursor-pointer">
                    <input type="checkbox" aria-label={`Trả ${title}`} checked={selected} onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, item.id] : ids.filter(id => id !== item.id))} className="h-4 w-4 shrink-0 accent-[#B88E4F]" />
                    <span className="min-w-0"><strong className="block">{title}</strong><span className="block mt-1 text-[#7D715E]">Còn được trả {item.returnableQuantity ?? item.quantity}</span></span>
                  </label>
                  {selected && <label className="flex items-center justify-between gap-3 mt-3 text-xs">Số lượng trả
                    <input aria-label={`Số lượng trả ${title}`} type="number" min={1} max={item.returnableQuantity ?? item.quantity} required value={quantities[item.id] ?? 1} onChange={e => setQuantities(values => ({ ...values, [item.id]: Number(e.target.value) }))} className="w-20 rounded-lg border border-[#EAE4D7] bg-white p-2" />
                  </label>}
                  {completedIds.includes(item.id) && <p className="mt-2 text-xs font-bold text-green-700">Đã gửi yêu cầu</p>}
                </div>;
              })}
            </div>
            <p className="mt-2 text-xs text-[#7D715E]" role="status">Đã chọn {selectedIds.length}/{eligible.length} sản phẩm. Mỗi sản phẩm được theo dõi và tính tiền hoàn riêng.</p>
          </fieldset>
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
