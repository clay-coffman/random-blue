// 90-day plan wireframes
(function(){
  const grid = document.getElementById('panel-plan-grid');
  if(!grid) return;

  grid.innerHTML = `
  <article class="variant">
    <header>
      <div class="label"><span class="opt">A</span>Now / Next / Later columns</div>
      <div class="note">3-column kanban. Each card = a resource with a why and an action. Most "field manual" feel.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/plan/fp_a4f2</div></div>
      <div class="body" style="padding:14px">
        <div class="row" style="justify-content:space-between">
          <div>
            <div class="sketch-text mono muted">PLAN · FP_A4F2 · PRIYA</div>
            <div class="sketch-text xl" style="margin-top:2px">Your 90-day plan</div>
          </div>
          <div class="row tight"><span class="chip">Edit passport</span><span class="chip ember-tint">Save & share</span></div>
        </div>
        <div class="h-line" style="margin:8px 0 12px"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div>
            <div class="sketch-text mono" style="color:var(--ember)">DO THIS NOW</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="sketch-text sm mono muted">r_2547</div>
                <div class="sketch-text">Pelion Ventures</div>
                <div class="sketch-text sm muted">apply by Nov 14</div>
                <div class="scribble short" style="margin-top:6px"></div>
                <div class="row tight" style="margin-top:6px"><span class="chip ember-tint">why →</span><div class="btn sm">Draft email</div></div>
              </div>
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="sketch-text sm mono muted">r_1820</div>
                <div class="sketch-text">Salt Lake Angels</div>
                <div class="sketch-text sm muted">monthly pitch · next Tue</div>
                <div class="scribble short" style="margin-top:6px"></div>
              </div>
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="sketch-text sm mono muted">r_0731</div>
                <div class="sketch-text">Kickstart Fund</div>
                <div class="sketch-text sm muted">warm intro available</div>
              </div>
            </div>
          </div>
          <div>
            <div class="sketch-text mono">DO THIS NEXT</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="box" style="padding:10px"><div class="sketch-text sm mono muted">r_3041</div><div class="sketch-text">Park City Angels</div><div class="scribble short" style="margin-top:6px"></div></div>
              <div class="box" style="padding:10px"><div class="sketch-text sm mono muted">r_0455</div><div class="sketch-text">Tandem Ventures</div><div class="scribble short" style="margin-top:6px"></div></div>
              <div class="box" style="padding:10px"><div class="sketch-text sm mono muted">r_1199</div><div class="sketch-text">Peterson Ventures</div></div>
            </div>
          </div>
          <div>
            <div class="sketch-text mono muted">IGNORE FOR NOW</div>
            <div class="stack-2" style="margin-top:6px">
              <div class="box dashed" style="padding:10px;opacity:.7"><div class="sketch-text sm">USU rural ag program</div><div class="sketch-text sm muted">not your county/stage</div></div>
              <div class="box dashed" style="padding:10px;opacity:.7"><div class="sketch-text sm">Export support · World Trade</div><div class="sketch-text sm muted">revisit at growth stage</div></div>
              <div class="box dashed" style="padding:10px;opacity:.7"><div class="sketch-text sm">SBIR / SBA grants</div><div class="sketch-text sm muted">non-fit for SaaS</div></div>
            </div>
          </div>
        </div>
        <div class="callout br">3 cols = field-manual<br/>"do this now"</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">B</span>Single ranked list w/ urgency band</div>
      <div class="note">Newspaper-style. Top of list is "this week"; band changes as you scroll. Easier to skim, less staging.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/plan/fp_a4f2</div></div>
      <div class="body" style="padding:18px">
        <div class="sketch-text mono muted">PRIYA · SLC · PAYING_CUSTOMERS · RAISE_SEED</div>
        <div class="sketch-text xl" style="margin:4px 0 14px;font-size:32px">8 moves, ranked by fit.</div>

        <div class="row" style="background:#FBE7DC;padding:6px 10px;border-radius:6px;margin-bottom:8px">
          <div class="sketch-text mono" style="color:var(--ember)">THIS WEEK · 3</div>
        </div>
        <div class="stack-2">
          <div class="box" style="padding:12px;border-left:5px solid var(--ember);border-radius:6px">
            <div class="row" style="justify-content:space-between"><div class="sketch-text">Pelion Ventures · seed-stage VC</div><div class="sketch-text mono">92</div></div>
            <div class="sketch-text sm muted">Matches: Salt Lake, B2B SaaS, paying customers, woman-owned. <span style="text-decoration:underline">r_2547</span></div>
          </div>
          <div class="box" style="padding:12px;border-left:5px solid var(--ember);border-radius:6px">
            <div class="row" style="justify-content:space-between"><div class="sketch-text">Salt Lake Angels · monthly pitch</div><div class="sketch-text mono">88</div></div>
            <div class="sketch-text sm muted">Pitch night next Tue · apply by Mon noon. <span style="text-decoration:underline">r_1820</span></div>
          </div>
        </div>

        <div class="row" style="background:var(--stone);padding:6px 10px;border-radius:6px;margin:14px 0 8px">
          <div class="sketch-text mono">THIS MONTH · 3</div>
        </div>
        <div class="stack-2">
          <div class="box" style="padding:12px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Kickstart Fund</div><div class="sketch-text mono">85</div></div><div class="scribble short" style="margin-top:6px"></div></div>
          <div class="box" style="padding:12px"><div class="row" style="justify-content:space-between"><div class="sketch-text">Park City Angels</div><div class="sketch-text mono">79</div></div></div>
        </div>

        <div class="row" style="background:var(--stone);padding:6px 10px;border-radius:6px;margin:14px 0 8px;opacity:.7">
          <div class="sketch-text mono muted">NEXT QUARTER · 2</div>
        </div>
        <div class="box dashed" style="padding:12px;opacity:.7"><div class="sketch-text sm">Tandem Ventures · Peterson Ventures</div></div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">C</span>Plan + map split</div>
      <div class="note">Plan on the left. Map on the right showing matched investors/resources geo-pinned. Bridges navigator → map.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/plan/fp_a4f2</div></div>
      <div class="body" style="padding:0">
        <div style="display:grid;grid-template-columns:1fr 1fr;min-height:480px">
          <div style="padding:14px;border-right:1.5px solid var(--ink);overflow:auto">
            <div class="sketch-text mono muted">YOUR PLAN · 8 RESOURCES</div>
            <div class="sketch-text lg" style="font-size:20px;margin:4px 0 8px">Top 3 to do this week</div>
            <div class="stack-2">
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Pelion Ventures</div><div class="chip ember-tint">1</div></div>
                <div class="sketch-text sm muted">SLC · seed-stage VC</div>
              </div>
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Salt Lake Angels</div><div class="chip ember-tint">2</div></div>
              </div>
              <div class="box" style="padding:10px;border-left:5px solid var(--ember);border-radius:6px">
                <div class="row" style="justify-content:space-between"><div class="sketch-text sm">Kickstart Fund</div><div class="chip ember-tint">3</div></div>
              </div>
              <div class="h-line" style="margin:6px 0"></div>
              <div class="sketch-text sm muted">+ 5 more this month</div>
            </div>
          </div>
          <div style="position:relative">
            <div class="mapbg"></div>
            <span class="pin sel" style="background:var(--ember);left:42%;top:30%"></span>
            <span class="pin" style="background:var(--ember);left:50%;top:38%"></span>
            <span class="pin" style="background:var(--ember);left:38%;top:48%"></span>
            <span class="pin" style="background:#16A34A;left:55%;top:55%;opacity:.6"></span>
            <span class="pin" style="background:#16A34A;left:48%;top:65%;opacity:.6"></span>
            <div class="box" style="position:absolute;left:10px;top:10px;background:var(--paper);padding:8px 10px"><div class="sketch-text sm mono muted">SHOWING</div><div class="sketch-text sm">8 matched resources</div></div>
            <div class="box" style="position:absolute;right:10px;bottom:10px;background:var(--paper);padding:6px 10px"><div class="sketch-text sm">Open big map →</div></div>
          </div>
        </div>
        <div class="callout bl">geo + plan in<br/>same view</div>
      </div>
    </div>
  </article>

  <article class="variant">
    <header>
      <div class="label"><span class="opt">D</span>Letter / printable plan</div>
      <div class="note">Reads like a one-page memo from Atlas to the founder. Most shareable. Could literally print + hand to a GOEO contact.</div>
    </header>
    <div class="screen tall">
      <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/plan/fp_a4f2 — print view</div></div>
      <div class="body" style="padding:24px;background:var(--paper-2);font-family:var(--serif)">
        <div class="row" style="justify-content:space-between">
          <div class="sketch-text mono muted" style="font-family:var(--mono)">06 MAY 2026 · STARTUP STATE ATLAS</div>
          <div class="sketch-text mono muted" style="font-family:var(--mono)">PASSPORT FP_A4F2</div>
        </div>
        <div class="h-solid"></div>
        <div style="font-family:var(--serif);font-size:26px;line-height:1.15;margin:8px 0">Memo to Priya, B2B SaaS founder, Salt Lake City.</div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:16px;line-height:1.55">You're 18 months in with paying customers, raising your first venture round. Here's where to put the next 90 days.</div>
        <div class="h-line" style="margin:14px 0"></div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:18px"><strong>This week.</strong> Apply to Pelion Ventures (deadline Nov 14). Pitch at Salt Lake Angels Tuesday. Request a warm intro to Kickstart Fund.</div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:18px;margin-top:10px"><strong>This month.</strong> File with Park City Angels, Tandem Ventures, Peterson Ventures. Attend Silicon Slopes monthly mixer.</div>
        <div class="sketch-text" style="font-family:var(--serif);font-size:18px;margin-top:10px"><strong>Skip for now.</strong> SBIR grants and export programs &mdash; not a fit at your stage.</div>
        <div class="h-line" style="margin:14px 0"></div>
        <div class="row" style="justify-content:space-between">
          <div class="sketch-text sm" style="font-family:var(--mono);color:var(--ink-3)">Resource IDs: r_2547, r_1820, r_0731, r_3041, r_0455, r_1199</div>
          <div class="sketch-text sm" style="font-family:var(--mono);color:var(--ink-3)">— Atlas</div>
        </div>
        <div class="row" style="margin-top:18px;justify-content:flex-end;gap:8px">
          <div class="btn sm">Print</div><div class="btn sm">Copy URL</div><div class="btn ember sm">Email to me</div>
        </div>
        <div class="callout tr">printable<br/>= shareable</div>
      </div>
    </div>
  </article>
  `;
})();
