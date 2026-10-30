import { getSessionId } from './auth-session';

const grants = new Map<string, { token: string; identity: string | null }>();

export function rememberLivePurchase(liveId: string, token?: string | null) {
  if (token) grants.set(liveId, { token, identity: getSessionId() });
}

export function getLivePurchase(liveId?: string) {
  const grant = liveId ? grants.get(liveId) : undefined;
  return grant?.identity === getSessionId() ? grant.token : undefined;
}

export function clearLivePurchase(liveId: string) { grants.delete(liveId); }
