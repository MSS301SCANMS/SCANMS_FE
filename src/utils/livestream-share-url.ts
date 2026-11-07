const isLocalHostname = (hostname: string) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(hostname.toLowerCase());

/** Prefer the stable frontend domain even when the host opens a local/tunnel page. */
export function getLivestreamShareUrl(sessionId: string): string {
  const publicSite = String(import.meta.env.VITE_PUBLIC_SITE_URL || '').trim();
  const origin = publicSite || window.location.origin;
  return new URL(`/live/${encodeURIComponent(sessionId)}`, origin).href;
}

/** Local startup writes the stable frontend URL separately from the backend tunnel. */
export async function resolveLivestreamShareUrl(sessionId: string): Promise<string> {
  let shareUrl = getLivestreamShareUrl(sessionId);
  if (isLocalHostname(window.location.hostname)) {
    try {
      const response = await fetch(`/demo-public-config.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const config = await response.json();
        const publicUrl = config.siteUrl || config.publicUrl;
        if (typeof publicUrl === 'string') {
          const origin = new URL(publicUrl);
          if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.username || origin.password) throw new Error('Invalid public origin');
          shareUrl = new URL(`/live/${encodeURIComponent(sessionId)}`, origin).href;
        }
      }
    } catch { /* Normal deployments can use their own origin without demo configuration. */ }
  }
  const url = new URL(shareUrl);
  if (isLocalHostname(url.hostname)) {
    throw new Error('Chưa có link Internet để chia sẻ. Hãy bật bản demo public rồi thử lại.');
  }
  try {
    const response = await fetch(new URL('/live-health', url), { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(6000) });
    if (!response.ok || (await response.json()).service !== 'livestream-realtime') throw new Error('Relay unavailable');
  } catch {
    throw new Error('Link public hoặc relay đang tắt. Hãy Run lại hệ thống trong IntelliJ rồi chia sẻ lại.');
  }
  return shareUrl;
}
