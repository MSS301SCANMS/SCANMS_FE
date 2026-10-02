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
} from 'lucide-react';
import { notificationsService, type AppNotification } from '../../services/notifications.service';
import { authService } from '../../services/auth.service';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDER' | 'FINANCE' | 'SYSTEM'>('ALL');
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

  const fetchUnreadCount = async () => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const count = await notificationsService.getUnreadCount();
    setUnreadCount((prev) => {
      if (count > prev && prev > 0) {
        playNotificationChime();
      }
      return count;
    });
  };

  const fetchNotifications = async () => {
    const user = authService.getCurrentUser();
    if (!user) return;
    setLoading(true);
    try {
      const res = await notificationsService.getNotifications(activeTab, 1, 20);
      setNotifications(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
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
    await notificationsService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationsService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);

    // Deep-link routing based on notification type
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
        className="relative p-2 rounded-xl text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition-colors focus:outline-hidden"
        title="Trung tâm thông báo SCANMS"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
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
                className="text-[11px] font-bold text-[#B88E4F] hover:text-[#8C6226] flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* 4 Category Tabs */}
          <div className="flex border-b border-[#EAE4D7] bg-white px-2 pt-2 gap-1 text-xs">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ORDER', label: 'Đơn hàng' },
                { id: 'FINANCE', label: 'Tài chính' },
                { id: 'SYSTEM', label: 'Hệ thống' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 text-center font-bold rounded-lg transition-all ${
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
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start gap-3 ${
                    !n.isRead ? 'bg-[#FBF5EB]/50' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE4D7] shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-black text-[#1A1612] truncate">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#C59B58] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#7D715E] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#A89D8B] mt-1.5 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EAE4D7] text-center">
            <span className="text-[10px] text-[#7D715E]">
              Thông báo thời gian thực • Nền tảng tiếp thị liên kết SCANMS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
