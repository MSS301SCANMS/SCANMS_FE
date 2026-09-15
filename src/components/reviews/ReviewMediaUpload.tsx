import { useRef, useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { MAX_REVIEW_IMAGES, validateReviewFile } from "./reviewValidation";

export interface ReviewAttachment {
  id: string;
  file: File;
  preview: string;
  kind: "image" | "video";
  progress: number;
  uploadedUrl?: string;
}

export function ReviewMediaUpload({
  attachments,
  onChange,
  disabled,
}: {
  attachments: ReviewAttachment[];
  onChange: (files: ReviewAttachment[]) => void;
  disabled: boolean;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  function addFiles(files: File[], kind: "image" | "video") {
    if (disabled) return;
    setError("");
    const existing = attachments.filter((item) => item.kind === kind);
    if (
      existing.length + files.length >
      (kind === "image" ? MAX_REVIEW_IMAGES : 1)
    ) {
      setError(
        kind === "image"
          ? "Chỉ được chọn tối đa 5 ảnh."
          : "Chỉ được chọn 1 video.",
      );
      return;
    }
    const invalid = files
      .map((file) => validateReviewFile(file, kind))
      .find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    const unique = files.filter(
      (file, index) =>
        !existing.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified,
        ) &&
        !files
          .slice(0, index)
          .some(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ),
    );
    onChange([
      ...attachments,
      ...unique.map((file) => ({
        id: crypto.randomUUID(),
        file,
        kind,
        preview: URL.createObjectURL(file),
        progress: 0,
      })),
    ]);
  }
  function remove(id: string) {
    const item = attachments.find((file) => file.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    onChange(attachments.filter((file) => file.id !== id));
    setError("");
  }
  return (
    <section aria-label="Ảnh và video đánh giá" className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink">
          Ảnh thực tế{" "}
          <span className="font-normal text-muted">(không bắt buộc)</span>
        </span>
        <span className="text-muted">
          {attachments.filter((item) => item.kind === "image").length}/5
        </span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => imageInput.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files), "image");
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 text-sm transition disabled:opacity-50 ${dragging ? "border-brand bg-brand-soft" : "border-line bg-canvas hover:border-brand"}`}
      >
        <ImagePlus className="h-6 w-6 text-brand-strong" />
        <span className="font-medium text-ink">
          Chọn ảnh hoặc kéo thả vào đây
        </span>
        <span className="text-xs text-muted">
          JPG, PNG, WEBP · tối đa 5MB/ảnh
        </span>
      </button>
      <input
        ref={imageInput}
        data-testid="review-images"
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []), "image");
          event.target.value = "";
        }}
      />
      <div className="grid grid-cols-3 gap-3">
        {attachments
          .filter((item) => item.kind === "image")
          .map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-line bg-canvas"
            >
              <img
                src={item.preview}
                alt={`Ảnh đã chọn: ${item.file.name}`}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(item.id)}
                aria-label={`Xóa ảnh ${item.file.name}`}
                className="absolute right-1 top-1 rounded-full bg-white p-1 text-ink shadow disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              {disabled && (
                <progress
                  aria-label={`Tiến độ tải ${item.file.name}`}
                  value={item.progress}
                  max={100}
                  className="block h-2 w-full accent-brand"
                />
              )}
              {item.uploadedUrl && (
                <span className="block p-1 text-center text-xs text-brand-strong">
                  Đã tải lên
                </span>
              )}
            </div>
          ))}
      </div>
      <button
        type="button"
        disabled={disabled || attachments.some((item) => item.kind === "video")}
        onClick={() => videoInput.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line p-3 text-sm text-ink hover:bg-brand-soft disabled:opacity-50"
      >
        <Video className="h-5 w-5 text-brand-strong" />
        Thêm video (MP4, MOV · tối đa 50MB)
      </button>
      <input
        ref={videoInput}
        data-testid="review-video"
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept="video/mp4,video/quicktime"
        disabled={disabled}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []), "video");
          event.target.value = "";
        }}
      />
      {attachments
        .filter((item) => item.kind === "video")
        .map((item) => (
          <div
            key={item.id}
            className="relative rounded-xl border border-line bg-canvas p-2"
          >
            <video
              controls
              playsInline
              preload="metadata"
              src={item.preview}
              className="max-h-60 w-full rounded-lg"
            >
              <track kind="captions" />
              Trình duyệt không hỗ trợ video này.
            </video>
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(item.id)}
              aria-label="Xóa video"
              className="absolute right-3 top-3 rounded-full bg-white p-1 text-ink shadow"
            >
              <X className="h-4 w-4" />
            </button>
            {disabled && (
              <progress
                aria-label="Tiến độ tải video"
                value={item.progress}
                max={100}
                className="block h-2 w-full accent-brand"
              />
            )}
            <p className="truncate text-xs text-muted">
              {item.file.name}
              {item.uploadedUrl ? " · Đã tải lên" : ""}
            </p>
          </div>
        ))}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
