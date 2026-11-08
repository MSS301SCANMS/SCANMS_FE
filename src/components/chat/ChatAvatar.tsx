import { useState } from 'react';

export function ChatAvatar({ name, src, small = false }: { name: string; src?: string; small?: boolean }) {
  const [failed, setFailed] = useState('');
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'S';
  return <span className={`store-chat-avatar${small ? ' store-chat-avatar--small' : ''}`} aria-hidden="true">
    {src && src !== failed ? <img src={src} alt="" onError={() => setFailed(src)} /> : initials}
  </span>;
}
