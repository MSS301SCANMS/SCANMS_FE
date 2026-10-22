import { useEffect, useRef, useState } from 'react';
import { Truck, RefreshCw, Phone, Check, Clock, PackageCheck, UserRound, ChevronDown } from 'lucide-react';
import './GhnTrackingTimeline.css';
import api from '../../services/api';
import { shippingService } from '../../services/shipping.service';
import { GHN_MILESTONES } from '../../utils/ghn-tracking';

interface TrackingEvent {
  status: string; title: string; time: string | null;
  warehouse?: string | null; shipperName?: string | null; shipperPhone?: string | null;
}
interface Tracking {
  orderCode: string; status: string; statusText: string; environment?: 'LIVE' | 'TEST';
  trackingError?: 'ORDER_NOT_FOUND' | null; expectedDeliveryTime: string | null;
  shipperName: string | null; shipperPhone: string | null; timeline: TrackingEvent[];
  isStale?: boolean; lastCheckedAt?: string | null; lastKnownStatusText?: string | null;
  isSimulation?: boolean; nextEventAt?: string | null;
  shipperPhoneDisplay?: string | null; shipperCanCall?: boolean;
}
const formatTime = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : null;
const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;

export function GhnTrackingTimeline({ orderCode, sampleRequestId, onSampleDelivered, onTrackingStatusChange, environment }: {
  orderCode: string; sampleRequestId?: string; onSampleDelivered?: () => void;
  onTrackingStatusChange?: (status: string, isFresh: boolean) => void;
  environment?: 'LIVE' | 'TEST';
}) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(30000);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [serverClockOffset, setServerClockOffset] = useState(0);
  const deliveredCallback = useRef(onSampleDelivered);
  deliveredCallback.current = onSampleDelivered;
  const trackingStatusCallback = useRef(onTrackingStatusChange);
  trackingStatusCallback.current = onTrackingStatusChange;
  const syncedSample = useRef('');
  const previousCode = useRef('');

  useEffect(() => {
    const clock = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    let active = true, inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let simulation = false;
    const controller = new AbortController();
    const trackingKey = `${environment || 'AUTO'}:${orderCode}:${sampleRequestId || ''}`;
    if (previousCode.current !== trackingKey) { setTracking(null); previousCode.current = trackingKey; syncedSample.current = ''; }
    setError('');
    const fetchTracking = async () => {
      if (!active || inFlight || document.hidden) return;
      clearTimeout(timer); inFlight = true; setBusy(true);
      let terminal = false;
      let pollInterval = simulation ? 5000 : 30000;
      try {
        const data = await shippingService.trackOrder(orderCode);
        if (!data || typeof data.status !== 'string' || !Array.isArray(data.timeline)) throw new Error('Invalid tracking response');
        if (!active) return;
        setTracking(data); setError('');
        const serverNow = Date.parse(data.lastCheckedAt || '');
        setServerClockOffset(Number.isFinite(serverNow) ? serverNow - Date.now() : 0);
        trackingStatusCallback.current?.(data.status, !data.isStale);
        simulation = Boolean(data.isSimulation);
        pollInterval = simulation ? 5000 : 30000;
        const nextEvent = Date.parse(data.nextEventAt || '');
        if (simulation && Number.isFinite(nextEvent) && Number.isFinite(serverNow)) {
          // Refresh at the next saved milestone, without trusting the device clock
          // or marking a delivery complete before the API confirms it.
          pollInterval = Math.min(pollInterval, Math.max(1000, nextEvent - serverNow + 150));
        }
        terminal = !data.isStale && ['delivered', 'returned', 'cancel', 'lost', 'damage', 'scrap'].includes(data.status);
        if (sampleRequestId && environment !== 'TEST' && data.environment !== 'TEST' && data.status === 'delivered' && !data.isStale && syncedSample.current !== sampleRequestId) {
          try {
            const response: any = await api.post(`/shipping/ghn/sync-sample/${encodeURIComponent(sampleRequestId)}`);
            const receipt = response?.data?.data || response?.data || response;
            if (active && ['RECEIVED', 'VIDEO_SUBMITTED', 'REVISION_REQUIRED', 'OVERDUE', 'COMPLETED'].includes(receipt?.status)) {
              syncedSample.current = sampleRequestId; deliveredCallback.current?.();
            } else if (active) {
              terminal = false;
              setError('GHN báo đã giao; hệ thống đang xác minh thời điểm nhận mẫu. Hạn video chưa bắt đầu.');
            }
          } catch { terminal = false; if (active) setError('Đã tải hành trình; chưa đồng bộ được xác nhận nhận mẫu. Hệ thống sẽ thử lại.'); }
        }
      } catch {
        if (active) setError('Chưa cập nhật được hành trình từ GHN. Dữ liệu đang hiển thị có thể chưa phải mới nhất.');
      } finally {
        inFlight = false;
        if (active) {
          setBusy(false);
          setLastPollAt(Date.now());
          setPollIntervalMs(pollInterval);
          if (!terminal) timer = setTimeout(fetchTracking, pollInterval);
        }
      }
    };
    const onVisible = () => { if (!document.hidden) void fetchTracking(); };
    document.addEventListener('visibilitychange', onVisible);
    void fetchTracking();
    return () => { active = false; clearTimeout(timer); controller.abort(); document.removeEventListener('visibilitychange', onVisible); };
  }, [orderCode, sampleRequestId, reload, environment]);

  const milestones = tracking?.isSimulation
    ? [{ title: 'Chờ lấy hàng', statuses: ['ready_to_pick', 'picking'] }, ...GHN_MILESTONES]
    : [{ title: 'Chờ bưu tá lấy hàng tại Shop', statuses: ['ready_to_pick', 'picking', 'money_collect_picking'] }, ...GHN_MILESTONES];
  const pending = tracking?.status === 'unavailable';
  const terminalStatuses = ['delivered', 'returned', 'cancel', 'lost', 'damage', 'scrap'];
  const refreshCountdown = tracking && lastPollAt !== null &&
    !(terminalStatuses.includes(tracking.status) && !tracking.isStale)
    ? Math.max(0, Math.ceil((lastPollAt + pollIntervalMs - clockNow) / 1000))
    : null;
  const nextEventTime = Date.parse(tracking?.nextEventAt || '');
  const milestoneCountdown = tracking?.isSimulation && !tracking.isStale && !terminalStatuses.includes(tracking.status) && Number.isFinite(nextEventTime)
    ? Math.max(0, Math.ceil((nextEventTime - (clockNow + serverClockOffset)) / 1000))
    : null;
  const refreshLabel = busy
    ? <>Đang làm mới…</>
    : milestoneCountdown !== null
      ? milestoneCountdown > 0
        ? <>Mốc tiếp theo sau <strong>{milestoneCountdown}</strong> giây</>
        : <>Đang chờ cập nhật mốc mới…</>
    : refreshCountdown !== null
      ? <>Kiểm tra GHN sau <strong>{refreshCountdown}</strong> giây</>
      : <>{tracking?.isSimulation ? 'Đã hoàn tất' : 'GHN đã kết thúc hành trình'}</>;
  const trackingNote = !tracking
    ? ''
    : tracking.isStale || error
      ? 'Dữ liệu có thể chưa cập nhật'
      : tracking.isSimulation && tracking.status !== 'delivered'
        ? 'Mỗi mốc cách nhau 1 phút; tự cập nhật khi đến mốc'
        : '';
  if (orderCode.startsWith('SIM-')) return <section className="rounded-xl border border-[#EAE4D7] bg-white p-4 text-sm" aria-label="Hành trình giao hàng mô phỏng">
    <strong>Giao hàng mô phỏng nội bộ</strong><p className="mt-2 break-all">{orderCode}</p>
    <p className="mt-2">{({ shipped: 'Shop đã gửi hàng', in_transit: 'Đang vận chuyển mô phỏng', delivered: 'Đã giao hàng mô phỏng' } as Record<string, string>)[tracking?.status || ''] || 'Đang tải…'}</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" className="mt-2 underline" disabled={busy} onClick={() => setReload(value => value + 1)}>Làm mới</button>
  </section>;
  return (
    <section className="ghn-journey" aria-label={`Hành trình GHN ${orderCode}`}>
      <div className="ghn-journey__header">
        <span className="ghn-journey__carrier-icon"><Truck size={21} aria-hidden="true" /></span>
        <div className="ghn-journey__identity"><strong>Giao Hàng Nhanh</strong><p>Mã vận đơn <code>{orderCode}</code></p></div>
        <button type="button" disabled={busy} onClick={() => setReload(value => value + 1)} className="ghn-journey__refresh" aria-label={busy ? 'Đang cập nhật' : 'Làm mới'} title="Cập nhật hành trình"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /><span>Làm mới</span></button>
      </div>
      {(error || pending || tracking?.isStale) && <div role="status" className="mt-2.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] p-2.5 text-[11px] leading-relaxed text-[#7D715E]">
        {tracking?.trackingError === 'ORDER_NOT_FOUND' ? 'GHN không tìm thấy vận đơn này. Vui lòng liên hệ Shop kiểm tra mã vận đơn.' : error || 'GHN chưa trả dữ liệu mới. Lịch sử lưu trước đó chỉ dùng để tham khảo.'}
        {sampleRequestId && <p className="mt-1">Chỉ xác nhận nhận mẫu và bắt đầu hạn nộp video sau khi kiểm tra giao thành công với GHN.</p>}
      </div>}
      {!tracking && !error && <p className="mt-3 text-[#7D715E]">Đang tra cứu GHN...</p>}
      {tracking && <div aria-live="polite">
        <div className="ghn-journey__status">
          <span className="ghn-journey__status-icon">{tracking.status === 'delivered' && !pending ? <PackageCheck size={25} /> : <Truck size={25} />}</span>
          <div><span className="ghn-journey__caption">{tracking.isSimulation ? 'Trạng thái mô phỏng' : tracking.isStale || pending ? 'Trạng thái lưu trước đó' : 'Trạng thái bưu kiện'}</span><h4>{pending ? tracking.lastKnownStatusText || 'Chưa có trạng thái GHN' : tracking.statusText}</h4>
            {tracking.status === 'delivered'
              ? formatTime(tracking.timeline.find(event => event.status === 'delivered')?.time) && <p>Hoàn tất lúc {formatTime(tracking.timeline.find(event => event.status === 'delivered')?.time)}</p>
              : formatTime(tracking.expectedDeliveryTime) && <p>Dự kiến: {formatTime(tracking.expectedDeliveryTime)}</p>}
          </div>
        </div>
        <ol className="ghn-journey__steps" aria-label="Các mốc giao hàng">
          {milestones.map(stage => {
            const evidence = tracking.timeline.find(event => stage.statuses.includes(event.status));
            const current = !pending && stage.statuses.includes(tracking.status);
            const confirmed = Boolean(evidence || current);
            return <li key={stage.title} className={`ghn-journey__step ${confirmed ? 'is-confirmed' : ''} ${current ? 'is-current' : ''}`} aria-current={current ? 'step' : undefined}>
              <span className="ghn-journey__step-icon">{confirmed ? <Check size={13} /> : <Clock size={12} />}</span>
              <p className="ghn-journey__step-title">{stage.title}</p><span className="ghn-journey__step-time">{formatTime(evidence?.time) || (current ? tracking.isStale ? 'Trạng thái lưu trước đó' : tracking.isSimulation ? 'Trạng thái mô phỏng hiện tại' : 'Trạng thái hiện tại theo GHN' : evidence ? 'GHN chưa cung cấp thời gian' : tracking.isSimulation ? stage.statuses.includes('delivered') && formatTime(tracking.expectedDeliveryTime) ? `Dự kiến ${formatTime(tracking.expectedDeliveryTime)}` : 'Chờ đến mốc mô phỏng' : 'Chưa có xác nhận từ GHN')}</span>
            </li>;
          })}
        </ol>
        {(['delivering', 'money_collect_delivering'].includes(tracking.status) || (tracking.isSimulation && tracking.status === 'delivered')) && <div className="ghn-journey__driver">
          <span className="ghn-journey__avatar"><UserRound size={20} aria-hidden="true" /></span>
          <div className="ghn-journey__driver-info"><p className="ghn-journey__caption">{tracking.isSimulation ? 'Shipper mô phỏng' : 'Shipper phụ trách giao hàng'}</p><strong>{tracking.shipperName || 'GHN chưa cung cấp tên shipper'}</strong><p>{tracking.isSimulation ? tracking.shipperPhoneDisplay || '09xx xxx xxx' : tracking.shipperPhone || 'Đang chờ GHN cập nhật SĐT liên hệ.'}</p></div>
          {tracking.isSimulation ? <button type="button" disabled className="ghn-journey__call" aria-label="Gọi shipper" title="Số điện thoại mô phỏng, không hỗ trợ gọi"><Phone size={14} /><span>Gọi shipper</span></button> : tracking.shipperPhone ? <a href={phoneHref(tracking.shipperPhone)} className="ghn-journey__call" aria-label="Gọi shipper"><Phone size={14} /><span>Gọi shipper</span></a> : null}
        </div>}
        {tracking.timeline.length ? <details className="ghn-journey__history"><summary>Lịch sử chi tiết <span>{tracking.timeline.length} cập nhật<ChevronDown size={14} /></span></summary><ol className="mt-3 space-y-3 border-l border-[#EEDFC6] pl-4" aria-label="Lịch sử chi tiết">
          {tracking.timeline.map((event, index) => <li key={`${event.status}-${event.time || index}`} className="relative">
            <span className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-[#C59B58]" /><strong className="text-xs">{event.title}</strong>
            <p className="mt-1 text-xs text-[#7D715E]">{formatTime(event.time) || 'GHN chưa cung cấp thời gian'}{event.warehouse ? ` · ${event.warehouse}` : ''}</p>
            {(event.shipperName || event.shipperPhone) && <p className="mt-1 text-xs text-[#7D715E]">Shipper: {event.shipperName || 'Chưa có tên'}{event.shipperPhone && <> · <a className="text-[#8C6B32] underline" href={phoneHref(event.shipperPhone)}>{event.shipperPhone}</a></>}</p>}
          </li>)}
        </ol></details> : <p className="ghn-journey__empty">GHN chưa gửi thêm lịch sử. Các mốc phía dưới chỉ đổi khi GHN xác nhận trạng thái mới.</p>}
        <p className="ghn-journey__updated">
          <span>{formatTime(tracking.lastCheckedAt) ? `Cập nhật: ${formatTime(tracking.lastCheckedAt)}` : ''}{trackingNote ? `${formatTime(tracking.lastCheckedAt) ? ' · ' : ''}${trackingNote}` : ''}</span>
          <span className="ghn-journey__countdown" role="timer">{refreshLabel}</span>
        </p>
      </div>}
    </section>
  );
}
