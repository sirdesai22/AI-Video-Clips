import { NextResponse, type NextRequest } from "next/server";
import { isAllowedRequest } from "./lib/request-guard";

export function proxy(req: NextRequest) {
  const ok = isAllowedRequest({
    method: req.method,
    host: req.headers.get("host"),
    origin: req.headers.get("origin"),
    secFetchSite: req.headers.get("sec-fetch-site"),
  });
  return ok ? NextResponse.next() : new NextResponse("Forbidden", { status: 403 });
}

export const config = { matcher: "/api/:path*" };
