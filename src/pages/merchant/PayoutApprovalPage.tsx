import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Download, RefreshCw, ReceiptText } from "lucide-react";
import {
  payoutService,
  getPayoutErrorMessage,
} from "../../services/payout.service";
import type {
  MerchantPayout,
  MerchantPayoutBatch,
  MerchantPayoutHistory,
} from "../../services/payout.service";
import type { PayoutStatus } from "../../services/wallet.service";
import { storeService } from "../../services/store.service";
import PayoutBillUpload from "../../components/payouts/PayoutBillUpload";
import {
  maskBankAccount,
  MAX_PAYOUT_BILL_BYTES,
  validatePayoutBill,
} from "../../components/payouts/payoutBillValidation";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang thanh toán theo lô",
  APPROVED: "Đã xác nhận chi trả",
  REJECTED: "Đã từ chối",
};
const money = (amount: string) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(amount))} ₫`;
const buttonClass =
  "rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

function saveWorkbook(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PayoutApprovalPage() {
  const { storeId: routeStoreId } = useParams<{ storeId: string }>();
  const [storeId, setStoreId] = useState(routeStoreId ?? "");
  const [storeName, setStoreName] = useState("Gian hàng của bạn");
  const [history, setHistory] = useState<MerchantPayoutHistory | null>(null);
  const [batches, setBatches] = useState<MerchantPayoutBatch[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PayoutStatus | "">("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialog, setDialog] = useState<{
    request: MerchantPayout;
    action: "approve" | "reject";
  } | null>(null);
  const [bankRefCode, setBankRefCode] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [bill, setBill] = useState<File | null>(null);
  const [billLink, setBillLink] = useState("");
  const inFlight = useRef(false);
  const loadSequence = useRef(0);
  const modalRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    modalRef.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [dialog]);

  useEffect(() => {
    let active = true;
    if (routeStoreId) {
      setStoreId(routeStoreId);
      return;
    }
    void storeService
      .getMyStore()
      .then((store) => {
        if (active) {
          setStoreId(store.id);
          setStoreName(store.name);
        }
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Không tải được shop");
      });
    return () => {
      active = false;
    };
  }, [routeStoreId]);

  const load = useCallback(async () => {
    if (!storeId) return;
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const [requests, batchHistory] = await Promise.all([
        payoutService.list(storeId, page, status),
        payoutService.batches(storeId),
      ]);
      if (sequence !== loadSequence.current) return;
      setHistory(requests);
      setBatches(batchHistory.batches);
      setSelected([]);
      setError("");
    } catch (err: unknown) {
      if (sequence === loadSequence.current)
        setError(await getPayoutErrorMessage(err));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [storeId, page, status]);
  useEffect(() => {
    const sequenceRef = loadSequence;
    void load();
    return () => {
      sequenceRef.current++;
    };
  }, [load]);

  async function runAction(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
    } catch (err: unknown) {
      setError(
        `${await getPayoutErrorMessage(err)} Nếu kết nối gián đoạn, tải lại trạng thái trước khi gửi lại.`,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function openDialog(request: MerchantPayout, action: "approve" | "reject") {
    setDialog({ request, action });
    setBankRefCode("");
    setNote("");
    setReason("");
    setBill(null);
    setError("");
  }

  async function submitDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || busy) return;
    if (
      dialog.action === "approve" &&
      (!bill ||
        validatePayoutBill(bill, history?.maxBillBytes) ||
        (bankRefCode.trim() &&
          !/^[A-Z0-9][A-Z0-9._/ -]{0,99}$/i.test(bankRefCode.trim())))
    ) {
      setError(
        "Cần bill JPG, PNG hoặc PDF hợp lệ; mã giao dịch nếu nhập phải đúng định dạng.",
      );
      return;
    }
    if (dialog.action === "reject" && !reason.trim()) {
      setError("Nhập lý do từ chối");
      return;
    }
    await runAction(async () => {
      if (dialog.action === "approve" && bill)
        await payoutService.approve(dialog.request.id, bill, {
          bankRefCode: bankRefCode.trim(),
          note: note.trim(),
        });
      else
        await payoutService.reject(storeId, dialog.request.id, reason.trim());
      setDialog(null);
      setSuccess(
        dialog.action === "approve"
          ? "Đã xác nhận chi trả; ví không bị trừ lần nữa."
          : "Đã từ chối và hoàn tiền về đúng ví shop.",
      );
      await load();
    });
  }

  const eligible =
    history?.requests.filter(
      (request) => request.status === "PENDING" && !request.batchId,
    ) ?? [];
  return (
    <div className="space-y-6 text-ink">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Duyệt chi trả KOL</h1>
          <p className="mt-1 text-sm text-muted">
            {storeName} · Chỉ quản lý payout thuộc shop của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || busy}
          aria-label="Tải lại payout"
          className={`${buttonClass} flex items-center gap-2 bg-white`}
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger bg-white p-4 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-xl border border-brand-border bg-brand-soft p-4 text-sm"
        >
          {success}
        </p>
      )}
      {billLink && (
        <p className="text-sm">
          <a
            href={billLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-strong underline"
          >
            Mở ảnh bill riêng tư (link hết hạn sau 2 phút)
          </a>
        </p>
      )}
      <section className="rounded-2xl border border-brand-border bg-brand-soft p-5 text-sm">
        <p>
          Xuất Excel tạo lô và chuyển payout sang “Đang thanh toán theo lô”;
          chưa chuyển tiền. Chỉ thanh toán số thực nhận sau thuế, rồi upload
          bill để xác nhận từng giao dịch.
        </p>
        <p className="mt-2 text-muted">
          Payout đã vào lô không được hoàn tiền tự động. Khi ngân hàng báo lỗi,
          cần đối soát trước. Mở link VietQR trong Excel sẽ gửi thông tin người
          thụ hưởng tới dịch vụ VietQR.
        </p>
      </section>
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <label className="flex items-center gap-2 text-sm">
            Trạng thái
            <select
              aria-label="Lọc trạng thái payout"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PayoutStatus | "");
                setPage(1);
              }}
              disabled={busy || loading}
              className="rounded-lg border border-line bg-white p-2"
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy || loading || selected.length === 0}
            onClick={() =>
              void runAction(async () => {
                const blob = await payoutService.exportBatch(storeId, selected);
                saveWorkbook(blob, `SCANMS-VietQR-${Date.now()}.xlsx`);
                setSuccess(
                  "Đã tạo lô VietQR. Nếu tải file gián đoạn, tải lại từ lịch sử lô; không tạo lô mới.",
                );
                await load();
              })
            }
            className={`${buttonClass} flex items-center gap-2 border-brand bg-brand text-white hover:bg-brand-strong`}
          >
            <Download size={16} />
            Xuất Excel VietQR / Napas247 ({selected.length})
          </button>
        </div>
        {loading && <p className="p-5 text-sm text-muted">Đang tải payout…</p>}
        <div className="overflow-x-auto">
          <table
            aria-label="Danh sách payout"
            className="w-full text-left text-sm"
          >
            <thead className="bg-surface-sand text-muted">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả payout chờ trên trang"
                    checked={
                      eligible.length > 0 &&
                      eligible.every((request) => selected.includes(request.id))
                    }
                    disabled={busy || loading || eligible.length === 0}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? eligible.map((request) => request.id)
                          : [],
                      )
                    }
                    className="accent-brand"
                  />
                </th>
                {[
                  "KOL / Mã payout",
                  "Người thụ hưởng",
                  "Yêu cầu",
                  "Thuế",
                  "Thực nhận",
                  "Trạng thái",
                  "Thao tác",
                ].map((label) => (
                  <th scope="col" key={label} className="whitespace-nowrap p-4">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history?.requests.map((request) => (
                <tr key={request.id} className="border-t border-line">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      aria-label={`Chọn payout ${request.id}`}
                      checked={selected.includes(request.id)}
                      disabled={
                        busy ||
                        loading ||
                        request.status !== "PENDING" ||
                        Boolean(request.batchId)
                      }
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, request.id]
                            : current.filter((id) => id !== request.id),
                        )
                      }
                      className="accent-brand"
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{request.collaboratorName}</p>
                    {request.kycStatus && (
                      <p className="mt-1 text-xs text-muted">
                        KYC:{" "}
                        {request.kycStatus === "VERIFIED"
                          ? "Đã xác minh"
                          : "Cần bổ sung"}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-xs text-muted">
                      {request.id}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(request.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </td>
                  <td className="p-4">
                    <p>{request.bankAccountName ?? "Thiếu thông tin"}</p>
                    <p className="text-xs text-muted">
                      {request.bankName} ·{" "}
                      {maskBankAccount(request.bankAccountNumber)}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-4">
                    {money(request.amount)}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    {money(request.taxAmount)}
                  </td>
                  <td className="whitespace-nowrap p-4 font-semibold">
                    {Number(request.netAmount) > 0
                      ? money(request.netAmount)
                      : "Cần đối soát"}
                  </td>
                  <td className="p-4">
                    <span className="whitespace-nowrap rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs">
                      {STATUS_LABELS[request.status]}
                    </span>
                    {request.batchId && (
                      <p className="mt-2 font-mono text-xs text-muted">
                        Lô: {request.batchId}
                      </p>
                    )}
                    {request.bankRefCode && (
                      <p className="mt-2 text-xs">GD: {request.bankRefCode}</p>
                    )}
                    {request.rejectedReason && (
                      <p className="mt-2 text-xs text-muted">
                        {request.rejectedReason}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {(request.status === "PENDING" ||
                        request.status === "PROCESSING") && (
                        <button
                          type="button"
                          disabled={busy || loading}
                          onClick={() => openDialog(request, "approve")}
                          className={`${buttonClass} border-brand bg-brand text-white hover:bg-brand-strong`}
                        >
                          Duyệt và tải bill
                        </button>
                      )}
                      {request.status === "PENDING" && !request.batchId && (
                        <button
                          type="button"
                          disabled={busy || loading}
                          onClick={() => openDialog(request, "reject")}
                          className={`${buttonClass} bg-white`}
                        >
                          Từ chối
                        </button>
                      )}
                      {request.hasBill && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void runAction(async () => {
                              const result = await payoutService.bill(
                                storeId,
                                request.id,
                              );
                              setBillLink(result.url);
                            })
                          }
                          className={`${buttonClass} flex items-center gap-1 bg-white`}
                        >
                          <ReceiptText size={14} />
                          Xem bill
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && history?.total === 0 && (
          <p className="p-5 text-sm text-muted">Chưa có payout thuộc shop.</p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line p-4 text-sm">
          <span>
            {history?.total ?? 0} yêu cầu · Trang {page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className={buttonClass}
            >
              Trước
            </button>
            <button
              type="button"
              disabled={busy || loading || page * 10 >= (history?.total ?? 0)}
              onClick={() => setPage((current) => current + 1)}
              className={buttonClass}
            >
              Sau
            </button>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold">Lịch sử lô VietQR gần nhất</h2>
        <p className="mt-2 text-xs text-muted">
          Tải lại cùng file không tạo lô mới. File có thể chứa payout đã trả —
          không chuyển khoản lại.
        </p>
        {batches.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Chưa có lô thanh toán.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div>
                  <p className="font-mono text-xs">{batch.id}</p>
                  <p className="mt-1 text-xs text-muted">
                    {batch.payoutCount} payout ·{" "}
                    {new Date(batch.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () =>
                      saveWorkbook(
                        await payoutService.downloadBatch(storeId, batch.id),
                        `SCANMS-VietQR-${batch.id}.xlsx`,
                      ),
                    )
                  }
                  className={`${buttonClass} bg-surface-sand`}
                >
                  Tải lại Excel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dialog && (
        <dialog
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setDialog(null);
          }}
          className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-brand-dark/50"
        >
          <h2 id="payout-dialog-title" className="text-xl font-bold">
            {dialog.action === "approve"
              ? "Duyệt payout và tải bill ngân hàng"
              : "Từ chối yêu cầu"}
          </h2>
          <p className="mt-2 break-all font-mono text-xs text-muted">
            {dialog.request.id}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="mb-3 text-sm font-semibold">Thông tin KOL</h3>
              <div className="flex items-center gap-3">
                {dialog.request.collaboratorAvatar ? (
                  <img
                    src={dialog.request.collaboratorAvatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong">
                    {dialog.request.collaboratorName?.charAt(0) || "K"}
                  </span>
                )}
                <strong>{dialog.request.collaboratorName}</strong>
              </div>
              <dl className="mt-3 space-y-2 break-words text-sm">
                <div>
                  <dt className="text-muted">Số điện thoại</dt>
                  <dd>{dialog.request.collaboratorPhone || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd>{dialog.request.collaboratorEmail || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Mã số thuế</dt>
                  <dd>
                    {dialog.request.collaboratorTaxCode || "Chưa cập nhật"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Ngân hàng nhận tiền
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Ngân hàng</dt>
                  <dd>{dialog.request.bankName || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Số tài khoản</dt>
                  <dd className="font-mono">
                    {maskBankAccount(dialog.request.bankAccountNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Chủ tài khoản</dt>
                  <dd>{dialog.request.bankAccountName || "Chưa cập nhật"}</dd>
                </div>
              </dl>
            </section>
          </div>
          <dl className="mt-4 grid gap-3 rounded-xl border border-brand-border bg-brand-soft p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Số tiền yêu cầu</dt>
              <dd className="mt-1 font-semibold">
                {money(dialog.request.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Thuế TNCN đã khấu trừ</dt>
              <dd className="mt-1 font-semibold">
                {money(dialog.request.taxAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Số tiền thực chuyển</dt>
              <dd className="mt-1 font-bold text-brand-strong">
                {money(dialog.request.netAmount)}
              </dd>
            </div>
          </dl>
          <form
            onSubmit={(event) => void submitDialog(event)}
            className="mt-5 space-y-4"
            aria-busy={busy}
          >
            {dialog.action === "approve" ? (
              <>
                <p className="text-sm text-muted">
                  Chỉ xác nhận sau khi chuyển khoản thành công. Bill không được
                  tái sử dụng cho payout khác. Duyệt payout không trừ ví lần
                  nữa.
                </p>
                <label className="block text-sm">
                  Mã giao dịch ngân hàng (nếu có)
                  <input
                    aria-label="Mã giao dịch ngân hàng"
                    value={bankRefCode}
                    onChange={(event) => setBankRefCode(event.target.value)}
                    maxLength={100}
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-line p-3 focus:border-brand"
                  />
                </label>
                <PayoutBillUpload
                  file={bill}
                  maxBytes={Math.min(
                    history?.maxBillBytes ?? MAX_PAYOUT_BILL_BYTES,
                    MAX_PAYOUT_BILL_BYTES,
                  )}
                  disabled={busy}
                  onChange={setBill}
                />
                <label className="block text-sm">
                  Ghi chú (không bắt buộc)
                  <textarea
                    aria-label="Ghi chú duyệt payout"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    disabled={busy}
                    rows={3}
                    placeholder="Ghi chú về giao dịch chuyển khoản..."
                    className="mt-2 w-full resize-y rounded-xl border border-line p-3 focus:border-brand"
                  />
                  <span className="mt-1 block text-right text-xs text-muted">
                    {note.length}/500
                  </span>
                </label>
              </>
            ) : (
              <label className="block text-sm">
                Lý do từ chối
                <textarea
                  aria-label="Lý do từ chối"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  maxLength={500}
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-line p-3 focus:border-brand"
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDialog(null)}
                className={buttonClass}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy || (dialog.action === "approve" && !bill)}
                className={`${buttonClass} border-brand bg-brand text-white hover:bg-brand-strong`}
              >
                {busy
                  ? "Đang tải bill và xác nhận…"
                  : dialog.action === "approve"
                    ? "Xác nhận duyệt"
                    : "Từ chối & hoàn tiền"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
