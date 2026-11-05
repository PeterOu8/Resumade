import { afterEach, expect, it, vi } from 'vitest';

import { apiJsonRequestOptions } from './trusted-client-ip';

vi.mock('server-only', () => ({}));

const token = 'a'.repeat(64);
const api = new URL('https://api.example.test/api/resumes/parse');

function configureVercel() {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('API_URL', api.origin);
  vi.stubEnv('RESUMADE_PROXY_TOKEN', token);
}

afterEach(() => vi.unstubAllEnvs());

it.each(['203.0.113.1', '2001:db8::1'])('forwards the single Vercel IP %s', async (ip) => {
  configureVercel();
  const options = await apiJsonRequestOptions(api, new Headers({ 'x-forwarded-for': ip }));
  const outbound = new Headers(options.headers);

  expect(outbound.get('X-Resumade-Client-IP')).toBe(ip);
  expect(outbound.get('X-Resumade-Proxy-Token')).toBe(token);
  expect(options.redirect).toBe('error');
});

it.each(['bad-ip', '203.0.113.1, 203.0.113.2', 'fe80::1%eth0', ''])(
  'omits the assertion for an invalid or missing IP (%s)',
  async (ip) => {
    configureVercel();
    const options = await apiJsonRequestOptions(api, new Headers({ 'x-forwarded-for': ip }));
    expect(new Headers(options.headers).has('X-Resumade-Proxy-Token')).toBe(false);
  },
);

it('keeps the credential on the configured HTTPS origin and requires Vercel and a token', async () => {
  configureVercel();
  const inbound = new Headers({ 'x-forwarded-for': '203.0.113.1' });
  for (const url of ['https://other.example.test', 'http://api.example.test']) {
    const options = await apiJsonRequestOptions(new URL(url), inbound);
    expect(new Headers(options.headers).has('X-Resumade-Proxy-Token')).toBe(false);
  }

  vi.stubEnv('VERCEL', undefined);
  expect(new Headers((await apiJsonRequestOptions(api, inbound)).headers).has('X-Resumade-Client-IP')).toBe(false);
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('RESUMADE_PROXY_TOKEN', undefined);
  expect(new Headers((await apiJsonRequestOptions(api, inbound)).headers).has('X-Resumade-Client-IP')).toBe(false);
});
