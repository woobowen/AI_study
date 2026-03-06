import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';

export interface RequestOptions extends Omit<RequestInit, 'headers' | 'body'> {
  headers?: HeadersInit;
  body?: unknown;
}

/**
 * 统一读取 JWT：优先 localStorage，其次回退到 Zustand 运行态。
 */
function resolveToken(): string | null {
  if (typeof window !== 'undefined') {
    const storageToken = localStorage.getItem('token');
    if (storageToken) {
      return storageToken;
    }
  }

  const state = useUserStore.getState() as unknown as Record<string, unknown>;
  const tokenCandidates = [state.token, state.authToken, state.accessToken];
  const authStoreToken = useAuthStore.getState().token;
  if (typeof authStoreToken === 'string' && authStoreToken.trim()) {
    return authStoreToken;
  }

  for (const candidate of tokenCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

/**
 * 通用 JSON 请求封装：自动注入 JWT，并返回强类型响应。
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = resolveToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
