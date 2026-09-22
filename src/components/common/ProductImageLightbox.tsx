import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ProductImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export function ProductImageLightbox({
  isOpen,
  imageUrl,
  alt,
  onClose,
}: ProductImageLightboxProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh lớn: ${alt}`}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng ảnh lớn"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/70"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="relative flex max-h-[90vh] max-w-6xl items-center justify-center overflow-hidden rounded-3xl bg-white p-2 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-[86vh] max-w-full object-contain"
        />
        <span className="pointer-events-none absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white">
          <ZoomIn className="h-3.5 w-3.5" /> Ảnh sản phẩm kích thước lớn
        </span>
      </div>
    </div>
  );
}

