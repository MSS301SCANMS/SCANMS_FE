import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { validatePayoutBill } from "./payoutBillValidation";

interface Props {
  file: File | null;
  maxBytes: number;
  disabled: boolean;
  onChange: (file: File | null) => void;
}

export default function PayoutBillUpload({
  file,
  maxBytes,
  disabled,
  onChange,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!file || file.type === "application/pdf") {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function select(files: FileList | null) {
    if (disabled || !files?.length) return;
    const message =
      files.length > 1
        ? "Chỉ chọn một file bill cho mỗi payout."
        : validatePayoutBill(files[0], maxBytes);
    setError(message);

    onChange(message ? null : files[0]);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">
        Tải lên bằng chứng chuyển khoản <span className="text-danger">*</span>
      </p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          select(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 text-center ${dragging ? "border-brand bg-brand-soft" : "border-line bg-canvas"}`}
      >
        <Upload className="mx-auto text-brand" size={24} aria-hidden="true" />
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="mt-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-strong focus-visible:outline-brand disabled:opacity-50"
        >
          Chọn file bill
        </button>
        <p className="text-xs text-muted">
          hoặc kéo và thả · JPG, PNG, PDF · tối đa{" "}
          {(maxBytes / 1048576).toFixed(1)} MB
        </p>
        <input
          ref={input}
          aria-label="Ảnh bill ngân hàng"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            select(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-line p-3">
          {preview ? (
            <img
              src={preview}
              alt="Preview bill ngân hàng"
              className="h-24 w-24 rounded-lg object-contain"
            />
          ) : (
            <FileText
              size={32}
              className="shrink-0 text-brand"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted">
              {(file.size / 1048576).toFixed(2)} MB
              {file.type === "application/pdf" ? " · Tài liệu PDF" : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Xóa file bill"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setError("");
            }}
            className="rounded-lg p-2 text-muted hover:bg-brand-soft disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
