/**
 * What the shared request helpers need to know about one call.
 */
export interface HttpOptions {
  /**
   * Names the call in the error message; never put a URL that carries a key here.
   */
  label: string;

  /**
   * Time given to the request before it is aborted.
   */
  timeoutMs: number;

  /**
   * Extra request headers.
   */
  headers?: Record<string, string>;
}
