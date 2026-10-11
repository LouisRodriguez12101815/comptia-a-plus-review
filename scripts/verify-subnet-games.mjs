/** Real rendered Next UI and browser storage; no route/state bridge. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {subnetData as data} from '../lib/subnet/catalog.ts';
const args=process.argv.slice(2),option=(k,f)=>{const i=args.indexOf(k);return i<0?f:args[i+1];};
const origin=option('--url','http://127.0.0.1:3031');
let server,browser,phase='startup';const contexts=[],checks=[];
const status=page=>page.getByRole('region',{name:'Subnet practice progress'});
async function verify(page,ok=true){await page.getByRole('button',{name:'Check step',exact:true}).click();await page.getByText(ok?'✓ Verified step':'↻ Reconsider this step',{exact:true}).waitFor();}
async function next(page){await page.getByRole('button',{name:'Continue',exact:true}).click();}
async function concept(page,wrong=false){if(wrong){await page.locator('[data-subnet-choice="128"]').click();await page.getByText('↻ Reconsider this step',{exact:true}).waitFor();}await page.locator('[data-subnet-choice="32"]').click();await page.getByText('✓ Verified step',{exact:true}).waitFor();await page.getByRole('button',{name:'Open debrief',exact:true}).click();}
async function detective(page,e,wrong=false){
 phase='detective_'+e.id;
 for(const [i,fields] of [['mask','blockSize'],['network','broadcast'],['first','last'],['capacity','isHost']].entries()){
  for(const f of fields){if(f==='isHost')await page.getByLabel('Given address is usable',{exact:true}).selectOption(String(e.expected[f]));else await page.getByLabel({mask:'Subnet mask',blockSize:'Block size',network:'Network address',broadcast:'Broadcast address',first:'First usable',last:'Last usable',capacity:'Usable host capacity'}[f],{exact:true}).fill(String(e.expected[f]));}
  if(!i&&wrong){await page.getByLabel('Subnet mask',{exact:true}).fill('255.255.255.0');await verify(page,false);await page.getByRole('button',{name:'Binary/prefix visualizer (counts as hint)',exact:true}).click();await page.getByLabel('Explicit parent prefix',{exact:true}).fill('16');await page.getByRole('status').filter({hasText:'Equal-size children'}).waitFor();await page.getByLabel('Subnet mask',{exact:true}).fill(e.expected.mask);}
  await verify(page);const before=await status(page).textContent();await page.getByRole('button',{name:'Check step',exact:true}).evaluate(el=>el.click());assert.equal(await status(page).textContent(),before);
  await next(page);
 }
 await concept(page,wrong);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
}
async function sort(page,ids){
 for(let target=0;target<ids.length;target++){
  let current=(await page.locator('[data-subnet-stage="order"] li button:first-of-type').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label').split(' ')[1]))).indexOf(ids[target]);
  while(current>target){await page.getByRole('button',{name:`Move ${ids[target]} up`,exact:true}).click();current--;}
 }
}
async function architect(page,m,wrong=false,alternative=false){
 phase='architect_'+m.id;
 const ids=m.requirements.map(r=>r.id);
 if(wrong){await sort(page,[...ids].reverse());await verify(page,false);await page.getByRole('button',{name:'Use hint (award becomes 75)',exact:true}).click();}
 await sort(page,ids);await verify(page);await next(page);
 for(const f of m.verifiedFixture)await page.getByLabel('Prefix '+f.id,{exact:true}).fill(f.cidr.split('/')[1]);
 if(wrong){await page.getByLabel('Prefix A',{exact:true}).fill('25');await verify(page,false);await page.getByText(/A: \/25 gives 126 usable, below 210/).waitFor();await page.getByLabel('Prefix A',{exact:true}).fill('24');}
 await verify(page);await next(page);
 const blocks=Object.fromEntries(m.verifiedFixture.map(f=>[f.id,f]));if(alternative)[blocks.B,blocks.C]=[blocks.C,blocks.B];
 for(const r of m.requirements){const f=blocks[r.id];await page.getByLabel(r.id+' network address',{exact:true}).fill(f.cidr.split('/')[0]);await page.getByLabel(r.id+' gateway',{exact:true}).fill(f.first);if(r.kind==='link')await page.getByLabel(r.id+' peer',{exact:true}).fill(f.last);}
 if(wrong){
  await page.getByLabel('D network address',{exact:true}).fill('172.16.10.1');await verify(page,false);await page.getByText(/D: Misalignment/).waitFor();const before=await status(page).textContent();await verify(page,false);assert.equal(await status(page).textContent(),before,'Same wrong payload is not an extra retry/reward');
  await page.getByRole('button',{name:'Use hint (award becomes 75)',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Resume saved run',exact:true}).click();assert.equal(await page.getByLabel('D network address',{exact:true}).inputValue(),'172.16.10.1');
  await page.getByLabel('D network address',{exact:true}).fill('172.16.10.0');await page.getByLabel('B network address',{exact:true}).fill('172.16.8.0');await page.getByLabel('B gateway',{exact:true}).fill('172.16.8.1');await verify(page,false);await page.getByText(/B: Overlap with A/).waitFor();
  await page.getByLabel('B network address',{exact:true}).fill(blocks.B.cidr.split('/')[0]);await page.getByLabel('B gateway',{exact:true}).fill(blocks.B.first);
 }
 await verify(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByRole('figure',{name:'VLSM topology',exact:true}).screenshot({path:`work/subnet-${m.id}-topology.png`});
 await page.getByRole('figure',{name:'Address space allocation',exact:true}).screenshot({path:`work/subnet-${m.id}-space.png`});
 await next(page);
 if(wrong){await page.locator('[data-subnet-choice="match"]').click();await page.getByText('↻ Reconsider this step',{exact:true}).waitFor();}
 await page.locator('[data-subnet-choice="constraints"]').click();await next(page);await concept(page,wrong);
}
try{
 await mkdir('work',{recursive:true});if(!args.includes('--url'))server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3031'],{stdio:'ignore'});
 browser=await chromium.launch({executablePath:option('--browser','/usr/bin/chromium'),args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(context);
 for(let i=0;i<100;i++){try{if((await context.request.get(origin+'/practice-games',{timeout:1000})).ok())break;}catch{}if(i===99)throw new Error('startup');await new Promise(r=>setTimeout(r,200));}
 const page=await context.newPage(),rooms=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/game/'))rooms.push(true);});
 await page.goto(origin+'/practice-games');await page.getByLabel('Topic',{exact:true}).selectOption('IPv4 subnetting and VLSM');await page.getByRole('link',{name:'Play Subnet Architect',exact:true}).click();
 await page.getByRole('button',{name:'Detective Guided Practice',exact:true}).click();await detective(page,data.exercises[0],true);
 assert.match(await status(page).textContent(),/Hints 1 · Retries 2 · Completed 5\/5 · Points 475/);
 await page.getByRole('region',{name:'Subnet debrief'}).getByText('Review: mask',{exact:true}).waitFor();
 await page.getByRole('link',{name:'Verified source notes and corrections',exact:true}).click();await page.getByRole('heading',{name:'IPv4 and VLSM: verified source review',exact:true}).waitFor();await page.getByText('Optional IPv6 review · separate and unscored',{exact:true}).click();await page.getByRole('button',{name:'128 bits',exact:true}).click();await page.getByText(/Correct: IPv6 has 128-bit addresses/).waitFor();await page.getByRole('button',{name:'Dual stack',exact:true}).click();await page.getByText(/Correct: dual-stack nodes support both families/).waitFor();await page.getByRole('link',{name:'Return to Subnet Architect',exact:true}).click();await page.getByRole('button',{name:'Resume saved run',exact:true}).click();
 await page.getByRole('button',{name:'Try a new transfer challenge',exact:true}).click();await detective(page,data.transferExercise);await page.getByText('✓ Independent transfer completed on a new problem. Evidence from one check, not enduring mastery.',{exact:true}).waitFor();
 checks.push('Subnet Detective source exercise: typed mask/bounds/range/capacity, wrong response, binary hint with explicit parent, retries, duplicate credit blocked, source review/return/resume, debrief and unaided new boundary-address transfer.');
 await page.getByRole('button',{name:'Choose another practice',exact:true}).click();await page.getByRole('button',{name:'Architect Guided Practice',exact:true}).click();await architect(page,data.missions[0],true,true);
 assert.match(await status(page).textContent(),/Hints 2 · Retries 6 · Completed 5\/5 · Points 450/);
 await page.getByRole('region',{name:'Subnet debrief'}).getByText('Review: allocation',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Try a new transfer challenge',exact:true}).click();await architect(page,data.missions[1]);await page.getByText('✓ Independent transfer completed on a new problem. Evidence from one check, not enduring mastery.',{exact:true}).waitFor();
 checks.push('VLSM starter and transfer: real reorder controls, insufficient capacity, misalignment, overlap, hints, saved typed fields, corrections without restart, alternate valid layout, interface addresses, reasoning, debrief and unaided new parent/requirements.');
 await page.evaluate(()=>localStorage.setItem('practice-mission:next-hop:v1','unrelated'));
 await page.getByRole('button',{name:'Reset subnet progress',exact:true}).click();await page.getByRole('button',{name:'Keep progress',exact:true}).click();assert.match(await status(page).textContent(),/Points 500/);
 await page.getByRole('button',{name:'Reset subnet progress',exact:true}).click();await page.getByRole('button',{name:'Confirm subnet reset',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('subnet-architect:run:v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('practice-mission:next-hop:v1')),'unrelated');assert.equal(rooms.length,0);
 checks.push('Phone/reduced-motion diagrams and address bar fit; reset is scoped and cancellable; both modes remain solo without room API requests.');
 await writeFile('work/subnet-browser-results.json',JSON.stringify({result:'PASS',mode:'real rendered UI; no route or state bridge',checks},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch{await writeFile('work/subnet-browser-results.json',JSON.stringify({result:'FAIL',reason:phase+'_failed',checks},null,2));console.error(JSON.stringify({operation:'subnet_browser',status:0,reason:phase+'_failed'}));process.exitCode=1;}
finally{for(const c of contexts)await c.close();await browser?.close();server?.kill('SIGTERM');}
