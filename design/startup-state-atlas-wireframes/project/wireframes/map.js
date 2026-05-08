// Investor map wireframes
(function(){
  const grid = document.getElementById('panel-map-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Classic: filters left, drawer right</div>
      <div class="note">Most familiar layout. Filters always visible, profile drawer slides in from right when a pin is selected.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/map</div></div>
      <div style="position:relative;height:500px;display:grid;grid-template-columns:200px 1fr 280px">
        <!-- filters -->
        <div style="padding:12px;background:var(--paper-2);border-right:1.5px solid var(--ink);overflow:auto">
          <div class="sketch-text mono muted">FILTERS</div>
          <div class="sketch-text sm" style="margin-top:6px">Sector</div>
          <div class="stack-2" style="margin-top:4px">
            <div class="row tight"><span class="ck on"></span><span class="sketch-text sm">B2B SaaS</span></div>
            <div class="row tight"><span class="ck on"></span><span class="sketch-text sm">FinTech</span></div>
            <div class="row tight"><span class="ck"></span><span class="sketch-text sm">Bio/Med</span></div>
            <div class="row tight"><span class="ck"></span><span class="sketch-text sm">Aerospace</span></div>
            <div class="row tight"><span class="ck"></span><span class="sketch-text sm">AI</span></div>
          </div>
          <div class="h-line"></div>
          <div class="sketch-text sm">Stage</div>
          <div class="row tight" style="margin-top:4px"><span class="chip ember-tint">Seed</span><span class="chip">Series A</span></div>
          <div class="h-line"></div>
          <div class="sketch-text sm">Employees</div>
          <div class="box dashed" style="padding:6px;margin-top:4px"><div class="sketch-text sm">2 — 50</div></div>
          <div class="h-line"></div>
          <div class="sketch-text sm">County</div>
          <div class="row tight" style="margin-top:4px"><span class="chip">SLC</span><span class="chip">Utah Co.</span></div>
          <div class="h-line"></div>
          <div class="row tight"><span class="ck on"></span><span class="sketch-text sm">Hiring now</span></div>
        </div>
        <!-- map -->
        <div style="position:relative">
          <div class="mapbg"></div>
          <span class="pin" style="background:#16A34A;left:30%;top:30%"></span>
          <span class="pin" style="background:#16A34A;left:36%;top:42%"></span>
          <span class="pin sel" style="background:#16A34A;left:46%;top:38%"></span>
          <span class="pin" style="background:#16A34A;left:54%;top:50%"></span>
          <span class="pin" style="background:#2563EB;left:40%;top:55%"></span>
          <span class="pin" style="background:#2563EB;left:60%;top:30%"></span>
          <span class="pin" style="background:#0891B2;left:48%;top:62%"></span>
          <div class="box" style="position:absolute;bottom:10px;left:10px;right:10px;background:rgba(247,244,237,.85);padding:8px 12px;backdrop-filter:blur(4px)">
            <div class="row" style="justify-content:space-between">
              <div class="sketch-text sm">Showing 38 companies · 8 sectors</div>
              <div class="row tight">
                <span class="chip fintech">FinTech 14</span>
                <span class="chip sw">SaaS 12</span>
                <span class="chip ai">AI 6</span>
                <span class="chip">+ 6</span>
              </div>
            </div>
          </div>
        </div>
        <!-- drawer -->
        <div style="padding:12px;background:var(--paper-2);border-left:1.5px solid var(--ink);overflow:auto">
          <div class="row" style="justify-content:space-between"><div class="sketch-text mono muted">PROFILE</div><div class="sketch-text sm">×</div></div>
          <div class="sketch-text xl" style="font-size:20px;margin-top:6px;font-family:var(--serif)">Crew</div>
          <div class="sketch-text sm muted">Lehi · FinTech · Seed</div>
          <div class="row tight" style="margin-top:6px"><span class="chip sage-tint">verified</span><span class="chip sky-tint">hiring</span></div>
          <div class="scribble full" style="margin-top:10px"></div>
          <div class="scribble med" style="margin-top:4px"></div>
          <div class="scribble short" style="margin-top:4px"></div>
          <div class="h-line"></div>
          <div class="sketch-text sm">Employees · 14</div>
          <div class="sketch-text sm">Founded · 2024</div>
          <div class="sketch-text sm">Web · trycrew.com</div>
          <div class="row tight" style="margin-top:10px"><div class="btn sm">Open page</div><div class="btn sm">.md</div><div class="btn sm">.json</div></div>
        </div>
      </div>
      <div class="callout br" style="bottom:-20px">familiar = fast<br/>to ship</div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Map-first, floating filter chips</div>
      <div class="note">Map fills the canvas. Filters compress into a chip bar across the top. Investor brief panel anchors bottom-left.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/map</div></div>
      <div style="position:relative;height:500px">
        <div class="mapbg"></div>
        <!-- pins -->
        <span class="pin" style="background:#16A34A;left:28%;top:32%"></span>
        <span class="pin" style="background:#16A34A;left:34%;top:38%"></span>
        <span class="pin sel" style="background:#16A34A;left:42%;top:42%"></span>
        <span class="pin" style="background:#16A34A;left:48%;top:48%"></span>
        <span class="pin" style="background:#16A34A;left:54%;top:54%"></span>
        <span class="pin" style="background:#16A34A;left:60%;top:36%"></span>
        <span class="pin" style="background:#2563EB;left:38%;top:60%"></span>
        <span class="pin" style="background:#0891B2;left:64%;top:50%"></span>

        <!-- top chip bar -->
        <div style="position:absolute;top:10px;left:10px;right:10px;display:flex;gap:6px;flex-wrap:wrap">
          <div class="box" style="background:var(--paper);padding:5px 10px"><div class="sketch-text sm">Sector ▾ <span class="chip fintech sm" style="margin-left:4px">FinTech</span></div></div>
          <div class="box" style="background:var(--paper);padding:5px 10px"><div class="sketch-text sm">Stage ▾ <strong>Seed</strong></div></div>
          <div class="box" style="background:var(--paper);padding:5px 10px"><div class="sketch-text sm">Size ▾ 2-50</div></div>
          <div class="box" style="background:var(--paper);padding:5px 10px"><div class="sketch-text sm">County ▾ Salt Lake +1</div></div>
          <div class="box ember" style="padding:5px 10px"><div class="sketch-text sm" style="color:var(--paper)">Hiring · ON</div></div>
          <div style="margin-left:auto" class="box" style="background:var(--paper);padding:5px 10px;margin-left:auto"><div class="sketch-text sm">⌕ search</div></div>
        </div>

        <!-- investor brief floating -->
        <div class="box" style="position:absolute;left:10px;bottom:10px;background:rgba(247,244,237,.94);padding:14px;max-width:340px">
          <div class="sketch-text mono muted">INVESTOR BRIEF · GENERATED</div>
          <div class="sketch-text lg" style="font-family:var(--serif);font-size:20px;margin:4px 0 6px">Utah seed-stage fintech</div>
          <div class="sketch-text sm">8 companies. Cluster themes: family neobanking, payments infrastructure, identity, estate planning.</div>
          <div class="row tight" style="margin-top:8px">
            <div class="btn sm">Tour these 8</div>
            <div class="btn ember sm">Generate PDF</div>
          </div>
        </div>

        <!-- legend -->
        <div class="box" style="position:absolute;right:10px;bottom:10px;background:var(--paper);padding:8px 10px">
          <div class="sketch-text mono muted">SECTORS</div>
          <div class="row tight" style="margin-top:4px"><span class="chip fintech">FinTech</span><span class="chip sw">SaaS</span></div>
          <div class="row tight" style="margin-top:4px"><span class="chip ai">AI</span><span class="chip aero">Aero</span></div>
        </div>
        <div class="callout tr" style="top:60px">brief = projector<br/>moment</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Map + list split</div>
      <div class="note">Map on left. Synced ranked list on right. Hover pin → highlight row, click row → fly to. Best for power-investors who want a working list.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/map</div></div>
      <div style="position:relative;height:500px;display:grid;grid-template-columns:1.1fr 1fr">
        <div style="position:relative;border-right:1.5px solid var(--ink)">
          <div class="mapbg"></div>
          <span class="pin" style="background:#16A34A;left:36%;top:30%"></span>
          <span class="pin sel" style="background:#16A34A;left:48%;top:40%"></span>
          <span class="pin" style="background:#16A34A;left:42%;top:55%"></span>
          <span class="pin" style="background:#16A34A;left:60%;top:48%"></span>
          <div class="box" style="position:absolute;bottom:10px;left:10px;background:var(--paper);padding:6px 10px"><div class="sketch-text sm">Salt Lake County · 4 pins</div></div>
        </div>
        <div style="padding:12px;background:var(--paper-2);overflow:auto">
          <div class="row" style="justify-content:space-between">
            <div class="sketch-text mono muted">38 RESULTS</div>
            <div class="sketch-text sm">Sort: relevance ▾</div>
          </div>
          <div class="stack-2" style="margin-top:8px">
            <div class="box" style="padding:10px;background:var(--ember);color:var(--paper);border-color:var(--ember)">
              <div class="row" style="justify-content:space-between"><div class="sketch-text" style="color:var(--paper)">Crew</div><div class="sketch-text mono">— hovered</div></div>
              <div class="sketch-text sm" style="color:var(--paper);opacity:.85">Lehi · FinTech · 14 ppl · Seed</div>
            </div>
            <div class="box" style="padding:10px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Bracket Labs</div><span class="chip fintech sm">fintech</span></div><div class="sketch-text sm muted">SLC · 9 ppl · Seed</div></div>
            <div class="box" style="padding:10px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Altitude AI</div><span class="chip ai sm">ai</span></div><div class="sketch-text sm muted">SLC · 6 ppl · Seed</div></div>
            <div class="box" style="padding:10px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Slate Pay</div><span class="chip fintech sm">fintech</span></div><div class="sketch-text sm muted">Park City · 4 ppl · Pre-seed</div></div>
            <div class="box" style="padding:10px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Quill Identity</div><span class="chip security sm">security</span></div><div class="sketch-text sm muted">Provo · 12 ppl · Seed</div></div>
            <div class="box dashed" style="padding:10px"><div class="sketch-text sm muted">+ 33 more</div></div>
          </div>
        </div>
        <div class="callout bl">spreadsheet brain<br/>+ map brain</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">D</span>Cluster gazetteer</div>
      <div class="note">Map zoomed out shows sector "regions" — colored shaded blobs labeled like a contour atlas. Click a region for the cluster brief. Most editorial.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/map?view=clusters</div></div>
      <div style="position:relative;height:500px">
        <div class="mapbg"></div>
        <!-- shaded clusters -->
        <div style="position:absolute;left:30%;top:30%;width:24%;height:18%;border-radius:50%;background:rgba(22,163,74,.22);border:1.5px dashed #16A34A;display:grid;place-items:center"><div class="sketch-text mono" style="color:#0a4a23;font-weight:700">FinTech (14)</div></div>
        <div style="position:absolute;left:14%;top:54%;width:18%;height:14%;border-radius:50%;background:rgba(8,145,178,.22);border:1.5px dashed #0891B2;display:grid;place-items:center"><div class="sketch-text mono" style="color:#0a4a55;font-weight:700">AI (6)</div></div>
        <div style="position:absolute;left:55%;top:60%;width:22%;height:16%;border-radius:50%;background:rgba(124,58,237,.18);border:1.5px dashed #7C3AED;display:grid;place-items:center"><div class="sketch-text mono" style="color:#3a1d6f;font-weight:700">Aero/Defense (9)</div></div>
        <div style="position:absolute;left:48%;top:25%;width:20%;height:14%;border-radius:50%;background:rgba(220,38,38,.18);border:1.5px dashed #DC2626;display:grid;place-items:center"><div class="sketch-text mono" style="color:#5a0c0c;font-weight:700">Bio/Med (7)</div></div>

        <div class="box" style="position:absolute;left:10px;top:10px;background:var(--paper);padding:8px 12px"><div class="sketch-text mono muted">UTAH ECOSYSTEM · 1,247 COMPANIES</div></div>
        <div class="box" style="position:absolute;right:10px;top:10px;background:var(--paper);padding:5px 10px"><div class="sketch-text sm">View · Clusters ▾</div></div>

        <!-- selected cluster brief -->
        <div class="box" style="position:absolute;left:10px;bottom:10px;max-width:320px;background:rgba(247,244,237,.95);padding:14px">
          <div class="sketch-text mono" style="color:#0a4a23">SELECTED CLUSTER · FINTECH</div>
          <div class="sketch-text" style="font-family:var(--serif);font-size:22px;margin:4px 0">14 fintech companies clustered around Lehi.</div>
          <div class="sketch-text sm">Family neobanking, payments infra, identity, estate planning. Median size 12 employees. Avg founded 2022.</div>
          <div class="row tight" style="margin-top:8px"><div class="btn sm">Zoom in</div><div class="btn sm">Brief PDF</div></div>
        </div>
        <div class="callout tr" style="top:50px">USGS-style<br/>land-use map</div>
      </div>
    </div>
  </article>
  `;
})();
