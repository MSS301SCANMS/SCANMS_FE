import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = [
  "Chọn số sao",
  "Rất không hài lòng",
  "Không hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng",
];

export function RatingStars({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <fieldset
      disabled={disabled}
      className="rounded-2xl border border-brand-border bg-brand-soft p-4 text-center"
    >
      <legend className="sr-only">Chọn đánh giá từ 1 đến 5 sao</legend>
      <p className="text-sm font-semibold text-ink">
        Bạn cảm thấy thế nào về sản phẩm?
      </p>
      <div
        role="radiogroup"
        aria-label="Số sao đánh giá"
        className="my-2 flex justify-center gap-1 sm:gap-3"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} sao — ${LABELS[star]}`}
            tabIndex={value === star || (!value && star === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight" || event.key === "ArrowUp"
                  ? Math.min(5, star + 1)
                  : event.key === "ArrowLeft" || event.key === "ArrowDown"
                    ? Math.max(1, star - 1)
                    : event.key === "Home"
                      ? 1
                      : event.key === "End"
                        ? 5
                        : null;
              if (next !== null) {
                event.preventDefault();
                onChange(next);
                const buttons =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    "button",
                  );
                buttons?.[next - 1]?.focus();
              }
            }}
            className="rounded-lg p-2 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            <Star
              aria-hidden="true"
              className={`h-8 w-8 ${(hovered || value) >= star ? "fill-amber-400 text-amber-500" : "text-gray-300"}`}
            />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-brand-strong">
        {LABELS[hovered || value]}
      </p>
    </fieldset>
  );
}
