// Founder intake wireframes
(function(){
  const grid = document.getElementById('panel-intake-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Single-screen scrollable</div>
      <div class="note">All 6 questions on one page. No "next" button. User skims, fills what's relevant, hits generate. Best for repeat users + screenshots.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/founder/passport</div></div>
      <div class="body" style="padding:18px">
        <div class="sketch-text mono muted">STEP 0 · FOUNDER PASSPORT</div>
        <div class="sketch-text xl" style="margin:6px 0 12px">Who are you building?</div>

        <div class="box dashed" style="padding:10px;margin-bottom:8px">
          <div class="sketch-text sm">1 · Where in Utah?</div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip">Salt Lake</span><span class="chip ember-tint">Utah Co.</span>
            <span class="chip">Washington</span><span class="chip">Weber</span>
            <span class="chip">+ 25</span>
          </div>
        </div>
        <div class="box dashed" style="padding:10px;margin-bottom:8px">
          <div class="sketch-text sm">2 · What stage?</div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip">Idea</span><span class="chip">Pre-rev</span>
            <span class="chip ember-tint">Paying customers</span>
            <span class="chip">Growth</span>
          </div>
        </div>
        <div class="box dashed" style="padding:10px;margin-bottom:8px">
          <div class="sketch-text sm">3 · Industry</div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip sw">B2B SaaS</span><span class="chip ai">AI</span>
            <span class="chip fintech">FinTech</span><span class="chip">+ 8</span>
          </div>
        </div>
        <div class="box dashed" style="padding:10px;margin-bottom:8px">
          <div class="sketch-text sm">4 · Right now I need…</div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip ember-tint">Capital</span><span class="chip">Customers</span>
            <span class="chip">Talent</span><span class="chip">Mentors</span>
          </div>
        </div>
        <div class="box dashed" style="padding:10px;margin-bottom:8px">
          <div class="sketch-text sm">5 · Identity tags <span class="muted">(optional)</span></div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip">Veteran</span><span class="chip">Woman-owned</span>
            <span class="chip">Rural</span><span class="chip">Student</span>
            <span class="chip">Researcher</span>
          </div>
        </div>
        <div class="box dashed" style="padding:10px;margin-bottom:14px">
          <div class="sketch-text sm">6 · Urgency</div>
          <div class="row tight" style="margin-top:6px">
            <span class="chip ember-tint">This week</span>
            <span class="chip">This month</span>
            <span class="chip">Next quarter</span>
          </div>
        </div>

        <div class="row" style="justify-content:space-between">
          <div class="sketch-text sm muted">4 of 6 answered</div>
          <div class="btn ember">Generate plan →</div>
        </div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Wizard, one Q per step</div>
      <div class="note">Big-question, big-answer. More guided, less overwhelming. Slower. Good for first-timers like Jordan or Dr. Amir.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/founder/passport · 3 of 6</div></div>
      <div class="body" style="padding:22px">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:18px">
          <div class="sketch-text mono">STEP 3 / 6</div>
          <div style="flex:1;height:6px;background:var(--stone);margin:0 14px;border-radius:99px;border:1.5px solid var(--ink);position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;width:50%;background:var(--ember)"></div>
          </div>
          <div class="sketch-text sm">~ 60s left</div>
        </div>

        <div class="sketch-text xl" style="font-size:30px;line-height:1.1">What stage<br/>is the business?</div>
        <div class="sketch-text muted" style="margin:8px 0 22px">Pick the closest. We'll fine-tune later.</div>

        <div class="stack-2">
          <div class="box" style="padding:14px"><div class="row"><span class="rd"></span><div><div class="sketch-text lg">Just an idea</div><div class="sketch-text sm muted">No company yet. Maybe still your day job.</div></div></div></div>
          <div class="box" style="padding:14px"><div class="row"><span class="rd"></span><div><div class="sketch-text lg">Pre-revenue</div><div class="sketch-text sm muted">Building, not selling yet.</div></div></div></div>
          <div class="box ember" style="padding:14px"><div class="row"><span class="rd on" style="background:#fff;border-color:#fff"></span><div><div class="sketch-text lg" style="color:var(--paper)">Paying customers</div><div class="sketch-text sm" style="color:var(--paper);opacity:.8">Real revenue. Looking to grow.</div></div></div></div>
          <div class="box" style="padding:14px"><div class="row"><span class="rd"></span><div><div class="sketch-text lg">Growth / scaling</div><div class="sketch-text sm muted">Hiring, raising larger rounds, expanding.</div></div></div></div>
        </div>

        <div class="row" style="justify-content:space-between;margin-top:22px">
          <div class="btn ghost">← Back</div>
          <div class="row tight"><span class="kbd">Enter</span><div class="btn primary">Next →</div></div>
        </div>
        <div class="callout tr">slower but<br/>more humane</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Chat-style intake</div>
      <div class="note">Atlas asks questions in a conversation. Feels personal; clarifying questions easy. Worry: chat fatigue. Mitigate with chips for answers.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/founder/passport</div></div>
      <div class="body" style="padding:18px">
        <div class="row" style="justify-content:space-between">
          <div class="sketch-text mono muted">ATLAS · INTAKE</div>
          <div class="sketch-text sm">3 of 6 answered</div>
        </div>
        <div class="h-line"></div>
        <div class="stack-3" style="margin-top:8px">
          <div style="display:flex;gap:8px"><div class="box ink" style="width:28px;height:28px;flex:none;display:grid;place-items:center;font-family:var(--mono);font-size:11px">A</div>
          <div class="box" style="padding:8px 12px;max-width:80%"><div class="sketch-text">Hi 👋 I'll ask 6 quick things. Where in Utah are you?</div></div></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><div class="box fill" style="padding:6px 10px"><div class="sketch-text">Salt Lake City</div></div></div>
          <div style="display:flex;gap:8px"><div class="box ink" style="width:28px;height:28px;flex:none;display:grid;place-items:center;font-family:var(--mono);font-size:11px">A</div>
          <div class="box" style="padding:8px 12px;max-width:80%"><div class="sketch-text">Got it. What stage?</div></div></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><div class="box fill" style="padding:6px 10px"><div class="sketch-text">Paying customers</div></div></div>
          <div style="display:flex;gap:8px"><div class="box ink" style="width:28px;height:28px;flex:none;display:grid;place-items:center;font-family:var(--mono);font-size:11px">A</div>
          <div class="box" style="padding:8px 12px;max-width:80%"><div class="sketch-text">What kind of business? Pick one or type your own.</div>
          <div class="row tight" style="margin-top:8px">
            <span class="chip sw">B2B SaaS</span><span class="chip fintech">FinTech</span>
            <span class="chip ai">AI</span><span class="chip">other…</span>
          </div></div></div>
        </div>
        <div class="box" style="margin-top:14px;padding:10px;background:var(--paper)">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div class="sketch-text muted">Type or pick a chip…</div>
            <div class="btn primary sm">Send</div>
          </div>
        </div>
        <div class="callout bl">chips = no typing<br/>= fast</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">D</span>Two-pane: form + live preview</div>
      <div class="note">Left = the questions. Right = the Founder Passport JSON building in real-time + an early peek at top matches. Power users + agents will love this.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/founder/passport</div></div>
      <div class="body" style="padding:0">
        <div style="display:grid;grid-template-columns:1.1fr 1fr;min-height:480px">
          <div style="padding:16px;border-right:1.5px solid var(--ink)">
            <div class="sketch-text mono muted">PASSPORT · INTAKE</div>
            <div class="sketch-text xl" style="margin:6px 0 14px">Tell us your situation</div>
            <div class="stack-2">
              <div class="box dashed" style="padding:10px"><div class="sketch-text sm">County</div><div class="row tight" style="margin-top:4px"><span class="chip ember-tint">Salt Lake</span></div></div>
              <div class="box dashed" style="padding:10px"><div class="sketch-text sm">Stage</div><div class="row tight" style="margin-top:4px"><span class="chip ember-tint">Paying customers</span></div></div>
              <div class="box dashed" style="padding:10px"><div class="sketch-text sm">Industry</div><div class="row tight" style="margin-top:4px"><span class="chip ember-tint">B2B SaaS</span><span class="chip">+ AI</span></div></div>
              <div class="box dashed" style="padding:10px"><div class="sketch-text sm">Goal</div><div class="row tight" style="margin-top:4px"><span class="chip ember-tint">Raise seed</span></div></div>
              <div class="box dashed" style="padding:10px"><div class="sketch-text sm">Identity</div><div class="row tight" style="margin-top:4px"><span class="chip">Woman-owned</span></div></div>
            </div>
            <div class="row" style="justify-content:flex-end;margin-top:14px"><div class="btn ember">Generate plan →</div></div>
          </div>
          <div style="padding:14px;background:var(--paper-2)">
            <div class="sketch-text mono muted">LIVE PASSPORT</div>
            <div class="box" style="padding:10px;margin-top:6px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:11.5px;line-height:1.5">
{<br/>
&nbsp;&nbsp;"id": "fp_a4f2",<br/>
&nbsp;&nbsp;"county": "Salt Lake",<br/>
&nbsp;&nbsp;"stage": "paying_customers",<br/>
&nbsp;&nbsp;"industry": "b2b_saas",<br/>
&nbsp;&nbsp;"goal": "raise_seed",<br/>
&nbsp;&nbsp;"tags": ["woman_owned"]<br/>
}
            </div>
            <div class="sketch-text mono muted" style="margin-top:14px">EARLY MATCHES (3)</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="box" style="padding:8px 10px"><div class="sketch-text sm">Pelion Ventures · 92</div><div class="scribble short" style="margin-top:4px"></div></div>
              <div class="box" style="padding:8px 10px"><div class="sketch-text sm">Salt Lake Angels · 88</div><div class="scribble short" style="margin-top:4px"></div></div>
              <div class="box" style="padding:8px 10px"><div class="sketch-text sm">Kickstart Fund · 85</div><div class="scribble short" style="margin-top:4px"></div></div>
            </div>
          </div>
        </div>
        <div class="callout tr">passport visible<br/>= trust+agent vibe</div>
      </div>
    </div>
  </article>
  `;
})();
