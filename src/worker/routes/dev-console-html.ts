/**
 * Static HTML for the dev console at GET /api/dev.
 * Kept in its own module so dev.ts stays readable.
 */
export const devConsoleHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Boat Sitter — API console</title>
<style>
  :root {
    --bg: #0f1720; --panel: #16202b; --line: #24303d; --ink: #e6edf3;
    --muted: #8b9bab; --accent: #4bb3fd; --ok: #3fb950; --err: #f85149;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px; background: var(--bg); color: var(--ink);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em;
       color: var(--muted); margin: 0 0 12px; }
  .sub { color: var(--muted); margin: 0 0 20px; font-size: 13px; }
  .wrap { display: grid; grid-template-columns: minmax(380px, 1fr) minmax(360px, 1fr);
          gap: 16px; align-items: start; max-width: 1400px; }
  @media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }
  .card { background: var(--panel); border: 1px solid var(--line);
          border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  label { display: block; font-size: 12px; color: var(--muted); margin: 10px 0 4px; }
  input, textarea, select {
    width: 100%; background: #0d141c; color: var(--ink); border: 1px solid var(--line);
    border-radius: 6px; padding: 8px 10px; font: inherit;
  }
  textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
             font-size: 12px; min-height: 300px; resize: vertical; }
  input:focus, textarea:focus, select:focus { outline: 1px solid var(--accent); border-color: var(--accent); }
  button {
    background: #21303f; color: var(--ink); border: 1px solid var(--line);
    border-radius: 6px; padding: 7px 12px; font: inherit; cursor: pointer; margin: 8px 6px 0 0;
  }
  button:hover { background: #2b3d4f; border-color: var(--accent); }
  button.primary { background: var(--accent); color: #06121c; border-color: var(--accent); font-weight: 600; }
  button.danger { border-color: #5c2b2b; color: #ffb4ae; }
  .row { display: flex; gap: 8px; }
  .row > * { flex: 1; }
  pre {
    background: #0d141c; border: 1px solid var(--line); border-radius: 8px;
    padding: 12px; overflow: auto; max-height: 620px; font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;
    word-break: break-word; margin: 0;
  }
  .status { font-size: 12px; margin-bottom: 8px; color: var(--muted); }
  .status .ok { color: var(--ok); } .status .err { color: var(--err); }
  .hint { font-size: 12px; color: var(--muted); margin-top: 8px; }
  code { background: #0d141c; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
<h1>Boat Sitter — API console</h1>
<p class="sub">Dev only. This page 404s when <code>ENVIRONMENT=production</code>.</p>

<div class="wrap">
  <div>
    <div class="card">
      <h2>Auth</h2>
      <label>Admin token — matches <code>ADMIN_TOKEN</code> in <code>.dev.vars</code></label>
      <input id="token" placeholder="dev-token" value="dev-token" />
      <button onclick="call('GET','/api/dev/status')">Check status</button>
      <button class="danger" onclick="reset()">Reset + reseed database</button>
      <p class="hint">Reset wipes <code>boats</code> and re-inserts from <code>seed-data.ts</code>.</p>
    </div>

    <div class="card">
      <h2>Read</h2>
      <div class="row">
        <div>
          <label>Region</label>
          <input id="f-region" placeholder="Mediterranean" />
        </div>
        <div>
          <label>Country</label>
          <input id="f-country" placeholder="Greece" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>Search (q)</label>
          <input id="f-q" placeholder="catamaran" />
        </div>
        <div>
          <label>Min rating</label>
          <input id="f-minRating" placeholder="4.8" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>Available from</label>
          <input id="f-availableFrom" placeholder="2026-11-01" />
        </div>
        <div>
          <label>Available to</label>
          <input id="f-availableTo" placeholder="2027-01-01" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>Featured</label>
          <select id="f-featured">
            <option value="">any</option><option value="true">true</option><option value="false">false</option>
          </select>
        </div>
        <div>
          <label>Sort</label>
          <select id="f-sort">
            <option>dateStart</option><option>-dateStart</option>
            <option>rating</option><option>-rating</option>
            <option>applicants</option><option>-applicants</option><option>name</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div><label>Page</label><input id="f-page" placeholder="1" /></div>
        <div><label>Limit</label><input id="f-limit" placeholder="12" /></div>
      </div>
      <button class="primary" onclick="list()">GET /api/boats</button>
      <button onclick="call('GET','/api/boats/facets')">GET facets</button>
    </div>

    <div class="card">
      <h2>Single boat</h2>
      <label>Boat id</label>
      <input id="boat-id" value="solstice" />
      <button onclick="call('GET','/api/boats/'+enc(v('boat-id')))">GET</button>
      <button class="danger" onclick="del()">DELETE</button>
      <p class="hint">PATCH uses this id with the JSON body on the right.</p>
      <button onclick="patch()">PATCH with body →</button>
    </div>
  </div>

  <div>
    <div class="card">
      <h2>Create / update body</h2>
      <button onclick="loadSample()">Load sample payload</button>
      <button onclick="loadInto()">Load current boat id</button>
      <label>JSON</label>
      <textarea id="body" spellcheck="false"></textarea>
      <button class="primary" onclick="create()">POST /api/boats</button>
      <p class="hint">POST needs every required field. PATCH accepts a partial body — e.g. <code>{"rating": 4.2}</code>.</p>
    </div>

    <div class="card">
      <h2>Response</h2>
      <div class="status" id="status">Ready.</div>
      <pre id="out">—</pre>
    </div>
  </div>
</div>

<script>
  const v = (id) => document.getElementById(id).value.trim();
  const enc = encodeURIComponent;

  function show(status, ms, data, isErr) {
    const el = document.getElementById('status');
    el.innerHTML = '<span class="' + (isErr ? 'err' : 'ok') + '">' + status + '</span> · ' + ms + ' ms';
    document.getElementById('out').textContent =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }

  async function call(method, path, body) {
    const t0 = performance.now();
    try {
      const res = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(v('token') ? { Authorization: 'Bearer ' + v('token') } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
      show(method + ' ' + path + ' → ' + res.status, ms, parsed, !res.ok);
      return parsed;
    } catch (err) {
      show(method + ' ' + path + ' → network error', Math.round(performance.now() - t0), String(err), true);
    }
  }

  function list() {
    const keys = ['region','country','q','minRating','availableFrom','availableTo','featured','sort','page','limit'];
    const qs = new URLSearchParams();
    for (const k of keys) {
      const el = document.getElementById('f-' + k);
      if (el && el.value.trim()) qs.set(k, el.value.trim());
    }
    call('GET', '/api/boats?' + qs.toString());
  }

  function parseBody() {
    const raw = document.getElementById('body').value.trim();
    if (!raw) { show('No body', 0, 'Paste JSON or click "Load sample payload".', true); return null; }
    try { return JSON.parse(raw); }
    catch (e) { show('Invalid JSON', 0, String(e), true); return null; }
  }

  async function create() {
    const body = parseBody(); if (!body) return;
    const r = await call('POST', '/api/boats', body);
    if (r && r.data && r.data.id) document.getElementById('boat-id').value = r.data.id;
  }

  function patch() {
    const body = parseBody(); if (!body) return;
    delete body.id;
    call('PATCH', '/api/boats/' + enc(v('boat-id')), body);
  }

  function del() {
    if (!confirm('Delete "' + v('boat-id') + '"?')) return;
    call('DELETE', '/api/boats/' + enc(v('boat-id')));
  }

  function reset() {
    if (!confirm('Wipe the boats table and re-seed?')) return;
    call('POST', '/api/dev/reset');
  }

  async function loadSample() {
    const res = await fetch('/api/dev/sample');
    const json = await res.json();
    document.getElementById('body').value = JSON.stringify(json, null, 2);
    document.getElementById('boat-id').value = json.id;
    show('Sample loaded', 0, 'Edit if you like, then POST.', false);
  }

  async function loadInto() {
    const res = await fetch('/api/boats/' + enc(v('boat-id')));
    const json = await res.json();
    if (!res.ok) return show('GET → ' + res.status, 0, json, true);
    document.getElementById('body').value = JSON.stringify(json.data, null, 2);
    show('Loaded ' + v('boat-id'), 0, 'Body populated. Edit and PATCH.', false);
  }

  loadSample();
</script>
</body>
</html>`;
