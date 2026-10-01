/**
 * Centralized XCLOUD Safe API Client
 * Ensures all network requests are type-safe, resilient against NetworkError,
 * and will never throw "JSON.parse: unexpected character at line 1 column 1"
 * even when receiving non-JSON responses.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export async function safeFetch<T = any>(
  url: string,
  options: RequestInit = {},
  fallbackData: T
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      return {
        success: response.ok,
        data: fallbackData,
        message: response.ok ? 'Success' : `HTTP ${response.status}: Unexpected response format (${text.slice(0, 100)})`,
        errors: response.ok ? [] : [`HTTP ${response.status}`],
      };
    }

    const json = await response.json();
    return {
      success: json.success ?? response.ok,
      data: json.data !== undefined ? json.data : fallbackData,
      message: json.message || (response.ok ? 'Success' : `HTTP ${response.status}`),
      errors: json.errors || [],
    };
  } catch (err: any) {
    // Graceful handling of network disconnects, timeouts, or unparseable packets
    return {
      success: false,
      data: fallbackData,
      message: err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Network unavailable'),
      errors: [err.message || 'Fetch failed'],
    };
  }
}
