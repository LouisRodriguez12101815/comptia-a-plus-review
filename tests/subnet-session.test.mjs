import test from 'node:test';
import assert from 'node:assert/strict';
import {subnetData as data} from '../lib/subnet/catalog.ts';
import {newRun,stages,activeStage,grade,submitRun,hintRun,runSummary,restoreRun,getConcept} from '../lib/subnet/session.ts';
import {calculate} from '../lib/subnet/ipv4.ts';
const answersFor=(run,s)=>{
 if(s==='concept')return {choice:getConcept(run).choices.find(c=>c.correct).id};if(s==='reason')return {choice:'constraints'};
 if(run.activity==='detective'){const e=[...data.exercises,data.transferExercise].find(e=>e.id===run.id);return Object.fromEntries(Object.entries(calculate(e.ip,e.prefix)).map(([k,v])=>[k,String(v)]));}
 const m=data.missions.find(m=>m.id===run.id);
 if(s==='order')return {order:m.requirements.map(r=>r.id).join(',')};
 if(s==='prefixes')return Object.fromEntries(m.verifiedFixture.map(f=>[f.id,f.cidr.split('/')[1]]));
 return Object.fromEntries(m.verifiedFixture.flatMap(f=>[[f.id+'.cidr',f.cidr],[f.id+'.gateway',f.first],[f.id+'.peer',f.last]]));
};
for(const activity of ['detective','architect'])test(`${activity}: wrong, hint, recovery, duplicates, ordering, persistence and debrief remain distinct`,()=>{
 let r=newRun(activity,'guided',activity==='detective'?data.exercises[0].id:'vlan-6');const first=activeStage(r);
 r=submitRun(r,first,{bad:'wrong'});assert.equal(submitRun(r,first,{bad:'wrong'}),r);r=hintRun(r,first);assert.equal(hintRun(r,first),r);
 assert.equal(submitRun(r,'concept',{choice:'32'}),r,'future stage cannot submit');
 r=submitRun(r,first,answersFor(r,first));assert.equal(runSummary(r).points,75);assert.equal(runSummary(r).retries,1);assert.equal(runSummary(r).accuracy,0);
 assert.equal(submitRun(r,first,answersFor(r,first)),r);assert.equal(hintRun(r,first),r);
 assert.deepEqual(restoreRun(JSON.stringify(r)),r);
 for(const s of stages(r).slice(1)){assert.equal(activeStage(r),s);const a=answersFor(r,s);assert.equal(grade(r,s,a).ok,true);r=submitRun(r,s,a);}
 const summary=runSummary(r);assert.equal(activeStage(r),undefined);assert.equal(summary.completed,5);assert.equal(summary.points,475);assert.equal(summary.firstCorrect,4);assert.equal(summary.hints,1);assert.equal(summary.independentTransfer,false);assert.ok(summary.rows[0].errors.length);
 assert.deepEqual(restoreRun(JSON.stringify({...r,points:999999})).receipts,r.receipts);assert.equal(runSummary(restoreRun(JSON.stringify({...r,points:999999}))).points,475);
});
test('only an unaided challenge transfer supports independent transfer status',()=>{
 for(const [activity,id] of [['detective','detective-transfer'],['architect','transfer-office']]){
  let r=newRun(activity,'challenge',id);for(const s of stages(r))r=submitRun(r,s,answersFor(r,s));assert.equal(runSummary(r).independentTransfer,true);
  let aided=newRun(activity,'challenge',id);aided=hintRun(aided,activeStage(aided));for(const s of stages(aided))aided=submitRun(aided,s,answersFor(aided,s));assert.equal(runSummary(aided).independentTransfer,false);
 }
});
test('restore rejects invalid identifiers, future receipts, versions and duplicate or post-correct attempts',()=>{
 const r=newRun('detective','challenge',data.exercises[0].id);
 for(const value of [null,'{',JSON.stringify({...r,version:2}),JSON.stringify({...r,id:'missing'}),JSON.stringify({...r,receipts:[]}),JSON.stringify({...r,draft:{x:9}})])assert.equal(restoreRun(value),null);
 const future={...r,receipts:{capacity:{attempts:[answersFor(r,'capacity')],hintUsed:false}}};assert.equal(restoreRun(JSON.stringify(future)),null);
 const duplicate={...r,receipts:{mask:{attempts:[{bad:'wrong'},{bad:'wrong'}],hintUsed:false}}};assert.equal(restoreRun(JSON.stringify(duplicate)),null);
 const after={...r,receipts:{mask:{attempts:[answersFor(r,'mask'),{bad:'wrong'}],hintUsed:false}}};assert.equal(restoreRun(JSON.stringify(after)),null);
});
