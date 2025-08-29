import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


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

  // Security: Block access to sensitive files
  const path = request.nextUrl.pathname;
  if (path.startsWith('/.git') || 
      path.includes('.env') || 
      path.includes('config') ||
      path.includes('wp-config') ||
      path.includes('composer.json') ||
      path.includes('package.json')) {
    console.log(`[Middleware] SECURITY: Blocked access to sensitive file: ${path}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // Dashboard authentication check
  if (path.startsWith('/dashboard')) {
    console.log(`[Middleware] Dashboard route detected: ${path}`);
    
    // Check for session token cookie (authentication)
    const sessionCookie = request.cookies.get('sessionToken');
    if (!sessionCookie) {
      console.log(`[Middleware] No session token found, redirecting to login`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`[Middleware] Valid session token found, proceeding with dashboard request`);
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

    // Domain system removed - redirect to main site
    console.log(`[Middleware] Domain system removed, redirecting to main site`);
    const redirectURL = new URL("https://cutz.lol");
    redirectURL.pathname = request.nextUrl.pathname;
    redirectURL.search = request.nextUrl.search;
    redirectURL.port = '';
    console.log(`[Middleware] Redirecting to: ${redirectURL.toString()}`);

    return NextResponse.redirect(redirectURL, { status: 301, headers });
  }

  console.log(`[Middleware] No subdomain handling needed, proceeding with normal request`);
  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};