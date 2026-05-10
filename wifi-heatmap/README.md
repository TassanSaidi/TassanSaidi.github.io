# WiFi Heatmap — Netlify Deployment

## Project structure

```
wifi-heatmap/
├── netlify.toml                      # Build config + routing
├── package.json
├── public/
│   ├── index.html                    # Heatmap page (paste your HTML here)
│   └── login.html                    # Password prompt
└── netlify/
    ├── functions/
    │   ├── login.js                  # Validates password, sets auth cookie
    │   └── get-data.js               # Google Sheets proxy → /api/data
    └── edge-functions/
        └── protect.js                # Auth guard — runs before every request
```

---

## Step 1 — Google Sheets setup

1. Open the sheet and click **Share → Anyone with the link → Viewer**.
2. Go to [Google Cloud Console](https://console.cloud.google.com/) and create (or open) a project.
3. Enable the **Google Sheets API** for that project.
4. Create an **API key** under **APIs & Services → Credentials**.
5. (Optional but recommended) Restrict the key to the Sheets API only.

---

## Step 2 — Deploy to Netlify

### Connect the repo

1. Push this repo to GitHub (or any Git provider).
2. In Netlify: **Add new site → Import an existing project**.
3. Pick the repo.
4. Set the **Base directory** to `wifi-heatmap`.
5. Leave Build command and Publish directory as detected from `netlify.toml`.

### Set environment variables

In **Site settings → Environment variables**, add:

| Variable | Value |
|---|---|
| `SITE_PASSWORD` | The password visitors must enter |
| `COOKIE_SECRET` | Any long random string (e.g. from `openssl rand -hex 32`) |
| `GOOGLE_SHEETS_API_KEY` | The API key from Step 1 |

Then **trigger a redeploy** (Site settings → Deploys → Trigger deploy).

---

## Step 3 — Paste your heatmap HTML

Open `public/index.html` and paste your heatmap markup between the two comment markers.

Survey data is pre-fetched and exposed on **`window.HEATMAP_DATA`** — an array of objects:

```js
[
  {
    timestamp: "2024-05-01 09:00",
    desk:      "D12",
    section:   "North Wing",
    wifi:      3,          // numeric signal strength
    email:     "user@example.com",
    notes:     "Near printer"
  },
  ...
]
```

If your heatmap exposes a function called `renderHeatmap`, it will be called automatically with the rows. Otherwise, read `window.HEATMAP_DATA` directly from your script.

---

## How auth works

- Every request hits the **edge function** (`protect.js`) before content is served.
- The edge function checks for an `auth` cookie whose value is `sha256(SITE_PASSWORD:COOKIE_SECRET)`.
- `/login` and `/api/login` are exempt so the login page is always reachable.
- Submitting the login form POSTs to `/api/login` → `login.js` validates the password and sets the cookie (24-hour session).
- No database, no JWT library — just a deterministic hash that both sides can compute independently.

---

## Local development

```bash
npm install -g netlify-cli
cd wifi-heatmap
netlify dev
```

Set the env vars in a `.env` file (gitignored) for local testing:

```
SITE_PASSWORD=yourpassword
COOKIE_SECRET=any-random-string
GOOGLE_SHEETS_API_KEY=AIza...
```
