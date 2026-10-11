/** Rendered Next UI and real browser storage. No route or state bridge. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {nextHopMission as mission} from '../lib/practice/mission-catalog.ts';
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const origin=option('--url','http://127.0.0.1:3029'),key=`practice-mission:${mission.id}:v${mission.version}`;
const q=id=>mission.questions.find(q=>q.id===id);
let server,browser,phase='startup';const checks=[],contexts=[];
async function answer(page,id,correct=true){
  phase=id;
  const question=q(id),section=page.locator(`[data-mission-question="${id}"]`);await section.waitFor();
  const choice=correct?question.choices.find(c=>c.id===question.correctAnswerId):question.choices.find(c=>c.id!==question.correctAnswerId);
  await section.locator(`[data-mission-answer="${choice.id}"]`).focus();await page.keyboard.press('Enter');
  await section.getByText(correct?'✓ Decision supported':'↻ Reconsider this action',{exact:true}).waitFor();
  await section.getByText(choice.explanation,{exact:true}).waitFor();
  assert.equal(await section.locator(`[data-mission-answer="${choice.id}"]`).isEnabled(),false);
}
try{
  await mkdir('work',{recursive:true});
  if(!args.includes('--url'))server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3029'],{stdio:'ignore'});
  browser=await chromium.launch({executablePath:option('--browser','/usr/bin/chromium'),args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(context);
  for(let i=0;i<100;i++){try{if((await context.request.get(origin+'/practice-games',{timeout:1000})).ok())break;}catch{}if(i===99)throw new Error('startup');await new Promise(r=>setTimeout(r,200));}
  const page=await context.newPage(),roomRequests=[];
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/game/'))roomRequests.push(true);});
  await page.goto(origin+'/practice-games');await page.getByRole('link',{name:'Start next-hop mission',exact:true}).click();
  await page.getByRole('button',{name:'Practice recommended objective',exact:true}).click();
  await page.getByText('Open the network plan and assumptions',{exact:true}).click();
  assert.equal(await page.locator('[data-packet-location]').count(),0,'Plan must not claim current packet movement');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Phone diagram must fit');
  await page.getByRole('figure',{name:'Packet network diagram'}).screenshot({path:'work/mission-phone-diagram.png'});
  await answer(page,'diagnose-practice',false);
  await page.getByRole('button',{name:'Use hint (award becomes 75)',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Practice recommended objective',exact:true}).click();
  await page.getByText(`Hint: ${q('diagnose-practice').hint}`,{exact:true}).waitFor();
  await answer(page,'diagnose-practice');
  let progress=page.getByRole('region',{name:'Mission progress'});
  assert.match(await progress.textContent(),/First-attempt accuracy 0% \(0\/1\) · Hints 1 · Retries 1/);
  assert.match(await progress.textContent(),/Practice points 75/);assert.equal(await page.locator('[data-achievement]').count(),0);
  // Real note -> mission -> fresh application, preserving recorded mistakes.
  await page.getByRole('link',{name:'Review the relevant note',exact:true}).click();
  await page.getByRole('heading',{name:'MAC addresses and ARP',exact:true}).waitFor();
  await page.getByRole('link',{name:'Return to next-hop mission',exact:true}).click();
  await page.getByRole('button',{name:'Try a new application',exact:true}).click();
  await answer(page,'diagnose-apply-1',false);await answer(page,'diagnose-apply-1');
  assert.equal(await page.locator('[data-achievement]').count(),0,'Assisted application is not proficiency');
  await page.getByRole('button',{name:'Apply to a new scenario',exact:true}).click();
  await answer(page,'diagnose-apply-2');
  assert.equal(await page.locator('[data-achievement]').count(),1);
  const before=await progress.textContent();await page.locator(`[data-mission-answer="${q('diagnose-apply-2').correctAnswerId}"]`).evaluate(el=>el.click());
  assert.equal(await progress.textContent(),before,'Disabled submission must not award credit again');
  await page.reload();assert.equal(await page.locator('[data-achievement]').count(),1);
  await page.locator('[data-objective="diagnose"]').getByText('✓ Proficient in this check · independent new application',{exact:true}).waitFor();
  checks.push('Wrong practice + hint + retry persisted; real note review returned to a new application; assisted transfer did not earn proficiency; different unaided transfer earned one explained achievement, retained after reload and duplicate submission.');
  // Real lab and flashcard review; explicit topic deck works despite default Core 1 focus.
  await page.locator('[data-objective="next-hop"]').getByRole('link',{name:'Review Lab 01 break/fix',exact:true}).click();
  await page.getByRole('heading',{name:'Break / fix — prediction before test',exact:true}).waitFor();
  await page.getByRole('link',{name:'Return to next-hop mission',exact:true}).click();
  await page.locator('[data-objective="next-hop"]').getByRole('link',{name:'Practice Chapter 9 flashcards',exact:true}).click();
  await page.getByText('Card 1 of 3 · Marked known on this device: 0',{exact:true}).waitFor();
  await page.getByRole('button',{name:/How does a host choose the ARP target/}).click();
  await page.getByText(/Compare the destination with the local subnet using the mask/).waitFor();
  await page.getByRole('link',{name:'Return to next-hop mission',exact:true}).click();
  for(const oid of ['next-hop','verify']){
    await page.locator(`[data-objective="${oid}"]`).getByRole('button',{name:'Practice objective',exact:true}).click();await answer(page,oid+'-practice');
    await page.getByRole('button',{name:'Apply to a new scenario',exact:true}).click();await answer(page,oid+'-apply-1');
    await page.getByRole('button',{name:'Mission overview',exact:true}).click();
  }
  assert.equal(await page.locator('[data-achievement]').count(),3);
  assert.match(await progress.textContent(),/Completed decisions 7 · Independent applications 3\/3 · Practice points 675/);
  assert.match(await progress.textContent(),/Hints 1 · Retries 2/);
  await page.getByText('All three objectives have an independent application recorded. Next, test the principle in Packet Tracer and explain the evidence in your own words.',{exact:true}).waitFor();
  checks.push('Real lab and focused flashcard review worked; all three objectives completed with diagnostic, next-hop and verification achievements; first attempts, hint use, retries, completion and finite rewards stayed separate.');
  // Reset is scoped and explicit. Keep progress first, then confirm.
  await page.evaluate(()=>localStorage.setItem('practice-game:component-match:v1','unrelated-record'));
  await page.getByRole('button',{name:'Reset mission progress',exact:true}).click();await page.getByRole('button',{name:'Keep progress',exact:true}).click();
  assert.equal(await page.locator('[data-achievement]').count(),3);
  await page.getByRole('button',{name:'Reset mission progress',exact:true}).click();await page.getByRole('button',{name:'Confirm mission reset',exact:true}).click();
  assert.equal(await page.locator('[data-achievement]').count(),0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('practice-game:component-match:v1')),'unrelated-record');
  await page.reload();assert.match(await progress.textContent(),/Practice points 0/);
  assert.equal(roomRequests.length,0);
  checks.push('Reset cancellation preserved rewards; confirmed reset cleared only this mission; reload stayed empty; solo mission made no game-room requests.');
  // Existing packet mistakes feed the catalog recommendation through actual UI/storage.
  await page.goto(origin+'/practice-games/follow-packet');await page.getByRole('button',{name:'Start challenge',exact:true}).click();await page.locator('[data-answer-id="premature"]').click();
  await page.getByRole('link',{name:'← Practice Games',exact:true}).click();
  await page.getByRole('region',{name:'Next practice recommendation'}).getByText(/Packet practice recorded difficulty/).waitFor();
  checks.push('Existing Follow the Packet mistake led to a source-backed next-hop mission recommendation.');
  // Storage-denied context: local practice remains playable and reports its limit.
  phase='storage-unavailable';const denied=await browser.newContext();contexts.push(denied);
  await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('blocked','SecurityError')};});
  const other=await denied.newPage();await other.goto(origin+'/practice-games/next-hop-mission');await other.getByRole('button',{name:'Practice recommended objective',exact:true}).click();
  await answer(other,'diagnose-practice');await other.getByText('Browser storage is unavailable. Practice works in memory; closing or reloading may lose this record.',{exact:true}).waitFor();
  checks.push('Storage write denial preserved in-memory gameplay and disclosed the persistence limit.');
  await writeFile('work/mission-browser-results.json',JSON.stringify({result:'PASS',mode:'real rendered UI and browser storage; no bridge',checks},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch{await writeFile('work/mission-browser-results.json',JSON.stringify({result:'FAIL',reason:phase+'_failed',checks},null,2));console.error(JSON.stringify({operation:'learning_loop_browser',status:0,reason:phase+'_failed'}));process.exitCode=1;}
finally{for(const c of contexts)await c.close();await browser?.close();server?.kill('SIGTERM');}
