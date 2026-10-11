/** Real rendered UI, local solo state and Next routes. No API or game-state bridge. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { challenges } from '../lib/practice/catalog.ts';
import { chromium } from 'playwright';
const args=process.argv.slice(2), option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const origin=option('--url','http://127.0.0.1:3027');
let server, browser; const checks=[], contexts=[]; let phase='startup';
try {
  await mkdir('work',{recursive:true});
  if(!args.includes('--url')) server=spawn(process.execPath,['./node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3027'],{stdio:'ignore'});
  browser=await chromium.launch({headless:true,executablePath:option('--browser','/usr/bin/chromium'),args:['--no-sandbox']});
  const ready=await browser.newContext();contexts.push(ready);
  for(let i=0;i<100;i++){try{if((await ready.request.get(origin+'/practice-games',{timeout:1000})).ok())break;}catch{}if(i===99)throw new Error('startup');await new Promise(resolve=>setTimeout(resolve,200));}
  for(const [index,challenge] of [challenges[0],challenges[1],challenges[1]].entries()) {
    phase=challenge.id;
    const phone=index!==1;
    const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1366,height:900},reducedMotion:phone?'reduce':'no-preference'});contexts.push(context);
    const page=await context.newPage(); const gameRequests=[];
    page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/game/'))gameRequests.push(true);});
    await page.goto(origin+'/practice-games');
    await page.getByLabel('Certification',{exact:true}).selectOption(challenge.certification);
    const link=page.getByRole('link',{name:index?'Play Follow the Packet':'Play Component Match',exact:true});await link.click();
    await page.getByRole('button',{name:'Start challenge',exact:true}).click();
    for(const [step,round] of challenge.rounds.entries()) {
      const section=page.locator(`[data-round-id="${round.id}"]`);await section.waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Phone must not overflow');
      const correct=section.locator(`[data-answer-id="${round.correctAnswerId}"]`);
      if(!step){
        const wrong=round.choices.find(c=>c.id!==round.correctAnswerId);
        const before=index?await page.locator('[data-packet-location]').textContent():null;
        await section.locator(`[data-answer-id="${wrong.id}"]`).click();
        await section.getByText('↻ Try a different match',{exact:true}).waitFor();
        assert.equal(await section.locator(`[data-answer-id="${wrong.id}"]`).isEnabled(),false);
        assert.equal(await section.getByRole('button',{name:'Continue',exact:true}).count(),0);
        await section.getByText(wrong.explanation,{exact:true}).waitFor();
        assert.equal(await correct.isEnabled(),true);
        if(index)assert.equal(await page.locator('[data-packet-location]').textContent(),before,'An incorrect decision must not move or reveal the packet');
        await section.getByRole('button',{name:'Use hint (−25 from this round’s award)',exact:true}).click();
        await correct.focus();await page.keyboard.press('Enter');
      } else if(!index && step===1){
        // Optional mouse drag handler uses the native DOM dataTransfer; keyboard/tap remains the primary path.
        const transfer=await page.evaluateHandle(()=>new DataTransfer());
        await correct.dispatchEvent('dragstart',{dataTransfer:transfer});
        await section.getByRole('group',{name:'Match target',exact:true}).dispatchEvent('drop',{dataTransfer:transfer});
      } else await correct.click();
      await section.getByText('✓ Supported match',{exact:true}).waitFor();
      assert.equal(await correct.isEnabled(),false);
      const progress=page.getByRole('region',{name:'Practice progress',exact:true});
      const points=75+step*100;assert.match(await progress.textContent(),new RegExp(`Score ${points} `));
      await correct.evaluate(button=>button.click()); // Disabled button cannot award duplicate credit.
      assert.match(await progress.textContent(),new RegExp(`Score ${points} `));
      if(index){
        const location=await page.locator('[data-packet-location]').textContent();
        assert.match(location,new RegExp(`TTL ${round.effect.ttl}`));
        const scenario=challenge.scenarios.find(s=>s.id===round.scenarioId);
        assert.ok(location.includes(scenario.nodes.find(n=>n.id===round.effect.nodeId).label));
        const frame=await page.locator('[data-frame-state]').textContent();
        if(round.effect.frameSource){assert.ok(frame.includes(round.effect.frameSource));assert.ok(frame.includes(round.effect.frameDestination));}
        const motion=await page.locator('.practice-packet-arrival').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).animationName));assert.ok(motion.includes(phone?'none':'practice-packet-arrival'));
      } else if(!step){
        // Resume from the real browser storage through the rendered resume control.
        await page.reload();await page.getByRole('button',{name:'Resume saved practice',exact:true}).click();
        await page.getByText('✓ Supported match',{exact:true}).waitFor();
        assert.equal(await page.locator('.practice-packet-arrival').count(),0);
      }
      await page.getByRole('button',{name:'Continue',exact:true}).click();
    }
    await page.getByRole('heading',{name:'Practice debrief',exact:true}).waitFor();
    const debrief=page.getByRole('region',{name:'Challenge debrief',exact:true});
    assert.match(await debrief.textContent(),new RegExp(`Final completion ${challenge.rounds.length}/${challenge.rounds.length}`));
    await debrief.getByText(`Review: ${challenge.rounds[0].objective}`,{exact:true}).waitFor();
    assert.ok((await debrief.textContent()).includes('Hints 1'));
    assert.ok((await debrief.textContent()).includes(`${challenge.rounds.length-1}/${challenge.rounds.length} correct`));
    assert.equal(gameRequests.length,0,'Solo practice must not create rooms or call Twilio APIs');
    checks.push(`${challenge.id} (${phone?'phone / reduced motion':'desktop'}): every round completed, wrong choice and hint recovered, keyboard/tap, duplicate credit blocked, source-linked mistake debrief; ${index?'packet positions, frame addresses, TTL and transfer network':'native drag handlers, phone width, saved-session resume'}.`);
    await context.close();
  }
  phase='outage-preservation';
  const context=await browser.newContext();contexts.push(context);const page=await context.newPage();
  await page.goto(origin+'/practice-games');await page.getByRole('link',{name:'Open Outage Ops',exact:true}).click();
  await page.getByRole('button',{name:'Begin training',exact:true}).click();await page.locator('[data-answer-id="scope"]').click();await page.getByRole('button',{name:'Continue →',exact:true}).click();
  await page.getByRole('button',{name:'← Mission select',exact:true}).click();
  await page.getByRole('button',{name:'Create a room',exact:true}).waitFor();await page.getByRole('button',{name:'Join a room',exact:true}).waitFor();
  checks.push('Outage Ops URL, Guided Demo entry/progression and Twilio create/join entry controls preserved.');
  await writeFile('work/practice-browser-results.json',JSON.stringify({result:'PASS',mode:'real UI; solo local state; no route bridge',checks},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch{
  await writeFile('work/practice-browser-results.json',JSON.stringify({result:'FAIL',reason:phase+'_failed',checks},null,2));console.error(JSON.stringify({operation:'practice_browser_test',status:0,reason:phase+'_failed'}));process.exitCode=1;
}finally{for(const context of contexts)await context.close();await browser?.close();server?.kill('SIGTERM');}
