import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  DollarSign,
  ShieldAlert,
  Info,
  Clock,
  Loader2,
  Radio,
} from 'lucide-react';
import { notificationsService, type AppNotification } from '../../services/notifications.service';
import { authService } from '../../services/auth.service';
import { liveBroadcastService } from '../../services/liveBroadcast';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDER' | 'PROMOTION' | 'SYSTEM'>('ALL');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Phát âm thanh chime nhẹ khi có thông báo mới (Web Audio API)
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const getLiveNotifications = (): AppNotification[] => {
    const broadcasts = liveBroadcastService.getAllBroadcasts();
    return broadcasts.map((b) => ({
      id: b.id,
      userId: 'current',
      title: b.title,
      message: `${b.storeName} • ${b.creatorName}: Đang livestream trực tiếp trợ giá cực sốc! ${b.discountText || 'Vào xem ngay'}`,
      type: 'LIVE_SESSION_BROADCAST',
      data: { sessionId: b.sessionId, liveUrl: b.liveUrl },
      isRead: !!b.isRead,
      createdAt: b.createdAt,
    }));
  };

  const fetchUnreadCount = async () => {
    const unreadBroadcasts = liveBroadcastService.getUnreadBroadcasts().length;
    const user = authService.getCurrentUser();
    let backendUnread = 0;
    if (user) {
      backendUnread = await notificationsService.getUnreadCount();
    }
    const totalCount = backendUnread + unreadBroadcasts;
    setUnreadCount((prev) => {
      if (totalCount > prev && prev > 0) {
        playNotificationChime();
      }
      return totalCount;
    });
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      let backendItems: AppNotification[] = [];
      let backendUnread = 0;

      if (user) {
        try {
          const res = await notificationsService.getNotifications(activeTab, 1, 20);
          backendItems = res.items || [];
          backendUnread = res.unreadCount || 0;
        } catch {
          backendItems = [];
        }
      }

      // Merge broadcast notifications for ALL and PROMOTION tabs
      const liveItems = getLiveNotifications();
      const now = Date.now();
      // Lọc bỏ bất kỳ thông báo phiên live nào từ backend mà đã hết thời gian endsAt hoặc đã kết thúc
      const validBackendItems = backendItems.filter((item) => {
        if (item.type.startsWith('LIVE_') || item.type.includes('LIVE')) {
          if (item.type === 'LIVE_SESSION_ENDED') {
            return false;
          }
          const endsAt = (item.data as any)?.endsAt;
          if (endsAt) {
            const endMs = new Date(endsAt).getTime();
            if (Number.isFinite(endMs) && endMs <= now) {
              return false;
            }
          }
          const createdMs = new Date(item.createdAt).getTime();
          if (item.type === 'LIVE_SESSION_STARTED' && Number.isFinite(createdMs) && (now - createdMs > 2 * 3600 * 1000)) {
            return false;
          }
        }
        return true;
      });

      // Tránh trùng lặp nếu cả backend lẫn local broadcast đều có cùng sessionId
      const liveSessionIds = new Set(liveItems.map((i) => i.data?.sessionId).filter(Boolean));
      const deduplicatedBackend = validBackendItems.filter((item) => {
        if (item.type === 'LIVE_GOVERNANCE') return true;
        if (item.type.startsWith('LIVE_') || item.type.includes('LIVE')) {
          const sId = (item.data as any)?.sessionId;
          if (sId && liveSessionIds.has(sId)) {
            return false;
          }
        }
        return true;
      });

      let combined: AppNotification[] = [];

      if (activeTab === 'ALL') {
        combined = [...liveItems, ...deduplicatedBackend];
      } else if (activeTab === 'PROMOTION') {
        combined = [...liveItems, ...deduplicatedBackend.filter((i) => i.type.includes('PROMOTION') || i.type.includes('COUPON'))];
      } else {
        combined = deduplicatedBackend;
      }

      setNotifications(combined);
      const unreadBroadcasts = liveBroadcastService.getUnreadBroadcasts().length;
      setUnreadCount(backendUnread + unreadBroadcasts);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Tự động kiểm tra unread định kỳ mỗi 10 giây (khi hết giờ kết thúc phiên live, chuông lập tức hạ số)
    const interval = setInterval(fetchUnreadCount, 10000);

    // Lắng nghe sự kiện livestream phát sóng thời gian thực cho mọi Role
    const handleNewLive = () => {
      playNotificationChime();
      void fetchNotifications();
      void fetchUnreadCount();
    };

    const handleLiveRead = () => {
      void fetchNotifications();
      void fetchUnreadCount();
    };

    window.addEventListener('scanms-new-live-broadcast', handleNewLive);
    window.addEventListener('scanms-live-broadcast-read', handleLiveRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scanms-new-live-broadcast', handleNewLive);
      window.removeEventListener('scanms-live-broadcast-read', handleLiveRead);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, activeTab]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    liveBroadcastService.markAllAsRead();
    try {
      await notificationsService.markAllAsRead();
    } catch {}
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      if (notif.type.startsWith('LIVE_') || notif.type.includes('LIVE')) {
        liveBroadcastService.markAsRead(notif.id);
      } else {
        try {
          await notificationsService.markAsRead(notif.id);
        } catch {}
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);

    if (notif.type === 'LIVE_GOVERNANCE') {
      const role = authService.getCurrentUser()?.role;
      const sessionQuery = `session=${encodeURIComponent(notif.data?.sessionId || '')}`;
      if (role === 'COLLABORATOR') navigate(`/collaborator/live-sessions?${sessionQuery}`);
      else if (role === 'SHOP_MANAGER') navigate(`/merchant/promotions?tab=live-sessions&${sessionQuery}`);
      else if (role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER') navigate(`/admin/affiliate-oversight?tab=live-sessions&${sessionQuery}`);
      return;
    }

    // 1. Live stream broadcast notification -> dẫn thẳng vào phòng livestream
    if (notif.type.startsWith('LIVE_') || notif.type.includes('LIVE')) {
      const liveUrl = notif.data?.liveUrl;
      if (liveUrl) {
        if (liveUrl.startsWith('http')) {
          try {
            const urlObj = new URL(liveUrl);
            if (urlObj.origin === window.location.origin) {
              navigate(urlObj.pathname + urlObj.search);
              return;
            } else {
              window.open(liveUrl, '_blank');
              return;
            }
          } catch {
            window.open(liveUrl, '_blank');
            return;
          }
        } else if (liveUrl.startsWith('/')) {
          navigate(liveUrl);
          return;
        }
      }
      const sessionId = notif.data?.sessionId || notif.data?.id || 'demo';
      navigate(`/live/${sessionId}`);
      return;
    }

    // 2. Deep-link routing based on notification type
    const user = authService.getCurrentUser();
    const userRole = user?.role;

    if (notif.type.startsWith('ORDER_') || notif.type.startsWith('DISPUTE_')) {
      if (userRole === 'CUSTOMER') {
        navigate('/customer/orders');
      } else if (userRole === 'SHOP_MANAGER') {
        navigate('/merchant/orders');
      } else if (userRole === 'SYSTEM_ADMIN' || userRole === 'SYSTEM_MANAGER') {
        navigate('/admin/disputes');
      }
    } else if (notif.type.startsWith('COMMISSION_') || notif.type.startsWith('PAYOUT_')) {
      if (userRole === 'COLLABORATOR') {
        navigate('/collaborator/wallet');
      } else if (userRole === 'SHOP_MANAGER') {
        navigate('/merchant/payouts');
      }
    } else if (notif.type.startsWith('KYC_')) {
      if (userRole === 'SYSTEM_ADMIN' || userRole === 'SHOP_MANAGER') {
        navigate('/merchant/kyc-approval');
      } else {
        navigate('/collaborator/profile?tab=kyc');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'LIVE_GOVERNANCE') return <ShieldAlert className="h-4 w-4 text-[#B88E4F]" />;
    if (type.startsWith('LIVE_') || type.includes('LIVE')) {
      return (
        <div className="relative">
          <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </div>
      );
    }
    if (type.startsWith('ORDER_')) {
      return <ShoppingBag className="w-4 h-4 text-[#C59B58]" />;
    }
    if (type.startsWith('COMMISSION_') || type.startsWith('PAYOUT_')) {
      return <DollarSign className="w-4 h-4 text-[#059669]" />;
    }
    if (type.startsWith('DISPUTE_')) {
      return <ShieldAlert className="w-4 h-4 text-[#DC2626]" />;
    }
    return <Info className="w-4 h-4 text-[#B88E4F]" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#B88E4F] transition-all cursor-pointer shadow-2xs group flex items-center justify-center active:scale-95"
        title="Trung tâm thông báo SCANMS"
        aria-label={`Thông báo: ${unreadCount} chưa đọc`}
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-[#FAF8F5] border-b border-[#EAE4D7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#1A1612]">Thông Báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C59B58]/15 text-[#8C6226] text-[10px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#B88E4F] hover:text-[#8C6226] flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-[#EAE4D7] bg-white px-2 pt-2 gap-1 text-xs">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ORDER', label: 'Đơn hàng' },
                { id: 'PROMOTION', label: 'Livestream & Deal' },
                { id: 'SYSTEM', label: 'Hệ thống' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 text-center font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#EAE4D7]/60">
            {loading ? (
              <div className="p-8 text-center text-[#7D715E]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C59B58]" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#7D715E]">
                <Bell className="w-8 h-8 mx-auto mb-2 text-[#EAE4D7]" />
                <p className="text-xs font-bold text-[#1A1612]">Không có thông báo nào</p>
                <p className="text-[11px] mt-0.5">Bạn đã cập nhật toàn bộ hoạt động mới nhất.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isLive = n.type.startsWith('LIVE_') || n.type.includes('LIVE');

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start gap-3 relative group ${
                      isLive
                        ? !n.isRead
                          ? 'bg-rose-50/40 border-l-4 border-l-rose-500'
                          : 'bg-white hover:bg-rose-50/20'
                        : !n.isRead
                        ? 'bg-[#FBF5EB]/50'
                        : 'bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl shadow-xs flex items-center justify-center shrink-0 mt-0.5 ${
                      isLive
                        ? 'bg-rose-50 border border-rose-200 text-rose-600'
                        : 'bg-white border border-[#EAE4D7]'
                    }`}>
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-black text-[#1A1612] truncate group-hover:text-[#B88E4F] transition-colors">
                            {n.title}
                          </h4>
                        </div>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          !n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#C59B58] shrink-0" />
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-[#7D715E] line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-[#A89D8B] font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(n.createdAt)}</span>
                        </div>
                        {isLive && (
                          <span className="text-[10.5px] font-extrabold text-rose-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Vào xem ngay →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EAE4D7] text-center">
            <span className="text-[10px] text-[#7D715E]">
              Thông báo trực tiếp • Nền tảng tiếp thị liên kết SCANMS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
