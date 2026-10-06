export function commandKey(scope: string, payload: string) {
  const name = `scanms-finance-command:${scope}`;
  let previous: { payload?: string; key?: string } | null = null;
  try { previous = JSON.parse(sessionStorage.getItem(name) || 'null'); } catch { /* Replace a corrupt pending command. */ }
  if (previous?.payload === payload && previous.key) return previous.key;
  const key = crypto.randomUUID(); sessionStorage.setItem(name, JSON.stringify({ payload, key })); return key;
}
export function completeCommand(scope: string) { sessionStorage.removeItem(`scanms-finance-command:${scope}`); }
