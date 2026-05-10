/**
 * POST /api/login  (proxied from netlify.toml redirect)
 *
 * Validates the submitted password against SITE_PASSWORD env var.
 * On success: sets an HttpOnly auth cookie and redirects to /.
 * On failure: redirects back to /login?error=1.
 *
 * The cookie value is sha256(SITE_PASSWORD:COOKIE_SECRET) — the same
 * computation the edge function does, so no database is needed.
 */

const { createHash } = require('crypto');

function computeToken(password, secret) {
  return createHash('sha256')
    .update(`${password}:${secret}`)
    .digest('hex');
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sitePassword = process.env.SITE_PASSWORD;
  const cookieSecret = process.env.COOKIE_SECRET;

  if (!sitePassword || !cookieSecret) {
    return { statusCode: 500, body: 'Server misconfigured: missing env vars' };
  }

  // Parse form body (application/x-www-form-urlencoded)
  const params = new URLSearchParams(event.body ?? '');
  const submitted = params.get('password') ?? '';

  if (submitted !== sitePassword) {
    return {
      statusCode: 303,
      headers: { Location: '/login?error=1' },
      body: '',
    };
  }

  const token = computeToken(sitePassword, cookieSecret);
  // 24-hour session
  const maxAge = 60 * 60 * 24;

  return {
    statusCode: 303,
    headers: {
      Location: '/',
      'Set-Cookie': `auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    },
    body: '',
  };
};
