export interface GuardInput {
  method: string;
  host: string | null;
  origin: string | null;
  secFetchSite: string | null;
}

const HOST_OK = /^(127\.0\.0\.1|localhost)(:\d+)?$/;

/** Blocks foreign Host headers (DNS rebinding) and cross-site writes (CSRF). */
export function isAllowedRequest({ method, host, origin, secFetchSite }: GuardInput): boolean {
  if (!host || !HOST_OK.test(host)) return false;
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return true;
  if (secFetchSite === "cross-site") return false;
  if (origin) {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}
