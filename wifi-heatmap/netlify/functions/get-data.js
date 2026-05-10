/**
 * GET /api/data  (proxied from netlify.toml redirect)
 *
 * Reads the WiFi survey Google Sheet and returns rows as JSON.
 * The sheet must be shared as "Anyone with the link can view".
 *
 * Sheet columns (row 1 = header, skipped):
 *   A: Timestamp  B: Desk  C: Section  D: WiFi  E: Email  F: Notes
 *
 * Required env vars: GOOGLE_SHEETS_API_KEY
 * Sheet ID is hardcoded to avoid exposing it in client-side code.
 */

const SHEET_ID = '1RYst3eHlQ_5unp2CpZzooDIbbNg8DM9yERnoyfNqZYg';
const SHEET_RANGE = 'A:F'; // Timestamp, Desk, Section, WiFi, Email, Notes

exports.handler = async function (event) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    return jsonError(500, 'GOOGLE_SHEETS_API_KEY env var is not set');
  }

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}` +
    `?key=${encodeURIComponent(apiKey)}`;

  let sheetRes;
  try {
    sheetRes = await fetch(url);
  } catch (err) {
    return jsonError(502, `Failed to reach Google Sheets API: ${err.message}`);
  }

  const payload = await sheetRes.json();

  if (!sheetRes.ok) {
    const msg = payload?.error?.message ?? sheetRes.statusText;
    return jsonError(502, `Google Sheets API error: ${msg}`);
  }

  const values = payload.values ?? [];

  // Row 0 is the header — skip it; remaining rows are data.
  const [, ...dataRows] = values;

  const rows = (dataRows ?? []).map((row) => ({
    timestamp: row[0] ?? '',
    desk:      row[1] ?? '',
    section:   row[2] ?? '',
    wifi:      row[3] ?? '',   // network name: "Staff" | "Mobile" | "Guest" | ""
    email:     row[4] ?? '',
    notes:     row[5] ?? '',
  }));

  // Most-recent entry's timestamp, used by the UI status bar.
  const lastSynced = rows.length > 0 ? rows[rows.length - 1].timestamp : '';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
    body: JSON.stringify({ rows, lastSynced }),
  };
};

function jsonError(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}
