import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';

export function LiveEvidenceGallery({ urls, onRemove, disabled = false }: {
  urls: string[]; onRemove?: (url: string) => void; disabled?: boolean;
}) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{urls.map((url, index) => {
    const image = /\.(jpe?g|png|webp)(?:[?#]|$)/i.test(url) || /\/image\/upload\//i.test(url);
    return <div key={url} className="relative min-w-0 overflow-hidden rounded-xl border border-[#EAE4D7] bg-white">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block" aria-label={`Mở bằng chứng ${index + 1}`}>
        {image ? <img src={url} alt={`Ảnh bằng chứng ${index + 1}`} loading="lazy" className="h-28 w-full bg-[#F3EFE6] object-contain" /> : <div className="flex h-20 items-center justify-center gap-2 bg-[#FAF8F5] text-xs text-[#7D715E]"><Upload size={16} /> Video / liên kết</div>}
        <span className="block truncate px-2 py-2 text-xs font-medium text-[#B88E4F]">Bằng chứng {index + 1} ↗</span>
      </a>
      {onRemove && <button type="button" disabled={disabled} aria-label={`Xóa bằng chứng ${index + 1}`} onClick={() => onRemove(url)} className="absolute right-1.5 top-1.5 rounded-full border border-[#EAE4D7] bg-white p-1 text-[#7D715E] hover:text-[#DC2626] disabled:opacity-50"><X size={14} /></button>}
    </div>;
  })}</div>;
}

export function LiveEvidenceAttachments({ evidence, setEvidence, uploading, onUploadingChange, disabled }: {
  evidence: string[];
  setEvidence: (update: (previous: string[]) => string[]) => void;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
  disabled: boolean;
}) {
  const upload = async (files: File[]) => {
    if (!files.length || disabled || uploading) return;
    if (files.length + evidence.length > 10) {
      toast.error(`Tối đa 10 bằng chứng. Bạn còn có thể thêm ${10 - evidence.length} tệp.`);
      return;
    }
    const invalid = files.find(file => {
      const video = file.type.startsWith('video/');
      const allowed = video ? ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'] : ['image/jpeg', 'image/png', 'image/webp'];
      return !allowed.includes(file.type) || file.size > (video ? 100 : 5) * 1024 * 1024;
    });
    if (invalid) {
      toast.error(`Tệp “${invalid.name}” không hợp lệ. Ảnh JPG/PNG/WebP tối đa 5 MB; video MP4/MOV/WebM/AVI tối đa 100 MB.`);
      return;
    }
    onUploadingChange(true);
    try {
      for (const file of files) {
        const result = await uploadService.uploadMedia(file, 'scanms/live-disputes');
        setEvidence(previous => [...new Set([...previous, result.url])].slice(0, 10));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Chưa tải được bằng chứng. Các tệp đã tải thành công vẫn được giữ, bạn có thể chọn lại tệp còn thiếu.');
    } finally {
      onUploadingChange(false);
    }
  };
  const blocked = disabled || uploading || evidence.length >= 10;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-[#C59B58] bg-[#FBF5EB] px-4 py-2 text-xs font-semibold text-[#B88E4F] ${blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#F3EFE6]'}`}>
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}{uploading ? 'Đang tải bằng chứng…' : 'Tải ảnh từ thiết bị'}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Tải ảnh bằng chứng" disabled={blocked} className="sr-only" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ''; void upload(files); }} />
      </label>
      <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#EAE4D7] px-3 py-2 text-xs text-[#7D715E] ${blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#FAF8F5]'}`}>
        <Upload size={15} /> Tải video
        <input type="file" multiple accept="video/mp4,video/quicktime,video/webm,video/x-msvideo" aria-label="Tải video bằng chứng" disabled={blocked} className="sr-only" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ''; void upload(files); }} />
      </label>
      <span className="text-xs text-[#7D715E]">{evidence.length}/10 bằng chứng</span>
    </div>
    <p className="text-xs leading-relaxed text-[#7D715E]">Có thể chọn nhiều ảnh JPG, PNG hoặc WebP, tối đa 5 MB/ảnh. Kiểm tra ảnh bên dưới trước khi xác nhận gửi hồ sơ.</p>
    <LiveEvidenceGallery urls={evidence} disabled={disabled || uploading} onRemove={url => setEvidence(previous => previous.filter(item => item !== url))} />
  </div>;
}
