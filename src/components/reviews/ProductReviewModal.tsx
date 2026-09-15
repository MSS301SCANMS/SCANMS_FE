import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, LoaderCircle, ShoppingBag, X } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { ReviewMediaUpload, type ReviewAttachment } from "./ReviewMediaUpload";
import { MAX_REVIEW_LENGTH, validateReviewComment } from "./reviewValidation";
import {
  reviewService,
  type ReviewProduct,
  type SubmittedProductReview,
  type VerifiedReviewOrder,
} from "../../services/review.service";

export interface ProductReviewTarget extends ReviewProduct {
  externalOrderSn: string;
  customerPhone?: string;
}
export interface ProductReviewResult {
  order: VerifiedReviewOrder;
  product: ReviewProduct;
  review: SubmittedProductReview;
}

export function ProductReviewModal({
  target,
  onClose,
  onSubmitted,
}: {
  target: ProductReviewTarget;
  onClose: () => void;
  onSubmitted: (result: ProductReviewResult) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const commentId = useId();
  const inFlight = useRef(false);
  const abort = useRef(new AbortController());
  const attachmentsRef = useRef<ReviewAttachment[]>([]);
  const [attachments, setAttachments] = useState<ReviewAttachment[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState(target.customerPhone ?? "");
  const [orderSn, setOrderSn] = useState(target.externalOrderSn);
  const [verified, setVerified] = useState<VerifiedReviewOrder | null>(null);
  const [productId, setProductId] = useState(target.productId);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const product =
    verified?.items.find((item) => item.productId === productId) ?? target;
  const commentError = validateReviewComment(comment);

  function changeAttachments(next: ReviewAttachment[]) {
    attachmentsRef.current = next;
    setAttachments(next);
  }
  function invalidateVerification() {
    setVerified(null);
    changeAttachments(
      attachmentsRef.current.map((item) => ({
        ...item,
        uploadedUrl: undefined,
        progress: 0,
      })),
    );
  }
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    abort.current = new AbortController();
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      abort.current.abort();
      element?.close();
      document.body.style.overflow = previousOverflow;
      attachmentsRef.current.forEach((item) =>
        URL.revokeObjectURL(item.preview),
      );
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${Math.min(240, textarea.current.scrollHeight)}px`;
    }
  }, [comment]);

  async function verify(): Promise<VerifiedReviewOrder> {
    const order = await reviewService.verifyOrder(orderSn, phone);
    setVerified(order);
    const matched =
      order.items.find((item) => item.productId === productId) ??
      order.items.find(
        (item) =>
          item.productId === target.productId ||
          item.productTitle === target.productTitle,
      );
    if (matched) setProductId(matched.productId);
    else if (!order.items.some((item) => item.productId === productId))
      setProductId("");
    return order;
  }
  async function verifyOnly() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setPhase("Đang xác minh...");
    try {
      await verify();
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Không thể xác minh đơn hàng.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      setPhase("");
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (rating < 1 || rating > 5 || commentError) {
      setError(commentError ?? "Vui lòng chọn từ 1 đến 5 sao.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    setPhase("Đang xác minh...");
    try {

      const order = await verify();
      const selected =
        order.items.find((item) => item.productId === productId) ??
        order.items.find(
          (item) =>
            item.productId === target.productId ||
            item.productTitle === target.productTitle,
        );
      if (!selected)
        throw new Error(
          "Vui lòng chọn sản phẩm thực tế trong đơn hàng đã xác minh.",
        );
      const urls: { kind: "image" | "video"; url: string }[] = [];
      for (const attachment of attachmentsRef.current) {
        setPhase(
          `Đang tải ${attachment.kind === "image" ? "ảnh" : "video"}: ${attachment.file.name}`,
        );
        const url =
          attachment.uploadedUrl ??
          (await reviewService.uploadMedia(
            order,
            selected.productId,
            attachment.file,
            (percent) => {
              changeAttachments(
                attachmentsRef.current.map((item) =>
                  item.id === attachment.id
                    ? { ...item, progress: percent }
                    : item,
                ),
              );
            },
            abort.current.signal,
          ));
        changeAttachments(
          attachmentsRef.current.map((item) =>
            item.id === attachment.id
              ? { ...item, uploadedUrl: url, progress: 100 }
              : item,
          ),
        );
        urls.push({ kind: attachment.kind, url });
      }
      setPhase("Đang gửi đánh giá...");
      const freshOrder = urls.length
        ? await reviewService.verifyOrder(order.externalOrderSn, phone)
        : order;
      if (
        freshOrder.id !== order.id ||
        !freshOrder.items.some((item) => item.productId === selected.productId)
      )
        throw new Error("Đơn hàng đã thay đổi. Vui lòng xác minh lại.");
      const review = await reviewService.submit(freshOrder, {
        productId: selected.productId,
        rating,
        comment: comment.trim(),
        images: urls
          .filter((item) => item.kind === "image")
          .map((item) => item.url),
        video: urls.find((item) => item.kind === "video")?.url,
      });
      onSubmitted({ order, product: selected, review });
      onClose();
    } catch (error: unknown) {
      if (!abort.current.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Gửi đánh giá thất bại. Vui lòng thử lại.",
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
      setPhase("");
    }
  }

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!inFlight.current) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !inFlight.current) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-brand-dark/50 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white p-5 sm:p-6">
        <div>
          <h2 id={titleId} className="text-lg font-bold sm:text-xl">
            Đánh giá sản phẩm {product.productTitle}
          </h2>
          <p id={`${titleId}-description`} className="mt-1 text-sm text-muted">
            Chia sẻ trải nghiệm thực tế để giúp cộng đồng SCANMS.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Đóng đánh giá"
          className="rounded-xl p-2 text-muted hover:bg-surface-sand disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas p-3">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productTitle}
              className="h-16 w-16 rounded-xl bg-white object-cover"
            />
          ) : (
            <ShoppingBag className="h-12 w-12 text-brand" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">{product.productTitle}</p>
            <p className="mt-1 break-all text-xs text-muted">
              Mã đơn: {orderSn}
            </p>
          </div>
        </div>
        <fieldset
          disabled={busy}
          className="space-y-3 rounded-2xl border border-line p-4"
        >
          <legend className="px-1 text-sm font-semibold">
            Xác minh đơn hàng
          </legend>
          <p className="text-xs text-muted">
            Nhập mã đơn và SĐT đã đặt hàng. Đơn mẫu trên prototype không thay
            thế đơn thực tế.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Mã đơn hàng
              <input
                value={orderSn}
                onChange={(event) => {
                  setOrderSn(event.target.value);
                  invalidateVerification();
                }}
                required
                minLength={6}
                maxLength={100}
                className="mt-1 w-full rounded-xl border border-line p-2.5 focus:outline-brand"
              />
            </label>
            <label className="text-sm">
              Số điện thoại đặt hàng
              <input
                type="tel"
                aria-label="Số điện thoại xác minh đánh giá"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  invalidateVerification();
                }}
                required
                maxLength={20}
                autoComplete="tel"
                className="mt-1 w-full rounded-xl border border-line p-2.5 focus:outline-brand"
              />
            </label>
          </div>
          {verified ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-brand-strong"
            >
              <CheckCircle2 className="h-4 w-4" />
              Đã xác minh đơn hàng
            </p>
          ) : (
            <button
              type="button"
              disabled={!orderSn.trim() || !phone.trim()}
              onClick={verifyOnly}
              className="rounded-xl border border-brand-border bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-strong disabled:opacity-50"
            >
              Xác minh đơn hàng
            </button>
          )}
          {verified && (
            <label className="block text-sm">
              Sản phẩm trong đơn
              <select
                aria-label="Sản phẩm cần đánh giá"
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  changeAttachments(
                    attachmentsRef.current.map((item) => ({
                      ...item,
                      uploadedUrl: undefined,
                      progress: 0,
                    })),
                  );
                }}
                className="mt-1 w-full rounded-xl border border-line bg-white p-2.5"
              >
                <option value="">Chọn sản phẩm đã nhận</option>
                {verified.items.map((item) => (
                  <option key={item.productId} value={item.productId}>
                    {item.productTitle}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
        <RatingStars value={rating} onChange={setRating} disabled={busy} />
        <div>
          <label htmlFor={commentId} className="text-sm font-semibold">
            Nhận xét của bạn <span className="text-red-600">*</span>
          </label>
          <textarea
            ref={textarea}
            id={commentId}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={busy}
            minLength={10}
            maxLength={MAX_REVIEW_LENGTH}
            required
            rows={4}
            aria-invalid={Boolean(comment && commentError)}
            aria-describedby={`${commentId}-help`}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            className="mt-2 block min-h-28 w-full resize-none rounded-2xl border border-line p-3 text-sm leading-relaxed focus:outline-brand disabled:bg-canvas"
          />
          <div
            id={`${commentId}-help`}
            className="mt-2 flex justify-between gap-3 text-xs"
          >
            <span
              className={
                comment && commentError ? "text-red-600" : "text-muted"
              }
            >
              {comment && commentError
                ? commentError
                : "Từ 10 đến 1000 ký tự · Nhận xét khách quan, lịch sự"}
            </span>
            <span className="shrink-0 text-muted">{comment.length}/1000</span>
          </div>
        </div>
        <ReviewMediaUpload
          attachments={attachments}
          onChange={changeAttachments}
          disabled={busy}
        />
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {busy && (
          <p
            role="status"
            className="flex items-center gap-2 break-all text-sm text-brand-strong"
          >
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />
            {phase}
          </p>
        )}
        <p className="text-xs text-muted">
          Ảnh/video sẽ được công khai cùng đánh giá. Không tải nội dung chứa
          thông tin cá nhân. MOV có thể không preview được trên một số trình
          duyệt.
        </p>
        <footer className="flex justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={
              busy ||
              !rating ||
              Boolean(commentError) ||
              !phone.trim() ||
              !orderSn.trim() ||
              Boolean(
                verified &&
                !verified.items.some((item) => item.productId === productId),
              )
            }
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </footer>
      </form>
    </dialog>,
    document.body,
  );
}
