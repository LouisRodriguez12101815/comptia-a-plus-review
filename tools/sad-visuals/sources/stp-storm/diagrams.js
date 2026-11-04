/* ---------- diagrams for the Harbor Street LAN / STP document ---------- */
function dContext(){
  return svg(900,420,
   box(350,150,200,100,'Office LAN','teal','3 switches, 3 VLANs')+
   box(20,60,170,60,'Floor 1 and 2 hosts','blue','PCs, phones, AP')+box(20,290,170,60,'Network engineer','blue','SSH or console')+
   box(710,50,170,60,'Router and firewall','mute','Gateway')+box(710,140,170,60,'DHCP and DNS server','mute','Leases, names')+
   box(710,230,170,60,'Monitoring collector','mute','SNMP, syslog')+
   arrow(190,95,350,180,'blue','Frames, ARP, DHCP',false,-10,-8)+arrow(190,320,350,230,'blue','show commands',false,0,16)+
   arrow(550,170,710,80,'mute','Routed traffic',false,0,-6)+arrow(550,200,710,170,'mute','DHCP, DNS',false,0,-8)+
   arrow(550,230,710,260,'mute','Traps, logs',true,0,16)+
   label(450,330,'Boundary: host access ports in, router port out','mute')+
   label(450,400,'Level 1: System Context. Solid = user traffic. Dashed = supporting traffic.','mute'));
}
function dContainers(){
  return svg(900,420,
   group(150,60,740,230,'One switch: logical building blocks','blue')+
   box(20,130,110,50,'Frame in','mute')+
   box(170,120,140,70,'MAC learning','blue','source address to port')+
   box(340,120,150,70,'Forwarding decision','blue','known: one port, else flood')+
   box(520,120,150,70,'Port state gate','yellow','only forwarding passes')+
   box(710,130,150,50,'Frame out','mute')+
   box(340,230,150,50,'STP engine','teal','roles and states')+
   box(170,320,150,50,'BPDUs from neighbors','mute')+box(520,320,170,50,'Counters, syslog, SNMP','mute')+
   arrow(130,155,170,155,'blue')+arrow(310,155,340,155,'blue')+arrow(490,155,520,155,'blue')+arrow(670,155,710,155,'blue')+
   arrow(415,230,595,190,'teal','sets port states',false,30,-4)+arrow(245,320,360,280,'mute','',false)+arrow(520,345,440,285,'mute','',true)+
   label(450,40,'Level 3: Components. Teal path is the loop control.','mute'));
}
function dSequence(mode){
  const X=[70,260,450,640,830],N=['Host A','SW2','SW1 (root)','SW3','Host B'];
  const on=mode==='on';
  let s=X.map((x,i)=>box(x-60,10,120,34,N[i],i==2?'yellow':i==0||i==4?'mute':'blue')+`<line x1="${x}" y1="44" x2="${x}" y2="${on?330:430}" stroke="${C.line}" stroke-dasharray="4 4"/>`).join('');
  const msg=(y,a,b,t,col='blue',d=false)=>arrow(X[a],y,X[b],y,col,'',d)+label((X[a]+X[b])/2,y-6,t,'mute');
  s+=msg(75,0,1,'ARP broadcast')+msg(110,1,2,'flood (copy 1)')+msg(145,1,3,'flood (copy 2)','blue')+msg(180,2,3,'SW1 floods onward');
  if(on){
    s+=`<text x="${X[3]-8}" y="148" text-anchor="end" font-size="14" style="fill:${C.coral}">✗</text>`+label(X[3]-22,140,'blocked port discards copy 2','coral','end',11);
    s+=msg(215,3,4,'delivered once','teal',true);
    s+=label(450,265,'Copy 2 never gets forwarded. The frame ends here.','teal','middle',14)+
       label(450,295,'Blocked ports: no forwarding, no sending, no learning.','mute');
  }else{
    s+=msg(215,3,4,'delivered','teal',true);
    s+=msg(250,3,2,'SW3 floods it back','coral')+msg(285,3,1,'and to SW2','coral')+msg(320,2,3,'SW1 floods again','coral')+msg(355,1,2,'SW2 floods again','coral');
    s+=label(450,395,'No port ever refuses it. Two copies circle forever, one each way.','coral','middle',14)+label(450,420,'Every new broadcast adds two more permanent copies.','mute');
  }
  return svg(900,on?340:440,s);
}
function dDeploy(cut){
  const SW={1:[450,40],2:[110,230],3:[690,230]};
  const sw=(k,t,col,sub)=>box(SW[k][0],SW[k][1],140,56,t,col,sub);
  let s=sw(1,'SW1','yellow','Root bridge')+sw(2,'SW2','blue','Floor 1 access')+sw(3,'SW3','blue','Floor 2 access')+
   box(10,330,100,40,'Host A','mute')+box(790,330,100,40,'Host B','mute')+box(740,60,140,44,'Router','mute','Gateway');
  s+=arrow(160,330,160,286,'mute','',false)+arrow(790,350,780,286,'mute','',false);
  s+=arrow(590,68,740,82,'mute','',false);
  const chip=(x,y,t,col)=>`<rect x="${x-38}" y="${y-12}" width="76" height="20" rx="5" fill="#0f1220" stroke="${C[col]}"/>`+label(x,y+3,t,col,'middle',11);
  // SW1-SW2 link
  s+=arrow(450,90,220,235,'teal','',false)+chip(420,112,'DP forwarding','teal')+chip(240,215,'RP forwarding','blue');
  // SW2-SW3 link
  if(!cut){
    s+=arrow(250,262,690,262,'blue','',true)+chip(320,282,'DP forwarding','teal')+chip(620,282,'ALT blocked','coral');
    s+=arrow(520,90,720,235,'teal','',false)+chip(540,112,'DP forwarding','teal')+chip(700,215,'RP forwarding','blue');
    s+=label(450,330,'The blocked port holds the redundant link in reserve.','mute')+label(450,356,'It still listens to BPDUs, so it knows when to wake up.','mute');
  }else{
    s+=`<line x1="520" y1="90" x2="720" y2="235" stroke="${C.coral}" stroke-width="3"/><text x="620" y="170" text-anchor="middle" font-size="26" style="fill:${C.coral}">✗</text>`;
    s+=arrow(250,262,690,262,'teal','',false)+chip(320,282,'DP forwarding','teal')+chip(620,282,'RP forwarding','blue');
    s+=label(450,330,'After listening (15 s) and learning (15 s) the old blocked port forwards.','teal')+label(450,356,'Hosts behind SW3 were offline for about 30 seconds (classic 802.1D, direct failure).','mute');
  }
  s+=label(450,392,'DP = designated port, RP = root port, ALT = alternate (blocked). Level: Deployment.','mute');
  return svg(900,410,s);
}

/* ---------- storm simulator ---------- */
function simulator(el){
  const HOP=1.0, MS=400, CAP=36, MAXF=600;
  const NODE={SW1:{x:450,y:80},SW2:{x:190,y:270},SW3:{x:710,y:270}};
  const LK={L12:{a:'SW1',b:'SW2'},L13:{a:'SW1',b:'SW3'},L23:{a:'SW2',b:'SW3'}};
  const PORTS={SW1:['L12','L13'],SW2:['L12','L23'],SW3:['L13','L23']};
  const w=mkFig(`
  <div class="ctl">
    <span class="seg"><button data-s="off">STP off</button><button data-s="on" class="on">STP on</button></span>
    <button id="send">Send one broadcast from Host A</button>
    <label>Background broadcasts <input id="rate" type="range" min="0" max="2" step="0.1" value="0"> <b id="ratev">0 per s</b></label>
  </div>
  <div class="ctl"><button id="cut" class="danger">Cut link SW1 to SW3</button><button id="go">Pause</button><button id="rst">Reset</button><span style="color:var(--mute);font-size:13px">Time is slowed: 1 simulated second = 0.4 real seconds. Frame hop = 1 simulated second.</span></div>
  <svg id="simsvg" viewBox="0 0 900 400" role="img" aria-label="Three switches in a triangle. Dots are broadcast frames. Stats below report the result."></svg>
  <div class="legend"><span><i style="background:${C.blue}"></i>Broadcast frame in flight</span><span><i style="background:${C.coral}"></i>Blocked or cut</span><span><i style="background:${C.yellow}"></i>Listening or learning</span><span><i style="background:${C.teal}"></i>Forwarding</span></div>
  <div class="stats">
    <div class="stat"><b id="s-fr">0</b><span>Frames in flight</span></div>
    <div class="stat"><b id="s-ut">0%</b><span>Link load (toy scale)</span></div>
    <div class="stat"><b id="s-rx">0</b><span>Copies Host B received</span></div>
    <div class="stat"><b id="s-dup">0</b><span>Duplicate deliveries</span></div>
    <div class="stat"><b id="s-mv">0</b><span>MAC table moves</span></div>
    <div class="stat"><b id="s-out">-</b><span>Hosts behind SW3 offline</span></div>
  </div>
  <div id="ban" class="banner"></div>
  <figcaption class="cap">Teaching model. Each switch floods a broadcast out every forwarding port except the one it arrived on. Link load is frames in flight divided by an arbitrary capacity of ${CAP}. Classic 802.1D timers: 15 s listening, 15 s learning. Not a measurement of any real switch.</figcaption>`);
  el.replaceWith(w);
  const $=s=>w.querySelector(s),svgEl=$('#simsvg');
  let stp,simT,frames,bid,seen,rx,dup,moves,mac,ports,up,sent,drops,outageAt,outageLen,running=true,acc=0,last=null,nextId;
  function reset(){
    simT=0;frames=[];bid=0;seen=new Set();rx=0;dup=0;moves=0;mac={};sent=0;drops=[];outageAt=null;outageLen=null;acc=0;nextId=1;
    up={L12:true,L13:true,L23:true};
    ports={};for(const n in PORTS){ports[n]={};PORTS[n].forEach(l=>ports[n][l]={state:'forwarding',role:stp?'DP':'-',until:null})}
    if(stp){ports.SW2.L12.role='RP';ports.SW3.L13.role='RP';ports.SW3.L23={state:'blocked',role:'ALT',until:null}}
    $('#cut').disabled=false;$('#ban').className='banner';$('#ban').textContent='';
  }
  const pos=(n,l,f)=>{const a=NODE[n],b=NODE[l.a===n?l.b:l.a];return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}};
  function spawn(from,link,id){if(frames.length>=MAXF)return;const lk=LK[link];frames.push({id:nextId++,bid:id,link,from,to:lk.a===from?lk.b:lk.a,t0:simT})}
  function flood(n,except,id){PORTS[n].forEach(l=>{if(l===except||!up[l])return;if(stp&&ports[n][l].state!=='forwarding')return;spawn(n,l,id)})}
  function learn(n,port){if(mac[n]!==undefined&&mac[n]!==port)moves++;mac[n]=port}
  function deliver(n,id){if(n!=='SW3'&&n!=='SW2')return;const key=id+n;if(seen.has(key))dup++;else seen.add(key);if(n==='SW3')rx++}
  function arrive(f){
    const n=f.to,p=ports[n][f.link];
    if(stp&&p.state!=='forwarding'){if(p.state==='learning')learn(n,f.link);const q=pos(n,LK[f.link],0.15);drops.push({x:q.x,y:q.y,t:simT});return}
    learn(n,f.link);
    if(n==='SW2'){/* own broadcast came back to Host A */ if(f.bid>0){if(seen.has(f.bid+'A'))dup++;else seen.add(f.bid+'A');dup+=0}}
    deliver(n,f.bid);
    flood(n,f.link,f.bid);
  }
  function sendOne(){sent++;bid++;mac.SW2='H';seen.add(bid+'A');flood('SW2','H',bid)}
  function setStp(v){stp=v;w.querySelectorAll('[data-s]').forEach(b=>b.classList.toggle('on',(b.dataset.s==='on')===v));reset()}
  function cut(){
    up.L13=false;frames=frames.filter(f=>f.link!=='L13');$('#cut').disabled=true;
    if(stp){ports.SW3.L13={state:'down',role:'-',until:null};ports.SW1.L13={state:'down',role:'-',until:null};
      ports.SW3.L23={state:'listening',role:'RP',until:simT+15};outageAt=simT}
    else setBan('warn','Link cut with STP off. The loop is gone, so the storm drains away. Unplugging a cable is how many real storms get stopped.');
  }
  function tickStp(){
    const p=ports.SW3.L23;
    if(p.until!==null&&simT>=p.until){
      if(p.state==='listening'){p.state='learning';p.until=simT+15}
      else if(p.state==='learning'){p.state='forwarding';p.until=null;outageLen=simT-outageAt;
        setBan('good',`STP converged. The old blocked port is now the root port and forwards. Hosts behind SW3 were offline about ${Math.round(outageLen)} simulated seconds.`)}
    }
  }
  function setBan(k,t){const b=$('#ban');b.className='banner '+k;b.textContent=t}
  const roleCol=p=>p.state==='forwarding'?'teal':p.state==='blocked'||p.state==='down'?'coral':'yellow';
  function draw(){
    let s='';
    for(const l in LK){
      const a=NODE[LK[l].a],b=NODE[LK[l].b];
      const bl=(stp&&(ports[LK[l].a][l].state==='blocked'||ports[LK[l].b][l].state==='blocked'));
      s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${!up[l]?C.coral:bl?C.coral:C.line}" stroke-width="4" ${!up[l]||bl?'stroke-dasharray="8 6"':''}/>`;
      if(!up[l]){const m=pos(LK[l].a,LK[l],0.5);s+=`<text x="${m.x}" y="${m.y+9}" text-anchor="middle" font-size="26" style="fill:${C.coral}">✗</text>`}
    }
    s+=`<line x1="190" y1="270" x2="70" y2="350" stroke="${C.line}" stroke-width="3"/><line x1="710" y1="270" x2="830" y2="350" stroke="${C.line}" stroke-width="3"/>`;
    s+=box(10,340,120,44,'Host A','mute')+box(770,340,120,44,'Host B','mute');
    const nm={SW1:'SW1 (root)',SW2:'SW2',SW3:'SW3'};
    for(const n in NODE){const q=NODE[n];s+=box(q.x-60,q.y-26,120,52,nm[n],n==='SW1'?'yellow':'blue')}
    for(const n in PORTS)PORTS[n].forEach(l=>{
      const p=ports[n][l];if(!stp&&false)return;const q=pos(n,LK[l],0.27);
      const t=stp?`${p.role==='-'?'':p.role+' '}${p.state}`:'forwarding';const col=stp?roleCol(p):'teal';
      s+=`<rect x="${q.x-42}" y="${q.y-10}" width="84" height="19" rx="5" fill="#0f1220" stroke="${C[col]}"/><text x="${q.x}" y="${q.y+4}" text-anchor="middle" font-size="11" style="fill:${C[col]}">${t}</text>`});
    frames.forEach(f=>{const lk=LK[f.link];const pr=Math.min(1,(simT-f.t0)/HOP);const a=NODE[f.from],b=NODE[f.to];
      const off=((f.id%3)-1)*5,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      s+=`<circle cx="${a.x+dx*pr-dy/len*off}" cy="${a.y+dy*pr+dx/len*off}" r="5" fill="${C.blue}" opacity=".9"/>`});
    drops=drops.filter(d=>simT-d.t<1.2);
    drops.forEach(d=>{s+=`<text x="${d.x}" y="${d.y-12}" text-anchor="middle" font-size="22" style="fill:${C.coral}">✗</text>`});
    const ut=Math.min(1,frames.length/CAP);
    s+=`<rect x="300" y="360" width="300" height="16" rx="8" fill="#1e2340" stroke="${C.line}"/><rect x="300" y="360" width="${300*ut}" height="16" rx="8" fill="${ut<.5?C.teal:ut<1?C.yellow:C.coral}"/>`+label(450,352,'Link load','mute','middle',12);
    svgEl.innerHTML=s;
    $('#s-fr').textContent=frames.length;$('#s-ut').textContent=Math.round(ut*100)+'%';$('#s-rx').textContent=rx;$('#s-dup').textContent=dup;$('#s-mv').textContent=moves;
    const dn=stp&&outageAt!==null&&outageLen===null;
    $('#s-out').textContent=outageAt===null?'-':(outageLen!==null?Math.round(outageLen)+' s':Math.round(simT-outageAt)+' s so far');
    if(dn)setBan('warn',`Link cut. SW3's blocked port is ${ports.SW3.L23.state}. It cannot forward user frames yet, so Host B is unreachable.`);
    else if(!stp&&ut>=1&&up.L13&&up.L12&&up.L23)setBan('bad','Broadcast storm. Links are saturated and legitimate traffic cannot get through. Turn STP on, or cut a link to break the loop.');
    else if(!stp&&sent>0&&frames.length>0&&up.L13)setBan('warn',`Every copy keeps circling. No switch ever refuses it. ${frames.length} copies and counting. Each broadcast you send adds two permanent copies.`);
    else if(stp&&sent>0&&frames.length===0&&outageAt===null&&dup===0)setBan('good','The broadcast reached each host once and ended. The blocked port discarded the only extra copy.');
  }
  function frame(ts){
    if(last===null)last=ts;const dt=(ts-last)/MS;last=ts;
    if(running){simT+=dt;
      const rate=+$('#rate').value;if(rate>0){acc+=dt*rate;while(acc>=1){acc-=1;sendOne()}}
      const due=frames.filter(f=>simT-f.t0>=HOP);frames=frames.filter(f=>simT-f.t0<HOP);due.forEach(arrive);
      if(stp)tickStp();}
    draw();requestAnimationFrame(frame);
  }
  w.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>setStp(b.dataset.s==='on'));
  $('#send').onclick=sendOne;$('#cut').onclick=cut;
  $('#go').onclick=()=>{running=!running;$('#go').textContent=running?'Pause':'Resume'};
  $('#rst').onclick=()=>reset();
  $('#rate').oninput=()=>{$('#ratev').textContent=(+$('#rate').value)+' per s'};
  window.__sim={sendOne,cut,setStp,get frames(){return frames.length},get moves(){return moves},get dup(){return dup},get rx(){return rx},get outage(){return outageLen},get simT(){return simT},fast(sec){const n=Math.round(sec*20);for(let i=0;i<n;i++){simT+=0.05;const due=frames.filter(f=>simT-f.t0>=HOP);frames=frames.filter(f=>simT-f.t0<HOP);due.forEach(arrive);if(stp)tickStp()}}};
  setStp(true);requestAnimationFrame(frame);
}

function mount(q){
  staticFig(q('context'),dContext(),'C4 Level 1. One LAN, five neighbors.');
  staticFig(q('containers'),dContainers(),'Logical view of one switch. The port state gate is what makes STP work.');
  toggleFig(q('sequence'),[['STP off (loop)','off'],['STP on (SW3 port blocked)','on']],dSequence,'Process view of one ARP broadcast. Flip the toggle to see where the frame ends.');
  simulator(q('simulator'));
  toggleFig(q('deployment'),[['Normal operation',false],['After cutting SW1 to SW3',true]],dDeploy,'Physical view with spanning tree port roles. Flip the toggle for the failover end state.');
}
