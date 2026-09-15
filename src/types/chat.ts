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
  id: string;
  storeId: string;
  collaboratorId: string;
  lastMessageAt: string;
  createdAt: string;
  store: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  collaborator: ChatUser;
  chatMessages: {
    messageText: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  }[];
}
