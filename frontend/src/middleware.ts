import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { domainAPI } from "./api";

const allowedOrigins = [
  "https://cutz.lol",
];

function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(origin);	
    }
    return pattern === origin;
  });
}

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Handling request for URL: ${request.url}`);
  
  console.log(`[Middleware] All request headers:`, Object.fromEntries([...request.headers.entries()]));
  
  const headers = new Headers(request.headers);
  headers.set("x-current-path", request.nextUrl.pathname);
  console.log(`[Middleware] Set x-current-path header to: ${request.nextUrl.pathname}`);

  const origin = request.headers.get('origin');
  if (origin && isOriginAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    console.log(`[Middleware] Set Access-Control-Allow-Origin: ${origin}`);
  } else {
    console.log(`[Middleware] Origin not allowed or not present: ${origin}`);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  console.log(`[Middleware] Added standard CORS headers`);

  if (request.method === 'OPTIONS') {
    console.log(`[Middleware] Handling OPTIONS preflight request`);
    return new NextResponse(null, { headers });
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const cfVisitor = request.headers.get("cf-visitor");
  const cfRay = request.headers.get("cf-ray");
  const cfIpCountry = request.headers.get("cf-ipcountry");
  const cfRequestId = request.headers.get("cf-request-id");
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xForwardedHost = request.headers.get("x-forwarded-host");
  const xForwardedProto = request.headers.get("x-forwarded-proto");
  const xRealIp = request.headers.get("x-real-ip");

  console.log(`[Middleware] Cloudflare headers:`, {
    "cf-connecting-ip": cfConnectingIp,
    "cf-visitor": cfVisitor,
    "cf-ray": cfRay,
    "cf-ipcountry": cfIpCountry,
    "cf-request-id": cfRequestId,
    "x-forwarded-for": xForwardedFor,
    "x-forwarded-host": xForwardedHost,
    "x-forwarded-proto": xForwardedProto,
    "x-real-ip": xRealIp
  });

  let host = request.headers.get("host") || "";
  console.log(`[Middleware] Standard host header: ${host}`);
  
  const urlHostname = new URL(request.url).hostname;
  console.log(`[Middleware] URL hostname: ${urlHostname}`);
  
  if ((host === "cutz.lol" || host.endsWith(".cutz.lol")) && urlHostname !== host) {
    console.log(`[Middleware] Host header and URL hostname mismatch. Using URL hostname instead.`);
    host = urlHostname;
  }
  
  if (xForwardedHost && host === "cutz.lol") {
    console.log(`[Middleware] Using x-forwarded-host: ${xForwardedHost} instead of host: ${host}`);
    host = xForwardedHost;
  }
  
  console.log(`[Middleware] Final host being used: ${host}`);

  if (host === "cutz.lol" || host.endsWith(".cutz.lol")) {
    console.log(`[Middleware] Main domain detected (${host}), proceeding without rewrite`);
    return NextResponse.next({ headers });
  }

  const hostnameParts = host.split(".");
  console.log(`[Middleware] Hostname parts: ${JSON.stringify(hostnameParts)}`);

  if (hostnameParts.length >= 2 && !host.includes("localhost")) {
    const subdomain = hostnameParts[0];
    const domain = hostnameParts.slice(1).join(".");
    console.log(`[Middleware] Detected subdomain: ${subdomain}, domain: ${domain}`);

    const path = request.nextUrl.pathname;
    console.log(`[Middleware] Request path: ${path}`);
    
    if (path.startsWith("/_next/") ||
      path.startsWith("/api/") ||
      path === "/favicon.ico" ||
      path.startsWith("/images/")) {
      console.log(`[Middleware] Static resource path detected (${path}), skipping rewrite`);
      return NextResponse.next({ headers });
    }

    try {
      console.log(`[Middleware] Checking domain selection for ${subdomain}.${domain}`);
      const domainCheckStartTime = Date.now();
      const result = await domainAPI.checkUserDomainSelection(subdomain, domain);
      const domainCheckDuration = Date.now() - domainCheckStartTime;
      console.log(`[Middleware] Domain check completed in ${domainCheckDuration}ms, result:`, result);
      
      if (result?.has_selected) {
        console.log(`[Middleware] Valid domain selection found for ${subdomain}.${domain}`);
        const url = request.nextUrl.clone();
        const newPath = `/${subdomain}${path === "/" ? "" : path}`;
        url.pathname = newPath;
        console.log(`[Middleware] Rewriting URL to path: ${newPath}`);
        return NextResponse.rewrite(url, { headers });
      }

      console.log(`[Middleware] No valid domain selection for ${subdomain}.${domain}, redirecting to main site`);
      const redirectURL = new URL("https://haze.bio");
      redirectURL.pathname = request.nextUrl.pathname;
      redirectURL.search = request.nextUrl.search;
      redirectURL.port = '';
      console.log(`[Middleware] Redirecting to: ${redirectURL.toString()}`);

      return NextResponse.redirect(redirectURL, { status: 301, headers });
    } catch (error) {
      console.error(`[Middleware] Error checking domain selection for ${subdomain}.${domain}:`, error);
      console.log(`[Middleware] Error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));

      const redirectURL = new URL("https://cutz.lol");
      redirectURL.pathname = request.nextUrl.pathname;
      redirectURL.search = request.nextUrl.search;
      redirectURL.port = '';
      console.log(`[Middleware] Error recovery: redirecting to: ${redirectURL.toString()}`);

      return NextResponse.redirect(redirectURL, { status: 301, headers });
    }
  }

  console.log(`[Middleware] No subdomain handling needed, proceeding with normal request`);
  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};