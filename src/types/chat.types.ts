export interface ChatUser {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  collaboratorProfile?: {
    avatarUrl?: string | null;
  } | null;
}

export type ChatAttachmentType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  mediaUrl?: string;
  mediaType?: ChatAttachmentType;
  mediaName?: string;
  isRead: boolean;
  createdAt: string;
  sender: ChatUser;
}

export interface Conversation {
  _count?: { chatMessages: number };
  id: string;
  storeId: string;
  collaboratorId?: string | null;
  customerId?: string | null;
  lastMessageAt: string;
  createdAt: string;
  store: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    owner?: {
      id?: string;
      fullName?: string;
      avatarUrl?: string | null;
    };
  };
  collaborator?: ChatUser | null;
  customer?: ChatUser | null;
  chatMessages: {
    messageText: string;
    mediaType?: ChatAttachmentType;
    mediaName?: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  }[];
}

export interface ChatProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  sku?: string;
  soldCount?: number;
}

export interface ChatStoreInfo {
  id: string;
  name: string;
  logoUrl?: string;
  isVerified?: boolean;
}

export interface ChatCouponVoucher {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  remainingUses: number | null;
  expiresAt: string | null;
  scopeType: string;
  products: Array<{ id: string; title: string }>;
  categories: string[];
  storeName: string;
}

export interface ChatExclusiveDeal {
  type: 'EXCLUSIVE_DEAL_PROPOSAL' | 'EXCLUSIVE_DEAL_DECISION';
  proposalId?: string;
  productTitle?: string;
  storeName?: string;
  publicCommissionRate?: number;
  currentCommissionRate?: number | null;
  previousCommissionRate?: number | null;
  isRevision?: boolean;
  message?: string;
  proposedCommissionRate?: number;
  approvedCommissionRate?: number;
  salesCommitment?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  shopResponse?: string | null;
  shortUrl?: string | null;
}

export interface ChatChatMessageItem {
  id: string;
  sender: 'user' | 'shop';
  content: string;
  timestamp: string;
  product?: ChatProductInfo;
  products?: ChatProductInfo[];
  coupon?: ChatCouponVoucher;
  mediaUrl?: string;
  mediaType?: ChatAttachmentType;
  mediaName?: string;
}

export type ChatMessageItem = ChatChatMessageItem;

export interface ChatConversationItem {
  id: string;
  store: ChatStoreInfo;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessageItem[];
}

export interface ScanmsChatContextType {
  isOpen: boolean;
  isMinimized: boolean;
  activeConversationId: string;
  conversations: ChatConversationItem[];
  activeConversation: ChatConversationItem | null;
  activeProduct: ChatProductInfo | null;
  openChat: (store?: ChatStoreInfo, product?: ChatProductInfo) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<boolean>;
  sendAttachment: (file: File, type: ChatAttachmentType, caption?: string) => Promise<void>;
  sendProductsInquiry: (products: ChatProductInfo[]) => Promise<boolean>;
  shareCouponVoucher: (coupon: ChatCouponVoucher) => boolean;
  clearActiveProduct: () => void;
  deleteConversation: (id: string) => Promise<boolean>;
  clearConversationMessages: (id: string) => Promise<boolean>;
  clearAllConversations: () => void;
}
