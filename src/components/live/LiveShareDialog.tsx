import { useEffect, useRef, useState } from 'react';
import { Copy, Globe, Laptop, Loader2, X } from 'lucide-react';
import { resolveLivestreamShareUrl } from '../../utils/livestream-share-url';
import { toast } from '../../utils/toast';

export function LiveShareDialog({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const localUrl = new URL(`/live/${encodeURIComponent(sessionId)}`, window.location.origin).href;
  const [publicUrl, setPublicUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setPublicUrl('');
    void resolveLivestreamShareUrl(sessionId)
      .then((url) => {
        if (active) setPublicUrl(url);
      })
      .catch((error) => {
        if (active) setError(error.message || 'Chưa kiểm tra được link công khai.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId, attempt]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => previous?.focus();
  }, []);
  const copy = async (url: string, local: boolean) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        local
          ? 'Đã sao chép link local. Link localhost chỉ mở trên máy đang chạy dự án.'
          : 'Đã sao chép link live công khai.',
      );
    } catch {
      toast.error('Chưa sao chép được. Bạn có thể chọn và sao chép đường dẫn bên dưới.');
    }
  };
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/50 p-5" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-share-title"
        className="w-full max-w-xl space-y-5 rounded-3xl border border-[#EAE4D7] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <header className="flex items-center justify-between gap-3">
          <h2 id="live-share-title" className="text-lg font-bold">
            Chia sẻ phiên live
          </h2>
          <button
            ref={closeButton}
            type="button"
            aria-label="Đóng chia sẻ live"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#FAF8F5]"
          >
            <X size={20} />
          </button>
        </header>
        <section className="space-y-3 rounded-2xl border border-[#EAE4D7] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Laptop size={18} />
            Link local
          </h3>
          <p className="text-xs leading-5 text-[#7D715E]">
            Dùng để mở lại phiên trên máy đang chạy dự án. Người khác không thể dùng localhost của bạn từ máy họ.
          </p>
          <input
            readOnly
            aria-label="Link live local"
            value={localUrl}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={() => void copy(localUrl, true)}
            className="flex items-center gap-2 rounded-xl border border-[#EEDFC6] px-4 py-2 text-sm font-semibold text-[#9B7137]"
          >
            <Copy size={16} />
            Sao chép link local
          </button>
        </section>
        <section className="space-y-3 rounded-2xl border border-[#EEDFC6] bg-[#FFFCF8] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Globe size={18} />
            Gửi cho người khác qua Internet
          </h3>
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-xs text-[#7D715E]">
              <Loader2 size={15} className="animate-spin" />
              Đang kiểm tra đường dẫn công khai…
            </p>
          ) : publicUrl ? (
            <input
              readOnly
              aria-label="Link live công khai"
              value={publicUrl}
              onFocus={(event) => event.target.select()}
              className="w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2 text-xs"
            />
          ) : (
            <p role="status" className="text-xs leading-5 text-[#7D715E]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!publicUrl || loading}
              onClick={() => void copy(publicUrl, false)}
              className="flex items-center gap-2 rounded-xl bg-[#C59B58] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Copy size={16} />
              Sao chép link công khai
            </button>
            {!loading && !publicUrl && (
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="text-xs text-[#9B7137] underline"
              >
                Kiểm tra lại
              </button>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
