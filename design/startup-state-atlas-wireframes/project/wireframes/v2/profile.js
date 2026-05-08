// ===== COMPANY PROFILE — A classic primary, B agent-card reveal complement =====
(function(){
  const root = document.getElementById('panel-profile');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Classic profile page — familiar, useful, with the Agent Card one click away</h3>
      <span class="sub">A. Hero, sections, jobs, gallery, facts. Agent Card lives in the right rail and as a tab.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;min-height:780px">
          <div class="chrome">
            <div class="dots"><i></i><i></i><i></i></div>
            <div class="url">/startups/crew</div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">human view · agent reveal one click away</span>
          </div>
          <div class="body" style="padding:0">

            <!-- HERO -->
            <div style="padding:32px 40px 24px;border-bottom:1.5px solid var(--ink);display:grid;grid-template-columns:96px 1fr auto;gap:24px;align-items:flex-start">
              <div class="box fill" style="width:96px;height:96px;display:grid;place-items:center;font-family:var(--serif);font-size:48px">C</div>
              <div>
                <div class="row tight">
                  <span class="chip dot fintech">FinTech</span>
                  <span class="chip">Seed</span>
                  <span class="chip sage-tint">verified · domain</span>
                  <span class="chip ember-tint">hiring 3</span>
                </div>
                <div class="sketch-text xxl" style="font-size:46px;margin-top:8px">Crew</div>
                <div class="sketch-text" style="font-size:18px;color:var(--ink-2);margin-top:4px">Family neobanking for the way modern parents actually move money.</div>
                <div class="row tight" style="margin-top:10px">
                  <span class="sketch-text mono sm" style="color:var(--ink-3)">Lehi, UT</span>
                  <span class="sketch-text mono sm" style="color:var(--ink-3)">· founded 2022</span>
                  <span class="sketch-text mono sm" style="color:var(--ink-3)">· 14 employees</span>
                  <span class="sketch-text mono sm" style="color:var(--ink-3)">· last update 2d ago</span>
                </div>
              </div>
              <div class="col" style="gap:8px">
                <span class="btn ember">↗ Visit website</span>
                <span class="btn">View 3 open roles</span>
                <span class="btn ghost sm">Claim this profile</span>
              </div>
            </div>

            <!-- TABS -->
            <div style="padding:0 40px;border-bottom:1.5px solid var(--ink);background:var(--paper-2);display:flex;gap:0">
              ${pTab('Overview', true)}
              ${pTab('Open roles · 3', false)}
              ${pTab('Gallery', false)}
              ${pTab('Facts', false)}
              <div style="margin-left:auto;display:flex;gap:0;align-items:center">
                ${pTab('Agent Card', false, true)}
              </div>
            </div>

            <!-- BODY -->
            <div style="display:grid;grid-template-columns:1fr 360px;gap:0;min-height:480px">
              <!-- main -->
              <div style="padding:28px 40px">
                <div class="sketch-text mono sm" style="color:var(--ink-3)">ABOUT</div>
                <div class="sketch-text" style="font-family:var(--serif);font-size:18px;line-height:1.55;color:var(--ink-2);margin-top:6px;max-width:620px">
                  Crew helps families share allowance, savings, and chore-based earning across kids and parents — a single account with kid debit cards, parent-set guardrails, and a lightweight learning layer. Built for households with two working parents.
                </div>

                <div style="margin-top:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
                  ${factTile('Stage','Seed')}
                  ${factTile('Last raise','$8M · Apr 2026')}
                  ${factTile('Customers','38,000 households')}
                  ${factTile('Hiring','Eng, growth, design')}
                </div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:28px">OPEN ROLES (3)</div>
                <div class="stack-2" style="margin-top:8px">
                  ${role('Senior backend engineer','Eng · Lehi or remote · $160-200k')}
                  ${role('Growth marketing lead','GTM · Lehi · $130-160k')}
                  ${role('Product designer (mobile)','Design · Lehi · $110-150k')}
                </div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:28px">GALLERY</div>
                <div style="margin-top:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
                  ${img('office')}${img('app screenshot')}${img('team')}${img('+ 6')}
                </div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:28px">ON THE MAP</div>
                <div class="screen short" style="margin-top:8px;min-height:140px;position:relative">
                  <div class="mapbg"></div>
                  <div class="pin sel" style="left:48%;top:55%"></div>
                  <div class="pin" style="left:35%;top:35%;background:var(--sage)"></div>
                  <div class="pin" style="left:60%;top:42%;background:var(--sage)"></div>
                </div>
              </div>

              <!-- right rail -->
              <div style="padding:24px 24px 24px 0">
                <!-- Agent Card teaser -->
                <div class="box ink" style="padding:14px;border-color:var(--ink);box-shadow:5px 5px 0 var(--ember);position:relative">
                  <div class="callout tr" style="color:var(--ember-tint)">↓ this is the differentiator</div>
                  <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.1em;font-weight:600">↓ AGENT CARD</div>
                  <div class="sketch-text" style="color:var(--paper);font-family:var(--serif);font-size:20px;font-weight:500;margin-top:6px;line-height:1.2">This same profile, served to AI agents.</div>
                  <div class="stack-2" style="margin-top:10px">
                    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--paper);padding:6px 8px;background:rgba(247,244,237,.08);border-radius:4px"><span>/startups/crew.md</span><span style="color:var(--ember-tint)">↗</span></div>
                    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--paper);padding:6px 8px;background:rgba(247,244,237,.08);border-radius:4px"><span>/startups/crew.json</span><span style="color:var(--ember-tint)">↗</span></div>
                    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--paper);padding:6px 8px;background:rgba(247,244,237,.08);border-radius:4px"><span>/api/v1/companies/crew</span><span style="color:var(--ember-tint)">↗</span></div>
                    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--paper);padding:6px 8px;background:rgba(247,244,237,.08);border-radius:4px"><span>/startups/crew/llms.txt</span><span style="color:var(--ember-tint)">↗</span></div>
                  </div>
                  <div class="sketch-text sm" style="color:var(--topo);margin-top:10px;line-height:1.5">Same source feeds the page, the JSON, the API, and the Markdown. The business owner maintains one verified profile.</div>
                  <span class="btn ember sm" style="margin-top:10px">Open dual-pane →</span>
                </div>

                <!-- claim -->
                <div class="box dashed" style="padding:14px;margin-top:18px">
                  <div class="sketch-text" style="font-weight:700">Are you Crew?</div>
                  <div class="sketch-text sm muted">Claim this profile in 90 seconds with a domain email.</div>
                  <span class="btn primary sm" style="margin-top:8px">Claim →</span>
                </div>

                <!-- relations -->
                <div style="margin-top:18px">
                  <div class="sketch-text mono sm" style="color:var(--ink-3)">RELATED</div>
                  <div class="stack-2" style="margin-top:6px">
                    <div class="box" style="padding:8px"><div class="sketch-text" style="font-weight:700">Investors</div><div class="sketch-text sm muted">Pelion · Salt Lake Angels · Kickstart</div></div>
                    <div class="box" style="padding:8px"><div class="sketch-text" style="font-weight:700">Cluster</div><div class="sketch-text sm muted">Utah seed fintech · 14 cos</div></div>
                  </div>
                </div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:18px;line-height:1.7">↑ verified by domain email · last sync 12s ago · sources: founder claim + GOEO directory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== COMPLEMENT: B dual-pane reveal ========== -->
    <div class="section-label" style="margin-top:48px">
      <span class="badge complement">Complement</span>
      <h3>The reveal: dual-pane "human + agent" view — B</h3>
      <span class="sub">One click away. The judge moment: "the page, the JSON, the API are the same source."</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;min-height:560px">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew?view=dual</div></div>
          <div class="body" style="padding:0;display:grid;grid-template-columns:1fr 1fr;min-height:520px">
            <!-- HUMAN side -->
            <div style="padding:24px 28px;border-right:2px solid var(--ink);position:relative">
              <div class="sketch-text mono sm" style="color:var(--ember);letter-spacing:.1em">← HUMAN VIEW</div>
              <div class="sketch-text xl" style="margin-top:6px">Crew</div>
              <div class="sketch-text sm muted">Family neobanking · Lehi · 14 employees · seed</div>
              <div class="row tight" style="margin-top:8px">
                <span class="chip dot fintech">FinTech</span>
                <span class="chip ember-tint">hiring 3</span>
                <span class="chip sage-tint">verified</span>
              </div>
              <div class="box" style="height:90px;margin-top:12px;background:var(--stone);display:grid;place-items:center"><span class="sketch-text mono sm muted">[ company hero photo ]</span></div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:15px;line-height:1.55;color:var(--ink-2);margin-top:12px">Crew helps families share allowance, savings, and chore-based earning across kids and parents — one account with kid debit cards, parent-set guardrails, and a lightweight learning layer.</div>
              <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:14px">OPEN ROLES (3)</div>
              <div class="stack-2" style="margin-top:6px">
                <div class="box" style="padding:6px 10px"><span class="sketch-text" style="font-weight:700;font-size:13px">Senior backend engineer</span> <span class="sketch-text sm muted">· $160-200k</span></div>
                <div class="box" style="padding:6px 10px"><span class="sketch-text" style="font-weight:700;font-size:13px">Growth marketing lead</span> <span class="sketch-text sm muted">· $130-160k</span></div>
                <div class="box" style="padding:6px 10px"><span class="sketch-text" style="font-weight:700;font-size:13px">Product designer</span> <span class="sketch-text sm muted">· $110-150k</span></div>
              </div>
            </div>

            <!-- AGENT side -->
            <div style="padding:24px 28px;background:var(--ink);color:var(--paper);position:relative">
              <div class="callout tl" style="left:auto;right:24px;color:var(--ember-tint)">same source.</div>
              <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.1em">AGENT VIEW →</div>
              <div class="row tight" style="margin-top:8px">
                <span class="chip" style="background:rgba(247,244,237,.06);color:var(--paper);border-color:var(--topo-2)">.md</span>
                <span class="chip" style="background:rgba(247,244,237,.16);color:var(--paper);border-color:var(--paper)">.json ←</span>
                <span class="chip" style="background:rgba(247,244,237,.06);color:var(--paper);border-color:var(--topo-2)">/api/v1/companies/crew</span>
                <span class="chip" style="background:rgba(247,244,237,.06);color:var(--paper);border-color:var(--topo-2)">llms.txt</span>
              </div>
              <div style="margin-top:14px;background:#0A1320;border:1px solid var(--topo-2);border-radius:6px;padding:14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--paper);overflow:hidden">
<span style="color:var(--topo)">{</span><br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"slug"</span>: <span style="color:var(--paper)">"crew"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"name"</span>: <span style="color:var(--paper)">"Crew"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"sector"</span>: [<span style="color:var(--paper)">"FinTech"</span>],<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"stage"</span>: <span style="color:var(--paper)">"seed"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"location"</span>: { <span style="color:var(--ember-tint)">"city"</span>: <span style="color:var(--paper)">"Lehi"</span>, <span style="color:var(--ember-tint)">"county"</span>: <span style="color:var(--paper)">"Utah"</span> },<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"employees"</span>: <span style="color:var(--paper)">14</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"hiring"</span>: <span style="color:var(--paper)">true</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"jobs"</span>: <span style="color:var(--topo)">[ 3 entries ]</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"description"</span>: <span style="color:var(--paper)">"Family neobanking…"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"verified"</span>: <span style="color:var(--paper)">true</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"updated_at"</span>: <span style="color:var(--paper)">"2026-11-06T14:22Z"</span><br/>
<span style="color:var(--topo)">}</span>
              </div>
              <div class="sketch-text sm" style="color:var(--topo);margin-top:14px;line-height:1.55;font-family:var(--body)">Same source feeds <code style="color:var(--ember-tint)">.json</code>, <code style="color:var(--ember-tint)">/api/v1/companies/crew</code>, and <code style="color:var(--ember-tint)">/startups/crew/llms.txt</code>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- rationale -->
    <div class="grid two" style="margin-top:32px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Classic by default = legible to investors</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">An investor visiting from a brief should land on a page that looks like every great company profile they've ever read. The hero, jobs, gallery, facts pattern is familiar — that's a feature.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Agent Card = the punchline</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">"Same source feeds .json, /api/v1/companies/crew, and llms.txt" is the line. The right-rail card teases it; the dual-pane delivers it. <em>The business is the website</em>, and the website is one of four canonical surfaces.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Two profile directions we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutP('C','Tabs-everywhere ("about / team / news / press")','Padded with sections that won\'t have content. Bracket Labs doesn\'t need a "press" tab to look real.','fake completeness')}
      ${cutP('D','Editorial magazine spread (full-bleed photo, drop caps, multi-column)','Beautiful on the rare hero company. Awful for the 95% of profiles with one photo. Save the editorial register for cluster cards.','only works for ~5 cos')}
    </div>
  `;

  function pTab(name, active, agent){
    return `<div style="padding:14px 16px;border-right:1.5px solid var(--topo);${active?'background:var(--paper);border-bottom:3px solid var(--ember);margin-bottom:-1.5px':''};${agent?'background:var(--ember-tint);border-bottom:3px solid var(--ember);margin-bottom:-1.5px':''};font-family:var(--hand);font-weight:700;font-size:14px;color:${active?'var(--ink)':agent?'var(--ember)':'var(--ink-3)'}">${name}</div>`;
  }

  function factTile(label, val){
    return `<div class="box fill" style="padding:10px 12px"><div class="sketch-text mono sm" style="color:var(--ink-3);letter-spacing:.06em">${label.toUpperCase()}</div><div class="sketch-text" style="font-family:var(--serif);font-size:18px;font-weight:500;margin-top:2px">${val}</div></div>`;
  }

  function role(t, sub){
    return `<div class="box" style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center"><div><div class="sketch-text" style="font-weight:700">${t}</div><div class="sketch-text sm muted">${sub}</div></div><span class="btn sm">View →</span></div>`;
  }

  function img(label){
    return `<div class="box fill" style="aspect-ratio:1.2;display:grid;place-items:center"><span class="sketch-text sm muted">${label}</span></div>`;
  }

  function cutP(opt, title, body, why){
    return `<div class="variant cut">
      <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
      <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:8px">${cutThumb(opt)}</div></div>
      <div class="note" style="margin-top:10px">${body}</div>
      <div class="why-cut">${why}</div>
    </div>`;
  }
  function cutThumb(opt){
    if(opt==='C') return `<div style="height:160px"><div style="display:flex;gap:4px;border-bottom:1.5px solid var(--ink-3);padding-bottom:4px">${['About','Team','News','Press','Jobs','Investors'].map((t,i)=>`<span class="sketch-text sm" style="padding:2px 6px;${i===0?'background:var(--ink-3);color:var(--paper)':'color:var(--ink-3)'};border-radius:3px">${t}</span>`).join('')}</div><div class="scribble full" style="margin-top:14px"></div><div class="scribble med" style="margin-top:6px"></div><div class="scribble short" style="margin-top:6px"></div></div>`;
    if(opt==='D') return `<div style="height:160px;display:grid;grid-template-columns:1fr 1fr;gap:6px"><div class="box fill" style="display:grid;place-items:center"><span class="sketch-text muted">[ huge photo ]</span></div><div style="padding:6px"><div class="sketch-text" style="font-family:var(--serif);font-size:32px;line-height:.9">C</div><div class="scribble med" style="margin-top:8px"></div><div class="scribble full" style="margin-top:4px"></div><div class="scribble med" style="margin-top:4px"></div></div></div>`;
  }
})();
