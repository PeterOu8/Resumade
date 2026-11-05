import 'server-only';

import { isIP } from 'node:net';
import { headers } from 'next/headers';

export async function apiJsonRequestOptions(
  destination: URL,
  inboundHeaders?: Pick<Headers, 'get'>,
): Promise<Pick<RequestInit, 'headers' | 'redirect'>> {
  const outboundHeaders = new Headers({ 'Content-Type': 'application/json' });
  const token = process.env.RESUMADE_PROXY_TOKEN;
  const apiUrl = process.env.API_URL;
  if (process.env.VERCEL !== '1' || !token || !/^[0-9a-f]{64}$/i.test(token) ||
      !apiUrl || destination.protocol !== 'https:' || destination.origin !== new URL(apiUrl).origin) {
    return { headers: outboundHeaders };
  }

  // Vercel supplies this header at ingress. Never use an arbitrary proxy chain here.
  const ip = (inboundHeaders ?? await headers()).get('x-forwarded-for');
  if (!ip || ip.includes('%') || !isIP(ip)) return { headers: outboundHeaders };

  outboundHeaders.set('X-Resumade-Client-IP', ip);
  outboundHeaders.set('X-Resumade-Proxy-Token', token);
  return { headers: outboundHeaders, redirect: 'error' };
}
