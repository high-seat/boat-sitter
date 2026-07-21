/**
 * Static HTML for the dev console at GET /api/dev.
 * A listing = a vessel (PUT /api/vessels/:id) + a sit (PUT /api/sits/:id).
 */
export const devConsoleHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Boat Sitter — API console</title>
<style>
  :root {
    --bg:#0f1720; --panel:#16202b; --line:#24303d; --ink:#e6edf3;
    --muted:#8b9bab; --accent:#4bb3fd; --ok:#3fb950; --err:#f85149;
  }
  * { box-sizing:border-box; }
  body { margin:0; padding:24px; background:var(--bg); color:var(--ink);
    font:14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { font-size:18px; margin:0 0 4px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:0 0 12px; }
  .sub { color:var(--muted); margin:0 0 20px; font-size:13px; }
  .wrap { display:grid; grid-template-columns:minmax(360px,1fr) minmax(360px,1fr); gap:16px; align-items:start; max-width:1400px; }
  @media (max-width:900px){ .wrap{ grid-template-columns:1fr; } }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:16px; margin-bottom:16px; }
  label { display:block; font-size:12px; color:var(--muted); margin:10px 0 4px; }
  input, textarea { width:100%; background:#0d141c; color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:8px 10px; font:inherit; }
  textarea { font-family:ui-monospace, Menlo, monospace; font-size:12px; min-height:220px; resize:vertical; }
  input:focus, textarea:focus { outline:1px solid var(--accent); border-color:var(--accent); }
  button { background:#21303f; color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:7px 12px; font:inherit; cursor:pointer; margin:8px 6px 0 0; }
  button:hover { background:#2b3d4f; border-color:var(--accent); }
  button.primary { background:var(--accent); color:#06121c; border-color:var(--accent); font-weight:600; }
  button.danger { border-color:#5c2b2b; color:#ffb4ae; }
  pre { background:#0d141c; border:1px solid var(--line); border-radius:8px; padding:12px; overflow:auto; max-height:620px;
    font-size:12px; font-family:ui-monospace, Menlo, monospace; white-space:pre-wrap; word-break:break-word; margin:0; }
  .status { font-size:12px; margin-bottom:8px; color:var(--muted); }
  .status .ok { color:var(--ok); } .status .err { color:var(--err); }
  .hint { font-size:12px; color:var(--muted); margin-top:8px; }
  code { background:#0d141c; padding:1px 5px; border-radius:4px; font-size:12px; }
</style>
</head>
<body>
<h1>Boat Sitter — API console</h1>
<p class="sub">Dev only. 404s when <code>ENVIRONMENT=production</code>. A listing = a vessel + a sit.</p>

<div class="wrap">
  <div>
    <div class="card">
      <h2>Auth &amp; database</h2>
      <label>Admin token — matches <code>ADMIN_TOKEN</code> (needed only for reset)</label>
      <input id="token" placeholder="dev-token" value="dev-token" />
      <button onclick="call('GET','/api/dev/status')">Check status</button>
      <button class="danger" onclick="reset()">Reset + reseed</button>
    </div>

    <div class="card">
      <h2>Browse</h2>
      <button class="primary" onclick="call('GET','/api/boats')">GET /api/boats</button>
      <button onclick="call('GET','/api/vessels')">GET /api/vessels</button>
      <button onclick="call('GET','/api/sits')">GET /api/sits</button>
      <label>Listing (sit) id</label>
      <input id="boat-id" value="solstice" />
      <button onclick="call('GET','/api/boats/'+enc(v('boat-id')))">GET one boat</button>
      <button onclick="call('GET','/api/applications?sitId='+enc(v('boat-id')))">GET its applications</button>
    </div>
  </div>

  <div>
    <div class="card">
      <h2>Create a listing</h2>
      <button onclick="loadSample()">Load sample vessel + sit</button>
      <label>Vessel JSON → <code>PUT /api/vessels/:id</code></label>
      <textarea id="vessel" spellcheck="false"></textarea>
      <button class="primary" onclick="putVessel()">1 · Save vessel</button>
      <label>Sit JSON → <code>PUT /api/sits/:id</code></label>
      <textarea id="sit" spellcheck="false"></textarea>
      <button class="primary" onclick="putSit()">2 · Save sit</button>
      <p class="hint">Save the vessel first — the sit references it by <code>boatId</code>. Then GET /api/boats to see the joined listing.</p>
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
    document.getElementById('status').innerHTML =
      '<span class="' + (isErr ? 'err' : 'ok') + '">' + status + '</span> · ' + ms + ' ms';
    document.getElementById('out').textContent =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }

  async function call(method, path, body) {
    const t0 = performance.now();
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type':'application/json', ...(v('token') ? { Authorization:'Bearer '+v('token') } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
      show(method + ' ' + path + ' → ' + res.status, ms, parsed, !res.ok);
      return { ok: res.ok, parsed };
    } catch (err) {
      show(method + ' ' + path + ' → network error', 0, String(err), true);
      return { ok:false };
    }
  }

  function parse(id) {
    const raw = document.getElementById(id).value.trim();
    if (!raw) { show('Empty body', 0, 'Click "Load sample vessel + sit".', true); return null; }
    try { return JSON.parse(raw); } catch (e) { show('Invalid JSON in ' + id, 0, String(e), true); return null; }
  }

  function putVessel() { const b = parse('vessel'); if (b) call('PUT','/api/vessels/'+enc(b.id), b); }
  function putSit() { const b = parse('sit'); if (b) { document.getElementById('boat-id').value = b.id; call('PUT','/api/sits/'+enc(b.id), b); } }
  function reset() { if (confirm('Wipe and re-seed?')) call('POST','/api/dev/reset'); }

  async function loadSample() {
    const res = await fetch('/api/dev/sample');
    const json = await res.json();
    document.getElementById('vessel').value = JSON.stringify(json.vessel, null, 2);
    document.getElementById('sit').value = JSON.stringify(json.sit, null, 2);
    document.getElementById('boat-id').value = json.sit.id;
    show('Sample loaded', 0, 'Save the vessel, then the sit.', false);
  }

  loadSample();
</script>
</body>
</html>`;
