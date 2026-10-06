import { useState } from 'react';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { customerService, type CustomerOrder } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { Select } from '../ui/Select';

interface Props {
  order: CustomerOrder;
  onClose: () => void;
  onSubmitted: () => void;
}

export function VerifiedReviewModal({ order, onClose, onSubmitted }: Props) {
  const reviewedIds = new Set((order.productReviews || []).map((review: any) => review.productId));
  const products = order.orderItems.filter((item) => item.product && !reviewedIds.has(item.productId));
  const [productId, setProductId] = useState(products[0]?.productId || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 10) return toast.error('Nội dung đánh giá cần ít nhất 10 ký tự');
    setSubmitting(true);
    try {
      const imageUrls = await Promise.all(images.map((file) => uploadService.uploadImage(file, `scanms/reviews/${order.id}`)));
      await customerService.submitVerifiedReview(order.id, { productId, rating, comment: comment.trim(), images: imageUrls });
      toast.success('Đã đăng đánh giá từ người mua đã xác minh');
      onSubmitted();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể đăng đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#231D15]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white border border-[#EAE4D7] shadow-2xl p-6 text-left">
        <div className="flex justify-between gap-4 pb-4 border-b border-[#EAE4D7]">
          <div><h2 className="text-lg font-black text-[#1A1612]">Đánh giá đã xác minh</h2><p className="text-xs text-[#7D715E] mt-1">Chỉ áp dụng cho đơn đã hoàn tất</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-[#F3EFE6] text-[#7D715E]"><X className="w-4 h-4" /></button>
        </div>
        {products.length === 0 ? <p className="py-8 text-center text-sm text-[#7D715E]">Bạn đã đánh giá tất cả sản phẩm trong đơn này.</p> : <div className="space-y-4 mt-5">
          <label className="block text-xs font-bold">Sản phẩm
            <div className="mt-1.5">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full text-xs font-medium">
                {products.map((item) => <option key={item.productId} value={item.productId}>{item.product?.title}</option>)}
              </Select>
            </div>
          </label>
          <div><span className="text-xs font-bold">Mức hài lòng</span><div className="flex gap-1 mt-2">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} sao`}><Star className={`w-7 h-7 ${value <= rating ? 'fill-[#C59B58] text-[#C59B58]' : 'text-[#EAE4D7]'}`} /></button>)}</div></div>
          <label className="block text-xs font-bold">Nhận xét
            <textarea required minLength={10} maxLength={1000} rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..." className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 outline-none focus:border-[#C59B58]" />
          </label>
          <label className="block rounded-xl border border-dashed border-[#C59B58] bg-[#FBF5EB] p-3 cursor-pointer"><span className="flex items-center gap-2 text-xs font-bold"><ImagePlus className="w-4 h-4 text-[#B88E4F]" />Ảnh trải nghiệm (không bắt buộc, tối đa 5)</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))} />{images.length > 0 && <span className="text-[11px] text-[#B88E4F] block mt-1">Đã chọn {images.length} ảnh</span>}</label>
        </div>}
        <div className="flex gap-2 mt-6 pt-4 border-t border-[#EAE4D7]"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#F3EFE6] text-xs font-bold text-[#7D715E]">Đóng</button>{products.length > 0 && <button type="submit" disabled={submitting || !productId} className="flex-[2] py-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white text-xs font-bold flex justify-center items-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}Đăng đánh giá</button>}</div>
      </form>
    </div>
  );
}
