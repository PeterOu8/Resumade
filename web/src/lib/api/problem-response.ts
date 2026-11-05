export function apiErrorMessage(result: unknown, fallback: string) {
  if (result && typeof result === 'object') {
    if ('detail' in result && typeof result.detail === 'string') return result.detail;
    if ('error' in result && typeof result.error === 'string') return result.error;
  }
  return fallback;
}

export async function readApiError(response: Response, fallback: string) {
  return apiErrorMessage(await response.json().catch(() => null), fallback);
}
