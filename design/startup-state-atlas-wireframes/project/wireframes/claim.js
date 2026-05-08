// Claim flow wireframes
(function(){
  const grid = document.getElementById('panel-claim-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Magic-link, 3 steps, AI draft</div>
      <div class="note">Email-on-domain → magic link → AI generates a profile draft from web → user approves. Simplest path. Three screens stacked.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/claim/crew</div></div>
      <div class="body" style="padding:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">

          <div class="box" style="padding:12px">
            <div class="sketch-text mono muted">STEP 1 · VERIFY</div>
            <div class="sketch-text lg" style="margin:6px 0">Claim Crew</div>
            <div class="sketch-text sm muted">Use a work email on your company domain.</div>
            <div class="box dashed" style="padding:8px;margin-top:10px">
              <div class="sketch-text sm muted">founder@trycrew.com</div>
            </div>
            <div class="sketch-text sm" style="margin-top:8px;color:var(--sage)">✓ matches website domain</div>
            <div class="row" style="margin-top:10px;justify-content:flex-end"><div class="btn ember sm">Send link</div></div>
          </div>

          <div class="box" style="padding:12px;background:var(--stone)">
            <div class="sketch-text mono muted">STEP 2 · LINK</div>
            <div class="sketch-text lg" style="margin:6px 0">Check your inbox</div>
            <div class="box" style="padding:10px;margin-top:8px;background:#fff">
              <div class="sketch-text sm mono muted">FROM atlas@startup.utah.gov</div>
              <div class="sketch-text sm" style="margin-top:4px">Open Crew's profile editor →</div>
            </div>
            <div class="sketch-text sm muted" style="margin-top:8px">Link expires in 30 min.</div>
          </div>

          <div class="box" style="padding:12px">
            <div class="sketch-text mono muted">STEP 3 · DRAFT</div>
            <div class="sketch-text lg" style="margin:6px 0">We pulled a draft</div>
            <div class="sketch-text sm muted">From your website + LinkedIn. Approve or edit.</div>
            <div class="box fill" style="padding:8px;margin-top:8px">
              <div class="row tight"><span class="chip sage-tint">verified</span><span class="chip">14 ppl</span><span class="chip">2024</span></div>
              <div class="scribble full" style="margin-top:6px"></div>
              <div class="scribble med" style="margin-top:4px"></div>
            </div>
            <div class="row" style="margin-top:10px;justify-content:space-between">
              <div class="btn ghost sm">Edit fields</div>
              <div class="btn ember sm">Publish</div>
            </div>
          </div>

        </div>
        <div class="callout br">3 screens, ~60s,<br/>zero pain</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Profile editor</div>
      <div class="note">After magic-link, what does the editor look like? Form on left, live preview on right, "agent card" tab toggles to show .md output.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew/edit</div></div>
      <div class="body" style="padding:0">
        <div class="row" style="padding:10px 14px;border-bottom:1.5px solid var(--ink);justify-content:space-between;background:var(--paper-2)">
          <div class="row tight"><div class="sketch-text mono muted">EDIT · CREW</div><span class="chip sage-tint">verified · founder@trycrew.com</span></div>
          <div class="row tight">
            <div class="btn sm">Cancel</div>
            <div class="btn sm">Preview</div>
            <div class="btn ember sm">Publish</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1.1fr 1fr;min-height:430px">
          <div style="padding:14px;border-right:1.5px solid var(--ink);overflow:auto">
            <div class="stack-3">
              <div><div class="sketch-text sm">Tagline</div><div class="box" style="padding:6px 10px;margin-top:4px"><div class="sketch-text sm">Family neobanking, simplified.</div></div></div>
              <div><div class="sketch-text sm">Description</div><div class="box" style="padding:8px 10px;margin-top:4px;min-height:60px"><div class="scribble full"></div><div class="scribble full" style="margin-top:4px"></div><div class="scribble med" style="margin-top:4px"></div></div></div>
              <div class="row" style="gap:10px"><div style="flex:1"><div class="sketch-text sm">Stage</div><div class="box" style="padding:6px 10px;margin-top:4px"><div class="sketch-text sm">Seed ▾</div></div></div>
              <div style="flex:1"><div class="sketch-text sm">Employees</div><div class="box" style="padding:6px 10px;margin-top:4px"><div class="sketch-text sm">14</div></div></div></div>
              <div><div class="sketch-text sm">Hiring? <span class="chip sky-tint">on</span></div><div class="box dashed" style="padding:8px;margin-top:6px"><div class="sketch-text sm">+ Add a role</div></div></div>
              <div><div class="sketch-text sm">Photos</div><div class="row tight" style="margin-top:4px"><div class="box fill" style="width:60px;height:40px"></div><div class="box fill" style="width:60px;height:40px"></div><div class="box dashed" style="width:60px;height:40px;display:grid;place-items:center"><div class="sketch-text sm">+</div></div></div></div>
            </div>
          </div>
          <div style="padding:14px;background:var(--paper)">
            <div class="row tight" style="margin-bottom:8px">
              <div class="chip ember-tint">Preview</div>
              <div class="chip">.md</div>
              <div class="chip">.json</div>
            </div>
            <div class="box" style="padding:12px">
              <div class="row" style="gap:8px"><div class="box fill" style="width:36px;height:36px;display:grid;place-items:center;font-family:var(--serif);font-size:18px">C</div><div><div class="sketch-text" style="font-family:var(--serif)">Crew</div><div class="sketch-text sm muted">Lehi · FinTech · Seed</div></div></div>
              <div class="h-line"></div>
              <div class="scribble full"></div><div class="scribble med" style="margin-top:4px"></div>
              <div class="row tight" style="margin-top:6px"><span class="chip">14 ppl</span><span class="chip">2024</span><span class="chip sky-tint">3 jobs</span></div>
            </div>
            <div class="sketch-text sm muted" style="margin-top:8px">Live preview &mdash; agent surfaces update at publish.</div>
          </div>
        </div>
        <div class="callout br">live preview =<br/>confidence</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Agent handoff: "Update via Claude"</div>
      <div class="note">After claim, the page offers a copy-paste prompt that lets the founder hand updates off to ChatGPT/Claude. The judge moment.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew/edit?via=agent</div></div>
      <div class="body" style="padding:18px">
        <div class="sketch-text mono muted">CREW · CLAIMED</div>
        <div class="sketch-text xl" style="margin:4px 0 6px">Update from your favorite agent</div>
        <div class="sketch-text" style="max-width:540px">Don't want to come back here every time? Paste this into Claude or ChatGPT and they'll talk to Atlas's API for you.</div>

        <div class="box" style="margin-top:14px;padding:12px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:12px;line-height:1.55">
          <div style="opacity:.55">// prompt for Claude / ChatGPT — paste anywhere</div><br/>
          You are updating my Startup State Atlas profile.<br/>
          Slug: <span style="color:#FBE7DC">crew</span><br/>
          Token: <span style="color:#FBE7DC">cl_8f2a... (one-time)</span><br/>
          API: <span style="color:#FBE7DC">PATCH /api/v1/companies/crew</span><br/>
          Spec: <span style="color:#FBE7DC">/api/v1/openapi.json</span><br/>
          <br/>
          Help me update <strong>hiring</strong>, <strong>jobs</strong>, and the <strong>description</strong>.<br/>
          Confirm the request body before sending.<br/>
          Do not change website, address, or LinkedIn.
        </div>
        <div class="row" style="margin-top:10px;gap:8px">
          <div class="btn sm">Copy prompt</div>
          <div class="btn sm">Open in Claude</div>
          <div class="btn sm">Open in ChatGPT</div>
        </div>
        <div class="h-line" style="margin:18px 0"></div>
        <div class="sketch-text mono muted">RECENT AGENT EDITS</div>
        <div class="stack-2" style="margin-top:6px">
          <div class="box" style="padding:8px 10px"><div class="row" style="justify-content:space-between"><div class="sketch-text sm">claude.ai · added 2 jobs</div><div class="sketch-text sm muted">today · 12:14</div></div></div>
          <div class="box" style="padding:8px 10px"><div class="row" style="justify-content:space-between"><div class="sketch-text sm">chatgpt · updated description</div><div class="sketch-text sm muted">3 days ago</div></div></div>
        </div>
        <div class="callout tr">hackathon<br/>"wow" moment</div>
      </div>
    </div>
  </article>
  `;
})();
