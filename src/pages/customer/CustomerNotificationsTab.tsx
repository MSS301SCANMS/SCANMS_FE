import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Loader2,
  Package,
  Ticket,
} from 'lucide-react';
import type {
  AppNotification,
  NotificationCategory,
} from '../../services/notifications.service';
import { CustomerNotificationCard } from './CustomerNotificationCard';
import './CustomerNotificationsTab.css';

type SpecificCategory = Exclude<NotificationCategory, 'ALL'>;
interface CustomerNotificationsTabProps {
  items: AppNotification[];
  loading: boolean;
  category: NotificationCategory;
  unreadCount: number;
  categoryUnread: Record<SpecificCategory, number>;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onSelectCategory: (category: NotificationCategory) => void;
  onOpen: (notification: AppNotification) => Promise<void>;
  onMarkRead: (
    event: MouseEvent,
    notification: AppNotification,
  ) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onLoadMore: () => void;
  onRetry: () => void;
  getCategory: (type: string) => SpecificCategory;
}

const categories = [
  { key: 'ALL', label: 'Tất cả', icon: Bell },
  { key: 'ORDER', label: 'Đơn hàng', icon: Package },
  { key: 'PROMOTION', label: 'Ưu đãi', icon: Ticket },
  { key: 'SYSTEM', label: 'SCANMS', icon: Bell },
] as const;
const headings = {
  ALL: {
    title: 'Thông báo',
  },
  ORDER: {
    title: 'Thông báo đơn hàng',
  },
  PROMOTION: {
    title: 'Ưu đãi & khuyến mãi',
  },
  SYSTEM: {
    title: 'Cập nhật SCANMS',
  },
};

export function CustomerNotificationsTab({
  items,
  loading,
  category,
  unreadCount,
  categoryUnread,
  error,
  hasMore,
  loadingMore,
  onSelectCategory,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  onRetry,
  getCategory,
}: CustomerNotificationsTabProps) {
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<string[]>([]);
  const heading = headings[category] || headings.ALL;

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setMarkingAll(false);
    }
  };
  const markRead = async (event: MouseEvent, item: AppNotification) => {
    setMarkingIds((ids) => [...ids, item.id]);
    try {
      await onMarkRead(event, item);
    } finally {
      setMarkingIds((ids) => ids.filter((id) => id !== item.id));
    }
  };

  return (
    <section
      className="@container/notifications grid gap-[14px] w-full max-w-[1040px] min-w-0 text-left text-[#1A1612] max-md:pb-[64px]"
      aria-label={heading.title}
    >
      <div className="flex w-full min-w-0 items-center flex-wrap gap-[12px] p-[10px_12px] @max-[449px]:p-[8px] border border-[#EAE4D7] rounded-[12px] bg-white shadow-[0_2px_6px_rgba(35,29,21,0.02)]">
        <nav className="grid flex-1 min-w-0 grid-cols-4 @max-[699px]:basis-full @max-[449px]:grid-cols-2 gap-[6px]" aria-label="Lọc thông báo">
          {categories.map(({ key, label, icon: Icon }) => {
            const unread = key === 'ALL' ? unreadCount : categoryUnread[key];
            const isActive = category === key;
            return (
              <button
                type="button"
                key={key}
                aria-pressed={isActive}
                className={`inline-flex items-center justify-center min-w-0 gap-[6px] min-h-[40px] px-[10px] @max-[449px]:px-[6px] py-[8px] border rounded-[8px] text-[12px] font-[500] leading-[1.4] cursor-pointer transition focus-visible:outline-2 focus-visible:outline-[#B88E4F] focus-visible:outline-offset-2 ${isActive ? 'bg-[#FBF5EB] border-[#EEDFC6] text-[#1A1612] font-[600]' : 'bg-white border-transparent text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'}`}
                onClick={() => onSelectCategory(key)}
              >
                <Icon size={14} className={isActive ? 'text-[#B88E4F]' : ''} />
                <span>{label}</span>
                {unread > 0 && <span className="min-w-[16px] px-[4px] py-[1px] rounded-[5px] bg-[#F3EFE6] text-[#B88E4F] text-center text-[9px] leading-[1.4]">{unread}</span>}
              </button>
            );
          })}
        </nav>
        {unreadCount > 0 && (
          <button
            type="button"
            className="ml-auto inline-flex items-center justify-center shrink-0 gap-[6px] min-h-[40px] px-[12px] py-[8px] border border-[#EEDFC6] rounded-[8px] bg-[#FAF8F5] text-[#1A1612] text-[12px] font-[500] whitespace-nowrap cursor-pointer hover:border-[#C59B58] hover:bg-[#FBF5EB] transition disabled:opacity-55 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-[#B88E4F] focus-visible:outline-offset-2"
            disabled={markingAll || loading}
            onClick={() => void markAll()}
          >
            {markingAll ? (
              <Loader2 size={14} className="animate-spin text-[#B88E4F]" aria-hidden="true" />
            ) : (
              <CheckCheck size={14} className="text-[#B88E4F]" aria-hidden="true" />
            )}
            Đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-[10px] py-[32px] px-[12px] border border-[#EAE4D7] rounded-[12px] bg-white text-[#B88E4F] text-center" role="status">
          <Loader2 size={26} className="animate-spin" />
          <p className="m-0 text-[11px] text-[#7D715E] leading-[1.6]">Đang tải thông báo…</p>
        </div>
      ) : error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-[10px] py-[32px] px-[12px] border border-[#EAE4D7] rounded-[12px] bg-white text-center" role="alert">
          <Bell size={25} className="text-[#DC2626]" />
          <p className="m-0 text-[11px] text-[#7D715E] leading-[1.6]">{error}</p>
          <button type="button" className="inline-flex items-center justify-center gap-[6px] p-[7px_10px] border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#1A1612] text-[11px] font-[500] leading-[1.4] hover:border-[#C59B58] transition cursor-pointer" onClick={onRetry}>
            Thử tải lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-[10px] py-[32px] px-[12px] border border-[#EAE4D7] rounded-[12px] bg-white text-center">
          <span className="grid place-items-center shrink-0 w-[40px] h-[40px] rounded-[11px] bg-[#FBF5EB] text-[#B88E4F]">
            <Bell size={24} />
          </span>
          <h2 className="m-0 font-inherit text-[15px] font-[600] text-[#1A1612]">Chưa có thông báo</h2>
          <p className="m-0 text-[11px] text-[#7D715E] leading-[1.6] break-words">Các cập nhật mới trong mục này sẽ xuất hiện tại đây.</p>
          {category === 'ORDER' && (
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-[6px] min-h-[30px] p-[6px_9px] border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#1A1612] text-[10px] font-[500] hover:border-[#C59B58] transition cursor-pointer mt-1 no-underline">
              Khám phá sản phẩm <ArrowRight size={13} className="text-[#B88E4F]" />
            </Link>
          )}
          {category === 'PROMOTION' && (
            <Link to="/customer/vouchers" className="inline-flex items-center justify-center gap-[6px] min-h-[30px] p-[6px_9px] border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#1A1612] text-[10px] font-[500] hover:border-[#C59B58] transition cursor-pointer mt-1 no-underline">
              Xem kho voucher <ArrowRight size={13} className="text-[#B88E4F]" />
            </Link>
          )}
        </div>
      ) : (
        <div className="customer-notification-list">
          {items.map((item) => (
            <CustomerNotificationCard key={item.id} item={item}
              category={getCategory(item.type)} busy={markingIds.includes(item.id) || markingAll}
              onOpen={() => void onOpen(item)}
              onMarkRead={(event) => void markRead(event, item)} />
          ))}
        </div>
      )}
      {!loading && items.length > 0 && error && (
        <div className="flex items-center justify-between flex-wrap gap-[8px] p-[10px_12px] border border-[#EAE4D7] rounded-[9px] bg-white text-[#7D715E] text-[11px]" role="alert">
          <span className="break-words">{error}</span>
          <button type="button" className="inline-flex items-center justify-center gap-[6px] p-[7px_10px] border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#DC2626] text-[11px] font-[500] leading-[1.4] hover:border-[#C59B58] cursor-pointer" onClick={onRetry}>Thử lại</button>
        </div>
      )}
      {!loading && items.length > 0 && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-[6px] min-h-[32px] p-[7px_10px] border border-[#EEDFC6] rounded-[7px] bg-white text-[#1A1612] text-[11px] font-[500] leading-[1.4] hover:border-[#C59B58] transition cursor-pointer disabled:opacity-55 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-[#B88E4F] focus-visible:outline-offset-2"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore && <Loader2 size={14} className="animate-spin text-[#B88E4F]" />}
            {loadingMore ? 'Đang tải…' : 'Xem thông báo cũ hơn'}
          </button>
        </div>
      )}
    </section>
  );
}
