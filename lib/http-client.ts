/**
 * HTTP Client Wrapper
 * Replaces axios with native fetch API for reduced bundle size
 * Provides axios-compatible interface for easy migration
 */

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpClientConfig;
}

export interface HttpError extends Error {
  response?: HttpResponse;
  status?: number;
  code?: string;
}

/**
 * Simple HTTP client that mimics axios API
 * Supports GET, POST, PUT, DELETE, PATCH methods
 */
export class HttpClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Merge headers with defaults
   */
  private mergeHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...headers,
    };
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.baseURL ? `${this.baseURL}${path}` : path;
  }

  /**
   * Create abort signal with timeout
   */
  private createAbortSignal(): AbortSignal {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Store timeout ID for cleanup
    const originalSignal = controller.signal;
    const wrappedSignal = Object.create(originalSignal);
    wrappedSignal._timeoutId = timeoutId;
    
    return wrappedSignal as AbortSignal;
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<HttpResponse<T>> {
    const contentType = response.headers.get('content-type') || '';
    let data: T;

    try {
      if (contentType.includes('application/json')) {
        data = await response.json() as T;
      } else if (contentType.includes('text')) {
        data = await response.text() as T;
      } else {
        data = await response.blob() as T;
      }
    } catch (error) {
      data = {} as T;
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as HttpError;
      error.response = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        config: { baseURL: this.baseURL, timeout: this.timeout },
      };
      error.status = response.status;
      throw error;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
      config: { baseURL: this.baseURL, timeout: this.timeout },
    };
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    const mergedHeaders = this.mergeHeaders(headers);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: mergedHeaders,
        signal: controller.signal,
      };

      if (data) {
        if (mergedHeaders['Content-Type']?.includes('application/json')) {
          options.body = JSON.stringify(data);
        } else if (data instanceof FormData) {
          options.body = data;
          delete mergedHeaders['Content-Type'];
        } else {
          options.body = String(data);
        }
      }

      const response = await fetch(url, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${this.timeout}ms`) as HttpError;
          timeoutError.code = 'ECONNABORTED';
          throw timeoutError;
        }
        throw error;
      }
      throw new Error('Unknown request error');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, headers);
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, data, headers);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, data, headers);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', path, data, headers);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }
}

/**
 * Factory function to create HTTP client (mimics axios.create)
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

export default createHttpClient;
