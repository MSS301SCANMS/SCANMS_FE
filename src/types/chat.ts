export interface ChatUser {
  id: string;
  fullName: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  mediaUrl?: string;
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
    logoUrl?: string;
  };
  collaborator?: ChatUser | null;
  customer?: ChatUser | null;
  chatMessages: {
    messageText: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  }[];
}
