import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nextHopMission as mission } from '../lib/practice/mission-catalog.ts';
import { emptyMission, nextQuestion, missionAnswer, missionHint, missionSummary, restoreMission } from '../lib/practice/mission.ts';
import { shuffle } from '../lib/practice/session.ts';
const question=id=>mission.questions.find(q=>q.id===id);
const answer=(record,q,correct=true)=>missionAnswer(record,mission,q.id,correct?q.correctAnswerId:q.choices.find(c=>c.id!==q.correctAnswerId).id);
test('mission content maps every decision and reward to a sourced objective and distinct application',async()=>{
  const labs=JSON.parse(await readFile('content/labs.json','utf8'));
  const notes=JSON.parse(await readFile('content/topics-network-plus.json','utf8'));
  const cards=JSON.parse(await readFile('content/flashcards.json','utf8'));
  assert.equal(mission.questions.length,9);assert.equal(new Set(mission.questions.map(q=>q.id)).size,9);
  for(const o of mission.objectives){
    assert.equal(question(o.practiceId).stage,'practice');assert.equal(o.applicationIds.length,2);
    for(const id of [o.practiceId,...o.applicationIds]){
      const q=question(id);assert.equal(q.objectiveId,o.id);assert.equal(q.objective,o.label);assert.ok(q.examMappings.every(m=>m.exam==='n10-009'));
      assert.ok(q.choices.every(c=>c.explanation.length>30));assert.equal(q.choices.filter(c=>c.id===q.correctAnswerId).length,1);
      assert.deepEqual(new Set(shuffle(q.choices).map(c=>c.id)),new Set(q.choices.map(c=>c.id)));
      assert.ok(mission.scenarios.some(s=>s.id===q.scenarioId));assert.ok(q.sourceIds.includes('routing-lab'));
    }
    assert.notEqual(question(o.applicationIds[0]).prompt,question(o.practiceId).prompt);
    assert.notEqual(question(o.applicationIds[1]).prompt,question(o.applicationIds[0]).prompt);
    for(const link of o.review){
      if(link.href.startsWith('/notes/'))assert.ok(notes.find(t=>t.id==='n10-ch9').sections.some(s=>s.id===link.href.split('#')[1]));
      if(link.href.startsWith('/labs/'))assert.ok(labs.find(l=>l.slug==='two-subnet-lan').sections.some(s=>s.id===link.href.split('#')[1]));
      if(link.href.startsWith('/flashcards'))assert.equal(cards.filter(c=>c.topicId==='n10-ch9').length,3);
    }
  }
  assert.ok(!cards.find(c=>c.id==='fc-n6').back.includes('learn every device'));
});
test('wrong practice, hint, retry and completion remain distinct from independent application',()=>{
  let r=emptyMission(mission),q=nextQuestion(r,mission,'diagnose');
  r=answer(r,q,false);r=missionHint(r,mission,q.id);r=answer(r,q);
  let s=missionSummary(r,mission);assert.equal(s.points,75);assert.equal(s.accuracy,0);assert.equal(s.hints,1);assert.equal(s.retries,1);assert.equal(s.completed,1);assert.equal(s.achievements.length,0);assert.equal(s.recommendation.id,'diagnose');
  q=nextQuestion(r,mission,'diagnose');assert.equal(q.stage,'application');
  r=answer(r,q,false);r=answer(r,q);s=missionSummary(r,mission);assert.equal(s.achievements.length,0);assert.equal(s.objectives[0].proof,undefined);
  q=nextQuestion(r,mission,'diagnose');assert.equal(q.id,'diagnose-apply-2');r=answer(r,q);
  s=missionSummary(r,mission);assert.equal(s.achievements.length,1);assert.equal(s.achievements[0].title,'Evidence before repair');assert.equal(s.objectives[0].proof.id,q.id);assert.equal(s.points,275);assert.equal(s.recommendation.id,'next-hop');
});
test('hint-assisted correct first application is not proficiency; exhausted unseen questions cannot be farmed',()=>{
  let r=emptyMission(mission);r=answer(r,question('next-hop-practice'));
  for(const id of ['next-hop-apply-1','next-hop-apply-2']){r=missionHint(r,mission,id);r=answer(r,question(id));}
  const s=missionSummary(r,mission);assert.equal(s.accuracy,100);assert.equal(s.hints,2);assert.equal(s.retries,0);assert.equal(s.completed,3);assert.equal(s.achievements.length,0);assert.equal(nextQuestion(r,mission,'next-hop'),undefined);
  assert.equal(answer(r,question('next-hop-apply-1')),r);
});
test('repeated/unknown/stale answers and hints do not award duplicate points or achievements',()=>{
  let r=emptyMission(mission);const p=question('verify-practice'),a=question('verify-apply-1');
  assert.equal(answer(r,a),r);assert.equal(missionHint(r,mission,a.id),r);assert.equal(missionAnswer(r,mission,p.id,'unknown'),r);
  r=answer(r,p,false);assert.equal(answer(r,p,false),r);r=answer(r,p);assert.equal(answer(r,p),r);assert.equal(missionHint(r,mission,p.id),r);
  r=answer(r,a);const s=missionSummary(r,mission);assert.equal(s.points,200);assert.equal(s.achievements.length,1);
  for(let i=0;i<10;i++){r=answer(r,a);r=answer(r,p);r=missionHint(r,mission,a.id);}
  assert.deepEqual(missionSummary(r,mission).achievements,s.achievements);assert.equal(missionSummary(r,mission).points,200);
  assert.equal(missionAnswer({...r,version:0},mission,p.id,p.correctAnswerId).version,0);
});
test('persistent records validate sequencing, versions and identifiers; rewards are derived, not trusted',()=>{
  let r=emptyMission(mission);r=answer(r,question('diagnose-practice'));r=answer(r,question('diagnose-apply-1'));
  assert.deepEqual(restoreMission(JSON.stringify(r),mission),r);
  for(const invalid of [null,'{',JSON.stringify({...r,version:0}),JSON.stringify({...r,receipts:[]}),JSON.stringify({...r,receipts:{'wrong-id':{hintUsed:false,attemptedIds:[]}}})])assert.equal(restoreMission(invalid,mission),null);
  const copy=structuredClone(r);copy.receipts['diagnose-practice'].attemptedIds.push(copy.receipts['diagnose-practice'].attemptedIds[0]);assert.equal(restoreMission(JSON.stringify(copy),mission),null);
  const future=emptyMission(mission);future.receipts['verify-apply-2']={hintUsed:false,attemptedIds:[question('verify-apply-2').correctAnswerId]};assert.equal(restoreMission(JSON.stringify(future),mission),null);
  const extra=structuredClone(r);extra.receipts['diagnose-apply-2']={hintUsed:false,attemptedIds:[question('diagnose-apply-2').correctAnswerId]};assert.equal(restoreMission(JSON.stringify(extra),mission),null);
  const forged={...r,points:90000,achievements:['everything']};assert.equal(missionSummary(restoreMission(JSON.stringify(forged),mission),mission).points,200);
});
test('all objectives form a finite complete loop and reset produces no retained rewards',()=>{
  let r=emptyMission(mission);
  for(const o of mission.objectives){r=answer(r,question(o.practiceId));r=answer(r,question(o.applicationIds[0]));}
  const s=missionSummary(r,mission);assert.equal(s.achievements.length,3);assert.equal(new Set(s.achievements.map(a=>a.id)).size,3);assert.equal(s.completed,6);assert.equal(s.points,600);assert.equal(s.recommendation,undefined);assert.equal(s.accuracy,100);
  assert.equal(missionSummary(emptyMission(mission),mission).achievements.length,0);
});
