// ===== AGENT DOCS — C install hero, B tabbed surfaces, A field-manual reference =====
(function(){
  const root = document.getElementById('panel-agents');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary hero</span>
      <h3>"Plug Utah's ecosystem into your AI" — install-oriented landing — C</h3>
      <span class="sub">Front of /agents reads like a product page, not a manpage. The audience is judges + non-engineers first.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;min-height:680px;background:var(--paper)">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/agents</div></div>
          <div class="body" style="padding:0">

            <!-- HERO -->
            <div style="padding:48px 48px 28px;border-bottom:1.5px solid var(--ink);background:var(--paper-2);position:relative">
              <div class="sketch-text mono sm" style="color:var(--ember);letter-spacing:.12em">FOR AGENTS &amp; DEVELOPERS</div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:60px;line-height:1.02;letter-spacing:-.02em;margin-top:6px;max-width:780px">Plug Utah's startup ecosystem into your AI.</div>
              <div class="sketch-text" style="font-size:18px;color:var(--ink-2);margin-top:10px;max-width:620px;line-height:1.5">Every resource, company, and founder passport is available as a typed API, an MCP server, a CLI, and Markdown. Same source, four surfaces.</div>

              <!-- 4 install cards -->
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:28px">
                ${installCard('Claude', 'MCP server · 1 click', 'Install →', true)}
                ${installCard('ChatGPT', 'OpenAPI tool · paste URL', 'Use →')}
                ${installCard('CLI', 'npm i -g startup-state', 'Copy →')}
                ${installCard('REST API', 'OpenAPI 3.1 · auth optional', 'Read →')}
              </div>

              <!-- demo terminal -->
              <div style="margin-top:24px;background:var(--ink);border:1.5px solid var(--ink);border-radius:10px;box-shadow:6px 6px 0 var(--ember);padding:14px 18px;font-family:var(--mono);font-size:13px;line-height:1.7;color:var(--paper);max-width:760px">
                <div class="row tight" style="margin-bottom:8px"><span class="dots"><i></i><i></i><i></i></span><span style="color:var(--topo);margin-left:6px;font-size:11px">terminal · live demo</span></div>
                <span style="color:var(--ember-tint)">$</span> startup-state recommend --persona priya --compact<br/>
                <span style="color:var(--topo)">→ 3 resources matched · 92, 88, 85 · runtime 240ms</span><br/>
                <br/>
                <span style="color:var(--ember-tint)">$</span> startup-state company get crew --json<br/>
                <span style="color:var(--topo)">→ verified · seed · 14 employees · hiring 3</span><br/>
                <br/>
                <span style="color:var(--ember-tint)">$</span> startup-state map cluster --sector fintech<br/>
                <span style="color:var(--topo)">→ 14 companies · Lehi/SLC · brief generated</span>
              </div>

              <span class="callout" style="position:absolute;bottom:18px;right:32px">install in 30s. demo in 60.</span>
            </div>

            <!-- =========== B TABS =========== -->
            <div style="padding:32px 48px 12px">
              <div class="sketch-text mono sm" style="color:var(--ink-3);letter-spacing:.12em">↓ EVERY SURFACE</div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:30px;line-height:1.1;margin-top:4px">Pick the surface that matches your runtime.</div>
            </div>

            <div style="padding:0 48px;border-bottom:1.5px solid var(--ink);display:flex;gap:0;margin-top:14px">
              ${aTab('REST API', true)}
              ${aTab('CLI')}
              ${aTab('MCP')}
              ${aTab('llms.txt')}
              ${aTab('AGENTS.md')}
              ${aTab('Schemas')}
            </div>

            <div style="padding:24px 48px;display:grid;grid-template-columns:1.1fr 1fr;gap:32px;background:var(--paper)">
              <!-- left: rest api content -->
              <div>
                <div class="row tight">
                  <span class="chip ink">REST API</span>
                  <span class="chip">OpenAPI 3.1</span>
                  <span class="chip sage-tint">auth optional</span>
                </div>
                <div class="sketch-text" style="font-family:var(--serif);font-size:22px;line-height:1.15;margin-top:10px">Eight endpoints. The whole product.</div>

                <div class="stack-2" style="margin-top:14px">
                  ${endpoint('GET',  '/api/v1/resources', 'list / filter')}
                  ${endpoint('POST', '/api/v1/resources/recommend', 'matched plan + scores', true)}
                  ${endpoint('GET',  '/api/v1/companies', 'list / filter')}
                  ${endpoint('GET',  '/api/v1/companies/:slug', 'one company')}
                  ${endpoint('PATCH','/api/v1/companies/:slug', 'scoped owner update')}
                  ${endpoint('POST', '/api/v1/companies/claim', 'magic-link verify')}
                  ${endpoint('POST', '/api/v1/founder-passports', 'create passport')}
                  ${endpoint('GET',  '/api/v1/openapi.json', 'machine-readable spec')}
                </div>

                <div class="row tight" style="margin-top:14px">
                  <span class="btn primary sm">Open Swagger →</span>
                  <span class="btn ghost sm">Download OpenAPI</span>
                  <span class="btn ghost sm">Postman collection</span>
                </div>
              </div>

              <!-- right: live request/response -->
              <div>
                <div class="sketch-text mono sm" style="color:var(--ember)">↓ TRY IT · POST /resources/recommend</div>
                <div style="margin-top:6px;background:var(--ink);border:1.5px solid var(--ink);border-radius:8px;padding:12px 14px;font-family:var(--mono);font-size:11px;line-height:1.65;color:var(--paper)">
<span style="color:var(--topo)">// request</span><br/>
{<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"county"</span>: <span style="color:var(--paper)">"Salt Lake"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"stage"</span>: <span style="color:var(--paper)">"paying_customers"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"industry"</span>: <span style="color:var(--paper)">"b2b_saas"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"goal"</span>: <span style="color:var(--paper)">"raise_seed"</span><br/>
}
                </div>
                <div style="margin-top:8px;background:#0A1320;border:1.5px solid var(--ink);border-radius:8px;padding:12px 14px;font-family:var(--mono);font-size:11px;line-height:1.65;color:var(--paper)">
<span style="color:var(--topo)">// response · 240ms</span><br/>
{<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"passport_id"</span>: <span style="color:var(--paper)">"fp_p7r3"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"recommendations"</span>: [<br/>
&nbsp;&nbsp;&nbsp;&nbsp;{ <span style="color:var(--ember-tint)">"id"</span>: 2547, <span style="color:var(--ember-tint)">"score"</span>: 92, <span style="color:var(--ember-tint)">"why"</span>: [<span style="color:var(--paper)">"stage"</span>, <span style="color:var(--paper)">"industry"</span>] },<br/>
&nbsp;&nbsp;&nbsp;&nbsp;{ <span style="color:var(--ember-tint)">"id"</span>: 1822, <span style="color:var(--ember-tint)">"score"</span>: 88, <span style="color:var(--ember-tint)">"why"</span>: [<span style="color:var(--paper)">"county"</span>, <span style="color:var(--paper)">"goal"</span>] },<br/>
&nbsp;&nbsp;&nbsp;&nbsp;{ <span style="color:var(--ember-tint)">"id"</span>: 1503, <span style="color:var(--ember-tint)">"score"</span>: 85 }<br/>
&nbsp;&nbsp;]<br/>
}
                </div>
                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:8px;line-height:1.6">↑ same call powers /founder, the CLI, the MCP server, and the agent docs. one source.</div>
              </div>
            </div>

            <!-- =========== A REFERENCE / FIELD MANUAL =========== -->
            <div style="padding:32px 48px;border-top:1.5px solid var(--ink);background:var(--stone)">
              <div class="row between">
                <div>
                  <div class="sketch-text mono sm" style="color:var(--ink-3);letter-spacing:.12em">↓ FIELD MANUAL</div>
                  <div class="sketch-text" style="font-family:var(--serif);font-size:24px;line-height:1.1">Reference, manpage-style.</div>
                </div>
                <div class="sketch-text mono sm muted">scroll for full docs · or jump:</div>
              </div>

              <div style="display:grid;grid-template-columns:200px 1fr;gap:32px;margin-top:18px">
                <!-- TOC -->
                <div class="stack-2">
                  <div class="sketch-text mono sm" style="color:var(--ink-3)">CONTENTS</div>
                  ${tocItem('1. Overview', true)}
                  ${tocItem('2. Authentication')}
                  ${tocItem('3. Founder Passport schema')}
                  ${tocItem('4. Company Profile schema')}
                  ${tocItem('5. Recommend endpoint')}
                  ${tocItem('6. Patch &amp; scope rules')}
                  ${tocItem('7. MCP tools')}
                  ${tocItem('8. MCP resources')}
                  ${tocItem('9. CLI command index')}
                  ${tocItem('10. llms.txt convention')}
                  ${tocItem('11. AGENTS.md convention')}
                  ${tocItem('12. Rate limits &amp; errors')}
                </div>

                <!-- manpage body -->
                <div style="background:var(--paper-2);border:1.5px solid var(--ink);border-radius:8px;padding:24px 28px;font-family:var(--mono);font-size:12px;line-height:1.75;color:var(--ink)">
                  <div style="font-family:var(--serif);font-size:22px;line-height:1.1;color:var(--ink);font-weight:500">5. Recommend endpoint</div>
                  <div style="margin-top:14px;color:var(--ink-2)">
                    <span style="color:var(--ember);font-weight:600">NAME</span><br/>
                    &nbsp;&nbsp;recommend — match a founder profile to ranked resources<br/><br/>

                    <span style="color:var(--ember);font-weight:600">SYNOPSIS</span><br/>
                    &nbsp;&nbsp;POST /api/v1/resources/recommend<br/>
                    &nbsp;&nbsp;startup-state recommend [--county] [--stage] [--industry] [--goal] [--compact|--json]<br/><br/>

                    <span style="color:var(--ember);font-weight:600">DESCRIPTION</span><br/>
                    &nbsp;&nbsp;Computes a deterministic match score per resource using stage,<br/>
                    &nbsp;&nbsp;location, goal, industry, and community. Only after retrieval does<br/>
                    &nbsp;&nbsp;the LLM produce the "why this matched" explanation, scoped to the<br/>
                    &nbsp;&nbsp;returned resources. The model never invents resources or eligibility.<br/><br/>

                    <span style="color:var(--ember);font-weight:600">FIELDS</span><br/>
                    &nbsp;&nbsp;county        string · required<br/>
                    &nbsp;&nbsp;stage         enum   · required (idea | building | paying | growth)<br/>
                    &nbsp;&nbsp;industry      string · required<br/>
                    &nbsp;&nbsp;goal          enum   · required (start | raise | hire | export | …)<br/>
                    &nbsp;&nbsp;communities   string[] · optional (Rural, Veteran, Women, Student…)<br/>
                    &nbsp;&nbsp;urgency       enum   · optional (week | month | quarter)<br/><br/>

                    <span style="color:var(--ember);font-weight:600">SCORING</span><br/>
                    &nbsp;&nbsp;25 · stage · 20 · location · 20 · goal/topic<br/>
                    &nbsp;&nbsp;15 · industry · 10 · community · 10 · semantic<br/><br/>

                    <span style="color:var(--ember);font-weight:600">EXIT CODES</span><br/>
                    &nbsp;&nbsp;0   ok&nbsp;&nbsp;·&nbsp;&nbsp;2   missing required field&nbsp;&nbsp;·&nbsp;&nbsp;3   no matches above floor<br/><br/>

                    <span style="color:var(--ember);font-weight:600">SEE ALSO</span><br/>
                    &nbsp;&nbsp;<u style="color:var(--sky)">founder-passports(7)</u> · <u style="color:var(--sky)">companies(7)</u> · <u style="color:var(--sky)">claim(7)</u>
                  </div>
                </div>
              </div>
            </div>

            <!-- footer: agent contracts -->
            <div style="padding:28px 48px 36px;background:var(--ink);color:var(--paper)">
              <div class="row between" style="align-items:flex-start">
                <div>
                  <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.12em">↓ AGENT CONTRACTS</div>
                  <div class="sketch-text" style="font-family:var(--serif);font-size:24px;color:var(--paper);line-height:1.15;margin-top:4px">Conventions every Atlas agent follows.</div>
                </div>
                <div class="row tight">
                  <span class="btn ember sm">/llms.txt</span>
                  <span class="btn sm" style="background:rgba(247,244,237,.1);color:var(--paper);border-color:var(--paper)">/AGENTS.md</span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px">
                ${rule('Cite resource IDs', 'Never paraphrase a resource without its numeric id.')}
                ${rule('Never invent eligibility', 'If county/stage/industry not provided, ask — don\'t guess.')}
                ${rule('Prefer 3 high-fit', 'Over broad lists. Confidence beats coverage.')}
                ${rule('Show PATCH bodies first', 'Scoped agent edits must be confirmed before sending.')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- rationale -->
    <div class="grid two" style="margin-top:32px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Install-first hero reads to non-developers</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Hackathon judges include investors and GOEO staff. "Install in Claude" is a sentence everyone parses; "MCP tools/resources" is not. The product page register up top makes the technical depth below feel optional, not required.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Tabs for surfaces, manpage for reference</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Tabs let agent-builders pick their runtime in one click. The manpage block at the bottom signals "this is a real, documented system" — which materially raises perceived technical execution score.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Two agent-doc directions we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutA('D', 'Single-page Stripe-style docs (left rail + middle column + right code)', 'Beautiful, but it\'s 30 hours of layout work nobody will read at the demo. The hero + tabs + manpage gets 90% of the impression for 20% of the effort.', 'over-engineered for hackathon')}
      ${cutA('E', 'Pure Swagger UI', 'Functional, but reads as "engineer\'s hand-off." Doesn\'t make the case to non-engineer judges that this is an agent-native product.', 'reads as backend-only')}
    </div>
  `;

  function installCard(name, sub, cta, primary){
    return `<div style="padding:14px;border:1.5px solid ${primary?'var(--ember)':'var(--ink)'};border-radius:8px;background:${primary?'var(--ember-tint)':'#fff'};box-shadow:4px 4px 0 ${primary?'var(--ember)':'var(--ink)'}">
      <div class="sketch-text mono sm" style="color:${primary?'var(--ember)':'var(--ink-3)'};letter-spacing:.1em">${primary?'★ ':''}${name.toUpperCase()}</div>
      <div class="sketch-text" style="font-family:var(--serif);font-size:22px;line-height:1.05;margin-top:6px">${name === 'Claude' ? 'Install in Claude' : name === 'ChatGPT' ? 'Use in ChatGPT' : name === 'CLI' ? 'Run from terminal' : 'Read the API'}</div>
      <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:6px">${sub}</div>
      <span class="btn ${primary?'ember':''} sm" style="margin-top:10px">${cta}</span>
    </div>`;
  }

  function aTab(name, active){
    return `<div style="padding:14px 18px;border-right:1.5px solid var(--topo);${active?'background:var(--paper);border-bottom:3px solid var(--ember);margin-bottom:-1.5px':''};font-family:var(--hand);font-weight:700;font-size:14px;color:${active?'var(--ink)':'var(--ink-3)'}">${name}</div>`;
  }

  function endpoint(method, path, sub, hot){
    const colors = { GET:'var(--sky)', POST:'var(--sage)', PATCH:'var(--ember)', DELETE:'var(--danger)' };
    return `<div class="box" style="padding:8px 12px;display:flex;align-items:center;gap:10px;${hot?'border-color:var(--ember);box-shadow:3px 3px 0 var(--ember)':''}">
      <span style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--paper);background:${colors[method]};padding:3px 7px;border-radius:3px;letter-spacing:.06em">${method}</span>
      <span class="sketch-text mono" style="font-size:13px">${path}</span>
      <span class="sketch-text sm muted" style="margin-left:auto">${sub}</span>
    </div>`;
  }

  function tocItem(t, active){
    return `<div style="padding:6px 8px;border-left:3px solid ${active?'var(--ember)':'transparent'};${active?'background:var(--ember-tint)':''};font-family:var(--hand);font-size:13px;font-weight:${active?'700':'500'};color:${active?'var(--ink)':'var(--ink-2)'}">${t}</div>`;
  }

  function rule(t, sub){
    return `<div style="padding:12px 14px;border:1.5px solid var(--topo-2);border-radius:6px;background:rgba(247,244,237,.05)">
      <div class="sketch-text" style="color:var(--paper);font-weight:700">${t}</div>
      <div class="sketch-text sm" style="color:var(--topo);margin-top:4px;line-height:1.5">${sub}</div>
    </div>`;
  }

  function cutA(opt, title, body, why){
    return `<div class="variant cut">
      <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
      <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:8px">${cutThumb(opt)}</div></div>
      <div class="note" style="margin-top:10px">${body}</div>
      <div class="why-cut">${why}</div>
    </div>`;
  }
  function cutThumb(opt){
    if(opt==='D') return `<div style="height:160px;display:grid;grid-template-columns:60px 1fr 80px;gap:4px"><div class="box fill"></div><div class="box fill" style="padding:6px"><div class="scribble short"></div><div class="scribble med" style="margin-top:4px"></div><div class="scribble full" style="margin-top:4px"></div></div><div class="box" style="background:#0A1320"></div></div>`;
    if(opt==='E') return `<div style="height:160px;background:#fff;padding:8px;border:1px solid var(--topo)"><div class="row tight"><span class="chip" style="font-size:9px;background:var(--sky);color:#fff">GET</span><span class="sketch-text mono sm">/resources</span></div><div class="row tight" style="margin-top:4px"><span class="chip" style="font-size:9px;background:var(--sage);color:#fff">POST</span><span class="sketch-text mono sm">/recommend</span></div><div class="row tight" style="margin-top:4px"><span class="chip" style="font-size:9px;background:var(--ember);color:#fff">PATCH</span><span class="sketch-text mono sm">/companies/:slug</span></div><div class="sketch-text mono sm muted" style="margin-top:8px;font-size:9px">swagger-ui · 1998 register</div></div>`;
  }
})();
