import { address, calculate, cidr, contained, overlaps, smallestPrefix } from "@/lib/subnet/ipv4";
import type { Allocation, DesignMission, Exercise } from "@/lib/subnet/types";

/** Player-facing feedback. `text` is the English source (also used by tests and logs); `key`/`values` look up the translation in the subnetGrading namespace. Content text without a key stays as-is. */
export type Feedback = { text: string; key?: string; values?: Record<string, string | number> };
const fb = (key: string, text: string, values?: Record<string, string | number>): Feedback => ({ text, key, values });

export const detectiveSteps = [
  {id:"mask",label:"Subnet mask and block size",fields:["mask","blockSize"],objective:"Translate an IPv4 prefix into a mask and increment"},
  {id:"bounds",label:"Network and broadcast",fields:["network","broadcast"],objective:"Find the aligned network and broadcast boundaries"},
  {id:"range",label:"Usable address range",fields:["first","last"],objective:"Reserve network/broadcast and identify usable addresses"},
  {id:"capacity",label:"Usable capacity and given address",fields:["capacity","isHost"],objective:"Calculate usable capacity and classify a host address"},
] as const;
export function detectiveGrade(exercise: Exercise, step: string, values: Record<string,string>) {
  const rule = detectiveSteps.find((s) => s.id === step);
  if (!rule) return {ok:false,errors:[fb("unknownStep","Unknown step.")] as Feedback[]};
  const expected = calculate(exercise.ip,exercise.prefix);
  const errors:Feedback[]=[];
  for(const field of rule.fields){
    const text=(values[field] ?? "").trim();
    if (field === "isHost") { if(text !== String(expected.isHost)) errors.push(fb("isHost","Reconsider whether the given address equals the network or broadcast boundary; neither is usable in this exercise.")); }
    else if(field === "capacity" || field === "blockSize") { if(!/^\d+$/.test(text) || Number(text) !== expected[field]) errors.push(field === "capacity" ? fb("capacity","Capacity: use 2^(32 − prefix) − 2, reserving network and broadcast.") : fb("blockSize",`Block size: look at the prefix boundary in octet ${expected.blockOctet}; use 256 minus that mask octet (256 for a full host octet).`,{octet:expected.blockOctet})); }
    else { try { if(address(text) !== address(expected[field])) errors.push(field === "mask" ? fb("mask","Mask: the prefix is the number of leading 1 bits, followed by host 0 bits.") : fb("alignField",`${field}: align the network down to its block boundary; broadcast is the final address and usable addresses lie strictly between.`,{field})); } catch(e) { errors.push(fb("fieldError",`${field}: ${(e as Error).message}`,{field,message:(e as Error).message})); } }
  }
  return {ok:errors.length===0,errors};
}
/** `reason` is the English text (tests and logs). `key` and `values` translate the same message; `key` text includes the `{id}: ` prefix. */
export function designGrade(mission: DesignMission, allocations: Record<string,Allocation>) {
  const parent = cidr(mission.parent), errors: {id:string;reason:string;key:string;values:Record<string,string|number>}[]=[];
  const blocks:{id:string;block:ReturnType<typeof cidr>}[]=[];
  const add=(id:string,reason:string,key:string,values:Record<string,string|number>={})=>errors.push({id,reason,key,values:{id,...values}});
  for(const req of mission.requirements){
    const allocation=allocations[req.id];
    if(!allocation){add(req.id,"Enter a block and its usable gateway/interface addresses.","designEnterBlock");continue;}
    try{
      const block=cidr(allocation.cidr);blocks.push({id:req.id,block});
      if(!contained(block,parent))add(req.id,`Out of range: the entire block must fit inside ${mission.parent}.`,"designOutOfRange",{parent:mission.parent});
      if(block.capacity<req.hosts)add(req.id,`Insufficient capacity: /${block.prefix} provides ${block.capacity} usable, but ${req.hosts} are required (gateway included).`,"designCapacity",{prefix:block.prefix,capacity:block.capacity,hosts:req.hosts});
      if(req.kind==='link' && block.prefix!==30)add(req.id,"This mission uses /30 point-to-point links, with exactly two usable interface addresses.","designLinkPrefix");
      try { const gateway=address(allocation.gateway);if(gateway<=block.start||gateway>=block.end)add(req.id,"Gateway/interface must be usable inside its block, not network or broadcast.","designGatewayRange");
        if(req.kind==='link'){const peer=address(allocation.peer);if(peer<=block.start||peer>=block.end)add(req.id,"The peer interface must also be usable inside this /30.","designPeerRange");if(gateway===peer)add(req.id,"The two link interfaces must have distinct usable addresses.","designDistinct");}
      }catch(e){add(req.id,`Interface address: ${(e as Error).message}`,"designInterface",{message:(e as Error).message});}
    }catch(e){add(req.id,(e as Error).message,"designBlock",{message:(e as Error).message});}
  }
  for(let i=0;i<blocks.length;i++) for(let j=0;j<i;j++) if(overlaps(blocks[i].block,blocks[j].block)) add(blocks[i].id,`Overlap with ${blocks[j].id}: two segments cannot share an address block.`,"designOverlap",{other:blocks[j].id});
  const allocated=blocks.reduce((n,b)=>n+b.block.size,0);
  const minimum=mission.requirements.reduce((n,r)=>n+2**(32-(r.kind==='link'?30:smallestPrefix(r.hosts))),0);
  if(minimum>parent.size)add("parent",`Insufficient parent space: minimum blocks need ${minimum} addresses, but the parent has ${parent.size}.`,"designParentSpace",{minimum,size:parent.size});
  return {ok:errors.length===0,errors,blocks,allocated,remaining:errors.length ? null : parent.size-allocated};
}
/** Display only. Index 0 is the first requirement; firstTwo is order[0:2]. Grading is unchanged. */
export function orderView(order: string[], requirements: { id: string }[]) {
  const known = new Set(requirements.map((item) => item.id));
  const items = order.filter((id) => known.has(id)).map((id, index) => ({ index, id }));
  return { items, firstTwo: items.slice(0, 2) };
}
/** Display only. A set keeps each usable count once. A record looks up one requirement by id. Grading is unchanged. */
export function requirementFacts(requirements: { id: string; hosts: number }[], lookupId = "A") {
  const hostsById: Record<string, number> = {};
  for (const requirement of requirements) if (!(requirement.id in hostsById)) hostsById[requirement.id] = requirement.hosts;
  return { hostsById, uniqueHosts: [...new Set(requirements.map((requirement) => requirement.hosts))], lookupId, hosts: lookupId in hostsById ? hostsById[lookupId] : null };
}
/** Display only. Ranked is a new list: usable count high to low, then id A to Z. Links are the filtered link ids. The input order is not changed. */
export function rankedRequirements(requirements: { id: string; hosts: number; kind: string }[]) {
  const ranked = [...requirements].sort((a, b) => b.hosts - a.hosts || a.id.localeCompare(b.id));
  return { ranked: ranked.map((item) => ({ id: item.id, hosts: item.hosts })), links: ranked.filter((item) => item.kind === "link").map((item) => item.id) };
}
export function orderGrade(mission: DesignMission, order:string[]) {
  return order.length===mission.requirements.length && new Set(order).size===order.length && order.every((id,i)=>{const r=mission.requirements.find(r=>r.id===id);const previous=mission.requirements.find(r=>r.id===order[i-1]);return !!r && (!previous||previous.hosts>=r.hosts);});
}
/** Choice ids are used in translation keys: reasonChoices.<id>.label / .explanation. */
export const designReason = {id:"design-reason",prompt:"What makes this a verified VLSM design?",choices:[{id:"constraints",label:"Capacity, alignment, disjoint blocks, containment and usable distinct interfaces; different prefixes fit requirements",correct:true,explanation:"A layout is valid because it meets these constraints, not because its addresses match a sample. Choosing smaller sufficient blocks conserves space; using larger blocks can still be valid if everything fits."},{id:"match",label:"It matches a sample or the addresses were entered, so no boundary/interface checks are needed",correct:false,explanation:"An interaction or familiar-looking address is not proof. Check usable capacity, overlap, alignment, containment and interfaces independently."}]};
