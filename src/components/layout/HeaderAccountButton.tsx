import { useState } from 'react';
import { ChevronDown, Shield, ShoppingBag, Star, Store } from 'lucide-react';
import type { UserProfile } from '../../services/auth.service';

interface HeaderAccountButtonProps {
  user: UserProfile | null;
  role: UserProfile['role'];
  expanded: boolean;
  menuId: string;
  detail?: string;
  onClick: () => void;
}

const roles = {
  CUSTOMER: { label: 'Khách mua sắm', icon: ShoppingBag },
  COLLABORATOR: { label: 'KOL/KOC', icon: Star },
  SHOP_MANAGER: { label: 'Chủ shop', icon: Store },
  SYSTEM_MANAGER: { label: 'Vận hành', icon: Shield },
  SYSTEM_ADMIN: { label: 'Admin', icon: Shield },
};

export function HeaderAccountButton({ user, role, expanded, menuId, detail, onClick }: HeaderAccountButtonProps) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const { label, icon: RoleIcon } = roles[role];
  const fullName = user?.fullName || user?.email || label;
  const name = fullName.replace(/\s*\((?:Top\s+KOL|KOL[^)]*|Vận Hành & Tuân Thủ|Super Admin|Admin|Ban Quản Trị Tối Cao|Quản trị viên Hệ thống)\)\s*$/iu, '').trim() || fullName;
  const avatarUrl = user?.avatarUrl || (role === 'SHOP_MANAGER' ? '/assets/shops/shop-sora-skin.png' : undefined);
  const description = `${fullName} · ${label}${detail && detail !== label ? ` · ${detail}` : ''}`;

  return (
    <button
      type="button"
      className={`flex items-center shrink-0 box-border w-[176px] min-w-0 h-[40px] gap-[7px] p-[4px_8px_4px_6px] border rounded-[10px] text-[#1A1612] text-left cursor-pointer transition-[border-color,background-color] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-[#B88E4F] focus-visible:outline-offset-[3px] max-[639px]:w-[40px] max-[639px]:justify-center max-[639px]:p-[5px] ${
        expanded
          ? 'border-[#B88E4F] bg-[#FBF5EB]'
          : 'border-[#EAE4D7] bg-white hover:border-[#B88E4F] hover:bg-[#FBF5EB]'
      }`}
      aria-expanded={expanded}
      aria-haspopup="true"
      aria-controls={menuId}
      aria-label={`Tài khoản ${description}`}
      title={description}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) onClick();
      }}
    >
      <span className="grid place-items-center shrink-0 w-[28px] h-[28px] overflow-hidden border border-[#EAE4D7] rounded-full bg-[#FBF5EB] text-[#B88E4F] text-[12px] font-[600]" aria-hidden="true">
        {avatarUrl && failedAvatar !== avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setFailedAvatar(avatarUrl)} />
        ) : (
          <span>{fullName.charAt(0).toUpperCase()}</span>
        )}
      </span>
      <span className="flex flex-1 min-w-0 flex-col items-start gap-[1px] max-[639px]:hidden">
        <strong className="block w-full max-w-full truncate text-[12px] font-[600] text-[#1A1612] leading-[15px]">{name}</strong>
        <span className="inline-flex items-center gap-[3px] px-[5px] rounded-[4px] bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-[500] leading-[14px] whitespace-nowrap">
          <RoleIcon className="w-[10px] h-[10px] shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </span>
      </span>
      <ChevronDown className={`w-[12px] h-[12px] text-[#7D715E] shrink-0 transition-transform duration-150 max-[639px]:hidden ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
  );
}
