import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { Modal } from '../ui/Modal';

export interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile) => void;
}

export function RoleSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}: RoleSwitcherModalProps) {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleQuickSwitchRole = async (email: string) => {
    setSwitching(true);
    try {
      const res: any = await authService.login(email, 'Password@123');
      const user = res.data?.user || res.user;
      onUserChanged(user);
      onClose();

      if (user?.role === 'SHOP_MANAGER') {
        navigate('/merchant/dashboard');
      } else if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'SYSTEM_MANAGER') {
        navigate('/admin/users');
      } else {
        navigate('/collaborator/dashboard');
      }
    } catch (err: any) {
      console.error('Lỗi chuyển vai trò:', err);
    } finally {
      setSwitching(false);
    }
  };

  const roles = [
    {
      id: 'kol1',
      name: 'Nguyễn Thành Thắng',
      badge: 'LEADER KOL',
      badgeBg: 'bg-amber-600 text-white',
      email: 'kol1@scanms.vn',
      desc: 'Top KOL Hạng Vàng (+3% hoa hồng)',
      avatar: 'T',
      avatarBg: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'demo',
      name: 'Trần Văn Nhật',
      badge: 'KOL VÀNG',
      badgeBg: 'bg-indigo-100 text-indigo-700',
      email: 'demo@scanms.vn',
      desc: 'KOL Đối Tác (+3% hoa hồng)',
      avatar: 'N',
      avatarBg: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'shop',
      name: 'Sora Skin Official',
      badge: 'CHỦ SHOP',
      badgeBg: 'bg-amber-100 text-amber-800',
      email: 'shop@scanms.vn',
      desc: 'Quản lý Sản phẩm & Gian hàng',
      avatar: 'S',
      avatarBg: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'admin',
      name: 'Nguyễn Quản Trị',
      badge: 'ADMIN',
      badgeBg: 'bg-slate-900 text-amber-400',
      email: 'admin@scanms.vn',
      desc: 'Quản trị viên Toàn sàn',
      avatar: 'QT',
      avatarBg: 'bg-slate-800 text-amber-400',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển Không Gian Vai Trò"
      subtitle="Chọn 1 trong 4 tài khoản mẫu để chuyển đổi không gian làm việc ngay lập tức:"
      icon={<RefreshCw className="w-4 h-4 text-amber-700" />}
      maxWidth="md"
    >
      <div className="flex flex-col gap-2.5">
        {roles.map((r) => {
          const isSelected = currentUser?.email === r.email;
          return (
            <button
              key={r.id}
              type="button"
              disabled={switching}
              onClick={() => handleQuickSwitchRole(r.email)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${r.avatarBg}`}
              >
                {r.avatar}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <strong className="text-xs font-bold text-slate-900 truncate">{r.name}</strong>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.badgeBg}`}>
                    {r.badge}
                  </span>
                </div>
                <small className="text-[11px] text-slate-500 block truncate">{r.email} • {r.desc}</small>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
