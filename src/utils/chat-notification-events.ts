import type { ChatMessage } from '../types/chat.types';

/** Subscribe without taking ownership of the socket shared by the chat UI. */
export function subscribeChatNotifications(
  socket: {
    on: (event: string, listener: (...args: any[]) => void) => unknown;
    off: (event: string, listener: (...args: any[]) => void) => unknown;
  },
  userId: string,
  onChange: () => void,
  onNewMessage: () => void,
  seen = new Set<string>(),
): () => void {
  const message = (item: ChatMessage) => {
    if (!item?.id || item.senderId === userId || seen.has(item.id)) return;
    seen.add(item.id);
    // Bound session memory while tolerating duplicate socket deliveries/retries.
    if (seen.size > 500) seen.delete(seen.values().next().value!);
    onChange();
    onNewMessage();
  };
  const read = (item: { readerId: string }) => {
    if (item?.readerId === userId) onChange();
  };
  socket.on('new_message', message);
  socket.on('messages_read', read);
  socket.on('connect', onChange); // Reconcile missed events after reconnect.
  return () => {
    socket.off('new_message', message);
    socket.off('messages_read', read);
    socket.off('connect', onChange);
  };
}
