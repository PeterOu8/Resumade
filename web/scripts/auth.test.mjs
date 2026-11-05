import assert from 'node:assert/strict';
import { createRequire, registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const authDirectory = new URL('../src/lib/auth/', import.meta.url).href;
const apiDirectory = new URL('../src/lib/api/', import.meta.url).href;

// Resolve the imports that Next's bundler normally supplies.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!context.parentURL?.startsWith(authDirectory) && !context.parentURL?.startsWith(apiDirectory)) {
      return nextResolve(specifier, context);
    }
    if (specifier === 'server-only') {
      return { url: 'data:text/javascript,export%20%7B%7D', shortCircuit: true };
    }
    if (specifier === 'next/navigation' || specifier === 'next/headers') {
      return nextResolve(pathToFileURL(require.resolve(`${specifier}.js`)).href, context);
    }
    if (specifier === '../api/trusted-client-ip') {
      return nextResolve('../api/trusted-client-ip.ts', context);
    }
    if (specifier === './auth.schema') {
      return nextResolve('./auth.schema.ts', context);
    }
    return nextResolve(specifier, context);
  },
});

const { submitAccountAction } = await import('../src/lib/auth/account-actions.ts');
const { isCurrentApiToken } = await import('../src/lib/auth/api-token.ts');
hooks.deregister();

const email = 'developer@example.test';
const password = 'example-test-password';

function form(fields) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

function mockApi(t, status, headers) {
  const previous = process.env.API_URL;
  process.env.API_URL = 'https://api.example.test';
  const fetch = mock.method(globalThis, 'fetch', async () => new Response(null, { status, headers }));
  t.after(() => {
    fetch.mock.restore();
    if (previous === undefined) delete process.env.API_URL;
    else process.env.API_URL = previous;
  });
  return fetch;
}

test('signup returns inline success without expecting an access token', async (t) => {
  const fetch = mockApi(t, 202);
  assert.deepEqual(
    await submitAccountAction('register', {}, form({ displayName: 'Test User', email, password, confirmPassword: password })),
    { success: true },
  );
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url.pathname, '/api/auth/register');
  assert.deepEqual(JSON.parse(options.body), { displayName: 'Test User', email, password });
});

test('forgot-password posts a normalised email and returns generic success', async (t) => {
  const fetch = mockApi(t, 202);
  assert.deepEqual(await submitAccountAction('forgot-password', {}, form({ email: ` ${email} ` })), { success: true });
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url.pathname, '/api/auth/forgot-password');
  assert.equal(options.method, 'POST');
  assert.equal(options.cache, 'no-store');
  assert.deepEqual(JSON.parse(options.body), { email });
});

test('verification rejects malformed tokens before requesting the API', async (t) => {
  const fetch = mockApi(t, 204);

  assert.match((await submitAccountAction('verify-email', {}, form({ token: 'invalid' }))).error, /invalid/);
  assert.equal(fetch.mock.callCount(), 0);

  const token = 'B'.repeat(64);
  assert.deepEqual(await submitAccountAction('verify-email', {}, form({ token })), { success: true });
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url.pathname, '/api/auth/verify-email');
  assert.deepEqual(JSON.parse(options.body), { token });
});

test('recovery requests display the retry delay when rate limited', async (t) => {
  mockApi(t, 429, { 'Retry-After': '37' });
  const result = await submitAccountAction('forgot-password', {}, form({ email }));
  assert.deepEqual(result, { error: 'Too many requests. Try again in 37 seconds.' });
});

test('reset-password shows an error for an invalid token or mismatched confirmation', async (t) => {
  const fetch = mockApi(t, 400);
  const fields = { token: 'A'.repeat(64), password, confirmPassword: password };
  assert.match((await submitAccountAction('reset-password', {}, form(fields))).error, /invalid or has expired/);
  assert.match((await submitAccountAction('reset-password', {}, form({ ...fields, confirmPassword: 'different' }))).error, /do not match/);
  assert.equal(fetch.mock.callCount(), 1);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url.pathname, '/api/auth/reset-password');
  assert.deepEqual(JSON.parse(options.body), { token: fields.token, password });
});

test('a successful reset redirects to sign-in with a confirmation', async (t) => {
  mockApi(t, 204);
  const fields = { token: 'C'.repeat(64), password, confirmPassword: password };
  await assert.rejects(
    submitAccountAction('reset-password', {}, form(fields)),
    (error) => error.message === 'NEXT_REDIRECT' && error.digest.split(';')[2] === '/signin?status=password_reset',
  );
});

test('sessions require a current backend expiration and security-version claim', () => {
  const now = Math.floor(Date.now() / 1000);
  const jwt = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

  assert.equal(isCurrentApiToken(jwt({ exp: now + 60, sv: '0' })), true);
  assert.equal(isCurrentApiToken(jwt({ exp: now, sv: '0' })), false);
  assert.equal(isCurrentApiToken(jwt({ exp: now + 60 })), false);
  assert.equal(isCurrentApiToken(jwt({ exp: now + 60, sv: 'bad' })), false);
  assert.equal(isCurrentApiToken('malformed'), false);
});
