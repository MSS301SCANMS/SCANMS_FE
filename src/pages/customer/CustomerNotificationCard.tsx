import type { MouseEvent } from 'react';
import { ArrowRight, Bell, Check, CheckCheck, Clock3, Loader2, Package, Ticket } from 'lucide-react';
import type { AppNotification, NotificationCategory } from '../../services/notifications.service';

type SpecificCategory = Exclude<NotificationCategory, 'ALL'>;
interface CustomerNotificationCardProps {
  item: AppNotification;
  category: SpecificCategory;
  busy: boolean;
  onOpen: () => void;
  onMarkRead: (event: MouseEvent<HTMLButtonElement>) => void;
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
const dateFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const categoryInfo = {
  ORDER: { label: 'Đơn hàng', action: 'Xem đơn mua', icon: Package },
  PROMOTION: { label: 'Ưu đãi', action: 'Xem ưu đãi', icon: Ticket },
  SYSTEM: { label: 'SCANMS', action: 'Xem chi tiết', icon: Bell },
};

export function CustomerNotificationCard({ item, category, busy, onOpen, onMarkRead }: CustomerNotificationCardProps) {
  const { label, action, icon: Icon } = categoryInfo[category];
  const date = new Date(item.createdAt);
  const validDate = Number.isFinite(date.getTime());
  const references = [
    ['Mã đơn', item.data?.orderSn],
    ['Vận đơn', item.data?.trackingNumber],
    ['Mã ưu đãi', item.data?.voucherCode],
  ].filter(([, value]) => (typeof value === 'string' && value.trim()) || typeof value === 'number');

  return (
    <article className="customer-notification-card" data-notification-id={item.id} data-read={item.isRead}
      aria-labelledby={`customer-notification-title-${item.id}`}>
      <div className="customer-notification-main">
        <span className="customer-notification-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.65} /></span>
        <div className="customer-notification-content">
          <div className="customer-notification-meta">
            <span className="customer-notification-category">{label}</span>
            {item.isRead ? (
              <span className="customer-notification-read"><Check size={12} aria-hidden="true" />Đã đọc</span>
            ) : (
              <span className="customer-notification-unread"><i aria-hidden="true" />Chưa đọc</span>
            )}
          </div>
          <h3 id={`customer-notification-title-${item.id}`}>
            <button type="button" onClick={onOpen}>{item.title}</button>
          </h3>
          <p className="customer-notification-message">{item.message}</p>
          {references.length > 0 && <div className="customer-notification-references">
            {references.map(([name, value]) => <span key={name}>{name}: <strong>{value}</strong></span>)}
          </div>}
        </div>
      </div>
      <div className="customer-notification-footer">
        {validDate && <time className="customer-notification-time" dateTime={item.createdAt}
          aria-label={`${timeFormat.format(date)}, ngày ${dateFormat.format(date)}`}>
          <Clock3 size={13} aria-hidden="true" />
          <span>{timeFormat.format(date)}</span><span aria-hidden="true">·</span><span>{dateFormat.format(date)}</span>
        </time>}
        <div className="customer-notification-actions">
          {!item.isRead && <button type="button" className="customer-notification-mark" disabled={busy}
            aria-busy={busy} aria-label={`Đánh dấu đã đọc: ${item.title}`} title="Đánh dấu đã đọc" onClick={onMarkRead}>
            {busy ? <Loader2 size={16} className="customer-notification-spinner" aria-hidden="true" /> : <CheckCheck size={16} aria-hidden="true" />}
            <span>Đánh dấu đã đọc</span>
          </button>}
          <button type="button" className="customer-notification-open" onClick={onOpen}>
            <span>{action}</span><ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
