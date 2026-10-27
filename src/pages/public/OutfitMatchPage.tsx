import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, Shirt, Footprints, HardHat, Loader2, ShoppingBag, X, ArrowLeft } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { outfitService, type OutfitProductCard, type OutfitRecommendResult } from '../../services/outfit.service';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { resolveDetectedGarments } from '@/utils/outfit-detection.utils';
import { toast } from '../../utils/toast';

function formatVnd(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value).toLocaleString('vi-VN')}₫`;
}

function humanizeOutfitMessage(message?: string) {
  return (message || '')
    .replace(/catalog/gi, 'sản phẩm')
    .replace(/Catalog/g, 'Sản phẩm');
}

function AccessoryGrid({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: OutfitProductCard[];
}) {
  return (
    <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5 shadow-2xs">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F1E6] text-[#6F4E20]">
          {icon}
        </span>
        <div>
          <h2 className="text-sm font-bold text-[#1A1612]">{title}</h2>
          <p className="text-[11px] text-[#7D715E]">{items.length} gợi ý từ sản phẩm đang bán</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] px-4 py-8 text-center text-xs text-[#7D715E]">
          Chưa có sản phẩm phù hợp trong nhóm này trên sàn.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.productId}
              to={`/products/${item.productId}`}
              className="group overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] transition hover:border-[#C59B58]/70 hover:shadow-xs"
            >
              <div className="aspect-square overflow-hidden bg-white">
                <img
                  src={getSafeProductImageUrl(item.imageUrl || undefined, item.title, item.categoryName || undefined)}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="space-y-1 p-2.5">
                <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1A1612]">{item.title}</p>
                <p className="text-[12px] font-bold text-[#8A5A1A]">{formatVnd(item.priceVnd)}</p>
                {item.storeName ? <p className="truncate text-[10px] text-[#7D715E]">{item.storeName}</p> : null}
                {item.matchReason ? (
                  <p className="line-clamp-2 text-[10px] text-[#6F4E20]">{item.matchReason}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function OutfitMatchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutfitRecommendResult | null>(null);

  const clearSelectedImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onPickFile = async (file?: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ chấp nhận JPG, PNG hoặc WEBP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ảnh tối đa 10MB');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);
    try {
      const data = await outfitService.recommend(file, 6);
      setResult(data);
      toast.success(data.detection.clothingDetected ? 'Đã nhận diện trang phục' : 'Chưa nhận diện được quần/áo');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'AI tạm không khả dụng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-white px-3 py-1 text-[11px] font-semibold text-[#6F4E20]">
              <Sparkles className="h-3.5 w-3.5" /> AI phối đồ SCANMS
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1A1612] sm:text-4xl">
              Upload quần áo, gợi ý giày &amp; nón
            </h1>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2 text-xs font-bold text-[#1A1612] shadow-2xs transition hover:border-[#C59B58]/70 hover:bg-[#FAF8F5]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#B88E4F]" />
            Quay lại sàn
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5 shadow-2xs">
            <div className="relative">
              {previewUrl ? (
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  disabled={loading}
                  className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#EAE4D7] bg-white/95 text-[#7D715E] shadow-2xs transition hover:border-[#C59B58] hover:text-[#1A1612] disabled:opacity-50"
                  aria-label="Bỏ ảnh đã chọn"
                  title="Bỏ ảnh đã chọn"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D9CDB8] bg-[#FBF7F0] px-4 py-10 text-center transition hover:border-[#C59B58] hover:bg-[#F7F1E6] disabled:opacity-70"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Ảnh trang phục" className="max-h-64 w-full rounded-xl object-contain" />
                ) : (
                  <>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8A5A1A] shadow-2xs">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-[#1A1612]">Tải ảnh quần / áo / bộ đồ</span>
                    <span className="text-xs text-[#7D715E]">JPG, PNG, WEBP · tối đa 10MB</span>
                  </>
                )}
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6F4E20]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang nhận diện…
                  </span>
                ) : previewUrl ? (
                  <span className="text-xs font-semibold text-[#6F4E20]">Bấm để chọn ảnh khác</span>
                ) : null}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0])}
            />

            {result ? (
              <div className="mt-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-3 text-[12px] text-[#574C3D]">
                {(() => {
                  const garments = resolveDetectedGarments(
                    result.detection.detectedGarments,
                    result.detection.detections,
                  );
                  const summary =
                    garments.map((g) => g.displayLabel).join(' · ') ||
                    result.detection.displayLabel ||
                    'Đã nhận diện trang phục';
                  const combo =
                    garments.map((g) => g.garmentType).filter(Boolean).join('+') ||
                    result.detection.garmentType;
                  return (
                    <>
                      <div className="flex items-center gap-2 font-semibold text-[#6F4E20]">
                        <Shirt className="h-4 w-4" />
                        {result.detection.clothingDetected || garments.length > 0
                          ? `${summary}${garments.length ? ` (${garments.length} món)` : ''}`
                          : 'Chưa nhận diện quần/áo'}
                      </div>
                      {garments.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {garments.map((item) => (
                            <li
                              key={`${item.className}-${item.confidence}`}
                              className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px]"
                            >
                              <span className="font-semibold text-[#1A1612]">{item.displayLabel}</span>
                              <span className="text-[#7D715E]">
                                {item.garmentType} · {Math.round(item.confidence * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-2 leading-relaxed">{humanizeOutfitMessage(result.message)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#7D715E]">
                        {combo ? <span>Tổ hợp: {combo}</span> : null}
                        {result.detection.stylePrediction?.style ? (
                          <span>Style: {result.detection.stylePrediction.style}</span>
                        ) : null}
                        {result.detection.dominantColors?.[0]?.name ? (
                          <span>Màu: {result.detection.dominantColors[0].name}</span>
                        ) : null}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </section>

          <div className="space-y-4">
            {!result && !loading ? (
              <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-white px-5 py-16 text-center">
                <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-[#C59B58]" />
                <p className="text-sm font-semibold text-[#1A1612]">Chưa có gợi ý</p>
                <p className="mt-1 text-xs text-[#7D715E]">Upload ảnh trang phục để nhận giày và nón phù hợp.</p>
              </div>
            ) : null}
            {result ? (
              <>
                <AccessoryGrid title="Giày gợi ý" icon={<Footprints className="h-4 w-4" />} items={result.shoes} />
                <AccessoryGrid title="Nón gợi ý" icon={<HardHat className="h-4 w-4" />} items={result.hats} />
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
