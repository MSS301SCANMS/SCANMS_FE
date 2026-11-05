import api from './api';
import { getChatSocket, isChatSocketEnabled } from './chat-socket.service';

const unwrap = <T, >(value: unknown): T => {
  const envelope = value as { result?: T; data?: T };
  return (envelope?.result ?? envelope?.data ?? value) as T;
};

export interface StoreChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  createdAt: string;
  isRead: boolean;
}

export interface StoreChatConversation {
  id: string;
  storeId: string;
  customerId: string;
  isStoreOwner: boolean;
  customer: { fullName: string };
  store: { id?: string; storeId?: string; name: string; logoUrl?: string };
  chatMessages: StoreChatMessage[];
  _count: { chatMessages: number };
}

export const storeChatService = {
  list: async () => unwrap<StoreChatConversation[]>(await api.get('/chat/conversations', {headers: {'x-skip-cache': '1'}})),
  open: async (storeId: string, customerId?: string) => unwrap<StoreChatConversation>(await api.post('/chat/conversations', {
    storeId,
    customerId
  })),
  history: async (id: string, cursor?: string) => unwrap<StoreChatMessage[]>(await api.get(`/chat/conversations/${id}/messages`, {
    params: {take: 50, cursor}, headers: {'x-skip-cache': '1'},
  })),
  read: (id: string) => api.patch(`/chat/conversations/${id}/read`),
  async upload(conversationId: string, file: File, messageId: string, progress: (percent: number) => void) {
    const body = new FormData();
    body.append('file', file);
    body.append('messageId', messageId);
    return unwrap<StoreChatMessage>(await api.post(`/chat/conversations/${conversationId}/attachments`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000,
      onUploadProgress: event => progress(Math.min(99, Math.round(event.loaded / (event.total || file.size) * 100))),
    }));
  },
  async download(conversationId: string, attachmentId: string): Promise<Blob> {
    return await api.get(`/chat/conversations/${conversationId}/attachments/${encodeURIComponent(attachmentId)}`, {
      responseType: 'blob', headers: { 'x-skip-cache': '1' }, timeout: 120000,
    }) as unknown as Blob;
  },
  async send(conversationId: string, messageText: string, messageId: string): Promise<StoreChatMessage> {
    const socket = getChatSocket();
    if (!isChatSocketEnabled() || !socket.connected)
      return unwrap<StoreChatMessage>(await api.post(`/chat/conversations/${conversationId}/messages`, {
        messageText,
        messageId
      }));
    return new Promise((resolve, reject) => {
      socket.timeout(10000).emit('send_message', {conversationId, messageText, messageId},
        (error: Error | null, result: { ok?: boolean; message?: StoreChatMessage | string }) => {
          if (error || !result?.ok || typeof result.message !== 'object') reject(new Error(typeof result?.message === 'string' ? result.message : 'Chưa xác nhận được tin nhắn. Hãy gửi lại.'));
          else resolve(result.message);
        });
    });
  },
};
