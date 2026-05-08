// ===== 90-DAY PLAN — A Now/Next/Later primary, D printable memo complement =====
(function(){
  const root = document.getElementById('panel-plan');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Now / Next / Later — opinionated three-column field manual</h3>
      <span class="sub">A. The "Ignore for now" column is the differentiator. Plan, Memo, Map as tabs.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;border-radius:0;min-height:780px">
          <div class="chrome">
            <div class="dots"><i></i><i></i><i></i></div>
            <div class="url">/atlas/plan/fp_a3f9c2</div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">shareable · save / export</span>
          </div>
          <div class="body" style="padding:0">

            <!-- plan header -->
            <div style="padding:24px 32px;border-bottom:1.5px solid var(--ink);display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap">
              <div>
                <div class="sketch-text mono sm" style="color:var(--ink-3)">90-DAY PLAN · for fp_a3f9c2</div>
                <div class="sketch-text xxl" style="margin-top:4px;font-size:34px">Priya · Salt Lake City · paying customers · raising seed</div>
                <div class="row tight" style="margin-top:10px">
                  <span class="chip ember-tint">capital</span>
                  <span class="chip sky-tint">customers</span>
                  <span class="chip">B2B SaaS</span>
                  <span class="chip">SLC County</span>
                  <span class="sketch-text sm muted" style="margin-left:6px">edit passport →</span>
                </div>
              </div>
              <div class="row tight">
                <span class="btn ghost">📄 Print memo</span>
                <span class="btn ghost">📋 Copy memo</span>
                <span class="btn ghost">✉ Email me</span>
                <span class="btn primary">Share plan</span>
              </div>
            </div>

            <!-- tabs -->
            <div style="display:flex;gap:0;padding:0 32px;border-bottom:1.5px solid var(--ink);background:var(--paper-2)">
              ${planTab('Plan', true)}
              ${planTab('Memo', false)}
              ${planTab('On the map', false)}
              ${planTab('Why these', false)}
            </div>

            <!-- 3 columns -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;min-height:580px">
              <!-- NOW -->
              <div style="padding:20px 22px;border-right:1.5px solid var(--ink);background:var(--paper-2)">
                <div class="row between" style="align-items:flex-end">
                  <div>
                    <div class="sketch-text mono sm" style="color:var(--ember)">↓ DO THIS NOW</div>
                    <div class="sketch-text xl">This week · 3 actions</div>
                  </div>
                  <span class="chip ember-tint">3</span>
                </div>
                <div class="stack-3" style="margin-top:14px">
                  ${planCard('Pelion Ventures','intro request', 92, 'capital · seed B2B SaaS', 'draft email →', 'sage', true)}
                  ${planCard('Salt Lake Angels','Nov pitch night', 88, 'capital · apply by Nov 14', 'apply →', 'sage')}
                  ${planCard('Silicon Slopes Connect','customer intros', 81, 'customers · monthly meetup', 'register →', 'sky')}
                </div>
              </div>

              <!-- NEXT -->
              <div style="padding:20px 22px;border-right:1.5px solid var(--ink)">
                <div class="row between" style="align-items:flex-end">
                  <div>
                    <div class="sketch-text mono sm" style="color:var(--ink)">↓ DO THIS NEXT</div>
                    <div class="sketch-text xl">Weeks 2–6 · 4 actions</div>
                  </div>
                  <span class="chip">4</span>
                </div>
                <div class="stack-3" style="margin-top:14px">
                  ${planCard('Kickstart Fund','seed pitch', 85, 'capital · regional · rolling', 'submit deck', 'sage', false, true)}
                  ${planCard('Park City Angels','syndicate intro', 79, "capital · warm intro req'd", 'request intro')}
                  ${planCard('Startup State office hours','GOEO mentor', 74, 'mentors · weekly · free', 'book slot','ink')}
                  ${planCard('Tandem Ventures','seed B2B', 72, 'capital · seed checks', 'cold email')}
                </div>
              </div>

              <!-- LATER + IGNORE -->
              <div style="padding:20px 22px">
                <div class="row between" style="align-items:flex-end">
                  <div>
                    <div class="sketch-text mono sm" style="color:var(--ink-3)">↓ IGNORE FOR NOW</div>
                    <div class="sketch-text xl">14 things you don't need</div>
                  </div>
                  <span class="chip">14</span>
                </div>
                <div class="sketch-text sm muted" style="margin-top:6px;line-height:1.5">Atlas is opinionated about what to skip. Click any item to see why it doesn't fit your passport — or override.</div>
                <div class="stack-2" style="margin-top:14px">
                  ${ignored('USDA Rural Microloan','not rural / not ag')}
                  ${ignored('Veterans Business Outreach','not a veteran')}
                  ${ignored('FDA 510(k) consulting','no medical device')}
                  ${ignored('Export-Import Bank intro','domestic only at seed')}
                  ${ignored('University TTO commercialization','not university research')}
                  ${ignored('Pre-revenue grants (3)','past pre-revenue')}
                  ${ignored('+ 8 more','low fit · &lt;40% match','muted')}
                </div>

                <div class="box ember-tint" style="padding:10px 12px;margin-top:18px;border-color:var(--ember)">
                  <div class="sketch-text sm" style="color:var(--ember-2);font-weight:700">↑ "Ignore for now" is the demo moment.</div>
                  <div class="sketch-text sm" style="color:var(--ink-2);margin-top:4px">A directory shows you everything. A guide tells you what <em>not</em> to chase. — Priya, after seeing this</div>
                </div>
              </div>
            </div>

            <!-- footer toolbar -->
            <div style="padding:14px 32px;border-top:1.5px solid var(--ink);background:var(--ink);color:var(--paper);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
              <div style="font-family:var(--mono);font-size:11px;color:var(--topo)">PLAN_ID · pl_8a1c · saved · last update 12s ago</div>
              <div class="row tight">
                <span class="sketch-text mono sm" style="color:var(--topo)">Same plan as JSON →</span>
                <span class="sketch-text mono sm" style="color:var(--ember-tint)">/api/v1/founder-passports/fp_a3f9c2/plan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========= COMPLEMENT: D printable memo ========= -->
    <div class="section-label" style="margin-top:48px">
      <span class="badge complement">Complement</span>
      <h3>Printable / shareable memo — D</h3>
      <span class="sub">One page. Reads in 30 seconds. Forwardable to a cofounder, mentor, or GOEO contact.</span>
    </div>

    <div class="grid two">
      <div class="variant" style="padding:0">
        <div class="screen tall" style="border:0">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/atlas/plan/pl_8a1c.pdf</div></div>
          <div class="body" style="padding:32px 40px;background:#fff;font-family:var(--serif)">
            <div style="border-bottom:2px solid var(--ink);padding-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <div class="sketch-text mono sm" style="color:var(--ink-3)">STARTUP STATE ATLAS · MEMO</div>
                <div class="sketch-text" style="font-family:var(--serif);font-size:28px;font-weight:500;margin-top:4px">For Priya, on raising your seed.</div>
              </div>
              <div class="sketch-text mono sm" style="color:var(--ink-3)">Nov 8, 2026 · pl_8a1c</div>
            </div>

            <div style="margin-top:16px;font-family:var(--serif);font-size:15px;line-height:1.6;color:var(--ink-2)">
              You're a B2B SaaS founder in Salt Lake County, 18 months in, paying customers, raising your first venture round. Your passport says capital and warm-intro customers are the priorities; everything else is noise for now.
            </div>

            <div style="margin-top:18px">
              <div class="sketch-text mono sm" style="color:var(--ember)">THIS WEEK</div>
              <ul style="margin:6px 0 0;padding-left:18px;font-family:var(--serif);font-size:15px;line-height:1.7">
                <li>Email <strong>Pelion Ventures</strong> with deck. Draft attached. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_2547]</span></li>
                <li>Apply to <strong>Salt Lake Angels</strong> Nov 14 pitch night. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_3102]</span></li>
                <li>Register for the next <strong>Silicon Slopes Connect</strong>. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_2880]</span></li>
              </ul>
            </div>

            <div style="margin-top:18px">
              <div class="sketch-text mono sm" style="color:var(--ink)">THIS MONTH</div>
              <ul style="margin:6px 0 0;padding-left:18px;font-family:var(--serif);font-size:15px;line-height:1.7">
                <li>Submit deck to <strong>Kickstart Fund</strong>. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_2901]</span></li>
                <li>Request a warm intro to <strong>Park City Angels</strong>. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_3120]</span></li>
                <li>Book GOEO office hours. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_1144]</span></li>
                <li>Cold email <strong>Tandem Ventures</strong>. <span class="sketch-text mono sm" style="color:var(--ink-3)">[r_2944]</span></li>
              </ul>
            </div>

            <div style="margin-top:18px">
              <div class="sketch-text mono sm" style="color:var(--ink-3)">SKIP FOR NOW</div>
              <div class="sketch-text" style="font-family:var(--serif);font-size:14px;color:var(--ink-3);margin-top:6px;line-height:1.5">
                Rural / agricultural · veterans · FDA · export · pre-revenue grants · university TTO. None of these match your stage or attributes.
              </div>
            </div>

            <div style="margin-top:24px;padding-top:14px;border-top:1px solid var(--topo);font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:.06em">
              SOURCES: r_2547, r_3102, r_2880, r_2901, r_3120, r_1144, r_2944 · all verified · last sync 09:14 MT
            </div>
          </div>
        </div>
      </div>

      <div class="col" style="gap:18px">
        <div class="variant">
          <header><div class="label"><span class="opt">share</span>Email + share modal</div>
          <div class="note">Same plan, three formats. Magic link survives logout.</div></header>
          <div class="screen short">
            <div class="body">
              <div class="sketch-text xl" style="margin-bottom:10px">Send Priya's plan</div>
              <div class="stack-2">
                <div class="box" style="padding:10px;display:flex;align-items:center;gap:10px"><span class="ck on"></span><div style="flex:1"><div class="sketch-text" style="font-weight:700">Email me a copy</div><div class="sketch-text sm muted">priya@trycrew.com</div></div></div>
                <div class="box" style="padding:10px;display:flex;align-items:center;gap:10px"><span class="ck on"></span><div style="flex:1"><div class="sketch-text" style="font-weight:700">Shareable URL</div><div class="sketch-text sm muted">/p/8a1c · expires in 30 days</div></div><span class="btn sm">Copy</span></div>
                <div class="box" style="padding:10px;display:flex;align-items:center;gap:10px"><span class="ck"></span><div style="flex:1"><div class="sketch-text" style="font-weight:700">CC my GOEO contact</div><div class="sketch-text sm muted">advisor@goeo.utah.gov</div></div></div>
                <div class="box" style="padding:10px;display:flex;align-items:center;gap:10px"><span class="ck"></span><div style="flex:1"><div class="sketch-text" style="font-weight:700">Print as PDF</div><div class="sketch-text sm muted">portrait, US letter</div></div></div>
              </div>
              <div class="row" style="margin-top:14px;justify-content:flex-end"><span class="btn ember">Send →</span></div>
            </div>
          </div>
        </div>

        <div class="variant">
          <header><div class="label"><span class="opt">on the map</span>Plan ↔ map cross-link</div>
          <div class="note">Each resource pins where it lives geographically. Investors get the same view at zoom level: "the cluster Priya is fundraising into."</div></header>
          <div class="screen short" style="position:relative">
            <div class="mapbg"></div>
            <div class="pin sel" style="left:42%;top:48%"></div>
            <div class="pin" style="left:55%;top:36%;background:var(--sage)"></div>
            <div class="pin" style="left:48%;top:62%;background:var(--sage)"></div>
            <div class="pin" style="left:58%;top:55%;background:var(--sky)"></div>
            <div class="pin" style="left:38%;top:62%;background:var(--sage)"></div>
            <div style="position:absolute;left:14px;top:14px;background:#fff;border:1.5px solid var(--ink);padding:8px 10px;border-radius:6px;box-shadow:3px 3px 0 var(--ink)">
              <div class="sketch-text mono sm" style="color:var(--ember)">PLAN PINNED · 7</div>
              <div class="sketch-text" style="font-weight:700">Priya's seed cluster</div>
              <div class="sketch-text sm muted">SLC + Park City</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- rationale -->
    <div class="grid two" style="margin-top:32px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Now / Next / Later beats a ranked list</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Founders aren't in "browse mode," they're in "this week" mode. Three columns force a decision per item: act now, queue, or skip. The "Ignore for now" column is the most opinionated thing the product does — and the strongest signal that this is a guide, not a directory.</div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Memo mode = forwardability</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">A founder will forward a one-page memo to a cofounder or mentor. They will not forward an interactive web app. The memo also doubles as the judge artifact: "we don't just generate a UI, we generate a document a founder can sign."</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Three plan layouts we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutPlan('B','Pure ranked list ("top 10 resources")',`Looks objective; doesn't help. Founders read the top 3 and bounce. No structure for "this week" vs "later."`,'no opinion = no help')}
      ${cutPlan('C','Calendar / Gantt ("timeline view")',`Pretty, but founders haven't committed to a calendar yet. Premature precision.`,'fake fidelity')}
      ${cutPlan('E','Pure dashboard with KPI tiles',`Too startup-saas. Wrong vibe — this is a state government product, not an ops tool.`,'wrong register')}
    </div>
  `;

  function planTab(label, active){
    return `<div style="padding:14px 18px;border-right:1.5px solid var(--topo);${active?'background:var(--paper);border-bottom:3px solid var(--ember);margin-bottom:-1.5px':''};font-family:var(--hand);font-weight:700;font-size:15px;color:${active?'var(--ink)':'var(--ink-3)'}">${label}</div>`;
  }

  function planCard(name, action, score, tags, cta, color, hot, deadline){
    const c = color==='sage'?'var(--sage)':color==='sky'?'var(--sky)':color==='ink'?'var(--ink)':'var(--ink-3)';
    return `
      <div class="box" style="padding:12px 12px 10px;background:#fff;${hot?'box-shadow:3px 3px 0 var(--ember);border-color:var(--ember)':''}">
        <div class="row between" style="align-items:flex-start">
          <div style="flex:1">
            <div class="sketch-text mono sm" style="color:${c}">${tags}</div>
            <div class="sketch-text" style="font-weight:700;font-size:15px;margin-top:2px">${name}</div>
            <div class="sketch-text sm muted">${action}${deadline?' · <span style="color:var(--ember)">deadline soon</span>':''}</div>
          </div>
          <div style="display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:2px solid ${c};color:${c};font-family:var(--serif);font-size:15px;font-weight:500;flex:none;margin-left:8px">${score}</div>
        </div>
        <div class="row between" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--topo)">
          <span class="sketch-text sm" style="color:var(--ink-3)">why →</span>
          <span class="sketch-text" style="font-weight:700;color:${c}">${cta}</span>
        </div>
      </div>`;
  }

  function ignored(name, why, muted){
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px dashed var(--topo);${muted?'opacity:.6':''}">
      <span class="sketch-text mono sm" style="color:var(--ink-3);flex:none;margin-top:2px">✕</span>
      <div style="flex:1">
        <div class="sketch-text sm" style="text-decoration:line-through;text-decoration-color:var(--ink-3)">${name}</div>
        <div class="sketch-text sm muted">${why}</div>
      </div>
    </div>`;
  }

  function cutPlan(opt, title, body, why){
    return `<div class="variant cut">
      <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
      <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:10px">${cutThumb(opt)}</div></div>
      <div class="note" style="margin-top:10px">${body}</div>
      <div class="why-cut">${why}</div>
    </div>`;
  }
  function cutThumb(opt){
    if(opt==='B') return `<div class="stack-2" style="height:160px;overflow:hidden">${[1,2,3,4,5,6].map(i=>`<div class="box" style="padding:5px;display:flex;justify-content:space-between"><span class="sketch-text sm">${i}. resource ${i}</span><span class="sketch-text sm muted">9${10-i}</span></div>`).join('')}</div>`;
    if(opt==='C') return `<div style="height:160px;display:grid;grid-template-rows:auto 1fr;gap:6px"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">${Array(8).fill(0).map((_,i)=>`<div class="sketch-text mono sm" style="text-align:center;color:var(--ink-3)">W${i+1}</div>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(4,1fr);gap:2px">${[[0,3,'var(--ember)'],[2,5,'var(--sky)'],[4,7,'var(--sage)']].map(([s,e,c],r)=>`<div style="grid-column:${s+1}/${e+1};grid-row:${r+1};background:${c};border-radius:3px"></div>`).join('')}</div></div>`;
    if(opt==='E') return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;height:160px">${Array(4).fill(0).map((_,i)=>`<div class="box fill" style="padding:8px"><div class="sketch-text mono sm muted">METRIC ${i+1}</div><div class="sketch-text xl">${[42,7,128,'$0'][i]}</div></div>`).join('')}</div>`;
  }
})();
