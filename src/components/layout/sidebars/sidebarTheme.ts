import type { WorkspaceNavRole } from './resolveWorkspaceRole';

export interface SidebarTheme {
  badgeLabel: string;
  shellBorder: string;
  headerBorder: string;
  avatarBorder: string;
  avatarBg: string;
  avatarText: string;
  roleBadge: string;
  linkActive: string;
  linkIdle: string;
  iconActive: string;
  iconIdle: string;
  badgeHighlight: string;
  badgeMuted: string;
  footerBorder: string;
  marketplaceHover: string;
  loginBtn: string;
  profileLink: string;
  spinner: string;
}

export const SIDEBAR_THEMES: Record<WorkspaceNavRole, SidebarTheme> = {
  CUSTOMER: {
    badgeLabel: 'Khách',
    shellBorder: 'border-[#D8E8DC]',
    headerBorder: 'border-[#D8E8DC]/70',
    avatarBorder: 'border-[#B7D4C0]',
    avatarBg: 'bg-[#F1F8F3]',
    avatarText: 'text-[#2F6B45]',
    roleBadge: 'bg-[#E7F5EC] text-[#2F6B45] border border-[#C5E0CF]',
    linkActive: 'bg-[#EAF6EF] text-[#2F6B45] font-bold border border-[#C5E0CF] shadow-2xs',
    linkIdle: 'text-[#3D4A40] hover:bg-[#F3FAF5] hover:text-[#2F6B45] font-medium',
    iconActive: 'text-[#2F6B45]',
    iconIdle: 'text-[#6B7F72] group-hover:text-[#2F6B45]',
    badgeHighlight: 'bg-[#2F6B45] text-white shadow-2xs animate-pulse',
    badgeMuted: 'bg-[#EAF6EF] text-[#2F6B45] border border-[#C5E0CF]',
    footerBorder: 'border-[#D8E8DC]',
    marketplaceHover: 'text-[#3D4A40] hover:text-[#2F6B45] hover:bg-[#F3FAF5]',
    loginBtn: 'bg-[#2F6B45] hover:bg-[#255738] text-white',
    profileLink: 'text-[#6B7F72] hover:text-[#2F6B45]',
    spinner: 'text-[#2F6B45]',
  },
  SHOP_MANAGER: {
    badgeLabel: 'Shop',
    shellBorder: 'border-[#EEDFC6]',
    headerBorder: 'border-[#EAE4D7]/70',
    avatarBorder: 'border-[#EAE4D7]',
    avatarBg: 'bg-[#FAF8F5]',
    avatarText: 'text-[#8C6226]',
    roleBadge: 'bg-[#FBF5EB] text-[#8C6226] border border-[#EEDFC6]',
    linkActive: 'bg-[#FAF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs',
    linkIdle: 'text-[#4A3F33] hover:bg-[#FAF8F5] hover:text-[#B88E4F] font-medium',
    iconActive: 'text-[#B88E4F]',
    iconIdle: 'text-[#7D715E] group-hover:text-[#B88E4F]',
    badgeHighlight: 'bg-[#C59B58] text-white shadow-2xs animate-pulse',
    badgeMuted: 'bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7]',
    footerBorder: 'border-[#EAE4D7]',
    marketplaceHover: 'text-[#4A3F33] hover:text-[#B88E4F] hover:bg-[#FAF8F5]',
    loginBtn: 'bg-[#C59B58] hover:bg-[#B88E4F] text-white',
    profileLink: 'text-[#7D715E] hover:text-[#C59B58]',
    spinner: 'text-[#B88E4F]',
  },
  COLLABORATOR: {
    badgeLabel: 'KOL',
    shellBorder: 'border-[#C9E4E0]',
    headerBorder: 'border-[#C9E4E0]/70',
    avatarBorder: 'border-[#A8D4CE]',
    avatarBg: 'bg-[#F0FAF8]',
    avatarText: 'text-[#0F766E]',
    roleBadge: 'bg-[#E6F7F4] text-[#0F766E] border border-[#B5DED7]',
    linkActive: 'bg-[#E6F7F4] text-[#0F766E] font-bold border border-[#B5DED7] shadow-2xs',
    linkIdle: 'text-[#3A4A48] hover:bg-[#F2FBFA] hover:text-[#0F766E] font-medium',
    iconActive: 'text-[#0F766E]',
    iconIdle: 'text-[#6A807C] group-hover:text-[#0F766E]',
    badgeHighlight: 'bg-[#0F766E] text-white shadow-2xs animate-pulse',
    badgeMuted: 'bg-[#E6F7F4] text-[#0F766E] border border-[#B5DED7]',
    footerBorder: 'border-[#C9E4E0]',
    marketplaceHover: 'text-[#3A4A48] hover:text-[#0F766E] hover:bg-[#F2FBFA]',
    loginBtn: 'bg-[#0F766E] hover:bg-[#0D5F59] text-white',
    profileLink: 'text-[#6A807C] hover:text-[#0F766E]',
    spinner: 'text-[#0F766E]',
  },
  SYSTEM_ADMIN: {
    badgeLabel: 'Admin',
    shellBorder: 'border-[#C5D4E8]',
    headerBorder: 'border-[#C5D4E8]/70',
    avatarBorder: 'border-[#A8BCE0]',
    avatarBg: 'bg-[#F0F4FB]',
    avatarText: 'text-[#1E3A5F]',
    roleBadge: 'bg-[#E8EEF8] text-[#1E3A5F] border border-[#C5D4E8]',
    linkActive: 'bg-[#E8EEF8] text-[#1E3A5F] font-bold border border-[#C5D4E8] shadow-2xs',
    linkIdle: 'text-[#3A4558] hover:bg-[#F4F7FC] hover:text-[#1E3A5F] font-medium',
    iconActive: 'text-[#1E3A5F]',
    iconIdle: 'text-[#6B778C] group-hover:text-[#1E3A5F]',
    badgeHighlight: 'bg-[#1E3A5F] text-white shadow-2xs animate-pulse',
    badgeMuted: 'bg-[#E8EEF8] text-[#1E3A5F] border border-[#C5D4E8]',
    footerBorder: 'border-[#C5D4E8]',
    marketplaceHover: 'text-[#3A4558] hover:text-[#1E3A5F] hover:bg-[#F4F7FC]',
    loginBtn: 'bg-[#1E3A5F] hover:bg-[#162C48] text-white',
    profileLink: 'text-[#6B778C] hover:text-[#1E3A5F]',
    spinner: 'text-[#1E3A5F]',
  },
  SYSTEM_MANAGER: {
    badgeLabel: 'Manager',
    shellBorder: 'border-[#D0D4E4]',
    headerBorder: 'border-[#D0D4E4]/70',
    avatarBorder: 'border-[#B8BFD6]',
    avatarBg: 'bg-[#F4F5FA]',
    avatarText: 'text-[#3F4C6B]',
    roleBadge: 'bg-[#ECEEF6] text-[#3F4C6B] border border-[#D0D4E4]',
    linkActive: 'bg-[#ECEEF6] text-[#3F4C6B] font-bold border border-[#D0D4E4] shadow-2xs',
    linkIdle: 'text-[#3E4456] hover:bg-[#F6F7FB] hover:text-[#3F4C6B] font-medium',
    iconActive: 'text-[#3F4C6B]',
    iconIdle: 'text-[#6F768A] group-hover:text-[#3F4C6B]',
    badgeHighlight: 'bg-[#3F4C6B] text-white shadow-2xs animate-pulse',
    badgeMuted: 'bg-[#ECEEF6] text-[#3F4C6B] border border-[#D0D4E4]',
    footerBorder: 'border-[#D0D4E4]',
    marketplaceHover: 'text-[#3E4456] hover:text-[#3F4C6B] hover:bg-[#F6F7FB]',
    loginBtn: 'bg-[#3F4C6B] hover:bg-[#333E58] text-white',
    profileLink: 'text-[#6F768A] hover:text-[#3F4C6B]',
    spinner: 'text-[#3F4C6B]',
  },
};
