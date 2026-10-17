import test from 'node:test';
import assert from 'node:assert/strict';
import {subnetData as data} from '../lib/subnet/catalog.ts';
import {address,dotted,calculate,cidr,cleanedTypedText,smallestPrefix,equalSubnetCount} from '../lib/subnet/ipv4.ts';
import {designGrade,detectiveGrade,orderGrade} from '../lib/subnet/grading.ts';
const fromFixture=m=>Object.fromEntries(m.verifiedFixture.map(f=>[f.id,{cidr:f.cidr,gateway:f.first,peer:f.last}]));
for(const e of [...data.exercises,data.transferExercise])test(`verified source/boundary arithmetic: ${e.id} ${e.ip}/${e.prefix}`,()=>{
 const actual=calculate(e.ip,e.prefix);for(const [key,value] of Object.entries(e.expected))assert.equal(actual[key],value,key);
 for(const stage of ['mask','bounds','range','capacity'])assert.equal(detectiveGrade(e,stage,Object.fromEntries(Object.entries(e.expected).map(([k,v])=>[k,String(v)]))).ok,true);
 assert.equal(calculate(actual.network,e.prefix).isHost,false);assert.equal(calculate(actual.broadcast,e.prefix).isHost,false);
 assert.equal(calculate(actual.first,e.prefix).isHost,true);assert.equal(calculate(actual.last,e.prefix).isHost,true);
});
test('unsigned arithmetic includes high octets, /0 and upper IPv4 boundary without signed wrap',()=>{
 assert.equal(address('255.255.255.255'),4294967295);assert.equal(dotted(4294967295),'255.255.255.255');
 assert.equal(calculate('255.255.255.254',30).network,'255.255.255.252');assert.equal(calculate('255.255.255.254',30).broadcast,'255.255.255.255');
 const all=calculate('200.1.2.3',0);assert.equal(all.start,0);assert.equal(all.capacity,4294967294);assert.equal(all.mask,'0.0.0.0');
 for(const bad of ['172.16.9.256','-1.0.0.0','1.2.3','1.2.3.4.5','1e2.0.0.1','01.2.3.4','1.2.3.x'])assert.throws(()=>address(bad));
 for(const p of [-1,31,32,33,2.5,NaN])assert.throws(()=>calculate('1.2.3.4',p));
 assert.throws(()=>cidr('10.0.0.1/24'),/Misalignment/);assert.throws(()=>cidr('10.0.0.0/no'));
});
test('typed address text is trimmed then split without changing the grade',()=>{
 assert.deepEqual(cleanedTypedText('192.168.1.1'),{typed:'192.168.1.1',cleaned:'192.168.1.1',pieces:['192','168','1','1']});
 assert.deepEqual(cleanedTypedText('  192.168.1.1 '),{typed:'  192.168.1.1 ',cleaned:'192.168.1.1',pieces:['192','168','1','1']});
 assert.deepEqual(cleanedTypedText(''),{typed:'',cleaned:'',pieces:[]});
 assert.deepEqual(cleanedTypedText(' AB '),{typed:' AB ',cleaned:'AB',pieces:['AB']});
 assert.deepEqual(cleanedTypedText('  10.0.0.0/24 '),{typed:'  10.0.0.0/24 ',cleaned:'10.0.0.0/24',pieces:['10.0.0.0','24']});
 const exercise=data.exercises[0];
 assert.equal(detectiveGrade(exercise,'bounds',{network:'  '+exercise.expected.network+' ',broadcast:exercise.expected.broadcast}).ok,true);
});
test('CIDR and equal-size subnet counts require explicit parent; no historical class inference',()=>{
 assert.equal(equalSubnetCount(8,24),65536);assert.equal(equalSubnetCount(24,27),8);assert.equal(equalSubnetCount(16,20),16);
 assert.throws(()=>equalSubnetCount(undefined,27));assert.throws(()=>equalSubnetCount(24,20));
 for(const [h,p] of [[210,24],[125,25],[95,25],[52,26],[2,30]])assert.equal(smallestPrefix(h),p);
});
for(const m of data.missions)test(`VLSM ${m.id}: verified fixture and alternate layout pass constraint grading`,()=>{
 const fixture=fromFixture(m);const g=designGrade(m,fixture);assert.equal(g.ok,true);assert.ok(g.remaining>0);
 const alternative=structuredClone(fixture);[alternative.B,alternative.C]=[alternative.C,alternative.B];
 if(m.id==='vlan-6'){assert.equal(designGrade(m,alternative).ok,true);const reverse={...fixture,A:{...fixture.A,cidr:'172.16.11.0/24',gateway:'172.16.11.254'},D:{...fixture.D,gateway:'172.16.10.62'}};assert.equal(designGrade(m,reverse).ok,true);}
 assert.equal(orderGrade(m,m.requirements.map(r=>r.id)),true);assert.equal(orderGrade(m,m.requirements.map(r=>r.id).reverse()),false);
});
test('capacity, overlap, alignment, outside parent, reserved/duplicate interfaces and insufficient parent are rejected specifically',()=>{
 const m=data.missions[0],f=fromFixture(m);const failing=(id,update,pattern)=>{const a=structuredClone(f);a[id]={...a[id],...update};assert.ok(designGrade(m,a).errors.some(e=>pattern.test(e.reason)));};
 failing('A',{cidr:'172.16.8.0/25'},/Insufficient capacity/);
 failing('B',{cidr:'172.16.8.0/25',gateway:'172.16.8.1'},/Overlap/);
 failing('D',{cidr:'172.16.10.1/26'},/Misalignment/);
 failing('D',{cidr:'172.16.12.0/26',gateway:'172.16.12.1'},/Out of range/);
 failing('A',{gateway:'172.16.8.0'},/not network or broadcast/);failing('A',{gateway:'172.16.8.255'},/not network or broadcast/);
 failing('L1',{peer:f.L1.gateway},/distinct/);failing('L1',{cidr:'172.16.10.64/29'},/uses \/30/);
 assert.ok(designGrade({...m,parent:'172.16.8.0/25'},f).errors.some(e=>/Insufficient parent space/.test(e.reason)));
});
test('IPv4 context and separate optional IPv6 checks retain stable IDs and inspected source references',()=>{
 const ids=new Set(data.sources.map(s=>s.id));
 assert.equal(new Set(data.concepts.map(c=>c.id)).size,5);
 for(const c of [...data.concepts,...data.optionalIpv6]){assert.equal(c.choices.filter(a=>a.correct).length,1);assert.ok(c.sourceIds.every(id=>ids.has(id)));assert.ok(c.choices.every(a=>a.explanation.length>30));}
 assert.equal(data.optionalIpv6.find(c=>c.id==='ipv6-width').choices.find(c=>c.correct).id,'128');
 assert.ok(data.unresolved.every(x=>x.reason.includes('Original image absent')));
});

test('larger-than-minimum LAN blocks remain acceptable when all constraints fit',()=>{
 const m=data.missions[0];
 const allocations=Object.fromEntries([['A','172.16.8.0/23','172.16.8.1'],['B','172.16.10.0/25','172.16.10.1'],['C','172.16.10.128/25','172.16.10.129'],['D','172.16.11.0/26','172.16.11.1'],['L1','172.16.11.64/30','172.16.11.65','172.16.11.66'],['L2','172.16.11.68/30','172.16.11.69','172.16.11.70'],['L3','172.16.11.72/30','172.16.11.73','172.16.11.74']].map(([id,cidr,gateway,peer])=>[id,{cidr,gateway,peer}]));
 assert.equal(designGrade(m,allocations).ok,true);
});
