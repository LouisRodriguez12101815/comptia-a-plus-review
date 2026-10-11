import { subnetData } from "@/lib/subnet/catalog";
import { calculate, cidr } from "@/lib/subnet/ipv4";
import { designGrade, designReason, detectiveGrade, detectiveSteps, orderGrade } from "@/lib/subnet/grading";
import type { Allocation, DesignMission } from "@/lib/subnet/types";
export type Answers=Record<string,string>;
export type Run={version:number;activity:"detective"|"architect";mode:"guided"|"challenge";id:string;receipts:Record<string,{attempts:Answers[];hintUsed:boolean}>;draft:Answers};
export function newRun(activity:Run['activity'],mode:Run['mode'],id:string):Run{return {version:1,activity,mode,id,receipts:{},draft:{}};}
export const getExercise=(run:Run)=>[...subnetData.exercises,subnetData.transferExercise].find(e=>e.id===run.id)!;
export const getMission=(run:Run)=>subnetData.missions.find(m=>m.id===run.id)!;
export const getConcept=(run:Run)=>subnetData.concepts[Math.max(0,subnetData.exercises.findIndex(e=>e.id===run.id))%subnetData.concepts.length];
export function stages(run:Run){return [...(run.activity==='detective'?detectiveSteps.map(s=>s.id):['order','prefixes','allocation','reason']),'concept'];}
export function allocations(answers:Answers):Record<string,Allocation>{return Object.fromEntries(Object.keys(answers).filter(k=>k.endsWith('.cidr')).map(k=>{const id=k.slice(0,-5);return [id,{cidr:answers[k],gateway:answers[id+'.gateway']??'',peer:answers[id+'.peer']??''}];}));}
export function grade(run:Run,stage:string,answers:Answers):{ok:boolean;errors:string[]}{
  if(stage==='concept'){const c=getConcept(run).choices.find(c=>c.id===answers.choice);return {ok:!!c?.correct,errors:c&&!c.correct?[c.explanation]:c?[]:['Choose the justified concept answer.']};}
  if(run.activity==='detective')return detectiveGrade(getExercise(run),stage,answers);
  const mission=getMission(run);
  if(stage==='order')return {ok:orderGrade(mission,(answers.order??'').split(',')),errors:orderGrade(mission,(answers.order??'').split(','))?[]:['Use each requirement once, from largest usable count to smallest. Equal-count links can be in any order.']};
  if(stage==='prefixes'){
    const errors:string[]=[];let total=0;
    for(const r of mission.requirements){try{if(!/^\d+$/.test(answers[r.id]??''))throw new Error('Enter a prefix.');const n=calculate('0.0.0.0',Number(answers[r.id]));total+=n.size;
      if(n.capacity<r.hosts)errors.push(`${r.id}: /${n.prefix} gives ${n.capacity} usable, below ${r.hosts}. Reserve network/broadcast.`);
      if(r.kind==='link'&&n.prefix!==30)errors.push(`${r.id}: links must use /30 in this mission.`);
    }catch(e){errors.push(`${r.id}: ${(e as Error).message}`);}}
    if(total>cidr(mission.parent).size)errors.push('Insufficient space: your chosen block sizes together exceed the parent. Reconsider oversized LANs.');
    return {ok:errors.length===0,errors};
  }
  if(stage==='allocation'){
    const result=designGrade(mission,allocations(answers));const errors=result.errors.map(e=>`${e.id}: ${e.reason}`);
    const selected=run.receipts.prefixes?.attempts.at(-1);
    for(const r of mission.requirements)if(answers[r.id+'.cidr']?.split('/')[1]!==selected?.[r.id])errors.push(`${r.id}: use the prefix you selected in the preceding step.`);
    return {ok:errors.length===0,errors};
  }
  if(stage==='reason'){const c=designReason.choices.find(c=>c.id===answers.choice);return {ok:!!c?.correct,errors:c&&!c.correct?[c.explanation]:c?[]:['Choose a verification explanation.']};}
  return {ok:false,errors:['Unknown stage.']};
}
export const activeStage=(run:Run)=>stages(run).find(s=>{const a=run.receipts[s]?.attempts.at(-1);return !a||!grade(run,s,a).ok;});
const fingerprint=(answers:Answers)=>JSON.stringify(Object.entries(answers).map(([k,v])=>[k,v.trim()]).sort(([a],[b])=>a.localeCompare(b)));
export function submitRun(run:Run,stage:string,answers:Answers):Run{
  if(activeStage(run)!==stage)return run;
  const receipt=run.receipts[stage]??{attempts:[],hintUsed:false};
  if(receipt.attempts.some(a=>fingerprint(a)===fingerprint(answers)))return run;
  return {...run,receipts:{...run.receipts,[stage]:{...receipt,attempts:[...receipt.attempts,{...answers}]}},draft:{...run.draft}};
}
export function hintRun(run:Run,stage:string):Run{
  if(activeStage(run)!==stage)return run;
  const receipt=run.receipts[stage]??{attempts:[],hintUsed:false};
  return receipt.hintUsed?run:{...run,receipts:{...run.receipts,[stage]:{...receipt,hintUsed:true}}};
}
export function runSummary(run:Run){
  const rows=stages(run).map(stage=>{const r=run.receipts[stage];const attempts=r?.attempts??[];return {stage,attempts:attempts.length,firstCorrect:!!attempts[0]&&grade(run,stage,attempts[0]).ok,complete:!!attempts.at(-1)&&grade(run,stage,attempts.at(-1)!).ok,hintUsed:!!r?.hintUsed,retries:Math.max(0,attempts.length-1),errors:attempts.flatMap(a=>grade(run,stage,a).errors)};});
  const attempted=rows.filter(r=>r.attempts>0).length,firstCorrect=rows.filter(r=>r.firstCorrect).length;
  return {rows,attempted,firstCorrect,accuracy:attempted?Math.round(100*firstCorrect/attempted):null,retries:rows.reduce((n,r)=>n+r.retries,0),hints:rows.filter(r=>r.hintUsed).length,completed:rows.filter(r=>r.complete).length,points:rows.reduce((n,r)=>n+(r.complete?(r.hintUsed?75:100):0),0),independentTransfer:run.mode==='challenge'&&(run.id==='transfer-office'||run.id===subnetData.transferExercise.id)&&rows.every(r=>r.complete&&r.firstCorrect&&!r.hintUsed)};
}
const validAnswers=(a:unknown):a is Answers=>!!a&&typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).every(([k,v])=>k.length<100&&typeof v==='string'&&v.length<200);
export function restoreRun(raw:string|null):Run|null{
  if(!raw)return null;
  try{const run=JSON.parse(raw) as Run;
    if(!run||run.version!==1||!['detective','architect'].includes(run.activity)||!['guided','challenge'].includes(run.mode)||!validAnswers(run.draft)||!run.receipts||typeof run.receipts!=='object'||Array.isArray(run.receipts))return null;
    if(run.activity==='detective'?!getExercise(run):!getMission(run))return null;
    const ss=stages(run);let incomplete=false;
    for(const s of ss){const r=run.receipts[s];if(!r){incomplete=true;continue;}
      if(incomplete||typeof r.hintUsed!=='boolean'||!Array.isArray(r.attempts)||!r.attempts.every(validAnswers)||new Set(r.attempts.map(fingerprint)).size!==r.attempts.length)return null;
      if(r.attempts.slice(0,-1).some(a=>grade(run,s,a).ok))return null;
      if(!r.attempts.at(-1)||!grade(run,s,r.attempts.at(-1)!).ok)incomplete=true;
    }
    if(Object.keys(run.receipts).some(k=>!ss.includes(k)))return null;
    return run;
  }catch{return null;}
}
export function flattenDesign(mission:DesignMission,networks:Record<string,string>,selected:Answers,draft:Answers):Answers{return Object.fromEntries(mission.requirements.flatMap(r=>[[r.id+'.cidr',`${networks[r.id]??''}/${selected[r.id]}`],[r.id+'.gateway',draft[r.id+'.gateway']??''],[r.id+'.peer',draft[r.id+'.peer']??'']]));}
