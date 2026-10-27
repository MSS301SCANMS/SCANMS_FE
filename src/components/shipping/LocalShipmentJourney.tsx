import { useState } from 'react';
import { Check, Clock, Copy, Loader2, PackageCheck, PackageOpen, Truck, X } from 'lucide-react';
import { trackingDisplayCode } from '../../utils/ghn-tracking-code';

const steps = [
  { status: 'shipped', title: 'Shop đã gửi hàng', icon: PackageOpen },
  { status: 'in_transit', title: 'Đang vận chuyển', icon: Truck },
  { status: 'delivered', title: 'Giao thành công', icon: PackageCheck },
];
const formatTime = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '';

export function LocalShipmentJourney({ code, tracking, busy, error, onClose }: {
  code: string;
  tracking: { status: string; timeline: { status: string; time: string | null }[] } | null;
  busy: boolean;
  error: string;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const index = steps.findIndex(step => step.status === tracking?.status);
  const current = steps[index];
  const StatusIcon = current?.icon || Clock;
  return <section className="local-shipment" aria-label="Hành trình giao hàng mô phỏng">
    <header className="local-shipment__header">
      <span className="local-shipment__symbol"><Truck size={20} aria-hidden="true" /></span>
      <div><h4>Thông tin vận chuyển</h4><span className="local-shipment__badge">Mô phỏng</span></div>
      {onClose && <button type="button" onClick={onClose} aria-label="Đóng hành trình" className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#8C7D6B] hover:bg-[#FFFCF7]"><X size={18} /></button>}
    </header>
    <div className="local-shipment__code"><span>Mã vận đơn</span>
      <button type="button" title="Sao chép mã vận đơn đầy đủ" onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true); setCopyError(''); }
        catch { setCopyError('Chưa sao chép được mã vận đơn. Vui lòng thử lại.'); }
      }}><code>{trackingDisplayCode(code)}</code>{copied ? <Check size={14} /> : <Copy size={14} />}<span className="sr-only">{copied ? 'Đã sao chép' : 'Sao chép mã vận đơn'}</span></button>
    </div>
    <div className={`local-shipment__status ${index === 2 ? 'is-delivered' : ''}`} role="status">
      {busy && !tracking ? <Loader2 size={22} className="animate-spin" /> : <StatusIcon size={22} />}
      <div><span>Trạng thái hiện tại</span><strong>{current?.title || (error ? 'Chưa tải được hành trình' : 'Đang tải hành trình…')}</strong></div>
    </div>
    <ol className="local-shipment__steps" aria-label="Các mốc giao hàng">
      {steps.map((step, position) => {
        const Icon = step.icon;
        const time = formatTime(tracking?.timeline.find(event => event.status === step.status)?.time);
        return <li key={step.status} className={position <= index ? 'is-confirmed' : ''} aria-current={position === index ? 'step' : undefined}>
          <span className="local-shipment__step-icon">{position < index ? <Check size={15} /> : <Icon size={15} />}</span>
          <strong>{step.title}</strong><small>{time || (position < index ? 'Đã hoàn tất' : position === index ? 'Hiện tại' : 'Chờ xử lý')}</small>
        </li>;
      })}
    </ol>
    {(error || copyError) && <p className="local-shipment__error" role="alert">{error || copyError}</p>}
  </section>;
}
