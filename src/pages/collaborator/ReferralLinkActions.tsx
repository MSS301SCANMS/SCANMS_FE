import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, MoreHorizontal, PauseCircle, PlayCircle, QrCode, Trash2, TrendingUp, Video } from 'lucide-react';
import type { ReferralLinkItem } from '../../services/referral-links.service';

interface ReferralLinkActionsProps {
  link: ReferralLinkItem;
  onQr: () => void;
  onAnalytics: () => void;
  onVideo: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReferralLinkActions({ link, onQr, onAnalytics, onVideo, onToggle, onDelete }: ReferralLinkActionsProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `link-actions-${link.id}`;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    setPosition({
      top: Math.max(8, anchor.bottom + menu.height + 8 > window.innerHeight
        ? anchor.top - menu.height - 6 : anchor.bottom + 6),
      left: Math.max(8, Math.min(anchor.right - menu.width, window.innerWidth - menu.width - 8)),
    });
    menuRef.current.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dismiss = () => setOpen(false);
    const outside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) dismiss();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        triggerRef.current?.focus({ preventScroll: true });
      } else if (event.key === 'Tab') {
        // Continue the tab order from the trigger when leaving the portaled menu.
        triggerRef.current?.focus({ preventScroll: true });
        dismiss();
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('resize', dismiss);
    document.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
    action();
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <a
        href={`/r/${link.shortCode}`}
        target="_blank"
        rel="noreferrer"
        title="Mở thử link rút gọn"
        aria-label={`Mở link ${link.shortCode}`}
        className="w-8 h-8 rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#C59B58] flex items-center justify-center transition shadow-2xs cursor-pointer"
      >
        <ExternalLink className="w-3.5 h-3.5 text-[#B88E4F]" />
      </a>
      <button
        type="button"
        onClick={onQr}
        title="Xem mã QR & Tải ảnh"
        aria-label={`Mã QR của ${link.shortCode}`}
        className="w-8 h-8 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] hover:bg-[#F3EFE6] hover:border-[#C59B58] flex items-center justify-center transition shadow-2xs cursor-pointer"
      >
        <QrCode className="w-3.5 h-3.5 text-[#B88E4F]" />
      </button>
      <button
        type="button"
        onClick={onAnalytics}
        title="Thống kê hiệu suất"
        aria-label={`Thống kê ${link.shortCode}`}
        className="w-8 h-8 rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FAF8F5] hover:border-[#C59B58] flex items-center justify-center transition shadow-2xs cursor-pointer"
      >
        <TrendingUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Thao tác khác cho ${link.shortCode}`}
        title="Thao tác khác"
        className="w-8 h-8 rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#C59B58] flex items-center justify-center transition shadow-2xs cursor-pointer"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Thao tác cho ${link.shortCode}`}
          className="fixed z-50 min-w-[210px] p-1.5 bg-white border border-[#EAE4D7] rounded-xl shadow-[0_12px_40px_rgba(35,29,21,0.14)] space-y-0.5 text-left animate-in fade-in-50 duration-150"
          style={position}
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => run(onVideo)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span>Nộp video review</span>
          </button>
          <button
            role="menuitem"
            type="button"
            disabled={link.status === 'BLOCKED'}
            onClick={() => run(onToggle)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer disabled:opacity-40"
          >
            {link.status === 'ACTIVE' ? (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Tạm dừng liên kết</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5 text-[#059669]" />
                <span>Kích hoạt liên kết</span>
              </>
            )}
          </button>
          <div className="h-px bg-[#EAE4D7]/70 my-1" />
          <button
            role="menuitem"
            type="button"
            onClick={() => run(onDelete)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Xóa liên kết</span>
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
