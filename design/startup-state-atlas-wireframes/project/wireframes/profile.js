// Company profile wireframes
(function(){
  const grid = document.getElementById('panel-profile-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Classic profile page (human view)</div>
      <div class="note">Hero with logo, key facts table, description, jobs, gallery. Familiar Crunchbase/LinkedIn shape.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew</div></div>
      <div class="body" style="padding:18px">
        <div class="row" style="gap:14px;align-items:flex-start">
          <div class="box fill" style="width:64px;height:64px;display:grid;place-items:center;font-family:var(--serif);font-size:28px;flex:none">C</div>
          <div style="flex:1">
            <div class="row" style="justify-content:space-between;align-items:center">
              <div>
                <div class="sketch-text xl" style="font-family:var(--serif);font-size:28px">Crew</div>
                <div class="sketch-text sm muted">Lehi · FinTech · Seed · 14 employees</div>
              </div>
              <div class="row tight">
                <span class="chip sage-tint">verified</span>
                <span class="chip sky-tint">hiring · 3</span>
                <div class="btn sm">Claim</div>
              </div>
            </div>
            <div class="row tight" style="margin-top:8px">
              <span class="chip fintech">FinTech</span><span class="chip">family banking</span><span class="chip">payments</span>
            </div>
          </div>
        </div>
        <div class="h-line" style="margin:14px 0"></div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:18px">
          <div>
            <div class="sketch-text mono muted">ABOUT</div>
            <div class="scribble full" style="margin-top:6px"></div>
            <div class="scribble full" style="margin-top:4px"></div>
            <div class="scribble med" style="margin-top:4px"></div>
            <div class="scribble short" style="margin-top:4px"></div>
            <div class="sketch-text mono muted" style="margin-top:14px">OPEN ROLES · 3</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="box" style="padding:8px 10px"><div class="row" style="justify-content:space-between"><div class="sketch-text sm">Senior backend engineer</div><div class="sketch-text sm muted">Lehi · remote OK</div></div></div>
              <div class="box" style="padding:8px 10px"><div class="row" style="justify-content:space-between"><div class="sketch-text sm">Product designer</div><div class="sketch-text sm muted">Lehi</div></div></div>
              <div class="box" style="padding:8px 10px"><div class="row" style="justify-content:space-between"><div class="sketch-text sm">Compliance lead</div><div class="sketch-text sm muted">Lehi</div></div></div>
            </div>
            <div class="sketch-text mono muted" style="margin-top:14px">GALLERY</div>
            <div class="row" style="margin-top:6px">
              <div class="box fill" style="width:90px;height:60px"></div>
              <div class="box fill" style="width:90px;height:60px"></div>
              <div class="box fill" style="width:90px;height:60px"></div>
            </div>
          </div>
          <div>
            <div class="sketch-text mono muted">FACTS</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Founded</div><div class="sketch-text sm">2024</div></div>
              <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Stage</div><div class="sketch-text sm">Seed</div></div>
              <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Employees</div><div class="sketch-text sm">14</div></div>
              <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Web</div><div class="sketch-text sm">trycrew.com</div></div>
              <div class="row" style="justify-content:space-between"><div class="sketch-text sm">LinkedIn</div><div class="sketch-text sm">/co/crew</div></div>
            </div>
            <div class="sketch-text mono muted" style="margin-top:14px">AGENT CARD</div>
            <div class="row tight" style="margin-top:6px"><div class="btn sm">.md</div><div class="btn sm">.json</div><div class="btn sm">/llms.txt</div></div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Dual-pane: human + agent side-by-side</div>
      <div class="note">Left = profile as a person sees it. Right = the .md/.json the same data renders as for an agent. The "business is the website" thesis made visible.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew</div></div>
      <div class="body" style="padding:0">
        <div style="display:grid;grid-template-columns:1fr 1fr;min-height:480px">
          <div style="padding:14px;border-right:1.5px solid var(--ink)">
            <div class="sketch-text mono muted">HUMAN VIEW</div>
            <div class="row" style="margin-top:6px;gap:10px">
              <div class="box fill" style="width:48px;height:48px;display:grid;place-items:center;font-family:var(--serif);font-size:22px">C</div>
              <div><div class="sketch-text xl" style="font-family:var(--serif);font-size:22px">Crew</div><div class="sketch-text sm muted">Family neobanking · Lehi</div></div>
            </div>
            <div class="row tight" style="margin-top:8px"><span class="chip fintech">FinTech</span><span class="chip sage-tint">verified</span><span class="chip sky-tint">hiring</span></div>
            <div class="h-line"></div>
            <div class="scribble full" style="margin-top:4px"></div>
            <div class="scribble full" style="margin-top:4px"></div>
            <div class="scribble med" style="margin-top:4px"></div>
            <div class="sketch-text mono muted" style="margin-top:12px">FACTS</div>
            <div class="row tight" style="margin-top:4px"><span class="chip">14 ppl</span><span class="chip">2024</span><span class="chip">Seed</span></div>
          </div>
          <div style="padding:14px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:11.5px;line-height:1.55">
            <div style="opacity:.6">// /startups/crew.md</div>
            # Crew<br/>
            <br/>
            > Family neobanking. Lehi, UT. Seed.<br/>
            <br/>
            - <strong style="color:#FBE7DC">id:</strong> co_crew<br/>
            - <strong style="color:#FBE7DC">sector:</strong> FinTech<br/>
            - <strong style="color:#FBE7DC">stage:</strong> seed<br/>
            - <strong style="color:#FBE7DC">employees:</strong> 14<br/>
            - <strong style="color:#FBE7DC">founded:</strong> 2024<br/>
            - <strong style="color:#FBE7DC">website:</strong> trycrew.com<br/>
            - <strong style="color:#FBE7DC">hiring:</strong> true<br/>
            - <strong style="color:#FBE7DC">verified:</strong> 2026-05-04<br/>
            <br/>
            ## What we sell<br/>
            <span style="color:#C4B89B">Family-shared bank accounts with allowance and...</span>
            <div style="margin-top:14px;opacity:.8">— same source feeds .json, /api/v1/companies/crew, and llms.txt</div>
          </div>
        </div>
        <div class="callout tr">human + agent<br/>same source</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Drawer (in-map)</div>
      <div class="note">Used when investor clicks a pin on the map. Compressed profile, key facts, link out to full page. Has to feel "good enough" to not need the page.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/map?co=crew</div></div>
      <div style="position:relative;height:500px">
        <div class="mapbg dim"></div>
        <span class="pin sel" style="background:#16A34A;left:30%;top:38%"></span>
        <span class="pin" style="background:#16A34A;left:18%;top:30%"></span>
        <span class="pin" style="background:#2563EB;left:22%;top:60%"></span>

        <div class="box" style="position:absolute;right:0;top:0;bottom:0;width:55%;background:var(--paper);padding:18px;overflow:auto;box-shadow:-8px 0 24px rgba(15,27,45,.12)">
          <div class="row" style="justify-content:space-between">
            <div class="sketch-text mono muted">PROFILE · CO_CREW</div>
            <div class="sketch-text sm">×</div>
          </div>
          <div class="row" style="margin-top:10px;gap:12px">
            <div class="box fill" style="width:56px;height:56px;display:grid;place-items:center;font-family:var(--serif);font-size:24px">C</div>
            <div>
              <div class="sketch-text xl" style="font-family:var(--serif);font-size:26px">Crew</div>
              <div class="sketch-text sm muted">Lehi · FinTech · Seed · 14 employees</div>
              <div class="row tight" style="margin-top:6px"><span class="chip sage-tint">verified</span><span class="chip sky-tint">3 jobs</span></div>
            </div>
          </div>
          <div class="h-line" style="margin:12px 0"></div>
          <div class="scribble full"></div><div class="scribble full" style="margin-top:4px"></div><div class="scribble med" style="margin-top:4px"></div>
          <div class="sketch-text mono muted" style="margin-top:14px">JOBS</div>
          <div class="stack-2" style="margin-top:6px">
            <div class="box" style="padding:8px 10px"><div class="sketch-text sm">Senior backend engineer</div></div>
            <div class="box" style="padding:8px 10px"><div class="sketch-text sm">Product designer</div></div>
          </div>
          <div class="row" style="margin-top:14px;justify-content:space-between">
            <div class="row tight"><div class="btn sm">.md</div><div class="btn sm">.json</div></div>
            <div class="btn ember sm">Open full page →</div>
          </div>
        </div>
        <div class="callout bl">drawer = the<br/>"investor moment"</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">D</span>Editorial company spread</div>
      <div class="note">Treat each company like a magazine spread. Big serif headline, pulled quotes, hero image, footer with mono facts. Best for "show to investors" feel.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew?view=editorial</div></div>
      <div class="body" style="padding:0">
        <div class="box fill" style="height:140px;border-radius:0;border-left:0;border-right:0;border-top:0;display:grid;place-items:center"><div class="sketch-text muted">— hero image —</div></div>
        <div style="padding:20px">
          <div class="row" style="justify-content:space-between">
            <div class="sketch-text mono muted">VOL. III · ISSUE 47 · UTAH FINTECH</div>
            <div class="sketch-text mono muted">CO_CREW</div>
          </div>
          <div style="font-family:var(--serif);font-size:36px;line-height:1.05;margin:8px 0 10px;letter-spacing:-.02em">A neobank for the family ledger.</div>
          <div class="sketch-text" style="font-family:var(--serif);font-size:16px;line-height:1.55">Lehi, UT &mdash; Crew is building a family-shared banking app that puts allowance, savings, and bill splits onto a single ledger.</div>
          <div class="h-line" style="margin:14px 0"></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <div><div class="sketch-text mono muted">FOUNDED</div><div class="sketch-text lg">2024</div></div>
            <div><div class="sketch-text mono muted">STAGE</div><div class="sketch-text lg">Seed</div></div>
            <div><div class="sketch-text mono muted">EMPLOYEES</div><div class="sketch-text lg">14</div></div>
            <div><div class="sketch-text mono muted">HIRING</div><div class="sketch-text lg" style="color:var(--ember)">3 roles</div></div>
          </div>
          <div class="h-line" style="margin:14px 0"></div>
          <div class="row tight"><div class="btn sm">trycrew.com</div><div class="btn sm">LinkedIn</div><div class="btn sm">/api/v1/companies/crew</div></div>
        </div>
        <div class="callout tr">projector-ready<br/>"magazine" feel</div>
      </div>
    </div>
  </article>
  `;
})();
