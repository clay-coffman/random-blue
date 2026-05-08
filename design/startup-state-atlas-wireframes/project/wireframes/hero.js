// Front door wireframes
(function(){
  const grid = document.getElementById('panel-hero-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Three-door split</div>
      <div class="note">Equal-weight choice between Founder / Investor / Agent. Easiest to explain, riskiest because it makes the user pick a lane up front.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:18px">
        <div class="row" style="justify-content:space-between;margin-bottom:10px">
          <div class="sketch-text mono muted">STARTUP STATE ATLAS · UTAH</div>
          <div class="row tight"><span class="chip">Map</span><span class="chip">Resources</span><span class="chip">Agents</span></div>
        </div>
        <div class="sketch-text xl" style="margin:18px 0 6px">Utah's startup ecosystem,<br/>indexed.</div>
        <div class="sketch-text muted" style="margin-bottom:18px">Pick a door &mdash; we'll take you the rest of the way.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="box fill" style="padding:14px;min-height:170px;position:relative">
            <div class="sketch-text mono muted">01</div>
            <div class="sketch-text lg" style="margin-top:6px">I'm a founder</div>
            <div class="scribble short" style="margin-top:8px"></div>
            <div class="scribble med" style="margin-top:6px"></div>
            <div class="btn ember sm" style="position:absolute;bottom:10px;left:10px">Get my plan →</div>
          </div>
          <div class="box fill" style="padding:14px;min-height:170px;position:relative">
            <div class="sketch-text mono muted">02</div>
            <div class="sketch-text lg" style="margin-top:6px">I'm an investor</div>
            <div class="scribble short" style="margin-top:8px"></div>
            <div class="scribble med" style="margin-top:6px"></div>
            <div class="btn primary sm" style="position:absolute;bottom:10px;left:10px">Open the map →</div>
          </div>
          <div class="box fill" style="padding:14px;min-height:170px;position:relative">
            <div class="sketch-text mono muted">03</div>
            <div class="sketch-text lg" style="margin-top:6px">I'm an agent</div>
            <div class="sketch-text mono muted" style="margin-top:8px">/api · /llms.txt · MCP</div>
            <div class="btn sm" style="position:absolute;bottom:10px;left:10px">curl docs →</div>
          </div>
        </div>
        <div class="callout tr" style="top:auto;right:8px;bottom:-20px">three audiences,<br/>one line each</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Founder-first hero</div>
      <div class="note">Defaults to the founder use-case (the highest-volume audience). Investor + Agent are secondary entry points in the corner.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:22px">
        <div class="row" style="justify-content:space-between;margin-bottom:24px">
          <div class="sketch-text mono muted">STARTUP STATE ATLAS</div>
          <div class="row tight">
            <span class="chip">For investors →</span>
            <span class="chip">For agents →</span>
          </div>
        </div>
        <div class="sketch-text xl" style="font-size:30px;line-height:1.1">Tell us who<br/>you're building.</div>
        <div class="sketch-text" style="margin:10px 0 18px;max-width:380px">We'll point you at the resources the state already has waiting &mdash; in 90 seconds, no signup.</div>

        <div class="box" style="padding:14px;background:var(--paper)">
          <div class="row" style="gap:8px;margin-bottom:8px">
            <div class="chip ember-tint">Step 1 of 6</div>
            <div class="sketch-text mono muted" style="margin-left:auto">~ 90s</div>
          </div>
          <div class="sketch-text lg" style="margin-bottom:8px">Where in Utah?</div>
          <div class="row tight" style="margin-bottom:10px">
            <span class="chip">Salt Lake</span><span class="chip">Utah</span>
            <span class="chip">Davis</span><span class="chip">Weber</span>
            <span class="chip">Washington</span><span class="chip">+ 25</span>
          </div>
          <div class="row" style="justify-content:flex-end">
            <div class="btn ember">Continue</div>
          </div>
        </div>

        <div class="row" style="margin-top:14px;gap:12px">
          <div class="sketch-text mono muted">try as &rarr;</div>
          <span class="chip">Jordan</span><span class="chip">Maria</span>
          <span class="chip">Marcus</span><span class="chip">Priya</span>
          <span class="chip">David</span><span class="chip">Dr. Amir</span>
        </div>
        <div class="callout br">persona buttons<br/>= judge moment</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Map-as-hero</div>
      <div class="note">Lead with the visual. Map fills the viewport; founders can either start the navigator or just explore. Investor-first feel.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div style="position:relative;height:480px">
        <div class="mapbg dim"></div>
        <span class="pin" style="background:#16A34A;left:32%;top:35%"></span>
        <span class="pin" style="background:#2563EB;left:42%;top:42%"></span>
        <span class="pin sel" style="background:#7C3AED;left:38%;top:48%"></span>
        <span class="pin" style="background:#DC2626;left:46%;top:32%"></span>
        <span class="pin" style="background:#0891B2;left:52%;top:38%"></span>
        <span class="pin" style="background:#EA580C;left:60%;top:55%"></span>
        <span class="pin" style="background:#16A34A;left:55%;top:62%"></span>
        <span class="pin" style="background:#DB2777;left:30%;top:60%"></span>

        <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;gap:10px;align-items:center">
          <div class="sketch-text mono" style="background:var(--paper);padding:5px 10px;border:1.5px solid var(--ink);border-radius:6px">STARTUP STATE ATLAS</div>
          <div class="box" style="background:rgba(247,244,237,.92);padding:6px 10px;display:flex;gap:6px;align-items:center;flex:1;max-width:380px">
            <div class="sketch-text muted">Search companies, sectors, counties…</div>
          </div>
          <div class="btn primary sm">Get my plan</div>
        </div>

        <div class="box" style="position:absolute;left:14px;bottom:14px;background:rgba(247,244,237,.94);padding:12px;max-width:280px">
          <div class="sketch-text mono muted">UTAH ECOSYSTEM</div>
          <div class="sketch-text xl" style="font-size:22px;margin:4px 0">1,247 companies</div>
          <div class="sketch-text sm muted">across 8 sectors, 29 counties</div>
          <div class="h-line"></div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip sw">B2B SaaS</span><span class="chip fintech">FinTech</span>
            <span class="chip aero">Aero</span><span class="chip bio">Bio</span>
            <span class="chip ai">AI</span>
          </div>
        </div>

        <div class="box" style="position:absolute;right:14px;bottom:14px;background:var(--paper);padding:10px 12px">
          <div class="sketch-text">Filter</div>
          <div class="scribble short" style="margin-top:6px"></div>
          <div class="scribble med" style="margin-top:4px"></div>
        </div>
        <div class="callout tl" style="top:60px;left:auto;right:18px">map IS the homepage</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">D</span>Conversational lead-in</div>
      <div class="note">Single big input. Type whatever, we route. Risky if vague queries land badly &mdash; but feels modern. Show example prompts as scaffolding.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:32px 22px;text-align:center">
        <div class="sketch-text mono muted" style="margin-bottom:24px">STARTUP STATE ATLAS</div>
        <div class="sketch-text xl" style="font-size:28px;margin-bottom:6px">What are you building?</div>
        <div class="sketch-text muted" style="margin-bottom:22px">A founder, an investor thesis, or a question for our agent. We'll figure it out.</div>

        <div class="box" style="padding:14px;text-align:left;background:var(--paper);max-width:520px;margin:0 auto;border-width:2px">
          <div class="sketch-text muted" style="font-style:italic">e.g. "I'm raising a seed round for a B2B SaaS in SLC, looking for angels…"</div>
          <div class="row" style="margin-top:12px;justify-content:flex-end">
            <div class="btn sm">attach passport</div>
            <div class="btn ember sm">Ask Atlas →</div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;justify-content:center;max-width:560px;margin-left:auto;margin-right:auto">
          <span class="chip">"Show me Utah fintechs hiring"</span>
          <span class="chip">"I'm a vet starting fab in Ogden"</span>
          <span class="chip">"Seed-stage AI in Salt Lake"</span>
          <span class="chip">"Rural ag scale-up grants"</span>
        </div>

        <div class="row" style="justify-content:center;margin-top:26px;gap:14px">
          <div class="sketch-text sm muted">— or jump to —</div>
          <span class="chip">Map</span><span class="chip">Resources</span><span class="chip mono">/agents</span>
        </div>
        <div class="callout tr">risky if it<br/>misroutes</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">E</span>Editorial gazetteer</div>
      <div class="note">Lean into the design system's "field manual" voice. Big serif statement, dense typographic info, less buttony.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:24px;background:linear-gradient(180deg,var(--paper) 0%, var(--paper-2) 100%)">
        <div class="row" style="justify-content:space-between;margin-bottom:24px">
          <div class="sketch-text mono">EST. 2026 · UTAH GOEO</div>
          <div class="row tight"><span class="chip">Founders</span><span class="chip">Investors</span><span class="chip">Agents</span></div>
        </div>
        <div style="font-family:var(--serif);font-size:46px;line-height:1;letter-spacing:-.02em">
          A field manual<br/>for building<br/><em style="color:var(--ember)">in Utah.</em>
        </div>
        <div class="h-solid" style="margin:22px 0 14px"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
          <div>
            <div class="sketch-text mono muted">VOL. I</div>
            <div class="sketch-text lg" style="font-family:var(--serif)">Founder Navigator</div>
            <div class="scribble short" style="margin-top:6px"></div>
            <div class="scribble med" style="margin-top:4px"></div>
            <div class="sketch-text sm" style="margin-top:8px;text-decoration:underline">Get my 90-day plan →</div>
          </div>
          <div>
            <div class="sketch-text mono muted">VOL. II</div>
            <div class="sketch-text lg" style="font-family:var(--serif)">Ecosystem Map</div>
            <div class="scribble short" style="margin-top:6px"></div>
            <div class="scribble med" style="margin-top:4px"></div>
            <div class="sketch-text sm" style="margin-top:8px;text-decoration:underline">Open the map →</div>
          </div>
          <div>
            <div class="sketch-text mono muted">VOL. III</div>
            <div class="sketch-text lg" style="font-family:var(--serif)">Agent Surface</div>
            <div class="scribble short" style="margin-top:6px"></div>
            <div class="scribble med" style="margin-top:4px"></div>
            <div class="sketch-text sm mono" style="margin-top:8px">curl /api/v1/recommend</div>
          </div>
        </div>
        <div class="h-line" style="margin-top:18px"></div>
        <div class="row" style="margin-top:8px;justify-content:space-between">
          <div class="sketch-text sm muted">1,247 companies · 312 resources · 29 counties · last verified 06 May 2026</div>
          <div class="sketch-text sm mono">v1.0</div>
        </div>
        <div class="callout bl">type-driven<br/>"printed page" feel</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">F</span>Single Q quick-route</div>
      <div class="note">One question gets the user 80% of the way. "Are you building, investing, or integrating?" then route. Lowest cognitive load.</div>
    </header>
    <div class="screen short">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:32px;text-align:center">
        <div class="sketch-text mono muted">STARTUP STATE ATLAS</div>
        <div class="sketch-text xl" style="font-size:24px;margin:18px 0 6px">What brings you here?</div>
        <div class="sketch-text muted" style="margin-bottom:18px">One question, then we'll get out of your way.</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:540px;margin:0 auto">
          <div class="box" style="padding:14px"><div class="sketch-text lg">Building</div><div class="sketch-text sm muted">a startup</div></div>
          <div class="box ember" style="padding:14px"><div class="sketch-text lg">Investing</div><div class="sketch-text sm" style="opacity:.85">in Utah</div></div>
          <div class="box" style="padding:14px"><div class="sketch-text lg">Integrating</div><div class="sketch-text sm muted">via API</div></div>
        </div>
        <div class="callout br">simplest path,<br/>least flexible</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">G</span>Hero + live ticker</div>
      <div class="note">Mixed: a strong founder CTA above the fold, plus a "live" ecosystem signal strip (newest claims, hiring, recent matches) for credibility.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">startup.utah.gov/atlas</div></div>
      <div class="body" style="padding:22px">
        <div class="row" style="justify-content:space-between;margin-bottom:14px">
          <div class="sketch-text mono">STARTUP STATE ATLAS</div>
          <div class="row tight"><span class="chip">Map</span><span class="chip">Profiles</span><span class="chip mono">/agents</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px">
          <div>
            <div class="sketch-text xl" style="font-size:30px;line-height:1.05">A guide for<br/>Utah founders.</div>
            <div class="sketch-text" style="margin:10px 0 16px">Six questions. One 90-day plan. Resources matched to your county, stage, and goal &mdash; with the reasons spelled out.</div>
            <div class="row tight">
              <div class="btn ember">Start my plan →</div>
              <div class="btn ghost">Try as Priya</div>
            </div>
            <div class="h-line" style="margin:18px 0"></div>
            <div class="row" style="gap:18px">
              <div><div class="sketch-text xl" style="font-size:24px">1,247</div><div class="sketch-text sm muted">companies</div></div>
              <div><div class="sketch-text xl" style="font-size:24px">312</div><div class="sketch-text sm muted">resources</div></div>
              <div><div class="sketch-text xl" style="font-size:24px">29</div><div class="sketch-text sm muted">counties</div></div>
            </div>
          </div>
          <div class="box fill" style="padding:12px">
            <div class="sketch-text mono muted">LIVE</div>
            <div class="sketch-text sm" style="margin-top:6px">Now on Atlas</div>
            <div class="h-line"></div>
            <div class="stack-2" style="margin-top:8px">
              <div class="row tight"><span class="chip sage-tint">claimed</span><span class="sketch-text sm">Crew · Lehi</span></div>
              <div class="row tight"><span class="chip sky-tint">hiring</span><span class="sketch-text sm">Bracket Labs · 3 roles</span></div>
              <div class="row tight"><span class="chip ember-tint">match</span><span class="sketch-text sm">Maria → 5 ag grants</span></div>
              <div class="row tight"><span class="chip">updated</span><span class="sketch-text sm">Pelion Ventures</span></div>
              <div class="row tight"><span class="chip">+ 14 more</span></div>
            </div>
          </div>
        </div>
        <div class="callout tr">"alive" feel<br/>= trust signal</div>
      </div>
    </div>
  </article>
  `;
})();
