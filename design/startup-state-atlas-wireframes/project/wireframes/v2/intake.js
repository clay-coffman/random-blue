// ===== FOUNDER INTAKE — D two-pane form + live passport =====
(function(){
  const root = document.getElementById('panel-intake');
  if(!root) return;

  root.innerHTML = `
    <div class="section-label">
      <span class="badge primary">Primary</span>
      <h3>Two-pane: structured form on the left, live Founder Passport on the right</h3>
      <span class="sub">D. Chips + steppers, no chat. The user sees the structured object the system thinks they are.</span>
    </div>

    <div class="grid full">
      <div class="variant" style="padding:0;overflow:hidden">
        <div class="screen tall" style="border:0;border-radius:0;min-height:760px">
          <div class="chrome">
            <div class="dots"><i></i><i></i><i></i></div>
            <div class="url">https://startup.utah.gov/atlas/intake</div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">step 4 of 6 · ~45 sec left</span>
          </div>
          <div class="body" style="padding:0">
            <!-- progress strip -->
            <div style="display:flex;align-items:center;gap:14px;padding:12px 28px;border-bottom:1.5px solid var(--ink);background:var(--paper-2)">
              <div class="sketch-text mono sm" style="color:var(--ink-3)">FOUNDER PASSPORT</div>
              <div style="flex:1;display:flex;gap:6px">
                ${[1,2,3,4,5,6].map(i=>`<div style="flex:1;height:6px;background:${i<=4?'var(--ember)':'var(--stone)'};border-radius:3px;border:1px solid ${i<=4?'var(--ember-2)':'var(--topo)'}"></div>`).join('')}
              </div>
              <div class="sketch-text mono sm">04 / 06</div>
              <span class="btn ghost sm">Save &amp; continue later</span>
            </div>

            <div style="display:grid;grid-template-columns:1.3fr 1fr;min-height:680px">
              <!-- LEFT: form -->
              <div style="padding:32px 36px;border-right:1.5px solid var(--ink)">
                <div class="sketch-text mono sm" style="color:var(--ember)">QUESTION 4 OF 6</div>
                <div class="sketch-text xxl" style="margin-top:8px;font-size:38px">What do you need <span style="color:var(--ember);font-style:italic">right now?</span></div>
                <div class="sketch-text" style="margin-top:8px;color:var(--ink-2);max-width:520px">Pick up to three. We'll surface the resources that fit, and quietly hide the ones that don't.</div>

                <div style="margin-top:28px;display:flex;flex-direction:column;gap:10px;max-width:540px">
                  ${need('Capital — angel, VC, or grant funding', true, 'sage')}
                  ${need('Customers — intros, pilots, contracts', true, 'sky')}
                  ${need('Mentors &amp; advisors', false)}
                  ${need('Hiring — recruiting, fellowships, talent matching', false)}
                  ${need('Workspace — incubator / accelerator', false)}
                  ${need('Regulatory — FDA, export, compliance', false)}
                  ${need('Research commercialization (lab → company)', false)}
                  ${need('Operating support — bookkeeping, legal, ops', false)}
                </div>

                <div class="row between" style="margin-top:36px">
                  <span class="btn ghost lg">← Back</span>
                  <div class="row tight">
                    <span class="sketch-text sm muted">2 of 3 selected</span>
                    <span class="btn ember lg">Continue →</span>
                  </div>
                </div>

                <!-- previous answers -->
                <div style="margin-top:36px;padding-top:20px;border-top:1.5px dashed var(--topo)">
                  <div class="sketch-text mono sm" style="color:var(--ink-3);margin-bottom:10px">↑ ANSWERED</div>
                  <div class="row tight">
                    <span class="chip"><strong style="color:var(--ink-3);margin-right:4px">01</strong> Salt Lake County <span style="color:var(--ink-3);margin-left:4px">edit</span></span>
                    <span class="chip"><strong style="color:var(--ink-3);margin-right:4px">02</strong> Paying customers <span style="color:var(--ink-3);margin-left:4px">edit</span></span>
                    <span class="chip"><strong style="color:var(--ink-3);margin-right:4px">03</strong> B2B SaaS <span style="color:var(--ink-3);margin-left:4px">edit</span></span>
                  </div>
                </div>
              </div>

              <!-- RIGHT: passport + matches -->
              <div style="padding:32px 28px;background:var(--paper-2);position:relative">
                <div class="callout tr" style="top:14px;right:18px">↙ updates as you<br/>answer</div>

                <div class="sketch-text mono sm" style="color:var(--ink-3)">↓ LIVE PASSPORT</div>

                <!-- passport card -->
                <div class="box" style="padding:0;background:var(--ink);color:var(--paper);border-color:var(--ink);box-shadow:5px 5px 0 var(--ember);margin-top:8px;overflow:hidden">
                  <div style="padding:10px 14px;background:rgba(247,244,237,.06);border-bottom:1.5px solid var(--topo-2);display:flex;justify-content:space-between;align-items:center">
                    <span style="font-family:var(--mono);font-size:11px;letter-spacing:.08em">FOUNDER_PASSPORT · fp_a3f9c2</span>
                    <span style="font-family:var(--mono);font-size:10px;color:var(--ember-tint)">● UPDATING</span>
                  </div>
                  <div style="padding:14px 16px;font-family:var(--mono);font-size:12.5px;line-height:1.7">
<span style="color:var(--topo)">{</span><br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"county"</span>: <span style="color:var(--paper)">"Salt Lake"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"stage"</span>: <span style="color:var(--paper)">"paying_customers"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"industry"</span>: <span style="color:var(--paper)">"b2b_saas"</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"needs"</span>: [<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--paper);background:rgba(194,65,12,.35);padding:1px 4px;border-radius:2px">"capital"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--paper);background:rgba(194,65,12,.35);padding:1px 4px;border-radius:2px">"customers"</span><br/>
&nbsp;&nbsp;],<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"identity_tags"</span>: <span style="color:var(--topo)">[ … ]</span>,<br/>
&nbsp;&nbsp;<span style="color:var(--ember-tint)">"urgency"</span>: <span style="color:var(--topo)">…</span><br/>
<span style="color:var(--topo)">}</span>
                  </div>
                </div>

                <!-- early matches -->
                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:24px">↓ EARLY MATCHES (will refine)</div>
                <div class="stack-2" style="margin-top:8px">
                  ${match('Pelion Ventures', 92, 'capital · seed · b2b saas', 'sage')}
                  ${match('Salt Lake Angels', 88, 'capital · pitch night Nov 14', 'sage')}
                  ${match('Kickstart Fund', 85, 'capital · seed · regional', 'sage')}
                  ${match('Silicon Slopes Customer Connect', 76, 'customers · monthly intros', 'sky')}
                  ${match('Startup State office hours', 72, 'mentors · weekly', 'ink')}
                </div>
                <div class="sketch-text mono sm" style="color:var(--ink-3);margin-top:14px">+ 23 more · ranked after question 6</div>

                <!-- agent reveal -->
                <div class="box" style="padding:10px 12px;margin-top:24px;background:var(--paper);border-style:dashed;border-color:var(--ink-3)">
                  <div class="row between">
                    <span class="sketch-text sm muted">Same passport, served as JSON to agents:</span>
                    <span class="sketch-text mono sm"><a style="color:var(--sky)">/api/v1/founder-passports/fp_a3f9c2</a></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- secondary: 6-question overview, mobile, persona-loaded states -->
    <div class="grid two" style="margin-top:36px">
      <div class="variant">
        <header><div class="label"><span class="opt">map</span>The six questions, at a glance</div>
        <div class="note">Same intake, shown as the full sequence so reviewers can sanity-check the question order and copy.</div></header>
        <div class="screen short">
          <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">/atlas/intake</div></div>
          <div class="body" style="padding:0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
              ${q(1,'Where in Utah?','county / city',true)}
              ${q(2,'What stage?','idea → growth',true)}
              ${q(3,'What industry?','sector tags',true)}
              ${q(4,'What do you need now?','capital · customers · …',true)}
              ${q(5,'Founder identity tags?','student · veteran · rural · …',false)}
              ${q(6,'How urgent?','this week / month / quarter',false)}
            </div>
          </div>
        </div>
      </div>

      <div class="variant">
        <header><div class="label"><span class="opt">mobile</span>Mobile intake — passport collapses to summary bar</div>
        <div class="note">Same model: the passport pinned to the top of the screen, expandable. Form pushes the chip cluster up as questions answer.</div></header>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px 0">
          ${mobileScreen(40)}
          ${mobileScreen(80)}
        </div>
      </div>
    </div>

    <!-- annotated rationale -->
    <div class="grid two" style="margin-top:8px">
      <div class="variant" style="background:var(--ember-tint);border-color:var(--ember);box-shadow:5px 5px 0 var(--ember)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> The passport is the thesis, made visible</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">The whole project's pitch is "the ecosystem is legible to humans <em>and</em> agents." Showing the JSON-shaped Founder Passport build live is the cheapest, clearest way to demonstrate that. It also doubles as trust: <em>"I see what the system thinks I am, and I can edit it."</em></div>
      </div>
      <div class="variant" style="background:var(--sage-tint);border-color:var(--sage);box-shadow:5px 5px 0 var(--sage)">
        <div class="label"><span class="opt" style="background:var(--ink)">why this</span> Structured chips beat chat for demo + matching</div>
        <div class="note" style="color:var(--ink-2);margin-top:8px">Chat intake is seductive and usually worse: it asks the user to type when they should click, and any LLM misroute in front of judges costs the demo. Chips deterministically populate the passport. The LLM is reserved for explanation, not classification.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:48px">
      <span class="badge cut">Considered &amp; cut</span>
      <h3>Four intake directions we're not taking</h3>
    </div>

    <div class="grid cuts">
      ${cutIntake('A','Long classic form, vertical scroll',`Every field on one page. Fast for power users, but no structure preview, no progressive feedback, and it looks like a permit application.`,'no live preview, no momentum')}
      ${cutIntake('B','Conversational chat intake',`Friendly but demo-fragile. One model misroute in front of judges and the whole product looks like a wrapper. Also slower than chips.`,'risky in front of judges')}
      ${cutIntake('C','Single-question reduction (one big "Where are you building?")',`Too compressed. We lose the structured fields that drive matching, and the LLM has to reverse-engineer everything from prose.`,'collapses signal we already have')}
      ${cutIntake('E','Card-deck swipe ("Tinder for resources")',`Cute, but slow. Founders don't want a game; they want a plan. Save card metaphors for the plan output, not the intake.`,'novelty over function')}
    </div>
  `;

  function need(label, on, color){
    const dot = color ? `<span class="chip ${color}-tint" style="font-size:11px;padding:1px 6px">match</span>`:'';
    return `<label class="box" style="padding:10px 12px;display:flex;align-items:center;gap:10px;${on?'border-color:var(--ember);background:var(--ember-tint)':''}">
      <span class="ck ${on?'on':''}"></span>
      <span class="sketch-text" style="flex:1;font-size:15px">${label}</span>
      ${on?dot:''}
    </label>`;
  }

  function match(name, score, why, color){
    const c = color==='sage' ? 'var(--sage)' : color==='sky' ? 'var(--sky)' : 'var(--ink)';
    return `<div class="box" style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div style="flex:1">
        <div class="sketch-text" style="font-weight:700;font-size:14px">${name}</div>
        <div class="sketch-text sm muted">${why}</div>
      </div>
      <div style="display:grid;place-items:center;width:42px;height:42px;border-radius:50%;border:2px solid ${c};color:${c};font-family:var(--serif);font-size:18px;font-weight:500">${score}</div>
    </div>`;
  }

  function q(n, t, sub, done){
    return `<div class="${done?'box fill':''}" style="padding:14px 16px;border-right:1.5px solid var(--topo);border-bottom:1.5px solid var(--topo);${done?'':'background:#fff'}">
      <div class="row tight"><span class="sketch-text mono sm" style="color:${done?'var(--sage)':'var(--ink-3)'}">Q${String(n).padStart(2,'0')}</span> ${done?'<span class="sketch-text mono sm" style="color:var(--sage)">✓ done</span>':'<span class="sketch-text mono sm" style="color:var(--ember)">● now</span>'}</div>
      <div class="sketch-text" style="font-weight:700;margin-top:4px">${t}</div>
      <div class="sketch-text sm muted">${sub}</div>
    </div>`;
  }

  function mobileScreen(progress){
    const filled = Math.round(progress/100 * 3);
    return `
      <div class="box" style="padding:0;border-radius:18px;overflow:hidden;background:var(--paper-2)">
        <div style="padding:8px 10px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:10px;display:flex;justify-content:space-between"><span>9:41</span><span>●●●</span></div>
        <div style="padding:10px;border-bottom:1.5px solid var(--topo);background:var(--paper)">
          <div class="sketch-text mono sm" style="color:var(--ink-3)">PASSPORT · ${progress}%</div>
          <div class="row tight" style="margin-top:4px">
            ${['SLC','paying','b2b'].slice(0,filled).map(t=>`<span class="chip ember-tint" style="font-size:11px;padding:1px 6px">${t}</span>`).join('')}
          </div>
        </div>
        <div style="padding:14px 12px">
          <div class="sketch-text mono sm" style="color:var(--ember)">Q0${Math.min(6,Math.ceil(progress/16.6))}</div>
          <div class="sketch-text" style="font-family:var(--serif);font-size:18px;font-weight:500;margin-top:4px">${progress<60?'What stage are you?':'What do you need now?'}</div>
          <div class="stack-2" style="margin-top:10px">
            <div class="box ${progress<60?'fill':'ember-tint'}" style="padding:8px;border-color:${progress<60?'var(--topo)':'var(--ember)'}"><span class="sketch-text sm">${progress<60?'Idea':'Capital'}</span></div>
            <div class="box fill" style="padding:8px"><span class="sketch-text sm">${progress<60?'Building MVP':'Customers'}</span></div>
            <div class="box ${progress<60?'ember-tint':'fill'}" style="padding:8px;border-color:${progress<60?'var(--ember)':'var(--topo)'}"><span class="sketch-text sm">${progress<60?'Paying customers':'Mentors'}</span></div>
          </div>
          <div class="btn ember" style="width:100%;justify-content:center;margin-top:12px">Continue →</div>
        </div>
      </div>`;
  }

  function cutIntake(opt, title, body, why){
    return `
      <div class="variant cut">
        <header><div class="label"><span class="opt">${opt}</span>${title}</div></header>
        <div class="screen mini" style="border-color:var(--ink-3)"><div class="body" style="padding:10px">${cutThumb(opt)}</div></div>
        <div class="note" style="margin-top:10px">${body}</div>
        <div class="why-cut">${why}</div>
      </div>
    `;
  }

  function cutThumb(opt){
    if(opt==='A') return `
      <div class="stack-2" style="height:160px;overflow:hidden">
        ${[1,2,3,4,5].map(i=>`<div class="box" style="padding:6px"><div class="scribble short"></div></div>`).join('')}
      </div>`;
    if(opt==='B') return `
      <div class="box fill" style="height:160px;padding:10px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px">
        <div class="box" style="padding:6px;align-self:flex-start;max-width:75%"><span class="sketch-text sm">Hi! I'm Atlas. Where in Utah are you building?</span></div>
        <div class="box ink" style="padding:6px;align-self:flex-end;max-width:65%"><span class="sketch-text sm">SLC, B2B SaaS, raising</span></div>
        <div class="box" style="padding:6px"><span class="sketch-text sm muted">Type a message…</span></div>
      </div>`;
    if(opt==='C') return `
      <div class="box fill" style="height:160px;padding:14px;display:grid;place-items:center;text-align:center">
        <div>
          <div class="sketch-text" style="font-family:var(--serif);font-size:20px;line-height:1.1">Tell us<br/>your situation.</div>
          <div class="box" style="padding:6px;margin-top:8px;background:#fff"><span class="sketch-text sm muted">…</span></div>
        </div>
      </div>`;
    if(opt==='E') return `
      <div style="height:160px;position:relative;display:grid;place-items:center">
        <div class="box" style="position:absolute;width:80%;height:120px;transform:rotate(-4deg);top:20px;background:#fff;padding:10px"><div class="sketch-text" style="font-weight:700">Pelion Ventures</div><div class="scribble med" style="margin-top:6px"></div><div class="scribble short" style="margin-top:4px"></div></div>
        <div class="box ember-tint" style="position:absolute;width:80%;height:120px;transform:rotate(2deg);top:14px;border-color:var(--ember)"><div style="padding:10px"><div class="sketch-text" style="font-weight:700">Salt Lake Angels</div><div class="scribble med" style="margin-top:6px"></div></div></div>
        <div style="position:absolute;bottom:6px;display:flex;gap:14px;font-family:var(--scribble);color:var(--ember)">← skip · save →</div>
      </div>`;
  }
})();
