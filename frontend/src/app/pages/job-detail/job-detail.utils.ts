/**
 * Hostname of a URL without "www.", or the URL itself when it does not parse.
 */
export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
