import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  X,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import { authService } from "../../services/auth.service";
import { LiveEvidenceAttachments, LiveEvidenceGallery } from "./LiveEvidenceAttachments";
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
    initiatedBy?: 'SHOP';
    kolStatement?: Statement;
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
  END_BY_KOL: "Kết thúc phiên Live",
  SHOP_END: "Kết thúc phiên & gửi Admin",
  KOL_EXPLAIN: "KOL gửi giải trình & bằng chứng",
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
  PERSONAL: "Việc cá nhân / bận đột xuất",
  HEALTH: "Sức khỏe / sự cố bất ngờ",
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
  initialAction,
  compact = false,
}: {
  session: Session;
  audience: "shop" | "kol" | "admin";
  onChanged?: () => void;
  liveRoom?: boolean;
  initialAction?: string;
  compact?: boolean;
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
  const compactIdle = compact && audience === "kol" && active && !g.stop && g.request?.status !== "PENDING" && !dispute && !g.timeline?.length;

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
          `/livestreams/${session.id}/governance`,
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
    if (busy || uploading) return;
    setReason(next === "END_BY_KOL" ? "PERSONAL" : "TECHNICAL");
    setAction(next);
    setMessage("");
    setEvidence([]);
    setLink("");
    setOutcome("INSUFFICIENT_EVIDENCE");
    setSanction("NONE");
    setCompensation(0);
  };
  useEffect(() => {
    if (initialAction) open(initialAction);
  }, [initialAction, session.id]);
  const submit = async () => {
    if (busy || uploading) return;
    if (message.trim().length < 10) {
      toast.error("Ghi nội dung cụ thể, ít nhất 10 ký tự.");
      return;
    }
    if (["SHOP_END", "EMERGENCY_STOP", "KOL_EXPLAIN", "COMPLAIN", "EXPLAIN"].includes(action || '') && evidence.length === 0) {
      toast.error("Cần thêm ít nhất một ảnh, video hoặc liên kết bằng chứng.");
      return;
    }
    setBusy(true);
    try {
      const response: any = await api.post(
        `/livestreams/${session.id}/governance`,
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
      className={compactIdle && value === "END_BY_KOL" ? "inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#EEDFC6] bg-white px-4 text-xs font-semibold text-[#DC2626] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] cursor-pointer" : `${button} ${["EMERGENCY_STOP", "END_BY_KOL"].includes(value) ? "text-[#DC2626]" : ""}`}
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
        {!!statement.evidence?.length && <div className="mt-3"><LiveEvidenceGallery urls={statement.evidence} /></div>}
      </div>
    );
  const decision = dispute?.finalDecision || dispute?.decision;
  if (audience === "admin" && !g.stop && !dispute && !g.request) return null;

  return (
    <div
      ref={panelRef}
      className={compactIdle ? "w-full min-w-0" : "mt-4 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-[#1A1612] sm:p-4"}
    >
      <div className={compactIdle ? "hidden" : "flex flex-wrap items-center justify-between gap-2"}>
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
      {dispute?.initiatedBy === "SHOP" && ["OPEN", "ESCALATED", "APPEALED"].includes(dispute.status) && <p className="mt-2 text-xs leading-5 text-[#7D715E]">Hồ sơ đã gửi Admin · Shop: {dispute.explanation?.evidence?.length ? "đã cung cấp bằng chứng" : "chờ bổ sung bằng chứng"} · KOL: {dispute.kolStatement?.evidence?.length ? "đã gửi giải trình và bằng chứng" : "chờ gửi giải trình và bằng chứng"}.</p>}
      <div className={compactIdle ? "w-full" : "mt-3 flex flex-wrap gap-2"}>
        {audience === "kol" && active && ["LIVE", "PAUSED"].includes(current.status) && actButton("END_BY_KOL")}
        {audience === "shop" && active && (
          <>
            {actButton("SHOP_END")}
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
        {audience === "kol" && dispute?.initiatedBy === "SHOP" && ["OPEN", "ESCALATED"].includes(dispute.status) && !dispute.kolStatement && actButton("KOL_EXPLAIN")}
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
          {renderStatement("Lý do và bằng chứng kết thúc phiên", g.stop)}
          {renderStatement(dispute?.initiatedBy === "SHOP" ? "Hồ sơ Shop kết thúc phiên · Chuyển Admin" : "KOL khiếu nại", dispute)}
          {renderStatement("Shop giải trình", dispute?.explanation)}
          {renderStatement("KOL giải trình & bằng chứng", dispute?.kolStatement)}
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
                {!!event.evidence?.length && <div className="mt-2"><LiveEvidenceGallery urls={event.evidence} /></div>}
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
            {action === "END_BY_KOL" && <p className="mb-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#7D715E]">Xác nhận kết thúc phiên? Phát sóng và voucher Live sẽ dừng; đơn mới không được cộng thưởng Live. Đơn đã đặt tiếp tục được xử lý theo điều kiện đã ghi nhận.</p>}
            {action === "SHOP_END" && <p className="mb-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#7D715E]">Shop chủ động kết thúc phiên. Bắt buộc chọn lý do, ghi giải trình và cung cấp bằng chứng. Hồ sơ được gửi Admin; KOL được thông báo để gửi giải trình đối chiếu. Đơn đã đặt giữ nguyên điều kiện đã ghi nhận.</p>}
            {["END_BY_KOL", "REQUEST_END", "EMERGENCY_STOP", "SHOP_END"].includes(action) && (
              <label className="mb-3 block text-xs text-[#7D715E]">
                Lý do bắt buộc
                <select
                  className={`${field} mt-1`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {Object.entries(reasons).filter(([value]) => action !== "END_BY_KOL" || !["KOL_VIOLATION", "OUT_OF_STOCK"].includes(value)).map(([value, title]) => (
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
                required
                minLength={10}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả sự việc, lý do và căn cứ đối chiếu…"
              />
            </label>
            <p className="mt-1 text-xs text-[#7D715E]">Vui lòng tự nhập lý do cụ thể, tối thiểu 10 ký tự. Không chấp nhận nội dung chỉ có khoảng trắng.</p>
            {["END_BY_KOL", "COMPLAIN", "EXPLAIN", "APPEAL", "SHOP_END", "EMERGENCY_STOP", "KOL_EXPLAIN"].includes(action) && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-[#1A1612]">{action === "END_BY_KOL" ? "Ảnh / bằng chứng kèm theo (không bắt buộc)" : "Ảnh / bằng chứng đối chiếu"}</p>
                {action === "END_BY_KOL" && <p className="text-xs leading-relaxed text-[#7D715E]">Bạn có thể đính kèm ảnh về sự cố hoặc việc đột xuất. Lý do và bằng chứng sẽ được lưu trong hồ sơ, thông báo cho Shop và Admin để xem xét.</p>}
                <div className="flex gap-2">
                  <input
                    className={field}
                    value={link}
                    disabled={busy || uploading}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Liên kết bằng chứng https://…"
                  />
                  <button type="button" className={button} disabled={busy || uploading} onClick={addLink}>
                    Thêm
                  </button>
                </div>
                <LiveEvidenceAttachments evidence={evidence} setEvidence={setEvidence} uploading={uploading} onUploadingChange={setUploading} disabled={busy} />
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
                disabled={busy || uploading || message.trim().length < 10}
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
