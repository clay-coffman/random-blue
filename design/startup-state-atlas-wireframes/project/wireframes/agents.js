// /agents docs page wireframes
(function(){
  const grid = document.getElementById('panel-agents-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Man-page column with sticky TOC</div>
      <div class="note">Single 720px column, sticky left TOC. Reads like a Unix man page. Most "field manual" feel; matches design system.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/agents</div></div>
      <div class="body" style="padding:0">
        <div style="display:grid;grid-template-columns:160px 1fr;min-height:480px">
          <div style="padding:14px;border-right:1.5px solid var(--ink);background:var(--paper-2)">
            <div class="sketch-text mono muted">CONTENTS</div>
            <div class="stack-2" style="margin-top:8px;font-family:var(--mono);font-size:12px">
              <div style="color:var(--ember);font-weight:600">1. Quickstart</div>
              <div>2. REST API</div>
              <div>3. CLI</div>
              <div>4. MCP server</div>
              <div>5. llms.txt</div>
              <div>6. AGENTS.md</div>
              <div>7. Webhooks</div>
              <div>8. Errors</div>
              <div>9. Schemas</div>
            </div>
          </div>
          <div style="padding:18px 22px;overflow:auto">
            <div class="sketch-text mono muted">ATLAS · /AGENTS · V1</div>
            <div class="sketch-text xl" style="font-family:var(--serif);font-size:32px;margin:4px 0 6px">Startup State for agents</div>
            <div class="sketch-text" style="max-width:520px">A canonical, agent-readable map of Utah's startup ecosystem. Read the resources, recommend, search companies, update profiles. Use whichever surface fits.</div>
            <div class="h-line" style="margin:14px 0"></div>
            <div class="sketch-text mono muted">1 · QUICKSTART</div>
            <div class="box" style="padding:10px;margin-top:6px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:12px;line-height:1.55">
              <span style="opacity:.55"># list resources matching a founder profile</span><br/>
              curl -s startup.utah.gov/api/v1/resources/recommend \\<br/>
              &nbsp;&nbsp;-d '{"county":"Salt Lake","stage":"paying_customers"}'
            </div>
            <div class="sketch-text mono muted" style="margin-top:14px">2 · REST API</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="row tight"><span class="chip">GET</span><div class="sketch-text sm mono">/api/v1/resources</div></div>
              <div class="row tight"><span class="chip ember-tint">POST</span><div class="sketch-text sm mono">/api/v1/resources/recommend</div></div>
              <div class="row tight"><span class="chip">GET</span><div class="sketch-text sm mono">/api/v1/companies</div></div>
              <div class="row tight"><span class="chip">GET</span><div class="sketch-text sm mono">/api/v1/companies/:slug</div></div>
              <div class="row tight"><span class="chip ember-tint">PATCH</span><div class="sketch-text sm mono">/api/v1/companies/:slug</div></div>
            </div>
            <div class="sketch-text mono muted" style="margin-top:14px">3 · CLI</div>
            <div class="box" style="padding:10px;margin-top:6px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:12px;line-height:1.55">
              npm i -g startup-state<br/>
              startup-state recommend --persona priya --compact
            </div>
          </div>
        </div>
        <div class="callout tr">terse, mono-heavy<br/>= dev trust</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Tabbed surfaces hero</div>
      <div class="note">Big tabs: API · CLI · MCP · llms.txt. Each tab swaps a code sample + one-paragraph "what this is, why you'd use it." Friendlier for non-devs.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/agents</div></div>
      <div class="body" style="padding:18px">
        <div class="sketch-text mono muted">FOR AGENTS · CLI · MCP · LLMS.TXT</div>
        <div class="sketch-text xl" style="font-family:var(--serif);font-size:32px;margin:4px 0 6px">One ecosystem,<br/>four ways in.</div>
        <div class="sketch-text" style="max-width:560px">Atlas is built so any agent &mdash; ChatGPT, Claude, Codex, your own &mdash; can query and update it without scraping. Pick a surface.</div>

        <div class="row tight" style="margin-top:18px;border-bottom:1.5px solid var(--ink);padding-bottom:0">
          <div class="box" style="padding:7px 14px;background:var(--ember);color:var(--paper);border-color:var(--ember);border-bottom:0;border-radius:6px 6px 0 0;margin-bottom:-1.5px">REST API</div>
          <div class="sketch-text sm" style="padding:7px 14px">CLI</div>
          <div class="sketch-text sm" style="padding:7px 14px">MCP server</div>
          <div class="sketch-text sm" style="padding:7px 14px">llms.txt</div>
          <div class="sketch-text sm" style="padding:7px 14px">AGENTS.md</div>
        </div>
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:18px;margin-top:14px">
          <div>
            <div class="sketch-text sm muted">"Use it when you're integrating Atlas into another product, automation, or AI pipeline."</div>
            <div class="box" style="padding:10px;margin-top:8px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:12px;line-height:1.55">
              POST /api/v1/resources/recommend<br/>
              <br/>
              {<br/>
              &nbsp;&nbsp;"county": "Washington",<br/>
              &nbsp;&nbsp;"stage": "growth",<br/>
              &nbsp;&nbsp;"industry": "Agriculture",<br/>
              &nbsp;&nbsp;"communities": ["Rural", "Women"]<br/>
              }
            </div>
            <div class="row tight" style="margin-top:8px"><div class="btn sm">OpenAPI</div><div class="btn sm">Postman</div><div class="btn sm">Try in browser</div></div>
          </div>
          <div>
            <div class="sketch-text mono muted">RESPONSE</div>
            <div class="box" style="padding:10px;margin-top:6px;background:var(--paper);font-family:var(--mono);font-size:11.5px;line-height:1.55">
              {<br/>
              &nbsp;&nbsp;"passport_id": "fp_123",<br/>
              &nbsp;&nbsp;"recommendations": [<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"resource_id": 2547,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"score": 87,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"why": [...]<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;}<br/>
              &nbsp;&nbsp;]<br/>
              }
            </div>
          </div>
        </div>
        <div class="callout bl">tabs make it<br/>scannable</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>"Install in Claude / ChatGPT" hero</div>
      <div class="note">Top is one-click adoption. Treats /agents as a marketing/onboarding page, not docs. Docs sit below.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/agents</div></div>
      <div class="body" style="padding:22px">
        <div class="sketch-text mono muted">/AGENTS · STARTUP STATE ATLAS</div>
        <div class="sketch-text xl" style="font-family:var(--serif);font-size:34px;margin:4px 0 6px;line-height:1.05">Plug Utah's ecosystem<br/>into your AI.</div>
        <div class="sketch-text" style="max-width:560px">In 30 seconds, ChatGPT, Claude, or Codex can recommend Utah resources, search Utah startups, or update their own profile.</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px">
          <div class="box" style="padding:14px;text-align:center">
            <div class="sketch-text mono muted">CLAUDE DESKTOP</div>
            <div class="sketch-text lg" style="margin:6px 0">MCP server</div>
            <div class="sketch-text sm muted">Add 1 entry to your config.</div>
            <div class="btn sm" style="margin-top:10px">Copy config →</div>
          </div>
          <div class="box ember" style="padding:14px;text-align:center">
            <div class="sketch-text mono" style="color:var(--paper);opacity:.85">CHATGPT / GPTS</div>
            <div class="sketch-text lg" style="margin:6px 0;color:var(--paper)">Custom GPT</div>
            <div class="sketch-text sm" style="color:var(--paper);opacity:.85">Atlas Action published. Search the GPT store.</div>
            <div class="btn sm" style="margin-top:10px;background:#fff;color:var(--ember);border-color:#fff">Install →</div>
          </div>
          <div class="box" style="padding:14px;text-align:center">
            <div class="sketch-text mono muted">YOUR CODE</div>
            <div class="sketch-text lg" style="margin:6px 0">CLI + REST</div>
            <div class="sketch-text sm muted">npm i -g startup-state</div>
            <div class="btn sm" style="margin-top:10px">Read docs →</div>
          </div>
        </div>
        <div class="h-line" style="margin:18px 0"></div>
        <div class="sketch-text mono muted">SCROLL FOR FULL REFERENCE</div>
        <div class="row tight" style="margin-top:6px"><span class="chip">REST API</span><span class="chip">CLI</span><span class="chip">MCP tools</span><span class="chip">llms.txt</span><span class="chip">AGENTS.md</span><span class="chip">Schemas</span></div>
        <div class="callout tr">"install" framing<br/>= judge friendly</div>
      </div>
    </div>
  </article>
  `;
})();
