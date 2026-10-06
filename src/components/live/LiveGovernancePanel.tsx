import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  X,
  Upload,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import { authService } from "../../services/auth.service";
import { uploadService } from "../../services/upload.service";
import { toast } from "../../utils/toast";

type Statement = {
  message: string;
  evidence?: string[];
  at?: string;
  userId?: string;
};
type Decision = Statement & {
  outcome: string;
  sanction: string;
  compensation: number;
  compensationStatus: string;
  restrictionDays?: number;
};
export type LiveGovernance = {
  request?: Statement & {
    status: string;
    reason: string;
    response?: Statement;
  };
  stop?: Statement & { mode: string; reason: string; at: string };
  preserveOrderTerms?: boolean;
  timeline?: Array<
    Statement & { action: string; role: string; actorId: string }
  >;
  snapshot?: {
    at: string;
    title: string;
    description?: string;
    commissionRate: string;
    orders: Array<{ id: string; status: string; finalAmount: string }>;
    claims: number;
    viewers: number;
    products: unknown[];
    coupon?: { displayCode: string };
  };
  dispute?: Statement & {
    status: string;
    submittedAt: string;
    explanation?: Statement;
    appeal?: Statement;
    escalation?: Statement;
    decision?: Decision;
    finalDecision?: Decision;
  };
};
type Session = {
  id: string;
  status: string;
  inviteStatus?: string;
  governance?: LiveGovernance;
};
const labels: Record<string, string> = {
  REQUEST_END: "Yêu cầu kết thúc",
  EMERGENCY_STOP: "Dừng khẩn cấp",
  ACCEPT_END: "Đồng ý kết thúc",
  REJECT_END: "Tiếp tục phiên",
  COMPLAIN: "Khiếu nại việc dừng phiên",
  EXPLAIN: "Gửi giải trình",
  DECIDE: "Giải quyết tranh chấp",
  ESCALATE: "Chuyển Super Admin",
  APPEAL: "Gửi kháng nghị",
  DECIDE_APPEAL: "Quyết định cuối cùng",
};
const reasons: Record<string, string> = {
  OUT_OF_STOCK: "Hết hàng",
  TECHNICAL: "Sự cố kỹ thuật",
  KOL_VIOLATION: "KOL vi phạm",
  OTHER: "Lý do khác",
};
const statuses: Record<string, string> = {
  OPEN: "Chờ Vận hành & Tuân thủ xử lý",
  ESCALATED: "Đã chuyển Super Admin",
  RESOLVED: "Đã có quyết định · Có thể kháng nghị",
  APPEALED: "Chờ Super Admin xem xét kháng nghị",
  CLOSED: "Đã có quyết định cuối cùng",
};
const outcomes: Record<string, string> = {
  SHOP_FAULT: "Shop có lỗi",
  KOL_FAULT: "KOL có lỗi",
  NO_FAULT: "Không xác định vi phạm",
  INSUFFICIENT_EVIDENCE: "Chưa đủ bằng chứng",
};
const sanctions: Record<string, string> = {
  NONE: "Không áp dụng",
  WARNING: "Cảnh cáo Shop",
  RESTRICT: "Hạn chế mở phiên",
  BLOCK: "Khóa hợp tác livestream",
  LIFT: "Gỡ hạn chế / khóa",
};
const roles: Record<string, string> = {
  SHOP_MANAGER: "Shop",
  COLLABORATOR: "KOL",
  SYSTEM_MANAGER: "Vận hành & Tuân thủ",
  SYSTEM_ADMIN: "Super Admin",
};
const field =
  "w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none focus:border-[#C59B58]";
const button =
  "rounded-xl border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-semibold text-[#7D715E] hover:border-[#C59B58] hover:bg-[#FBF5EB] disabled:opacity-50";
const time = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "";

export function LiveGovernancePanel({
  session,
  audience,
  onChanged,
  liveRoom = false,
}: {
  session: Session;
  audience: "shop" | "kol" | "admin";
  onChanged?: () => void;
  liveRoom?: boolean;
}) {
  const [remote, setRemote] = useState<Session | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("TECHNICAL");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [outcome, setOutcome] = useState("INSUFFICIENT_EVIDENCE");
  const [sanction, setSanction] = useState("NONE");
  const [days, setDays] = useState(7);
  const [compensation, setCompensation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const user = authService.getCurrentUser();
  const superAdmin = user?.role === "SYSTEM_ADMIN";
  const current = liveRoom ? remote || session : session;
  const g = current.governance || {};
  const dispute = g.dispute;
  const active =
    ["LIVE", "SCHEDULED", "PAUSED"].includes(current.status) &&
    current.inviteStatus === "ACCEPTED";
  const decisionForm = action === "DECIDE" || action === "DECIDE_APPEAL";

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("session") !== session.id
    )
      return;
    setExpanded(true);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [session.id]);

  useEffect(() => {
    if (!liveRoom) return;
    let alive = true;
    const refresh = async () => {
      try {
        const response: any = await api.get(
          `/live-sessions/${session.id}/governance`,
          { headers: { "x-skip-cache": "true" } },
        );
        if (alive) setRemote(response?.data || response);
      } catch {
        /* The room remains usable if a background request fails. */
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    const handleChange = (event: Event) => {
      if ((event as CustomEvent).detail?.sessionId === session.id)
        void refresh();
    };
    window.addEventListener("scanms-live-governance", handleChange);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("scanms-live-governance", handleChange);
    };
  }, [liveRoom, session.id]);

  const open = (next: string) => {
    setAction(next);
    setMessage("");
    setEvidence([]);
    setLink("");
    setOutcome("INSUFFICIENT_EVIDENCE");
    setSanction("NONE");
    setCompensation(0);
  };
  const submit = async () => {
    if (message.trim().length < 10) {
      toast.error("Ghi nội dung cụ thể, ít nhất 10 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const response: any = await api.post(
        `/live-sessions/${session.id}/governance`,
        {
          action,
          message: message.trim(),
          evidence,
          reason,
          ...(decisionForm
            ? { outcome, sanction, restrictionDays: days, compensation }
            : {}),
        },
      );
      const result = response?.data || response;
      if (liveRoom) setRemote({ ...current, ...result });
      setAction(null);
      onChanged?.();
      toast.success("Đã ghi nhận và thông báo cho các bên liên quan.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không lưu được thao tác.");
    } finally {
      setBusy(false);
    }
  };
  const addLink = () => {
    try {
      const url = new URL(link.trim());
      if (url.protocol !== "https:") throw new Error();
      if (evidence.length >= 10) throw new Error();
      setEvidence([...new Set([...evidence, url.href])]);
      setLink("");
    } catch {
      toast.error("Dùng liên kết HTTPS hợp lệ, tối đa 10 bằng chứng.");
    }
  };
  const actButton = (value: string) => (
    <button
      key={value}
      type="button"
      onClick={() => open(value)}
      className={`${button} ${value === "EMERGENCY_STOP" ? "text-[#DC2626]" : ""}`}
    >
      {labels[value]}
    </button>
  );
  const renderStatement = (title: string, statement?: Statement) =>
    statement && (
      <div className="rounded-xl border border-[#EAE4D7] bg-white p-3">
        <p className="text-xs font-semibold text-[#7D715E]">
          {title} {statement.at && `· ${time(statement.at)}`}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
          {statement.message}
        </p>
        {statement.evidence?.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-3 mt-2 inline-block text-xs text-[#B88E4F] underline"
          >
            Bằng chứng {index + 1}
          </a>
        ))}
      </div>
    );
  const decision = dispute?.finalDecision || dispute?.decision;
  if (audience === "admin" && !g.stop && !dispute && !g.request) return null;

  return (
    <div
      ref={panelRef}
      className="mt-4 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-[#1A1612] sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#B88E4F]" /> Bảo vệ hợp tác
          livestream
        </h4>
        {dispute && (
          <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1 text-xs text-[#7D715E]">
            {statuses[dispute.status]}
          </span>
        )}
      </div>
      {g.stop && (
        <p className="mt-2 text-xs text-[#7D715E]">
          Đã dừng lúc {time(g.stop.at)} · {reasons[g.stop.reason]} ·{" "}
          {g.stop.message}
        </p>
      )}
      {g.request?.status === "PENDING" && active && (
        <div className="mt-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm">
          <strong>Shop yêu cầu kết thúc: {reasons[g.request.reason]}</strong>
          <p className="mt-1 text-[#7D715E]">{g.request.message}</p>
          <p className="mt-1 text-xs text-[#7D715E]">
            Phiên tiếp tục cho đến khi KOL đồng ý hoặc Shop dừng khẩn cấp.
          </p>
        </div>
      )}
      {g.preserveOrderTerms && (
        <p className="mt-2 text-xs text-[#7D715E]">
          Đơn đã đặt, ưu đãi và hoa hồng được giữ để xử lý và đối soát theo
          trạng thái đơn.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {audience === "shop" && active && (
          <>
            {g.request?.status !== "PENDING" && actButton("REQUEST_END")}
            {actButton("EMERGENCY_STOP")}
          </>
        )}
        {audience === "kol" && active && g.request?.status === "PENDING" && (
          <>
            {actButton("ACCEPT_END")}
            {actButton("REJECT_END")}
          </>
        )}
        {audience === "kol" && g.stop && !dispute && actButton("COMPLAIN")}
        {audience === "shop" &&
          dispute &&
          ["OPEN", "ESCALATED", "APPEALED"].includes(dispute.status) &&
          actButton("EXPLAIN")}
        {audience !== "admin" &&
          dispute?.status === "RESOLVED" &&
          !dispute.appeal &&
          actButton("APPEAL")}
        {audience === "admin" && dispute?.status === "OPEN" && (
          <>
            {actButton("DECIDE")}
            {actButton("ESCALATE")}
          </>
        )}
        {audience === "admin" &&
          superAdmin &&
          dispute &&
          ["ESCALATED", "APPEALED"].includes(dispute.status) &&
          actButton("DECIDE_APPEAL")}
        {(g.timeline?.length || dispute) && (
          <button
            type="button"
            className={button}
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className="mr-1 inline h-3 w-3" />
            {expanded ? "Thu gọn hồ sơ" : "Xem hồ sơ & lịch sử"}
          </button>
        )}
      </div>
      {decision && (
        <div className="mt-3 rounded-xl border border-[#EEDFC6] bg-white p-3 text-sm">
          <strong>
            {outcomes[decision.outcome]} · {sanctions[decision.sanction]}
          </strong>
          <p className="mt-1 whitespace-pre-wrap text-[#7D715E]">
            {decision.message}
          </p>
          {decision.compensation > 0 && (
            <p className="mt-2 text-xs">
              Bồi hoàn được ghi nhận:{" "}
              {decision.compensation.toLocaleString("vi-VN")} ₫ · Chờ đối soát,
              chưa chuyển tiền.
            </p>
          )}
        </div>
      )}
      {expanded && (
        <div className="mt-3 space-y-2">
          {renderStatement("KOL khiếu nại", dispute)}
          {renderStatement("Shop giải trình", dispute?.explanation)}
          {renderStatement("Kháng nghị", dispute?.appeal)}
          {renderStatement("Chuyển cấp", dispute?.escalation)}
          {g.snapshot && (
            <div className="rounded-xl border border-[#EAE4D7] bg-white p-3 text-xs text-[#7D715E]">
              <strong>Dữ liệu lưu khi dừng · {time(g.snapshot.at)}</strong>
              <p className="mt-1">
                {g.snapshot.orders.length} đơn · {g.snapshot.viewers} lượt xem ·{" "}
                {g.snapshot.claims} lượt nhận mã · Hoa hồng{" "}
                {g.snapshot.commissionRate}% · Voucher{" "}
                {g.snapshot.coupon?.displayCode || "Không có"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                Thỏa thuận / mô tả phiên:{" "}
                {g.snapshot.description || "Chưa cung cấp"}
              </p>
              {g.snapshot.orders.map((order) => (
                <p key={order.id} className="mt-1 break-all">
                  Đơn {order.id} · {order.status} ·{" "}
                  {Number(order.finalAmount).toLocaleString("vi-VN")} ₫
                </p>
              ))}
            </div>
          )}
          <ol className="space-y-2">
            {g.timeline?.map((event, index) => (
              <li
                key={index}
                className="border-l-2 border-[#EEDFC6] pl-3 text-xs"
              >
                <strong>
                  {labels[event.action]} · {roles[event.role] || event.role}
                </strong>
                <span className="ml-2 text-[#7D715E]">{time(event.at)}</span>
                <p className="mt-1 whitespace-pre-wrap break-words text-[#7D715E]">
                  {event.message}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
      {action && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#231D15]/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`governance-${session.id}`}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3
                id={`governance-${session.id}`}
                className="text-lg font-semibold"
              >
                {labels[action]}
              </h3>
              <button
                type="button"
                aria-label="Đóng"
                disabled={busy || uploading}
                onClick={() => setAction(null)}
              >
                <X className="h-5 w-5 text-[#7D715E]" />
              </button>
            </div>
            {action === "EMERGENCY_STOP" && (
              <p className="mb-4 flex gap-2 rounded-xl bg-[#FBF5EB] p-3 text-sm text-[#7D715E]">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[#B88E4F]" />
                Dừng phát sóng ngay và thông báo KOL. KOL có quyền khiếu nại.
                Đơn đã đặt được giữ nguyên.
              </p>
            )}
            {["REQUEST_END", "EMERGENCY_STOP"].includes(action) && (
              <label className="mb-3 block text-xs text-[#7D715E]">
                Lý do bắt buộc
                <select
                  className={`${field} mt-1`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {Object.entries(reasons).map(([value, title]) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {decisionForm && (
              <div className="mb-3 space-y-3">
                <label className="block text-xs text-[#7D715E]">
                  Kết luận
                  <select
                    className={`${field} mt-1`}
                    value={outcome}
                    onChange={(e) => {
                      setOutcome(e.target.value);
                      setSanction("NONE");
                      setCompensation(0);
                    }}
                  >
                    {Object.entries(outcomes).map(([value, title]) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-[#7D715E]">
                  Xử lý Shop
                  <select
                    className={`${field} mt-1`}
                    value={sanction}
                    onChange={(e) => setSanction(e.target.value)}
                  >
                    {Object.entries(sanctions)
                      .filter(
                        ([value]) =>
                          value === "NONE" ||
                          (value === "LIFT" && superAdmin) ||
                          (outcome === "SHOP_FAULT" &&
                            (value === "WARNING" || superAdmin)),
                      )
                      .map(([value, title]) => (
                        <option key={value} value={value}>
                          {title}
                        </option>
                      ))}
                  </select>
                </label>
                {sanction === "RESTRICT" && (
                  <label className="block text-xs text-[#7D715E]">
                    Số ngày hạn chế
                    <input
                      className={`${field} mt-1`}
                      type="number"
                      min={1}
                      max={90}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    />
                  </label>
                )}
                {outcome === "SHOP_FAULT" && (
                  <label className="block text-xs text-[#7D715E]">
                    Bồi hoàn theo thỏa thuận (₫)
                    <input
                      className={`${field} mt-1`}
                      type="number"
                      min={0}
                      max={1000000000}
                      value={compensation}
                      onChange={(e) => setCompensation(Number(e.target.value))}
                    />
                    <span className="mt-1 block">
                      Ghi căn cứ trong quyết định. Khoản này chờ đối soát, chưa
                      tự động chuyển tiền.
                    </span>
                  </label>
                )}
              </div>
            )}
            <label className="block text-xs text-[#7D715E]">
              Nội dung / căn cứ bắt buộc
              <textarea
                className={`${field} mt-1 min-h-28`}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả sự việc, lý do và căn cứ đối chiếu…"
              />
            </label>
            {["COMPLAIN", "EXPLAIN", "APPEAL"].includes(action) && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    className={field}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Liên kết bằng chứng https://…"
                  />
                  <button type="button" className={button} onClick={addLink}>
                    Thêm
                  </button>
                </div>
                <label
                  className={`${button} inline-flex cursor-pointer items-center gap-2`}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Đang tải…" : "Tải ảnh / video bằng chứng"}
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*,video/*"
                    disabled={uploading || busy || evidence.length >= 10}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setUploading(true);
                      try {
                        const result = await uploadService.uploadMedia(
                          file,
                          "scanms/live-disputes",
                        );
                        setEvidence((prev) => [...prev, result.url]);
                      } catch {
                        toast.error("Không tải được bằng chứng.");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                {evidence.map((url, index) => (
                  <div
                    key={url}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[#B88E4F] underline"
                    >
                      Bằng chứng {index + 1}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setEvidence(evidence.filter((item) => item !== url))
                      }
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={button}
                disabled={busy || uploading}
                onClick={() => setAction(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={busy || uploading}
                onClick={() => void submit()}
                className="rounded-xl bg-[#C59B58] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B88E4F] disabled:opacity-50"
              >
                {busy ? "Đang lưu…" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
