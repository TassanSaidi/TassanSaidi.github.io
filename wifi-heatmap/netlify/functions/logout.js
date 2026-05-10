/**
 * GET /api/logout
 * Clears the auth cookie and redirects to the login page.
 */
exports.handler = async function () {
  return {
    statusCode: 303,
    headers: {
      Location: '/login',
      // Expire the cookie immediately
      'Set-Cookie': 'auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
    body: '',
  };
};
