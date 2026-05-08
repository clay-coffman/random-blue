// ===== INVESTOR MAP — B map-first primary, D cluster gazetteer toggle =====
(function(){
  const root = document.getElementById('panel-map');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Map-first with floating filter chips + investor-brief sidecar</h3>
      <span class="sub">B. Default working interface. View toggle (Companies / Clusters) lives top-right.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;border-radius:0;min-height:760px;background:#E8E1CF">
          <div class="chrome">
            <div class="dots"><i></i><i></i><i></i></div>
            <div class="url">/atlas/map?sector=fintech&stage=seed&size=2-10</div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">view: companies · projection mode</span>
          </div>
          <div class="body" style="padding:0;position:relative;height:720px">
            <div class="mapbg" style="position:absolute;inset:0"></div>

            <!-- topo lines -->
            <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:.35;pointer-events:none" viewBox="0 0 1400 720" preserveAspectRatio="none">
              <g stroke="#A89A78" stroke-width="1" fill="none">
                <path d="M0 380 Q 200 320, 400 380 T 800 380 T 1200 380 T 1400 380"/>
                <path d="M0 440 Q 200 380, 400 440 T 800 440 T 1200 440 T 1400 440"/>
                <path d="M0 500 Q 200 440, 400 500 T 800 500 T 1200 500 T 1400 500"/>
                <path d="M0 560 Q 200 500, 400 560 T 800 560 T 1200 560 T 1400 560"/>
                <path d="M0 620 Q 200 560, 400 620 T 800 620 T 1200 620 T 1400 620"/>
              </g>
              <text x="780" y="160" font-family="Roboto Serif, Georgia, serif" font-size="14" fill="#A89A78" letter-spacing="6">— GREAT SALT LAKE —</text>
              <text x="500" y="450" font-family="Roboto Serif, Georgia, serif" font-style="italic" font-size="14" fill="#A89A78">Wasatch Range</text>
              <text x="900" y="600" font-family="Roboto Serif, Georgia, serif" font-style="italic" font-size="14" fill="#A89A78">Uinta Mountains</text>
            </svg>

            <!-- TOP BAR: filters + view toggle -->
            <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;z-index:5">
              <div class="row tight">
                ${filter('Sector', 'FinTech', true)}
                ${filter('Stage', 'Seed', true)}
                ${filter('Size', '2–10', true)}
                ${filter('County', 'Salt Lake +1', true)}
                ${filter('Hiring', 'Any', false)}
                ${filter('Verified', 'Any', false)}
                <span class="btn ghost sm" style="background:#fff">+ Filter</span>
                <span class="sketch-text mono sm" style="color:var(--ink);background:var(--paper);padding:3px 7px;border-radius:4px;border:1.5px solid var(--ink)"><strong>14</strong> companies match</span>
              </div>
              <div class="row tight" style="background:#fff;border:1.5px solid var(--ink);border-radius:8px;padding:3px;box-shadow:2px 2px 0 var(--ink)">
                <span class="sketch-text" style="font-weight:700;font-size:13px;background:var(--ink);color:var(--paper);padding:5px 10px;border-radius:5px">Companies</span>
                <span class="sketch-text muted" style="font-weight:700;font-size:13px;padding:5px 10px">Clusters</span>
                <span class="sketch-text muted" style="font-weight:700;font-size:13px;padding:5px 10px">Heat</span>
              </div>
            </div>

            <!-- SEARCH -->
            <div style="position:absolute;top:62px;left:14px;background:#fff;border:1.5px solid var(--ink);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;box-shadow:3px 3px 0 var(--ink);z-index:5;min-width:280px">
              <span class="sketch-text mono sm">⌕</span>
              <span class="sketch-text muted">Search a company, founder, or sector…</span>
              <span class="kbd" style="margin-left:auto">⌘K</span>
            </div>

            <!-- pins -->
            <div class="pin sel" style="left:42%;top:38%"></div>
            <div class="pin" style="left:46%;top:35%;background:var(--sector-fintech, #16A34A)"></div>
            <div class="pin" style="left:38%;top:42%;background:#16A34A"></div>
            <div class="pin" style="left:48%;top:46%;background:#16A34A"></div>
            <div class="pin" style="left:44%;top:54%;background:#16A34A"></div>
            <div class="pin" style="left:52%;top:42%;background:#16A34A"></div>
            <div class="pin" style="left:50%;top:58%;background:#16A34A"></div>
            <div class="pin" style="left:36%;top:34%;background:#16A34A"></div>
            <div class="pin" style="left:60%;top:50%;background:#7C3AED;opacity:.45"></div>
            <div class="pin" style="left:64%;top:60%;background:#2563EB;opacity:.45"></div>
            <div class="pin" style="left:30%;top:48%;background:#16A34A"></div>
            <div class="pin" style="left:33%;top:52%;background:#16A34A"></div>
            <div class="pin" style="left:55%;top:36%;background:#16A34A"></div>
            <div class="pin" style="left:58%;top:48%;background:#16A34A"></div>
            <div class="pin" style="left:34%;top:38%;background:#0891B2;opacity:.45"></div>

            <!-- Selected card -->
            <div style="position:absolute;left:48%;top:30%;background:#fff;border:1.5px solid var(--ink);padding:8px 10px;border-radius:6px;box-shadow:3px 3px 0 var(--ink);min-width:160px;z-index:6">
              <div class="sketch-text mono sm" style="color:var(--sage)">FINTECH · SEED</div>
              <div class="sketch-text" style="font-weight:700">Crew</div>
              <div class="sketch-text sm muted">Lehi · 14 · hiring 3</div>
            </div>

            <!-- LEFT BOTTOM: legend + cluster names -->
            <div style="position:absolute;left:14px;bottom:14px;background:#fff;border:1.5px solid var(--ink);padding:10px 12px;border-radius:6px;box-shadow:3px 3px 0 var(--ink);z-index:5">
              <div class="sketch-text mono sm" style="color:var(--ink-3);margin-bottom:6px">SECTOR LEGEND</div>
              <div class="row tight">
                <span class="chip dot fintech">FinTech · 14</span>
                <span class="chip dot sw">Software · faded</span>
                <span class="chip dot aero">Aero · faded</span>
                <span class="chip dot ai">AI · faded</span>
              </div>
            </div>

            <!-- BOTTOM-RIGHT: investor brief -->
            <div style="position:absolute;right:14px;top:62px;bottom:14px;width:340px;background:var(--paper-2);border:1.5px solid var(--ink);border-radius:10px;box-shadow:5px 5px 0 var(--ink);overflow:hidden;display:flex;flex-direction:column;z-index:6">
              <div style="padding:10px 14px;background:var(--ink);color:var(--paper);display:flex;justify-content:space-between;align-items:center">
                <span class="sketch-text mono sm" style="color:var(--ember-tint);font-weight:600">↓ INVESTOR BRIEF</span>
                <span class="kbd" style="background:transparent;color:var(--paper);border-color:var(--paper)">B</span>
              </div>
              <div style="padding:14px;overflow-y:auto;flex:1">
                <div class="sketch-text" style="font-family:var(--serif);font-size:22px;font-weight:500;line-height:1.15">Utah seed-stage fintech</div>
                <div class="sketch-text sm muted">14 companies · SLC + Lehi · 2-10 employees · ~$60M aggregated raised</div>

                <div style="margin-top:14px">
                  <div class="sketch-text mono sm" style="color:var(--ember)">CLUSTER THEMES</div>
                  <div class="stack-2" style="margin-top:6px">
                    ${theme('Family neobanking', 4, 'Crew · Greenlight clones · …')}
                    ${theme('Payments infrastructure', 3, 'Bracket · Routable · …')}
                    ${theme('Identity / KYC', 3, 'Persona-style')}
                    ${theme('Estate planning', 2)}
                    ${theme('Construction finance', 2)}
                  </div>
                </div>

                <div style="margin-top:14px">
                  <div class="sketch-text mono sm" style="color:var(--sky)">NOTABLE RAISES (12 mo)</div>
                  <div class="stack-2" style="margin-top:6px">
                    <div class="box" style="padding:6px 10px;display:flex;justify-content:space-between"><span class="sketch-text sm">Crew · seed</span><span class="sketch-text mono sm">$8M</span></div>
                    <div class="box" style="padding:6px 10px;display:flex;justify-content:space-between"><span class="sketch-text sm">Bracket · seed</span><span class="sketch-text mono sm">$12M</span></div>
                    <div class="box" style="padding:6px 10px;display:flex;justify-content:space-between"><span class="sketch-text sm">+ 4 more</span><span class="sketch-text mono sm muted">view</span></div>
                  </div>
                </div>

                <div style="margin-top:14px">
                  <div class="sketch-text mono sm" style="color:var(--sage)">HIRING NOW</div>
                  <div class="sketch-text sm muted" style="margin-top:4px">8 / 14 hiring · 27 open roles · majority engineering &amp; ops.</div>
                </div>
              </div>
              <div style="padding:10px 14px;border-top:1.5px solid var(--topo);background:var(--paper);display:flex;justify-content:space-between;gap:6px">
                <span class="btn sm">📄 Export PDF</span>
                <span class="btn sm">📋 Copy summary</span>
                <span class="btn primary sm">Open list →</span>
              </div>
            </div>

            <!-- BOTTOM controls -->
            <div style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:#fff;border:1.5px solid var(--ink);padding:6px 10px;border-radius:8px;box-shadow:3px 3px 0 var(--ink);display:flex;align-items:center;gap:10px;z-index:5">
              <span class="kbd">−</span>
              <span class="sketch-text mono sm">zoom 9</span>
              <span class="kbd">+</span>
              <span class="sketch-text mono sm" style="color:var(--ink-3);margin-left:8px">|  reset · share view</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =========== COMPLEMENT: D Cluster gazetteer toggle =========== -->
    <div class="section-label" style="margin-top:48px">
      <span class="badge complement">Complement</span>
      <h3>Cluster gazetteer mode — D</h3>
      <span class="sub">Toggle from "Companies" to "Clusters." Editorial register, projection-friendly, opening state for first-time investors.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0">
        <div class="screen tall" style="border:0;min-height:560px">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/atlas/map?view=clusters</div></div>
          <div class="body" style="padding:0;position:relative;height:520px;background:#F0EBDB">
            <div class="mapbg"></div>
            <!-- editorial header -->
            <div style="position:absolute;top:18px;left:18px;right:18px;text-align:center">
              <div class="sketch-text mono sm" style="color:var(--ink-3);letter-spacing:.2em">— A T L A S · A   G A Z E T T E E R   O F   U T A H   E N T E R P R I S E —</div>
            </div>

            <!-- cluster blobs -->
            ${cluster(28, 28, 180, 130, 'FINTECH CLUSTER', 'Lehi / Silicon Slopes', 14, '#16A34A')}
            ${cluster(46, 16, 220, 120, 'B2B SOFTWARE', 'Salt Lake / Lehi', 38, '#2563EB')}
            ${cluster(70, 30, 160, 110, 'AEROSPACE & DEFENSE', 'Ogden / Provo', 11, '#7C3AED')}
            ${cluster(20, 56, 170, 110, 'LIFE SCIENCES', 'University of Utah', 22, '#DC2626')}
            ${cluster(48, 60, 200, 120, 'AI / ML', 'Lehi / SLC', 19, '#0891B2')}
            ${cluster(76, 64, 140, 100, 'ENERGY', 'Wasatch Front', 7, '#EA580C')}

            <!-- selected cluster panel -->
            <div style="position:absolute;right:18px;bottom:18px;width:300px;background:var(--paper-2);border:1.5px solid var(--ink);border-radius:10px;box-shadow:5px 5px 0 var(--ink);padding:12px 14px">
              <div class="sketch-text mono sm" style="color:var(--ember)">↓ FINTECH CLUSTER · LEHI</div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:22px;font-weight:500;line-height:1.1;margin-top:4px">14 companies. 162 employees. Median 12.</div>
              <div class="sketch-text sm muted" style="margin-top:6px;line-height:1.5">Common themes: family neobanking, payments infrastructure, identity, estate planning, construction finance.</div>
              <div class="row tight" style="margin-top:10px">
                <span class="btn sm">Open list</span>
                <span class="btn sm">Generate brief</span>
                <span class="btn primary sm">Investor tour →</span>
              </div>
            </div>

            <div style="position:absolute;left:18px;bottom:18px;background:#fff;border:1.5px solid var(--ink);padding:6px 10px;border-radius:6px;font-family:var(--mono);font-size:11px">
              ← back to companies · zoom 7 · 6 clusters
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- secondary surfaces: list view, profile drawer -->
    <div class="grid two" style="margin-top:36px">
      <div class="variant">
        <header><div class="label"><span class="opt">list</span>Same data, list view ("Open list →")</div>
        <div class="note">Investors who want to scan tables get a sortable list with the same filter chips at the top.</div></header>
        <div class="screen short">
          <div class="body" style="padding:0">
            <div style="display:grid;grid-template-columns:1.4fr 80px 80px 90px 90px;padding:8px 12px;border-bottom:1.5px solid var(--ink);background:var(--stone);font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:var(--ink-3)">
              <span>COMPANY</span><span>STAGE</span><span>EMPL</span><span>HIRING</span><span>LAST RAISE</span>
            </div>
            ${listRow('Crew · Lehi · family neobanking','seed','14','3','Apr · $8M', true)}
            ${listRow('Bracket Labs · SLC · payments','seed','9','5','Mar · $12M')}
            ${listRow('Vault Identity · Lehi · KYC','seed','6','—','—')}
            ${listRow('Helm Estate · SLC · planning','pre-seed','4','2','Jan · $1M')}
            ${listRow('Routable · Lehi · invoice','growth','42','7','last yr')}
            ${listRow('Anchor Pay · Provo · merchant','seed','5','—','—')}
          </div>
        </div>
      </div>

      <div class="variant">
        <header><div class="label"><span class="opt">drawer</span>Click a pin → company drawer</div>
        <div class="note">Drawer slides in from the right; same content as the full profile, condensed. Has the agent-card teaser.</div></header>
        <div class="screen short" style="position:relative">
          <div class="mapbg"></div>
          <div style="position:absolute;right:0;top:0;bottom:0;width:62%;background:#fff;border-left:1.5px solid var(--ink);padding:12px 14px;overflow:hidden">
            <div class="row between"><div>
              <div class="sketch-text mono sm" style="color:var(--sage)">FINTECH · SEED · LEHI</div>
              <div class="sketch-text xl">Crew</div>
            </div><span class="chip sage-tint">verified</span></div>
            <div class="sketch-text sm muted" style="margin-top:8px">Family neobanking. 14 employees. Hiring 3 — eng, growth, design.</div>
            <div class="row tight" style="margin-top:10px">
              <span class="btn sm">crew.com</span>
              <span class="btn sm">jobs</span>
              <span class="btn primary sm">Open profile</span>
            </div>
            <div class="box dashed" style="padding:8px;margin-top:14px">
              <div class="sketch-text mono sm" style="color:var(--ink-3)">↓ AGENT CARD</div>
              <div class="sketch-text sm">.md · .json · API</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- rationale -->
    <div class="grid two" style="margin-top:32px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Map-first works for the founder + investor + judge</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Floating filters keep the map dominant — that's the visual. The investor-brief sidecar makes filter changes feel like research moves, not toy interactions. The view toggle in the corner lets the demo pivot to the gazetteer without leaving the surface.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Cluster gazetteer is the projection mode</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">D is too stylized for daily lookup, but it's the most original visual in the deck. Reserved as the opening state and the projection-screen view investors see in a board room.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Three map directions we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutMap('A','Sidebar-driven (filters left, map right, list bottom)','Standard real-estate-portal layout. Functional, but the map is squeezed and the brief panel competes with the filter panel.','map gets crowded out')}
      ${cutMap('C','Heat-map only',`Beautiful aggregate, but you can't click a company. Save heat as a third toggle, not the default.`,'no individual lookup')}
      ${cutMap('E','Tile gallery (no map)',`Just photo cards of every company. Loses the geographic story entirely.`,'kills the geography')}
    </div>
  `;

  function filter(name, val, on){
    return `<span class="chip ${on?'ink':''}" style="${on?'':'background:#fff'};font-weight:700">${name}: <span style="font-weight:400;${on?'color:var(--paper)':'color:var(--ink-3)'};margin-left:4px">${val}</span> ▾</span>`;
  }

  function theme(name, n, sub){
    return `<div class="box" style="padding:8px 10px;background:#fff">
      <div class="row between"><span class="sketch-text" style="font-weight:700">${name}</span><span class="chip" style="font-size:11px;padding:1px 6px">${n}</span></div>
      ${sub?`<div class="sketch-text sm muted">${sub}</div>`:''}
    </div>`;
  }

  function cluster(left, top, w, h, title, sub, n, color){
    return `<div style="position:absolute;left:${left}%;top:${top}%;width:${w}px;height:${h}px;border:2px dashed ${color};border-radius:50%;background:${color}20;display:grid;place-items:center;text-align:center">
      <div>
        <div class="sketch-text mono sm" style="color:${color};letter-spacing:.08em;font-weight:700">${title}</div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:30px;line-height:1;font-weight:500;color:var(--ink)">${n}</div>
        <div class="sketch-text sm muted">${sub}</div>
      </div>
    </div>`;
  }

  function listRow(t, stage, e, h, raise, sel){
    return `<div style="display:grid;grid-template-columns:1.4fr 80px 80px 90px 90px;padding:9px 12px;border-bottom:1px dashed var(--topo);${sel?'background:var(--ember-tint)':''};font-size:13px;font-family:var(--body)">
      <span>${t}</span><span class="sketch-text sm">${stage}</span><span class="sketch-text sm">${e}</span><span class="sketch-text sm">${h}</span><span class="sketch-text sm">${raise}</span>
    </div>`;
  }

  function cutMap(opt, title, body, why){
    return `<div class="variant cut">
      <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
      <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:6px">${cutThumb(opt)}</div></div>
      <div class="note" style="margin-top:10px">${body}</div>
      <div class="why-cut">${why}</div>
    </div>`;
  }
  function cutThumb(opt){
    if(opt==='A') return `<div style="display:grid;grid-template-columns:90px 1fr;gap:4px;height:160px"><div class="box fill"><div class="scribble short" style="margin:8px"></div><div class="scribble med" style="margin:6px 8px"></div><div class="scribble short" style="margin:6px 8px"></div></div><div class="box" style="position:relative;overflow:hidden"><div class="mapbg"></div><div class="pin" style="left:30%;top:50%"></div><div class="pin" style="left:60%;top:30%"></div></div></div>`;
    if(opt==='C') return `<div style="height:160px;position:relative;overflow:hidden;border-radius:4px"><div class="mapbg"></div><div style="position:absolute;inset:0;background:radial-gradient(circle at 40% 50%, rgba(194,65,12,.6), transparent 28%),radial-gradient(circle at 60% 40%, rgba(194,65,12,.5), transparent 25%),radial-gradient(circle at 50% 70%, rgba(37,99,235,.4), transparent 22%)"></div></div>`;
    if(opt==='E') return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;height:160px">${Array(6).fill(0).map(()=>`<div class="box fill" style="padding:6px"><div class="box" style="height:30px;background:var(--topo)"></div><div class="scribble short" style="margin-top:4px"></div></div>`).join('')}</div>`;
  }
})();
