/* ---------- diagrams ---------- */
function dContext(){
  return svg(900,440,
   box(350,170,200,100,'Ledgerline','teal','Payment ledger')+
   box(20,70,170,60,'Merchant app','blue','Client system')+box(20,300,170,60,'Ops engineer','blue','Person, via SSO')+
   box(710,30,170,60,'Identity provider','mute','OIDC')+box(710,120,170,60,'Card processor','mute','HTTPS REST')+
   box(710,210,170,60,'Bank settlement','mute','SFTP files')+box(710,300,170,60,'Monitoring and paging','mute','Metrics, alerts')+
   arrow(190,100,350,200,'blue','POST /v1/transfers',false,-10,-8)+arrow(190,330,350,250,'blue','Runbooks, approvals',false,0,16)+
   arrow(550,190,710,60,'mute','Token checks',true,0,-6)+arrow(550,200,710,150,'mute','Outbox calls',false,0,-8)+
   arrow(550,240,710,240,'mute','Batch files',false,0,-8)+arrow(550,260,710,330,'mute','Telemetry',true,0,14)+
   label(450,395,'Boundary: TLS termination in, processor and bank calls out','mute')+
   label(450,420,'Level 1: System Context. Solid = request path. Dashed = supporting traffic.','mute'));
}
function dContainers(){
  return svg(900,540,
   group(200,60,640,330,'Site A (primary)','blue')+group(200,405,640,115,'Site B (hot standby) and witness site','teal')+
   box(20,170,130,60,'Traffic manager','blue','DNS, health checks')+
   box(230,100,150,60,'API tier','blue','Stateless, N nodes')+
   box(430,100,170,60,'Ledger primary','yellow','PostgreSQL, single writer')+
   box(660,100,150,60,'Backup store','mute','Versioned objects')+
   box(230,230,150,60,'Failover manager','mute','Leader lease 10 s')+
   box(640,230,170,60,'Outbox worker','blue','At-least-once')+
   box(640,320,170,50,'Card processor','mute','External')+
   box(400,445,130,55,'DR-A standby','teal','Sync')+box(550,445,130,55,'DR-B standby','teal','Sync')+box(700,445,125,55,'Consensus','mute','3 voters, 1 at witness')+
   arrow(150,200,230,135,'blue','HTTPS',false,-6,-6)+arrow(380,130,430,130,'blue','SQL',false,0,-8)+
   arrow(470,160,465,445,'teal','',false)+arrow(560,160,615,445,'teal','',false)+
   label(520,335,'WAL stream','teal','middle',12)+label(520,351,'commit waits 1 of 2','teal','middle',12)+
   arrow(600,130,660,130,'mute','Backups',true,0,-8)+
   arrow(725,290,725,320,'mute','',false)+
   arrow(380,260,640,260,'mute','',true)+label(400,252,'','mute')+
   label(450,40,'Level 2: Containers. Teal = synchronous replication path. Yellow = single writer.','mute'));
}
function dSequence(mode){
  const X=[70,250,430,620,820],N=['Merchant','Traffic mgr','API','Primary DB','Standby (Site B)'];
  let s=X.map((x,i)=>box(x-62,10,124,34,N[i],i==3?'yellow':i==4?'teal':'blue')+`<line x1="${x}" y1="44" x2="${x}" y2="${mode==='sync'?470:400}" stroke="${C.line}" stroke-dasharray="4 4"/>`).join('');
  const msg=(y,a,b,t,col='blue',d=false)=>arrow(X[a],y,X[b],y,col,'',d)+label((X[a]+X[b])/2,y-6,t,'mute');
  s+=msg(75,0,1,'POST + Idempotency-Key')+msg(105,1,2,'route')+msg(135,2,3,'BEGIN, write rows, COMMIT');
  s+=`<rect x="${X[3]-10}" y="150" width="20" height="26" fill="${C.yellow}" opacity=".35"/>`+label(X[3]+18,168,'flush local disk','yellow','start',11);
  if(mode==='sync'){
    s+=msg(205,3,4,'stream log (one-way delay)','teal');
    s+=`<rect x="${X[4]-10}" y="215" width="20" height="26" fill="${C.teal}" opacity=".35"/>`+label(X[4]-18,233,'flush remote disk','teal','end',11);
    s+=msg(275,4,3,'ack (one-way delay back)','teal',true);
    s+=`<rect x="${X[3]-6}" y="175" width="12" height="108" fill="${C.coral}" opacity=".4"/>`+label(X[3]-14,260,'COMMIT blocked','coral','end',12);
    s+=msg(315,3,2,'commit complete','yellow',true)+msg(345,2,0,'201 Created (durable on two sites)','teal',true);
    s+=label(450,385,'Round trip is on the critical path of every commit.','coral')
     +label(450,410,'Outbox worker forwards to the processor later, off this path.','mute');
    s+=`<rect x="${X[3]-4}" y="205" width="${X[4]-X[3]+8}" height="0" />`;
  }else{
    s+=msg(215,3,2,'commit complete (no wait)','yellow',true)+msg(245,2,0,'201 Created (durable on one site only)','coral',true);
    s+=msg(300,3,4,'stream log later (lag)','mute',true)+`<rect x="${X[4]-10}" y="310" width="20" height="26" fill="${C.teal}" opacity=".35"/>`;
    s+=label(450,375,'Fast. But between 201 and the remote flush the promise rests on one site.','coral');
  }
  return svg(900,mode==='sync'?490:420,s);
}
function dDeploy(lost){const LOST_T=lost?'Routes to Site B':'Routes to Site A';
  const a=lost?'coral':'blue',b=lost?'yellow':'teal';
  let s=group(20,30,380,300,'Site A'+(lost?' (LOST)':' (active)'),a)+group(500,30,380,300,'Site B'+(lost?' (promoted)':' (hot standby)'),b)+group(320,360,260,110,'Witness site','mute');
  const dim=lost?'mute':'blue';
  s+=box(40,60,150,44,'API x3',dim)+box(40,120,150,44,lost?'Old primary (fenced)':'Ledger primary',lost?'coral':'yellow','',lost)+box(40,180,150,44,'Consensus node',dim)+box(40,240,150,44,'Backup agent','mute');
  s+=box(520,60,150,44,'API x3',lost?'teal':'mute')+box(520,120,150,44,lost?'DR-A: new primary':'DR-A standby',lost?'yellow':'teal')+box(520,180,150,44,lost?'DR-B follows':'DR-B standby','teal')+box(520,240,150,44,'Consensus node','blue');
  s+=box(690,60,170,44,'Traffic manager','blue',LOST_T)+box(690,120,170,44,'Backup bucket','mute','Third location');
  s+=box(350,395,200,50,'Consensus node','blue','Third vote');
  if(!lost){
    s+=arrow(190,142,520,142,'teal','Synchronous WAL (~100 km, ~1 ms RTT)',false,0,-8)+arrow(190,142,520,195,'teal','',false);
    s+=arrow(190,202,520,262,'blue','',true,0,0,true)+arrow(115,224,350,420,'blue','',true)+arrow(595,284,550,420,'blue','',true);
  }else{
    s+=`<line x1="40" y1="75" x2="380" y2="320" stroke="${C.coral}" stroke-width="3"/><line x1="380" y1="75" x2="40" y2="320" stroke="${C.coral}" stroke-width="3"/>`;
    s+=arrow(595,284,550,420,'blue','quorum: B + witness',true,105,22)+arrow(595,164,595,180,'yellow','',false);
    
    s+=label(450,352,'Lease expires ~10 s, quorum, fence, promote, shift traffic, reconcile','mute');
  }
  s+=label(450,490,lost?'After the failure: no acknowledged write lost, because every ack required Site B.':'Level: Deployment. Teal = synchronous replication. Dashed = consensus heartbeats.',lost?'teal':'mute');
  return svg(900,510,s);
}

/* ---------- simulator ---------- */
function simulator(el){
  const S=25; // real ms per simulated ms (slow motion)
  const INTERVAL=40, FLUSH=0.5;
  const w=mkFig(`
  <div class="ctl">
    <span class="seg"><button data-m="sync" class="on">Synchronous</button><button data-m="async">Asynchronous</button></span>
    <label>Distance <input id="dist" type="range" min="10" max="2000" value="100" step="10"> <b id="distv">100 km</b></label>
    <label>Async lag <input id="lag" type="range" min="0" max="200" value="80" step="10"> <b id="lagv">80 ms</b></label>
  </div>
  <div class="ctl"><button id="go">Pause</button><button id="boom" class="danger">Disaster: lose Site A</button><button id="rst">Reset</button><span class="m" style="color:var(--mute);font-size:13px">Slow motion: 1 simulated ms = ${S} real ms</span></div>
  <svg id="simsvg" viewBox="0 0 900 300" role="img" aria-label="Replication simulator animation. Stats below the animation report the result."></svg>
  <div class="legend"><span><i style="background:${C.teal}"></i>Acknowledged and on both sites</span><span><i style="background:${C.yellow}"></i>Acknowledged, only on Site A (at risk)</span><span><i style="background:${C.coral}"></i>Acknowledged, then lost</span><span><i style="background:#6b7299"></i>Not acknowledged (in flight)</span></div>
  <div class="stats">
    <div class="stat"><b id="s-rtt">-</b><span>Round trip (lower bound)</span></div>
    <div class="stat"><b id="s-lat">-</b><span>Commit latency seen by client</span></div>
    <div class="stat"><b id="s-tps">-</b><span>Max commits/s, one session</span></div>
    <div class="stat"><b id="s-acked">0</b><span>Acknowledged writes</span></div>
    <div class="stat"><b id="s-lost">0</b><span>Acknowledged writes lost</span></div>
  </div>
  <div id="ban" class="banner"></div>
  <figcaption class="cap">Teaching model. Fiber delay 5 µs per km one way, round trip = 0.01 ms per km, plus 0.5 ms flush at each end. Not a measurement of any real system.</figcaption>`);
  el.replaceWith(w);
  const $=s=>w.querySelector(s),svgEl=$('#simsvg');
  let mode='sync',writes,simT,last,running,dead,deadAt,nid;
  const XA=130,XB=770,Y=110;
  function reset(){writes=[];simT=0;last=null;running=true;dead=false;deadAt=null;nid=1;$('#go').textContent='Pause';$('#boom').disabled=false;$('#ban').className='banner';$('#ban').textContent='';stats()}
  const km=()=>+$('#dist').value, lag=()=>+$('#lag').value;
  const ow=()=>km()*0.005, rtt=()=>km()*0.01;
  function stats(){
    $('#s-rtt').textContent=rtt().toFixed(1)+' ms';
    const lat=mode==='sync'?rtt()+2*FLUSH:FLUSH;
    $('#s-lat').textContent=lat.toFixed(1)+' ms';
    $('#s-tps').textContent=Math.floor(1000/lat).toLocaleString();
    $('#distv').textContent=km()+' km';$('#lagv').textContent=lag()+' ms';
    $('#lagv').parentElement.style.opacity=mode==='async'?1:.4;
  }
  function addWrite(){
    const t0=simT,o=ow();
    let standbyAt,ackAt;
    if(mode==='sync'){standbyAt=t0+FLUSH+o+FLUSH;ackAt=standbyAt+o}
    else{ackAt=t0+FLUSH;standbyAt=t0+FLUSH+lag()+o+FLUSH}
    writes.push({id:nid++,t0,ackAt,standbyAt,mode,o,lost:false});
    if(writes.length>14)writes.shift();
  }
  function state(wr){
    if(dead){
      if(wr.ackAt<=deadAt&&wr.standbyAt>deadAt)return'lost';
      if(wr.ackAt>deadAt)return'unacked';
    }
    if(simT<wr.ackAt)return'unacked';
    return simT>=wr.standbyAt?'safe':'risk';
  }
  const colr={safe:C.teal,risk:C.yellow,lost:C.coral,unacked:'#6b7299'};
  let ackedTotal=0,lostTotal=0,counted=new Set();
  function draw(){
    let s=`<rect x="40" y="40" width="180" height="140" rx="12" fill="${C.fill}" stroke="${dead?C.coral:C.yellow}" stroke-width="2"/>`+
      `<rect x="680" y="40" width="180" height="140" rx="12" fill="${C.fill}" stroke="${C.teal}" stroke-width="2"/>`+
      label(130,62,dead?'Site A (LOST)':'Site A: primary',dead?'coral':'yellow','middle',14)+label(770,62,'Site B: standby','teal','middle',14)+
      `<line x1="${XA+90}" y1="${Y}" x2="${XB-90}" y2="${Y}" stroke="${C.line}" stroke-width="3" stroke-dasharray="${dead?'3 6':'0'}"/>`+
      label(450,Y-14,km()+' km of fiber, one way '+ow().toFixed(2)+' ms','mute');
    if(dead)s+=`<line x1="45" y1="45" x2="215" y2="175" stroke="${C.coral}" stroke-width="4"/><line x1="215" y1="45" x2="45" y2="175" stroke="${C.coral}" stroke-width="4"/>`;
    // ledger chips
    writes.forEach((wr,i)=>{
      const st=state(wr);
      const cx=55+(i%7)*24, cy=82+Math.floor(i/7)*30;
      s+=`<rect x="${cx}" y="${cy}" width="20" height="22" rx="4" fill="${colr[st]=== '#6b7299'?'none':colr[st]}" stroke="${colr[st]}" stroke-width="2"/>`;
      const onB=simT>=wr.standbyAt&&!(dead&&wr.standbyAt>deadAt);
      const bx=695+(i%7)*24,by=82+Math.floor(i/7)*30;
      s+=onB?`<rect x="${bx}" y="${by}" width="20" height="22" rx="4" fill="${C.teal}"/>`:`<rect x="${bx}" y="${by}" width="20" height="22" rx="4" fill="none" stroke="${C.line}" stroke-dasharray="3 3"/>`;
      // packets
      const sendStart=wr.t0+FLUSH, arrive=wr.standbyAt-FLUSH;
      const lim=dead?deadAt:simT;
      const pos=(t0,t1,t,fromA)=>{const p=Math.min(1,Math.max(0,(t-t0)/(t1-t0||1)));return fromA?XA+90+p*(XB-XA-180):XB-90-p*(XB-XA-180)};
      const fwdStart=wr.mode==='sync'?sendStart:sendStart+lag();
      if(simT>=fwdStart&&simT<arrive&&!(dead&&fwdStart>deadAt)){const px=dead&&simT>deadAt?pos(fwdStart,arrive,deadAt,true):pos(fwdStart,arrive,simT,true);s+=`<circle cx="${px}" cy="${Y+(i%3-1)*8}" r="6" fill="${C.blue}"/>`}
      if(wr.mode==='sync'&&simT>=wr.standbyAt&&simT<wr.ackAt&&!dead){s+=`<circle cx="${pos(wr.standbyAt,wr.ackAt,simT,false)}" cy="${Y+(i%3-1)*8}" r="5" fill="${C.teal}"/>`}
    });
    // client ack indicator
    s+=label(130,205,'Client sees 201 after:','mute','middle',12)+label(130,226,(mode==='sync'?(rtt()+2*FLUSH).toFixed(1):FLUSH.toFixed(1))+' ms',mode==='sync'?'coral':'teal','middle',20);
    s+=label(770,205,dead?'Promoted copy holds:':'Standby holds:','mute','middle',12)+label(770,226,writes.filter(x=>simT>=x.standbyAt&&!(dead&&x.standbyAt>deadAt)).length+' of '+writes.length+' recent writes','teal','middle',16);
    s+=label(450,270,'Blue = log streaming to Site B. Teal = acknowledgment returning (sync only).','mute');
    svgEl.innerHTML=s;
  }
  function tally(){
    let a=0,l=0;
    // full-history counters
    writes.forEach(wr=>{if(!counted.has(wr.id+':a')&&simT>=wr.ackAt&&!(dead&&wr.ackAt>deadAt)){counted.add(wr.id+':a');ackedTotal++}});
    $('#s-acked').textContent=ackedTotal;$('#s-lost').textContent=lostTotal;
  }
  function boom(){
    if(dead)return;dead=true;deadAt=simT;
    const lostNow=writes.filter(wr=>wr.ackAt<=deadAt&&wr.standbyAt>deadAt);
    lostTotal+=lostNow.length;
    const unacked=writes.filter(wr=>wr.ackAt>deadAt).length;
    const onB=writes.filter(wr=>wr.standbyAt<=deadAt);
    const win=onB.length?(deadAt-Math.max(...onB.map(x=>x.standbyAt))):deadAt;
    const ban=$('#ban');
    if(lostNow.length===0){ban.className='banner good';ban.textContent=`Zero acknowledged writes lost. ${unacked} in-flight write${unacked===1?'':'s'} were never acknowledged, so those merchants retry with the same idempotency key. RPO = 0.`}
    else{ban.className='banner bad';ban.textContent=`${lostNow.length} acknowledged write${lostNow.length===1?'':'s'} lost. Merchants were told "success" and the data is gone. Newest write on Site B was ${win.toFixed(0)} ms old at failure, so RPO here is about ${Math.max(win,lag()).toFixed(0)} ms, not zero.`}
    $('#boom').disabled=true;tally();
  }
  let acc=0;
  function frame(ts){
    if(last===null)last=ts;
    const dt=(ts-last)/S;last=ts;
    if(running&&!dead){simT+=dt;acc+=dt;while(acc>=INTERVAL){acc-=INTERVAL;addWrite()}}
    if(!dead){tally()}
    draw();requestAnimationFrame(frame);
  }
  w.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;w.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));stats()});
  $('#dist').oninput=stats;$('#lag').oninput=stats;
  $('#go').onclick=()=>{running=!running;$('#go').textContent=running?'Pause':'Resume'};
  $('#boom').onclick=boom;
  $('#rst').onclick=()=>{counted=new Set();ackedTotal=0;lostTotal=0;acc=0;reset()};
  window.__sim={get dead(){return dead},boom,setMode:m=>w.querySelector(`[data-m=${m}]`).click(),get lost(){return lostTotal},get simT(){return simT}};
  reset();requestAnimationFrame(frame);
}


function mount(q){
  staticFig(q('context'),dContext(),'C4 Level 1. One system, six neighbors.');
  staticFig(q('containers'),dContainers(),'C4 Level 2. Teal path is what makes RPO zero.');
  toggleFig(q('sequence'),[['Synchronous commit','sync'],['Asynchronous commit','async']],dSequence,'Process view of one transfer. Flip the toggle to see where the acknowledgment moves.');
  simulator(q('simulator'));
  toggleFig(q('deployment'),[['Normal operation',false],['Lose Site A',true]],dDeploy,'Deployment view. Flip the toggle to watch the failover end state.');
}
