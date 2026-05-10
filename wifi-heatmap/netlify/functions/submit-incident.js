/**
 * POST /api/submit
 *
 * Proxies a new WiFi incident row to the Google Apps Script web app,
 * which appends the row to the Google Sheet.
 *
 * Required env var: SCRIPT_WRITE_URL  (the deployed Apps Script web app URL)
 * Body (JSON): { desk, section, wifi, email?, notes? }
 */

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const scriptUrl = process.env.SCRIPT_WRITE_URL;
  if (!scriptUrl) {
    return jsonError(500, 'SCRIPT_WRITE_URL env var is not set');
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const { desk, section, wifi, email = '', notes = '' } = body;
  if (!desk || !wifi) {
    return jsonError(400, 'desk and wifi are required');
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desk, section: section || '', wifi, email, notes }),
      redirect: 'follow',
    });

    const text = await res.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    return jsonError(502, `Could not reach Apps Script: ${err.message}`);
  }
};

function jsonError(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: false, error: message }),
  };
}
