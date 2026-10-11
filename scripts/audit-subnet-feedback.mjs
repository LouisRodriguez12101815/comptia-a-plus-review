/** Diagnostic audit: records observed UI findings, not a passing acceptance assertion.
 * Start the production server on localhost:3032 first. No state or API bridge. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('work',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage(),results=[];let phase='startup';
const check=async()=>{await page.getByRole('button',{name:'Check step',exact:true}).click();};
const feedback=()=>page.getByRole('status').filter({hasText:'Reconsider this step'}).textContent();
try{
 await page.goto('http://127.0.0.1:3032/practice-games/subnet-architect');
 await page.getByRole('button',{name:'Detective Challenge',exact:true}).click();
 phase='repeat_wrong_submission';
 await page.getByLabel('Subnet mask',{exact:true}).fill('255.255.255.0');await page.getByLabel('Block size',{exact:true}).fill('2');await check();const wrongMask=await feedback();
 await page.getByLabel('Subnet mask',{exact:true}).fill('255.255.254.0');await page.getByLabel('Block size',{exact:true}).fill('3');await check();const wrongSize=await feedback();
 await page.getByLabel('Subnet mask',{exact:true}).fill('255.255.255.0');await page.getByLabel('Block size',{exact:true}).fill('2');await check();const repeated=await feedback();
 results.push({operation:'repeat_wrong_submission',reason:repeated===wrongSize&&repeated!==wrongMask?'stale_feedback_confirmed':'not_reproduced'});
 await page.screenshot({path:'work/audit-stale-feedback.png',fullPage:true});
 phase='keyboard';await page.getByLabel('Subnet mask',{exact:true}).focus();await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e),r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),outline:s.outlineStyle,width:r.width,height:r.height};});
 results.push({operation:'keyboard_focus',reason:focus.name==='Block size'&&focus.outline==='solid'&&focus.height>=44?'visible_focus_and_touch_size_verified':'needs_review'});
 // Finish the real UI steps to reach the concept check.
 await page.getByLabel('Subnet mask',{exact:true}).fill('255.255.254.0');await page.getByLabel('Block size',{exact:true}).fill('2');await check();await page.getByRole('button',{name:'Continue',exact:true}).click();
 for(const fields of [[['Network address','151.37.150.0'],['Broadcast address','151.37.151.255']],[['First usable','151.37.150.1'],['Last usable','151.37.151.254']]]){for(const [name,value] of fields)await page.getByLabel(name,{exact:true}).fill(value);await check();await page.getByRole('button',{name:'Continue',exact:true}).click();}
 await page.getByLabel('Usable host capacity',{exact:true}).fill('510');await page.getByLabel('Given address is usable',{exact:true}).selectOption('true');await check();await page.getByRole('button',{name:'Continue',exact:true}).click();
 phase='context_hint';await page.getByRole('button',{name:'Use hint (award becomes 75)',exact:true}).click();
 const hint=await page.getByText(/^Hint: /).textContent();
 results.push({operation:'context_hint',reason:hint.includes('align down')&&hint.includes('block boundary')?'unrelated_hint_confirmed':'not_reproduced'});
 await page.locator('[data-subnet-choice="32"]').click();await page.getByRole('button',{name:'Open debrief',exact:true}).click();
 phase='review_path';const review=page.getByRole('link',{name:'Review /26 lab subnetting',exact:true});await review.click();await page.waitForURL(/two-subnet-lan/);
 results.push({operation:'targeted_review',reason:await page.getByRole('heading',{level:1}).count()?'lab_route_reachable':'needs_review'});
 await page.goto('http://127.0.0.1:3032/practice-games/subnet-architect');await page.getByRole('button',{name:'Resume saved run',exact:true}).click();await page.getByRole('button',{name:'Try a new transfer challenge',exact:true}).click();
 phase='concept_repeat'; // Complete the new boundary exercise without modifying application state.
 for(const fields of [[['Subnet mask','255.255.255.192'],['Block size','64']],[['Network address','192.168.40.0'],['Broadcast address','192.168.40.63']],[['First usable','192.168.40.1'],['Last usable','192.168.40.62']]]){for(const [name,value] of fields)await page.getByLabel(name,{exact:true}).fill(value);await check();await page.getByRole('button',{name:'Continue',exact:true}).click();}
 await page.getByLabel('Usable host capacity',{exact:true}).fill('62');await page.getByLabel('Given address is usable',{exact:true}).selectOption('false');await check();await page.getByRole('button',{name:'Continue',exact:true}).click();
 results.push({operation:'transfer_context',reason:await page.locator('[data-subnet-choice="32"]').count()?'same_context_question_confirmed':'not_reproduced'});
 await page.locator('[data-subnet-choice="32"]').click();await page.getByRole('button',{name:'Open debrief',exact:true}).click();
 results.push({operation:'mobile_overflow',reason:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)?'none_observed':'overflow_confirmed'});
 phase='chapter7_review';await page.goto('http://127.0.0.1:3032/notes/n10-ch7');
 await page.getByText('For a corporate network of any size, consultants use a Class A private network (10.0.0.0) because it gives the most flexibility and room to grow.',{exact:true}).waitFor();
 results.push({operation:'chapter7_review',reason:'universal_class_default_guidance_confirmed'});
 await writeFile('work/gameplay-audit-probes.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}catch{console.error(JSON.stringify({operation:'audit_probe',status:0,reason:phase+'_failed'}));process.exitCode=1;}
finally{await context.close();await browser.close();}
