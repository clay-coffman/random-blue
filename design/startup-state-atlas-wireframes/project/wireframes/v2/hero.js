// ===== FRONT DOOR — B founder-first + G live signal strip =====
(function(){
  const root = document.getElementById('panel-hero');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Founder-first hero, live signal strip, persona shortcuts</h3>
      <span class="sub">B + G + persona buttons. The full proposed front door at hi-res.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;border-radius:0;min-height:720px">
          <div class="chrome">
            <div class="dots"><i></i><i></i><i></i></div>
            <div class="url">https://startup.utah.gov</div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">desktop · 1440</span>
          </div>
          <div class="body" style="padding:0">
            <!-- top nav -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1.5px solid var(--ink)">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:28px;height:28px;border:1.5px solid var(--ink);border-radius:50%;display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:600">N</div>
                <div style="font-family:var(--serif);font-size:18px">Atlas <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3);margin-left:4px">startup.utah.gov</span></div>
              </div>
              <div style="display:flex;gap:18px;font-family:var(--hand);font-size:15px;font-weight:700">
                <span style="border-bottom:2px solid var(--ink)">Atlas</span>
                <span style="color:var(--ink-3)">Map</span>
                <span style="color:var(--ink-3)">Resources</span>
                <span style="color:var(--ink-3)">For agents</span>
              </div>
              <div style="display:flex;gap:8px">
                <span class="btn ghost sm">Sign in</span>
                <span class="btn ember sm">Claim a company</span>
              </div>
            </div>

            <!-- HERO -->
            <div style="padding:64px 28px 36px;display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center">
              <div>
                <div class="anno" style="margin-bottom:12px">A guide. Not a library.</div>
                <div class="sketch-text xxl" style="font-size:54px;letter-spacing:-.02em">
                  A guide for Utah <br/>founders.
                </div>
                <div class="sketch-text" style="font-size:26px;font-family:var(--serif);font-weight:400;color:var(--ink-2);margin-top:14px;line-height:1.2">
                  Six questions. <span style="color:var(--ember);font-style:italic">One 90-day plan.</span>
                </div>
                <div class="sketch-text" style="font-size:16px;color:var(--ink-2);margin-top:20px;max-width:520px;line-height:1.55">
                  Tell us who you're building. Atlas matches your situation against every state-vetted resource — capital, mentors, pitch nights, rural and veteran programs — and returns a ranked plan, not a pile of links.
                </div>
                <div class="row" style="margin-top:28px;gap:12px">
                  <span class="btn ember lg" style="padding:14px 22px;font-size:18px">Start my plan →</span>
                  <span class="btn lg ghost" style="padding:14px 22px;font-size:16px">Explore the map</span>
                  <span class="btn lg ghost" style="padding:14px 22px;font-size:16px">For agents</span>
                </div>

                <!-- persona shortcuts -->
                <div style="margin-top:36px">
                  <div class="sketch-text mono sm" style="color:var(--ink-3);margin-bottom:8px">↓ TRY AS A SAMPLE FOUNDER</div>
                  <div class="row tight">
                    <span class="persona active"><span class="face">J</span>Jordan, 20</span>
                    <span class="persona"><span class="face">M</span>Maria, 38</span>
                    <span class="persona"><span class="face">M</span>Marcus, 34</span>
                    <span class="persona"><span class="face">P</span>Priya, 31</span>
                    <span class="persona"><span class="face">D</span>David, 45</span>
                    <span class="persona"><span class="face">A</span>Dr. Amir, 29</span>
                  </div>
                </div>
              </div>

              <!-- right: faux preview card -->
              <div style="position:relative">
                <div class="callout tr">live preview ↓<br/>of the plan</div>
                <div class="box" style="padding:18px;background:var(--paper-2);box-shadow:6px 6px 0 var(--ink);transform:rotate(.5deg)">
                  <div class="row between">
                    <span class="sketch-text mono sm muted">PRIYA · SLC · paying customers</span>
                    <span class="chip ember-tint">Raising seed</span>
                  </div>
                  <div class="sketch-text xl" style="margin-top:10px">90-day plan, page 1</div>
                  <div class="h-line"></div>
                  <div class="sketch-text mono sm" style="color:var(--ember);margin-top:6px">DO THIS NOW</div>
                  <div class="stack-2" style="margin-top:6px">
                    <div class="box" style="padding:8px;display:flex;justify-content:space-between;align-items:center">
                      <div>
                        <div class="sketch-text" style="font-weight:700">Pelion Ventures · intro request</div>
                        <div class="sketch-text sm muted">Match 92 · seed-stage B2B SaaS</div>
                      </div>
                      <span class="chip sage-tint">draft email →</span>
                    </div>
                    <div class="box" style="padding:8px">
                      <div class="sketch-text" style="font-weight:700">Salt Lake Angels · Nov pitch night</div>
                      <div class="sketch-text sm muted">Match 88 · apply by Nov 14</div>
                    </div>
                  </div>
                  <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:12px">DO THIS NEXT · 3 items</div>
                  <div class="scribble full" style="margin-top:6px"></div>
                  <div class="scribble med" style="margin-top:4px"></div>
                  <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:12px">IGNORE FOR NOW · 14 items</div>
                  <div class="scribble short" style="margin-top:6px;opacity:.5"></div>
                </div>
              </div>
            </div>

            <!-- LIVE SIGNAL STRIP (G) -->
            <div style="border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);background:var(--ink);color:var(--paper);padding:14px 28px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
              <div class="ticker">
                <span class="live" style="color:var(--ember-tint)">● LIVE</span>
              </div>
              <div style="display:flex;gap:0;align-items:center">
                <div class="stat" style="border-color:rgba(247,244,237,.2)"><span class="num" style="color:var(--paper)">1,247</span><span class="lab" style="color:var(--topo)">companies</span></div>
                <div class="stat" style="border-color:rgba(247,244,237,.2)"><span class="num" style="color:var(--paper)">312</span><span class="lab" style="color:var(--topo)">resources</span></div>
                <div class="stat" style="border-color:rgba(247,244,237,.2)"><span class="num" style="color:var(--paper)">29</span><span class="lab" style="color:var(--topo)">counties</span></div>
                <div class="stat" style="border-color:rgba(247,244,237,.2)"><span class="num" style="color:var(--paper)">84</span><span class="lab" style="color:var(--topo)">verified profiles</span></div>
              </div>
              <div style="flex:1;display:flex;gap:14px;align-items:center;font-family:var(--mono);font-size:11px;color:var(--topo);min-width:240px;overflow:hidden">
                <span style="color:var(--ember)">→</span>
                <span><strong style="color:var(--paper)">Crew</strong> claimed</span>
                <span style="color:var(--topo-2)">·</span>
                <span><strong style="color:var(--paper)">Bracket Labs</strong> hiring 3</span>
                <span style="color:var(--topo-2)">·</span>
                <span><strong style="color:var(--paper)">Maria</strong> matched 5 ag grants</span>
                <span style="color:var(--topo-2)">·</span>
                <span><strong style="color:var(--paper)">Pelion</strong> added funding pref</span>
              </div>
            </div>

            <!-- SECONDARY ROW: three audiences as quiet reveal -->
            <div style="padding:48px 28px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px;border-bottom:1.5px solid var(--topo)">
              <div>
                <div class="sketch-text mono sm" style="color:var(--ember)">FOR FOUNDERS</div>
                <div class="sketch-text xl" style="margin-top:6px">Find the right next move.</div>
                <div class="sketch-text sm muted" style="margin-top:6px;line-height:1.5">Six questions → ranked 90-day plan. Filtered by county, stage, industry, and identity tags. <span style="color:var(--ink)">Start →</span></div>
              </div>
              <div>
                <div class="sketch-text mono sm" style="color:var(--sky)">FOR INVESTORS</div>
                <div class="sketch-text xl" style="margin-top:6px">See what Utah is building.</div>
                <div class="sketch-text sm muted" style="margin-top:6px;line-height:1.5">Map of every Utah startup. Cluster by sector, filter by stage and geography, generate a one-page brief. <span style="color:var(--ink)">Open map →</span></div>
              </div>
              <div>
                <div class="sketch-text mono sm" style="color:var(--sage)">FOR AGENTS</div>
                <div class="sketch-text xl" style="margin-top:6px">Plug it into your AI.</div>
                <div class="sketch-text sm muted" style="margin-top:6px;line-height:1.5">REST API, MCP server, CLI, <code>llms.txt</code>, per-company <code>.md</code> + <code>.json</code>. Source-bound, schema-typed. <span style="color:var(--ink)">Read /agents →</span></div>
              </div>
            </div>

            <!-- footer credibility -->
            <div style="padding:18px 28px;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:.06em;text-transform:uppercase">
              <span>Built by Utah Governor's Office of Economic Development</span>
              <span>OPENAPI · MCP · LLMS.TXT · v0.4 · ATLAS</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- annotated rationale strip -->
    <div class="grid two" style="margin-top:28px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Founder-first earns trust before classifying users</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">B is the highest-volume use case. The hackathon brief is explicit: founders need clarity, not a library. Leading with a single sentence (<em>"A guide for Utah founders. Six questions. One 90-day plan."</em>) collapses the whole thesis. The three-audience reveal stays — just below the fold.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Live signal strip = ecosystem feels alive</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">G's stats + LIVE ticker prove there's a real graph behind the page in &lt;2 seconds — without making the front door an investor dashboard. Counts validate map / profile / claim layer credibility before the user has clicked anything.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Five front-door directions we're not taking</h3>
      <span class="sub">…and why.</span>
    </div>

    <div class="grid cuts">
      ${cutHero('A','Three-door split (founder / investor / agent)','Clear, but bureaucratic. Forces the user to classify themselves before the product has earned trust. Saved as the secondary row below the hero.','too static — feels like a gov.uk landing')}
      ${cutHero('C','Map-as-hero','Visually impressive but investor-first. Founders bounce because they don\'t see themselves in the product instantly.','wrong audience priority')}
      ${cutHero('D','Conversational AI intake as hero','Risky. If the model misroutes once during judging, the whole demo looks sloppy. Chat also makes us feel like a wrapper.','demo-fragile + generic')}
      ${cutHero('E','Editorial gazetteer / atlas spread','Beautiful, but opaque. New users don\'t know where to click. Save the editorial register for the cluster gazetteer in the map.','too opaque for the front door')}
      ${cutHero('F','Single huge question ("Where are you building?")','Too reductive — it forces all the personalization into one ambiguous text field. The intake screen does this better with structure.','reduces signal, increases ambiguity')}
    </div>
  `;

  function cutHero(opt, title, body, why){
    return `
      <div class="variant cut">
        <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
        <div class="screen mini" style="border-color:var(--ink-3)">
          <div class="body" style="padding:10px">
            ${cutThumb(opt)}
          </div>
        </div>
        <div class="note" style="margin-top:10px">${body}</div>
        <div class="why-cut">${why}</div>
      </div>
    `;
  }

  function cutThumb(opt){
    if(opt==='A') return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;height:160px">
        <div class="box fill" style="display:grid;place-items:center"><span class="sketch-text sm">FOUNDER</span></div>
        <div class="box fill" style="display:grid;place-items:center"><span class="sketch-text sm">INVESTOR</span></div>
        <div class="box fill" style="display:grid;place-items:center"><span class="sketch-text sm">AGENT</span></div>
      </div>`;
    if(opt==='C') return `
      <div class="box" style="height:160px;position:relative;overflow:hidden">
        <div class="mapbg"></div>
        <div class="pin sel" style="left:35%;top:40%"></div>
        <div class="pin" style="left:55%;top:55%;background:var(--sky)"></div>
        <div class="pin" style="left:48%;top:30%;background:var(--sage)"></div>
        <div style="position:absolute;left:8px;bottom:8px;background:#fff;padding:4px 8px;border:1.5px solid var(--ink);border-radius:4px"><span class="sketch-text sm">Utah ecosystem · 1,247</span></div>
      </div>`;
    if(opt==='D') return `
      <div class="box fill" style="height:160px;padding:10px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px">
        <div class="box" style="padding:6px"><span class="sketch-text sm">where are you in Utah?</span></div>
        <div class="box ink" style="padding:6px"><span class="sketch-text sm">Salt Lake County</span></div>
        <div class="box" style="padding:6px"><span class="sketch-text sm">_</span></div>
      </div>`;
    if(opt==='E') return `
      <div class="box" style="height:160px;padding:10px;background:var(--paper-2)">
        <div class="sketch-text" style="font-family:var(--serif);font-size:22px;text-align:center">A T L A S</div>
        <div style="text-align:center" class="sketch-text mono sm muted">— a gazetteer of Utah enterprise —</div>
        <div class="h-line" style="margin:10px 0"></div>
        <div class="scribble full" style="margin-top:6px"></div>
        <div class="scribble med" style="margin-top:4px"></div>
        <div class="scribble short" style="margin-top:4px"></div>
      </div>`;
    if(opt==='F') return `
      <div class="box fill" style="height:160px;padding:14px;display:grid;place-items:center;text-align:center">
        <div>
          <div class="sketch-text xl">Where are you<br/>building?</div>
          <div class="box" style="padding:6px;margin-top:10px;background:#fff"><span class="sketch-text sm muted">type a county, sector, or stage…</span></div>
        </div>
      </div>`;
  }
})();
