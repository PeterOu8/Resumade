import 'server-only';

export function isCurrentApiToken(token?: string) {
  if (!token) return false;

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return Number.isSafeInteger(payload.exp) &&
      typeof payload.sv === 'string' && /^\d+$/.test(payload.sv) &&
      payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
