import { address, calculate, cidr, contained, overlaps, smallestPrefix } from "@/lib/subnet/ipv4";
import type { Allocation, DesignMission, Exercise } from "@/lib/subnet/types";
export const detectiveSteps = [
  {id:"mask",label:"Subnet mask and block size",fields:["mask","blockSize"],objective:"Translate an IPv4 prefix into a mask and increment"},
  {id:"bounds",label:"Network and broadcast",fields:["network","broadcast"],objective:"Find the aligned network and broadcast boundaries"},
  {id:"range",label:"Usable address range",fields:["first","last"],objective:"Reserve network/broadcast and identify usable addresses"},
  {id:"capacity",label:"Usable capacity and given address",fields:["capacity","isHost"],objective:"Calculate usable capacity and classify a host address"},
] as const;
export function detectiveGrade(exercise: Exercise, step: string, values: Record<string,string>) {
  const rule = detectiveSteps.find((s) => s.id === step);
  if (!rule) return {ok:false,errors:["Unknown step."]};
  const expected = calculate(exercise.ip,exercise.prefix);
  const errors:string[]=[];
  for(const field of rule.fields){
    const text=(values[field] ?? "").trim();
    if (field === "isHost") { if(text !== String(expected.isHost)) errors.push("Reconsider whether the given address equals the network or broadcast boundary; neither is usable in this exercise."); }
    else if(field === "capacity" || field === "blockSize") { if(!/^\d+$/.test(text) || Number(text) !== expected[field]) errors.push(field === "capacity" ? "Capacity: use 2^(32 − prefix) − 2, reserving network and broadcast." : `Block size: look at the prefix boundary in octet ${expected.blockOctet}; use 256 minus that mask octet (256 for a full host octet).`); }
    else { try { if(address(text) !== address(expected[field])) errors.push(field === "mask" ? "Mask: the prefix is the number of leading 1 bits, followed by host 0 bits." : `${field}: align the network down to its block boundary; broadcast is the final address and usable addresses lie strictly between.`); } catch(e) { errors.push(`${field}: ${(e as Error).message}`); } }
  }
  return {ok:errors.length===0,errors};
}
export function designGrade(mission: DesignMission, allocations: Record<string,Allocation>) {
  const parent = cidr(mission.parent), errors: {id:string;reason:string}[]=[];
  const blocks:{id:string;block:ReturnType<typeof cidr>}[]=[];
  for(const req of mission.requirements){
    const allocation=allocations[req.id];
    if(!allocation){errors.push({id:req.id,reason:"Enter a block and its usable gateway/interface addresses."});continue;}
    try{
      const block=cidr(allocation.cidr);blocks.push({id:req.id,block});
      if(!contained(block,parent))errors.push({id:req.id,reason:`Out of range: the entire block must fit inside ${mission.parent}.`});
      if(block.capacity<req.hosts)errors.push({id:req.id,reason:`Insufficient capacity: /${block.prefix} provides ${block.capacity} usable, but ${req.hosts} are required (gateway included).`});
      if(req.kind==='link' && block.prefix!==30)errors.push({id:req.id,reason:"This mission uses /30 point-to-point links, with exactly two usable interface addresses."});
      try { const gateway=address(allocation.gateway);if(gateway<=block.start||gateway>=block.end)errors.push({id:req.id,reason:"Gateway/interface must be usable inside its block, not network or broadcast."});
        if(req.kind==='link'){const peer=address(allocation.peer);if(peer<=block.start||peer>=block.end)errors.push({id:req.id,reason:"The peer interface must also be usable inside this /30."});if(gateway===peer)errors.push({id:req.id,reason:"The two link interfaces must have distinct usable addresses."});}
      }catch(e){errors.push({id:req.id,reason:`Interface address: ${(e as Error).message}`});}
    }catch(e){errors.push({id:req.id,reason:(e as Error).message});}
  }
  for(let i=0;i<blocks.length;i++) for(let j=0;j<i;j++) if(overlaps(blocks[i].block,blocks[j].block)) errors.push({id:blocks[i].id,reason:`Overlap with ${blocks[j].id}: two segments cannot share an address block.`});
  const allocated=blocks.reduce((n,b)=>n+b.block.size,0);
  const minimum=mission.requirements.reduce((n,r)=>n+2**(32-(r.kind==='link'?30:smallestPrefix(r.hosts))),0);
  if(minimum>parent.size)errors.push({id:"parent",reason:`Insufficient parent space: minimum blocks need ${minimum} addresses, but the parent has ${parent.size}.`});
  return {ok:errors.length===0,errors,blocks,allocated,remaining:errors.length ? null : parent.size-allocated};
}
/** Display only. A set keeps each usable count once. A record looks up one requirement by id. Grading is unchanged. */
export function requirementFacts(requirements: { id: string; hosts: number }[], lookupId = "A") {
  const hostsById: Record<string, number> = {};
  for (const requirement of requirements) if (!(requirement.id in hostsById)) hostsById[requirement.id] = requirement.hosts;
  return { hostsById, uniqueHosts: [...new Set(requirements.map((requirement) => requirement.hosts))], lookupId, hosts: lookupId in hostsById ? hostsById[lookupId] : null };
}
export function orderGrade(mission: DesignMission, order:string[]) {
  return order.length===mission.requirements.length && new Set(order).size===order.length && order.every((id,i)=>{const r=mission.requirements.find(r=>r.id===id);const previous=mission.requirements.find(r=>r.id===order[i-1]);return !!r && (!previous||previous.hosts>=r.hosts);});
}
export const designReason = {id:"design-reason",prompt:"What makes this a verified VLSM design?",choices:[{id:"constraints",label:"Capacity, alignment, disjoint blocks, containment and usable distinct interfaces; different prefixes fit requirements",correct:true,explanation:"A layout is valid because it meets these constraints, not because its addresses match a sample. Choosing smaller sufficient blocks conserves space; using larger blocks can still be valid if everything fits."},{id:"match",label:"It matches a sample or the addresses were entered, so no boundary/interface checks are needed",correct:false,explanation:"An interaction or familiar-looking address is not proof. Check usable capacity, overlap, alignment, containment and interfaces independently."}]};
