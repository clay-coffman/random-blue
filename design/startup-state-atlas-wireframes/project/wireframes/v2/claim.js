// ===== CLAIM FLOW — A magic link → B editor → C update via Claude/ChatGPT =====
(function(){
  const root = document.getElementById('panel-claim');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Three-act claim flow</h3>
      <span class="sub">Act 1 magic-link verification → Act 2 live editor → Act 3 "update via Claude/ChatGPT" reveal. C is the strongest hackathon-judge moment in the whole product.</span>
    </div>

    <!-- =========== ACT 1 =========== -->
    <div class="act-header">
      <div class="act-num">Act 1</div>
      <div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:30px;line-height:1">Claim &amp; verify — A</div>
        <div class="sketch-text muted" style="margin-top:4px">Domain email · magic link · ~90 seconds. No account, no CMS.</div>
      </div>
    </div>

    <div class="grid three">
      <div class="variant">
        <header><div class="label"><span class="step">1.1</span>"Are you Crew?"</div>
        <div class="note">Triggered from any unclaimed profile. CTA lives in the right rail and at the bottom of the page.</div></header>
        <div class="screen short">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/startups/crew</div></div>
          <div class="body" style="padding:18px">
            <div class="sketch-text mono sm" style="color:var(--ink-3)">FINTECH · SEED · LEHI</div>
            <div class="sketch-text xl">Crew</div>
            <div class="sketch-text sm muted">Family neobanking · 14 employees</div>
            <div class="box dashed" style="padding:14px;margin-top:18px">
              <div class="sketch-text" style="font-weight:700;font-size:16px">Are you Crew?</div>
              <div class="sketch-text sm muted" style="margin-top:4px">Claim this profile to update jobs, description, hiring, gallery — for humans <em>and</em> for AI agents.</div>
              <div class="row tight" style="margin-top:10px">
                <span class="btn primary sm">Claim →</span>
                <span class="btn ghost sm">Suggest an edit</span>
              </div>
            </div>
            <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:10px;line-height:1.6">↑ verification works because the company website domain is on file (crew.com). Anyone with a @crew.com email gets in.</div>
          </div>
        </div>
      </div>

      <div class="variant">
        <header><div class="label"><span class="step">1.2</span>Domain email + magic link</div>
        <div class="note">Single field. Domain is checked against the company's verified website. Mismatched domains route to a manual GOEO review.</div></header>
        <div class="screen short">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/claim/crew</div></div>
          <div class="body" style="padding:24px">
            <div class="sketch-text mono sm" style="color:var(--ember)">CLAIMING · CREW</div>
            <div class="sketch-text" style="font-family:var(--serif);font-size:24px;line-height:1.1;margin-top:6px">Use your work email at <span style="color:var(--ember)">crew.com</span></div>

            <div class="box fill" style="padding:14px;margin-top:14px;background:#fff">
              <div class="sketch-text mono sm" style="color:var(--ink-3)">EMAIL</div>
              <div class="sketch-text" style="font-size:18px;border-bottom:1.5px solid var(--ink);padding:6px 0;margin-top:4px">priya<span style="color:var(--ink-3)">@crew.com</span></div>
              <div class="row tight" style="margin-top:10px">
                <span class="chip sage-tint">✓ matches verified domain</span>
                <span class="chip">no password needed</span>
              </div>
            </div>

            <div class="row tight" style="margin-top:14px">
              <span class="btn primary">Send magic link →</span>
              <span class="btn ghost sm">Different verification</span>
            </div>

            <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:12px;line-height:1.6">↑ alternates: LinkedIn match · GOEO contact on file · manual review (24h)</div>
          </div>
        </div>
      </div>

      <div class="variant">
        <header><div class="label"><span class="step">1.3</span>Link clicked → ownership granted</div>
        <div class="note">Plain confirmation, then straight into the editor. No interstitial dashboard, no settings page.</div></header>
        <div class="screen short">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/claim/crew/verified</div></div>
          <div class="body" style="padding:24px;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:10px">
            <div class="sketch-text" style="font-family:var(--serif);font-size:48px;line-height:1;color:var(--sage)">✓</div>
            <div class="sketch-text" style="font-family:var(--serif);font-size:24px;line-height:1.15">You own Crew.</div>
            <div class="sketch-text sm muted">priya@crew.com · verified by domain · 12s ago</div>
            <div class="row tight" style="justify-content:center;margin-top:8px">
              <span class="btn primary">Edit profile →</span>
              <span class="btn ghost sm">Go to map</span>
            </div>
            <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:14px;line-height:1.6;max-width:340px;margin-left:auto;margin-right:auto">A verification badge will appear on the profile within ~30 seconds. Other crew.com emails can also edit — invite or restrict from settings.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- =========== ACT 2 =========== -->
    <div class="act-header">
      <div class="act-num">Act 2</div>
      <div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:30px;line-height:1">Edit with live preview — B</div>
        <div class="sketch-text muted" style="margin-top:4px">Form on the left, profile preview on the right, agent-card preview as a toggle. The practical workflow.</div>
      </div>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;min-height:680px">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/claim/crew/edit</div><span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">draft · autosave on</span></div>
          <div class="body" style="padding:0;display:grid;grid-template-columns:1fr 1fr;min-height:640px">

            <!-- editor -->
            <div style="padding:24px 28px;border-right:1.5px solid var(--ink);overflow:hidden">
              <div class="row between">
                <div class="sketch-text mono sm" style="color:var(--ember)">← EDITOR</div>
                <div class="row tight">
                  <span class="chip sage-tint">draft</span>
                  <span class="chip">autosaved 3s ago</span>
                </div>
              </div>

              <!-- field group: identity -->
              <div style="margin-top:16px">
                <div class="sketch-text mono sm" style="color:var(--ink-3)">IDENTITY</div>
                ${field('Name', 'Crew', 'locked · contact GOEO to change')}
                ${field('Tagline', 'Family neobanking for the way modern parents actually move money.', '120 chars · shown on profile, .md, and search results')}
                ${field('Sectors', '[FinTech] [+ add]', 'pick 1-3 from the controlled list')}
              </div>

              <div style="margin-top:18px">
                <div class="sketch-text mono sm" style="color:var(--ink-3)">OPERATING</div>
                ${field('Stage', 'Seed ▾', '')}
                ${field('Employees', '14', 'integer · last update 12 days ago')}
                ${field('Hiring', '✓ Yes', 'pulls in 3 open roles below')}
              </div>

              <!-- jobs editor -->
              <div style="margin-top:18px">
                <div class="sketch-text mono sm" style="color:var(--ink-3)">OPEN ROLES (3)</div>
                <div class="stack-2" style="margin-top:6px">
                  ${jobRow('Senior backend engineer', 'Eng · Lehi/remote · $160-200k', true)}
                  ${jobRow('Growth marketing lead', 'GTM · Lehi · $130-160k')}
                  ${jobRow('Product designer (mobile)', 'Design · Lehi · $110-150k')}
                  <div class="box dashed" style="padding:8px 12px;text-align:center"><span class="sketch-text sm muted">+ Add a role</span></div>
                </div>
              </div>

              <div class="row tight" style="margin-top:24px">
                <span class="btn primary">Publish changes →</span>
                <span class="btn ghost sm">Save draft</span>
                <span class="btn ghost sm" style="margin-left:auto;color:var(--danger)">Discard</span>
              </div>
            </div>

            <!-- live preview -->
            <div style="padding:24px 28px;background:var(--paper-2);position:relative">
              <div class="row between">
                <div class="sketch-text mono sm" style="color:var(--sage)">↓ LIVE PREVIEW</div>
                <div class="row tight" style="background:#fff;border:1.5px solid var(--ink);border-radius:6px;padding:2px;box-shadow:2px 2px 0 var(--ink)">
                  <span class="sketch-text" style="font-weight:700;font-size:12px;background:var(--ink);color:var(--paper);padding:4px 8px;border-radius:4px">Profile</span>
                  <span class="sketch-text muted" style="font-weight:700;font-size:12px;padding:4px 8px">Agent card</span>
                  <span class="sketch-text muted" style="font-weight:700;font-size:12px;padding:4px 8px">Map pin</span>
                </div>
              </div>

              <div style="margin-top:14px;background:#fff;border:1.5px solid var(--ink);border-radius:8px;padding:18px;box-shadow:4px 4px 0 var(--ink)">
                <div class="row tight">
                  <span class="chip dot fintech">FinTech</span>
                  <span class="chip">Seed</span>
                  <span class="chip ember-tint">hiring 3</span>
                </div>
                <div class="sketch-text" style="font-family:var(--serif);font-size:32px;line-height:1;margin-top:8px">Crew</div>
                <div class="sketch-text sm" style="color:var(--ink-2);margin-top:4px">Family neobanking for the way modern parents actually move money.</div>
                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:6px">Lehi, UT · 14 employees · founded 2022</div>

                <div class="box" style="height:90px;background:var(--stone);margin-top:12px;display:grid;place-items:center"><span class="sketch-text mono sm muted">[ hero photo ]</span></div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:14px">OPEN ROLES</div>
                <div class="stack-2" style="margin-top:4px">
                  <div class="box" style="padding:6px 10px"><span class="sketch-text sm" style="font-weight:700">Senior backend engineer</span> <span class="sketch-text sm muted">· $160-200k</span></div>
                  <div class="box" style="padding:6px 10px"><span class="sketch-text sm" style="font-weight:700">Growth marketing lead</span></div>
                  <div class="box" style="padding:6px 10px"><span class="sketch-text sm" style="font-weight:700">Product designer (mobile)</span></div>
                </div>

                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:14px;line-height:1.6">↑ this is what visitors will see. switch to "Agent card" or "Map pin" to preview those surfaces.</div>
              </div>

              <div class="callout" style="position:absolute;bottom:24px;right:28px;left:auto;top:auto">live as you type</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =========== ACT 3 =========== -->
    <div class="act-header">
      <div class="act-num" style="background:var(--ember);color:var(--paper-2)">Act 3</div>
      <div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:30px;line-height:1">Update via Claude / ChatGPT — C</div>
        <div class="sketch-text muted" style="margin-top:4px">The reveal. After publishing, the owner sees that next time they don't have to log in — they can ask Claude.</div>
      </div>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;min-height:720px;background:var(--ink)">
          <div class="chrome" style="background:#0A1320;border-bottom-color:var(--topo-2)"><div class="dots"><i></i><i></i><i></i></div><div class="url" style="background:rgba(247,244,237,.06);color:var(--paper);border-color:var(--topo-2)">/claim/crew/published</div></div>
          <div class="body" style="padding:0;color:var(--paper)">

            <!-- success header -->
            <div style="padding:32px 40px 18px;border-bottom:1px solid var(--topo-2)">
              <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.1em">✓ PUBLISHED · 12s AGO</div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:46px;line-height:1.05;color:var(--paper);margin-top:6px">Your profile is live.</div>
              <div class="sketch-text" style="color:var(--topo);margin-top:6px;max-width:560px">Crew is now visible on the map, in search results, and at four canonical URLs — the page, the JSON, the Markdown, and the API.</div>
              <div class="row tight" style="margin-top:14px">
                <span class="btn ember sm">↗ View live profile</span>
                <span class="btn sm" style="background:rgba(247,244,237,.1);color:var(--paper);border-color:var(--paper)">Back to editor</span>
              </div>
            </div>

            <!-- the reveal -->
            <div style="padding:28px 40px;display:grid;grid-template-columns:1fr 1.2fr;gap:32px">

              <!-- left: pitch + channels -->
              <div>
                <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.12em">↓ NEXT TIME, DON'T LOG IN</div>
                <div class="sketch-text" style="font-family:var(--serif);font-size:34px;line-height:1.08;color:var(--paper);margin-top:8px">Ask Claude or ChatGPT to update your profile.</div>
                <div class="sketch-text" style="color:var(--topo);margin-top:10px;line-height:1.6;max-width:420px">A scoped one-time token lets the agent PATCH only the fields you allow. Address, LinkedIn, and verified domain stay locked. Every change is logged.</div>

                <div class="stack-2" style="margin-top:20px">
                  ${channel('Claude', 'claude.ai · install MCP server', true)}
                  ${channel('ChatGPT', 'chat.openai.com · use OpenAPI tool')}
                  ${channel('Codex / CLI', 'startup-state company patch crew')}
                  ${channel('Direct API', 'PATCH /api/v1/companies/crew')}
                </div>

                <div class="sketch-text mono sm" style="color:var(--topo);margin-top:18px;line-height:1.6">↑ all four use the same token, the same scopes, the same audit log.</div>
              </div>

              <!-- right: agent prompt + edit log -->
              <div>
                <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.12em">↓ COPY THIS PROMPT</div>

                <div style="background:#0A1320;border:1.5px solid var(--topo-2);border-radius:8px;padding:18px;margin-top:8px;font-family:var(--mono);font-size:12px;line-height:1.7;color:var(--paper);position:relative">
                  <div style="position:absolute;top:8px;right:8px;display:flex;gap:6px">
                    <span class="chip" style="background:rgba(247,244,237,.06);color:var(--ember-tint);border-color:var(--topo-2);font-size:10px">copy</span>
                  </div>
You are updating my Startup State Atlas profile.<br/>
<br/>
Company slug: <span style="color:var(--ember-tint)">crew</span><br/>
One-time token: <span style="color:var(--ember-tint)">cl_8f2a••••••••</span><br/>
<br/>
<span style="color:var(--topo)"># allowed fields</span><br/>
- hiring_status<br/>
- jobs<br/>
- description<br/>
- tags<br/>
- photo_gallery<br/>
<br/>
<span style="color:var(--topo)"># do NOT change</span><br/>
- website<br/>
- address<br/>
- linkedin<br/>
- verified_domain<br/>
<br/>
Before sending the PATCH request,<br/>
show me the request body and wait<br/>
for my confirmation.
                </div>

                <div class="row tight" style="margin-top:10px">
                  <span class="btn ember sm">📋 Copy prompt</span>
                  <span class="btn sm" style="background:rgba(247,244,237,.1);color:var(--paper);border-color:var(--paper)">Open in Claude →</span>
                  <span class="btn sm" style="background:rgba(247,244,237,.1);color:var(--paper);border-color:var(--paper)">Open in ChatGPT →</span>
                </div>

                <!-- recent agent edits -->
                <div class="sketch-text mono sm" style="color:var(--ember-tint);letter-spacing:.12em;margin-top:24px">↓ RECENT AGENT EDITS</div>
                <div class="stack-2" style="margin-top:8px">
                  ${editLog('claude.ai', 'added 2 jobs · "Senior backend eng", "Growth lead"', 'today · 12:14', '✓ accepted')}
                  ${editLog('chatgpt.com', 'updated description', '3 days ago', '✓ accepted')}
                  ${editLog('claude.ai', 'tried to change website', '5 days ago', '✗ blocked')}
                  ${editLog('priya@crew.com', 'manual edit · gallery', 'last week', '✓ accepted')}
                </div>
              </div>
            </div>

            <!-- footer punchline -->
            <div style="padding:20px 40px 32px;border-top:1px solid var(--topo-2);background:#0A1320">
              <div class="sketch-text" style="font-family:var(--serif);font-size:18px;color:var(--paper);text-align:center;line-height:1.4;font-style:italic;max-width:760px;margin:0 auto">"You did not update a web page. You updated your canonical profile — and the website, the map, the API, and the agent docs all changed from the same source of truth."</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- rationale -->
    <div class="grid two" style="margin-top:32px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Three acts, one demo</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Each act takes ~20 seconds to demo. Act 1 establishes the lightweight verification the brief requires. Act 2 proves it's a usable CMS. Act 3 is the moment that earns the room.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Even mocked, Act 3 lands</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">For the hackathon you don't need real Claude/ChatGPT OAuth. You need a working OpenAPI spec, a copy-prompt button, a fake recent-edit log, and the dark "your profile is live" screen. The narrative does the work.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Two claim approaches we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutC('D','OAuth with Google Workspace / Microsoft 365','Better long-term security, but adds OAuth flows, scopes, and corporate-account confusion. Domain magic-link is the right MVP.','too heavy for hackathon')}
      ${cutC('E','Document upload (incorporation papers)','Solves edge cases but feels bureaucratic. Reserve for the manual-review fallback when domain doesn\'t match.','reads like state paperwork')}
    </div>
  `;

  function field(label, val, hint){
    return `<div class="box" style="padding:8px 12px;margin-top:6px;background:#fff">
      <div class="row between"><span class="sketch-text mono sm" style="color:var(--ink-3)">${label.toUpperCase()}</span>${hint?`<span class="sketch-text sm muted" style="font-size:11px">${hint}</span>`:''}</div>
      <div class="sketch-text" style="font-weight:500;margin-top:2px">${val}</div>
    </div>`;
  }

  function jobRow(t, sub, focus){
    return `<div class="box" style="padding:8px 12px;${focus?'border-color:var(--ember);box-shadow:3px 3px 0 var(--ember)':''}">
      <div class="row between"><div><div class="sketch-text" style="font-weight:700;font-size:14px">${t}</div><div class="sketch-text sm muted">${sub}</div></div>
      <div class="row tight"><span class="kbd">edit</span><span class="kbd">×</span></div></div>
    </div>`;
  }

  function channel(name, sub, primary){
    return `<div style="padding:10px 12px;border:1.5px solid ${primary?'var(--ember-tint)':'var(--topo-2)'};border-radius:6px;background:${primary?'rgba(194,65,12,.18)':'rgba(247,244,237,.04)'};display:flex;justify-content:space-between;align-items:center">
      <div><div class="sketch-text" style="color:var(--paper);font-weight:700">${name}</div><div class="sketch-text mono sm" style="color:var(--topo)">${sub}</div></div>
      <span class="sketch-text sm" style="color:${primary?'var(--ember-tint)':'var(--topo)'}">${primary?'set up →':'connect'}</span>
    </div>`;
  }

  function editLog(actor, action, when, status){
    const ok = status.startsWith('✓');
    return `<div style="padding:8px 10px;border-left:3px solid ${ok?'var(--sage)':'var(--danger)'};background:rgba(247,244,237,.04);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div>
        <div class="sketch-text mono sm" style="color:var(--ember-tint);font-weight:600">${actor}</div>
        <div class="sketch-text sm" style="color:var(--paper)">${action}</div>
      </div>
      <div style="text-align:right">
        <div class="sketch-text mono sm" style="color:var(--topo)">${when}</div>
        <div class="sketch-text mono sm" style="color:${ok?'#A7D5A9':'#F4B0B0'};font-weight:600">${status}</div>
      </div>
    </div>`;
  }

  function cutC(opt, title, body, why){
    return `<div class="variant cut">
      <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
      <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:8px">${cutThumb(opt)}</div></div>
      <div class="note" style="margin-top:10px">${body}</div>
      <div class="why-cut">${why}</div>
    </div>`;
  }
  function cutThumb(opt){
    if(opt==='D') return `<div style="height:160px;display:grid;place-items:center;gap:8px"><div class="box" style="padding:10px 16px;background:var(--paper-2)"><span class="sketch-text">G  Sign in with Google</span></div><div class="box" style="padding:10px 16px;background:var(--paper-2)"><span class="sketch-text">⊞  Sign in with Microsoft</span></div><div class="box" style="padding:10px 16px;background:var(--paper-2)"><span class="sketch-text">@  Use SSO domain</span></div></div>`;
    if(opt==='E') return `<div style="height:160px;display:grid;place-items:center"><div class="box dashed" style="padding:14px 20px;text-align:center"><div class="sketch-text mono sm muted">drag a PDF</div><div class="sketch-text sm muted">articles of incorporation · EIN letter</div></div></div>`;
  }
})();
