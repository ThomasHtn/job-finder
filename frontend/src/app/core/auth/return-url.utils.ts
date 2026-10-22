import { HOME_ROUTE, LOGIN_ROUTE, RETURN_URL_PARAM } from './auth.constants';

/**
 * The path to come back to after signing in: an in-app path, else the feed. Anything that could
 * leave the app (another origin, a protocol-relative URL) is refused, so the parameter is no open redirect.
 */
export function safeReturnUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || /^\/[/\\]/.test(value)) {
    return HOME_ROUTE;
  }
  return value.startsWith(LOGIN_ROUTE) ? HOME_ROUTE : value;
}

/**
 * The login screen's URL, remembering `returnUrl` unless it is only the feed.
 */
export function loginUrlFor(returnUrl: string): string {
  const target = safeReturnUrl(returnUrl);
  return target === HOME_ROUTE
    ? LOGIN_ROUTE
    : `${LOGIN_ROUTE}?${RETURN_URL_PARAM}=${encodeURIComponent(target)}`;
}
