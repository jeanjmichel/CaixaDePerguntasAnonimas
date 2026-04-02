export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
  retryAfterMs?: number;
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  const response = await fetch(url, options);

  if (response.ok) {
    const json = await response.json();
    return { data: json.data as T, error: null };
  }

  const retryAfter = response.headers.get('Retry-After');
  const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;

  try {
    const json = await response.json();
    return {
      data: null,
      error: json.error ?? { code: 'UNKNOWN', message: 'Ocorreu um erro inesperado.' },
      retryAfterMs,
    };
  } catch {
    return {
      data: null,
      error: { code: 'UNKNOWN', message: 'Ocorreu um erro inesperado.' },
      retryAfterMs,
    };
  }
}
