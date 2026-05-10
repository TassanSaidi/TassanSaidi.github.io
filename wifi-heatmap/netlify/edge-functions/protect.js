/**
 * Auth guard edge function.
 * Runs on every request before content is served.
 * Exempts /login (page + POST endpoint) and /.netlify/* internals.
 *
 * Required env vars: SITE_PASSWORD, COOKIE_SECRET
 */

export default async function protect(req, context) {
  const { pathname } = new URL(req.url);

  // Paths that are always public (login page, login POST, logout, Netlify internals)
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/logout') ||
    pathname.startsWith('/.netlify/');

  if (isPublic) {
    return context.next();
  }

  const cookie = req.headers.get('cookie') ?? '';
  const authToken = parseCookie(cookie, 'auth');

  const password = Deno.env.get('SITE_PASSWORD');
  const secret = Deno.env.get('COOKIE_SECRET');

  if (!password || !secret) {
    return new Response('Server misconfigured: missing env vars', { status: 500 });
  }

  const expected = await computeToken(password, secret);

  if (!authToken || authToken !== expected) {
    const loginUrl = new URL('/login', req.url);
    return Response.redirect(loginUrl.href, 302);
  }

  return context.next();
}

// --- Helpers ---

function parseCookie(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function computeToken(password, secret) {
  const data = new TextEncoder().encode(`${password}:${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
