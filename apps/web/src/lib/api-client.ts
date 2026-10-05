export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('impactlens_token');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('impactlens_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('impactlens_token');
    localStorage.removeItem('impactlens_user');
  }
}

let loginPromise: Promise<string | null> | null = null;

export async function ensureToken(): Promise<string | null> {
  const existing = getAuthToken();
  if (existing) return existing;

  if (typeof window === 'undefined') return null;

  if (!loginPromise) {
    loginPromise = fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@impactlens.local', password: 'Password123!' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.accessToken) {
          setAuthToken(data.accessToken);
          if (data.user) {
            localStorage.setItem('impactlens_user', JSON.stringify(data.user));
          }
          return data.accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        loginPromise = null;
      });
  }
  return loginPromise;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAuthToken();
  if (!token && typeof window !== 'undefined' && !path.includes('/auth/login')) {
    token = await ensureToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const error = new Error(errorData.message || `API Error: ${response.status}`);
    (error as any).status = response.status;
    (error as any).code = errorData.code;
    (error as any).details = errorData.details;
    throw error;
  }

  return response.json();
}

export const api = {
  get: <T = any>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
