import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sponsorshipService,
  type Sponsorship,
} from "../../services/sponsorship.service";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { authService } from "../../services/auth.service";
import { ClipboardList, Megaphone, RefreshCw } from 'lucide-react';
import { SponsoredBookingForm, sponsorshipMoney } from './SponsoredBookingForm';

const labels = {
  REQUESTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  EXPIRED: 'Đã hết hạn',
};
const inputClass =
  "w-full rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm text-[#1A1612] focus:outline-[#C59B58]";
const when = (date: string) => new Date(date).toLocaleString("vi-VN");

/** The same workflow serves owners and platform reviewers; ownership is enforced again by BE. */
export function SponsoredPlacementsPanel({
  admin = false,
}: {
  admin?: boolean;
}) {
  const cache = useQueryClient();
  const user = authService.getCurrentUser();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(admin ? 'REQUESTED' : '');
  const [selected, setSelected] = useState<{
    row: Sponsorship;
    cancel: boolean;
  } | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [note, setNote] = useState("");
  const [clientError, setClientError] = useState("");
  const [successMessage, setSuccessMessage] = useState('');
  const [renewal, setRenewal] = useState<(Sponsorship & { formStartsAt: string; formEndsAt: string }) | null>(null);
  const bookingSection = useRef<HTMLDivElement>(null);
  // Reuse a key for a retry of the identical payload, but never for an edited submission.
  const pendingRequest = useRef<{ payload: string; key: string } | null>(null);
  const reviewPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selected) {
      reviewPanel.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      reviewPanel.current?.focus({ preventScroll: true });
    }
  }, [selected]);
  const query = useQuery({
    queryKey: ["sponsorships", user?.id, admin, page, status],
    queryFn: () => sponsorshipService.list(page, status),
    enabled: !!user && ['SHOP_MANAGER', 'SYSTEM_ADMIN', 'SYSTEM_MANAGER'].includes(user.role),
    refetchInterval: 15000,
  });
  const pricing = useQuery({
    queryKey: ['sponsorship-pricing'], queryFn: sponsorshipService.pricing,
    enabled: !!user && ['SHOP_MANAGER', 'SYSTEM_ADMIN', 'SYSTEM_MANAGER'].includes(user.role),
    staleTime: 60000,
  });
  useEffect(() => {
    const nextExpiry = Math.min(...(query.data?.items ?? [])
      .filter(row => ['REQUESTED', 'APPROVED'].includes(row.status))
      .map(row => Date.parse(row.endsAt)).filter(time => time > Date.now()));
    if (!Number.isFinite(nextExpiry)) return;
    const timer = window.setTimeout(() => void query.refetch(), Math.min(2147483647, Math.max(100, nextExpiry - Date.now() + 100)));
    return () => window.clearTimeout(timer);
  }, [query.data, query.refetch]);
  function startRenewal(row: Sponsorship) {
    const start = new Date(Date.now() + 3600000);
    const duration = Math.min(31, Math.max(1, Math.ceil((Date.parse(row.endsAt) - Date.parse(row.startsAt)) / 86400000))) * 86400000;
    const local = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setRenewal({ ...row, formStartsAt: local(start), formEndsAt: local(new Date(start.getTime() + duration)) });
    setSuccessMessage(''); setClientError(''); mutation.reset();
    bookingSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const mutation = useMutation({
    mutationFn: async ({
      form,
      action,
    }: {
      form: HTMLFormElement;
      action: "request" | "review" | "cancel";
    }) => {
      const data = new FormData(form);
      if (action === "request") {
        const startsAt = new Date(String(data.get("startsAt"))).toISOString();
        const endsAt = new Date(String(data.get("endsAt"))).toISOString();
        const payload = {
          headline: String(data.get("headline")).trim(),
          startsAt,
          endsAt,
          quotedAmount: Number(data.get('quotedAmount')),
          ...(renewal ? { renewsPlacementId: renewal.id } : {}),
        };
        const duration = Date.parse(endsAt) - Date.parse(startsAt);
        if (
          duration < 3600000 ||
          duration > 31 * 86400000 ||
          Date.parse(endsAt) <= Date.now()
        )
          throw new Error(
            "Lịch phải còn hiệu lực và kéo dài từ 1 giờ đến 31 ngày.",
          );
        const serialized = JSON.stringify(payload);
        if (pendingRequest.current?.payload !== serialized)
          pendingRequest.current = {
            payload: serialized,
            key: crypto.randomUUID(),
          };
        await sponsorshipService.request({
          ...payload,
          requestKey: pendingRequest.current.key,
        });
        pendingRequest.current = null;
        form.reset();
      } else if (selected && action === "cancel") {
        await sponsorshipService.cancel(selected.row.id, note.trim());
      } else if (selected) {
        await sponsorshipService.review(selected.row.id, {
          decision,
          note: note.trim(),
          ...(decision === "APPROVE"
            ? {
                fundingType: "PAID",
                amount: Number(data.get("amount")),
                paymentReference: String(data.get("reference")).trim(),
                paymentProofUrl: String(data.get("proof")).trim(),
              }
            : {}),
        });
      }
    },
    onSuccess: async (_, { action }) => {
      setRenewal(null);
      setPage(1);
      setStatus(action === 'request' ? 'REQUESTED' : action === 'cancel' ? 'CANCELLED' : decision === 'APPROVE' ? 'APPROVED' : 'REJECTED');
      setSuccessMessage(action === 'request' ? (renewal ? 'Đã gửi đăng ký gia hạn. Phí mới đã được lưu, chờ thanh toán và Admin duyệt lại.' : 'Đã gửi đăng ký. Phí đã được lưu, chờ Admin hướng dẫn thanh toán và xét duyệt.') : 'Đã cập nhật đăng ký quảng cáo.');
      setSelected(null);
      setNote("");
      await cache.invalidateQueries({ queryKey: ["sponsorships"] });
      await cache.invalidateQueries({ queryKey: ["marketplace-sponsored-placements"] });
    },
  });
  function submit(
    event: FormEvent<HTMLFormElement>,
    action: "request" | "review" | "cancel",
  ) {
    event.preventDefault();
    if (mutation.isPending) return;
    setClientError("");
    setSuccessMessage('');
    if (action !== "request" && note.trim().length < 5) {
      setClientError("Vui lòng nhập căn cứ/lý do tối thiểu 5 ký tự.");
      return;
    }
    mutation.mutate({ form: event.currentTarget, action });
  }
  const error = clientError || mutation.error?.message || query.error?.message || pricing.error?.message;
  return (
    <Card className="sp-workspace mt-5 p-4 sm:p-6 text-[#1A1612]">
      <div className="sp-heading">
        <span className="sp-heading-icon"><Megaphone size={21} /></span>
        <div><h2>Quảng bá gian hàng</h2>
        <p>{admin ? 'Đối soát thanh toán và duyệt lịch quảng cáo trên trang chủ.' : 'Đưa thương hiệu đến gần khách mua sắm trên SCANMS.'}</p></div>
      </div>
      {successMessage && <p role="status" className="mb-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#1A1612]">{successMessage}</p>}
      {error && (
        <p
          role="alert"
          className="my-3 rounded-xl border border-red-200 p-3 text-sm text-[#DC2626]"
        >
          {error}
        </p>
      )}
      {!admin && <div ref={bookingSection}><SponsoredBookingForm key={renewal?.id ?? 'new'} pricing={pricing.data} pending={mutation.isPending}
        renewal={renewal ? { headline: renewal.headline, startsAt: renewal.formStartsAt, endsAt: renewal.formEndsAt } : null}
        onCancelRenewal={() => setRenewal(null)} onSubmit={(event) => submit(event, "request")} /></div>}
      <div className="sp-history-toolbar">
        <div className="sp-history-heading">
          <ClipboardList size={18} aria-hidden="true" />
          <h3>{admin ? 'Đăng ký cần xử lý' : 'Lịch sử đăng ký'}</h3>
          {query.data && <span className="sp-history-count">{query.data.total}</span>}
        </div>
        <div className="sp-history-controls">
        <label>
          <span>Trạng thái</span>
          <select
            aria-label="Lọc trạng thái tài trợ"
            value={status}
            className="sp-history-filter"
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          size="sm"
          className="sp-history-refresh"
          icon={<RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} />}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Tải lại
        </Button>
        </div>
      </div>
      {query.isLoading && <p className="sp-history-loading" role="status">Đang tải đăng ký…</p>}
      {!query.isLoading && query.data?.items.length === 0 && (
        <div className="sp-history-empty" role="status">
          <span className="sp-history-empty-icon"><ClipboardList size={21} aria-hidden="true" /></span>
          <div><strong>Chưa có đăng ký phù hợp</strong>
          <p>{status ? 'Thử chọn trạng thái khác để xem các đăng ký.' : 'Các đăng ký quảng cáo sẽ xuất hiện tại đây.'}</p></div>
        </div>
      )}
      <div className="space-y-3">
        {query.data?.items.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-[#EAE4D7] p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{row.store.name}</strong>
              <span className="rounded-full bg-[#FBF5EB] px-3 text-sm text-[#7D715E]">
                {labels[row.status]}
              </span>
            </div>
            <p className="mt-2 break-words">{row.headline}</p>
            <p className="mt-1 text-xs text-[#7D715E]">
              {when(row.startsAt)} → {when(row.endsAt)}
            </p>
            {row.fundingType && (
              <p className="mt-2 text-sm">
                {row.fundingType === "PLATFORM_GRANT"
                  ? "Gói miễn phí cũ — không đủ điều kiện hiển thị quảng cáo"
                  : `${row.paymentReference ? 'Đã đối soát' : 'Phí đăng ký'}: ${sponsorshipMoney(Number(row.amount))}${row.paymentReference ? ` · ${row.paymentReference}` : ''}`}
              </p>
            )}
            {row.reviewNote && (
              <p className="mt-2 break-words text-sm">
                Phản hồi: {row.reviewNote}
              </p>
            )}
            {row.status === 'EXPIRED' && <div className="sp-expired-notice"><strong>Gói đã hết hạn lúc {when(row.endsAt)}</strong><p>Gói này không còn hiển thị trên trang chủ.{!admin && ' Bạn có muốn gia hạn để tiếp tục quảng bá gian hàng?'}</p></div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {!admin && row.status === 'EXPIRED' && <Button variant="gold" disabled={mutation.isPending} onClick={() => startRenewal(row)}>Gia hạn gói</Button>}
              {admin && row.status === "REQUESTED" && (
                <Button
                  variant="gold"
                  disabled={mutation.isPending}
                  onClick={() => {
                    mutation.reset();
                    setClientError("");
                    setSelected({ row, cancel: false });
                    setNote("");
                    setDecision("APPROVE");
                  }}
                >
                  Xét duyệt
                </Button>
              )}
              {["REQUESTED", "APPROVED"].includes(row.status) && (
                <Button
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => {
                    mutation.reset();
                    setClientError("");
                    setSelected({ row, cancel: true });
                    setNote("");
                  }}
                >
                  Hủy gói
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!!query.data?.total && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <Button
            variant="outline"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span>
            {page}/{query.data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= query.data.totalPages || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
      {selected && (
        <section
          ref={reviewPanel}
          tabIndex={-1}
          className="mt-5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-4"
          aria-label={
            selected.cancel ? "Form hủy tài trợ" : "Form xét duyệt tài trợ"
          }
        >
          <h3 className="font-bold">
            {selected.cancel ? "Hủy gói" : "Xét duyệt"} —{" "}
            {selected.row.store.name}
          </h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) =>
              submit(event, selected.cancel ? "cancel" : "review")
            }
          >
            {!selected.cancel && (
              <>
                <label className="block text-sm">
                  Kết quả
                  <select
                    className={inputClass}
                    value={decision}
                    onChange={(event) =>
                      setDecision(event.target.value as typeof decision)
                    }
                  >
                    <option value="APPROVE">Đồng ý</option>
                    <option value="REJECT">Từ chối</option>
                  </select>
                </label>
                {decision === "APPROVE" && (
                  <>
                    <p className="text-sm text-[#7D715E]">
                      Chỉ duyệt sau khi kiểm tra tiền đã nhận và chứng từ thanh toán quảng cáo.
                    </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">
                          Số tiền đã xác minh (₫)
                          <input
                            className={inputClass}
                            type="number"
                            name="amount"
                            required
                            min={1}
                            max={1000000000}
                            step={1}
                            defaultValue={selected.row.amount ?? (pricing.data ? Math.ceil((Date.parse(selected.row.endsAt) - Date.parse(selected.row.startsAt)) / 86400000) * pricing.data.dailyRate : '')}
                          />
                        </label>
                        <label className="text-sm">
                          Mã đối soát duy nhất
                          <input
                            className={inputClass}
                            name="reference"
                            required
                            minLength={6}
                            maxLength={100}
                          />
                        </label>
                        <label className="text-sm sm:col-span-2">
                          Liên kết chứng từ HTTPS
                          <input
                            className={inputClass}
                            type="url"
                            name="proof"
                            pattern="https://.*"
                            required
                            maxLength={2000}
                          />
                        </label>
                      </div>
                  </>
                )}
              </>
            )}
            <label className="block text-sm">
              {selected.cancel
                ? "Lý do hủy"
                : "Căn cứ xét duyệt / hướng dẫn cho Shop"}
              <textarea
                className={inputClass}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                minLength={5}
                maxLength={2000}
                required
              />
            </label>
            {selected.cancel && (
              <p className="text-sm text-[#7D715E]">
                Dừng hiển thị không đồng nghĩa đã hoàn phí. Khoản có thu phí cần
                xử lý đối soát riêng.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-[#DC2626]">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="gold" loading={mutation.isPending}>
                Xác nhận
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  setSelected(null);
                  mutation.reset();
                  setClientError("");
                }}
              >
                Đóng
              </Button>
            </div>
          </form>
        </section>
      )}
    </Card>
  );
}
