import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('server-only', () => ({}));

describe('resume parse route', () => {
  afterEach(() => {
    delete process.env.API_URL;
    vi.unstubAllGlobals();
  });

  it('rejects oversized AI text before calling the API', async () => {
    process.env.API_URL = 'https://api.example.test';
    const backendFetch = vi.fn();
    vi.stubGlobal('fetch', backendFetch);
    const textItems = Array.from({ length: 11 }, () => ({
      text: 'x'.repeat(10_000),
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      fontName: 'Test',
      hasEOL: false,
    }));
    const request = new Request('https://example.test/api/resumes/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textItems,
        ai: { provider: 'openai', apiKey: 'test-api-key', model: '' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'This PDF contains too much text for AI parsing.',
    });
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
