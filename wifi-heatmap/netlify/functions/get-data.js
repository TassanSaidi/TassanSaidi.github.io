/**
 * GET /api/data  (proxied from netlify.toml redirect)
 *
 * Reads the WiFi survey Google Sheet and returns rows as JSON.
 * The sheet must be shared as "Anyone with the link can view".
 *
 * Reads two tabs and merges them:
 *   - "Untitled"          (legacy):  A: Timestamp  B: Desk  C: Section  D: Notes
 *   - "Form responses 1"  (current): A: Timestamp  B: Desk  C: WiFi  D: Email  E: Notes
 *
 * Section is derived from Desk on the client, so the legacy Section column
 * is dropped on the way through.
 *
 * Required env vars: GOOGLE_SHEETS_API_KEY
 */

const SHEET_ID = '1RYst3eHlQ_5unp2CpZzooDIbbNg8DM9yERnoyfNqZYg';
const LEGACY_RANGE  = "'Untitled'!A:D";
const CURRENT_RANGE = "'Form responses 1'!A:E";

exports.handler = async function (event) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    return jsonError(500, 'GOOGLE_SHEETS_API_KEY env var is not set');
  }

  const params = new URLSearchParams();
  params.append('ranges', LEGACY_RANGE);
  params.append('ranges', CURRENT_RANGE);
  params.append('key', apiKey);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?${params}`;

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

  const ranges = payload.valueRanges ?? [];
  const legacyRows  = (ranges[0]?.values ?? []).slice(1); // skip header row
  const currentRows = (ranges[1]?.values ?? []).slice(1);

  const legacy = legacyRows.map((row) => ({
    timestamp: row[0] ?? '',
    desk:      row[1] ?? '',
    section:   '',
    wifi:      '',
    email:     '',
    notes:     row[3] ?? '',
  }));

  const current = currentRows.map((row) => ({
    timestamp: row[0] ?? '',
    desk:      row[1] ?? '',
    section:   '',
    wifi:      row[2] ?? '',
    email:     row[3] ?? '',
    notes:     row[4] ?? '',
  }));

  // Merge and sort chronologically. Timestamps are formatted strings
  // like "10/05/2026 12:39:17"; parseTs handles both DD/MM/YYYY and ISO.
  const rows = [...legacy, ...current]
    .filter((r) => r.timestamp || r.desk)
    .sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp));

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

function parseTs(s) {
  if (!s) return 0;
  // Try DD/MM/YYYY HH:MM:SS first (Google Forms default in en-ZA)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, d, mo, y, h, mi, se] = m;
    return new Date(+y, +mo - 1, +d, +h, +mi, +se).getTime();
  }
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

function jsonError(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}
