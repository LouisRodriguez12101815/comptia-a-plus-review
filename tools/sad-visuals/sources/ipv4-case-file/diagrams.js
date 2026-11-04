/* ---------- diagrams for Case File 1.7: IPv4 addressing ---------- */
function dStrata(){
  const rows=[
    ['2011','Pool exhausted, IPv6','Free IPv4 blocks ran out','teal'],
    ['1994-96','NAT and RFC 1918','End-to-end addressing lost','yellow'],
    ['1993','CIDR and VLSM','Pool still finite','blue'],
    ['1985','Subnetting','One fixed mask wastes space','blue'],
    ['1981','Classful addresses','Class B for 400 hosts','coral']
  ];
  let s=label(450,26,'Newest layer on top. Each layer is a patch for the one beneath it.','mute','middle',13);
  rows.forEach((r,i)=>{
    const y=44+i*66,col=r[3];
    s+=`<rect x="20" y="${y}" width="860" height="56" rx="8" fill="${C.fill}" stroke="${C[col]}" stroke-width="2"/>`;
    s+=label(40,y+34,r[0],col,'start',16)+label(160,y+34,r[1],'#e8ebf7','start',15);
    s+=`<text x="560" y="${y+22}" font-size="11" style="fill:${C.mute}">What it broke or left open</text>`+label(560,y+42,r[2],'coral','start',14);
    if(i<4)s+=arrow(450,y+56,450,y+66,col,'',false);
  });
  return svg(900,390,s);
}

/* ---------- allocation stress test ---------- */
function allocation(el){
  const names=['Warehouse','Office','Guest Wi-Fi','Phones','WAN link A','WAN link B'];
  const w=mkFig(`
  <div class="ctl"><span class="seg"><button data-m="class">Classful</button><button data-m="flsm">One fixed mask</button><button data-m="vlsm" class="on">VLSM</button></span></div>
  <div class="ctl" id="inputs"></div>
  <svg id="alsvg" viewBox="0 0 900 190" role="img" aria-label="Address blocks drawn to scale. Filled part is hosts in use, hollow part is wasted."></svg>
  <div class="stats">
    <div class="stat"><b id="a-alloc">-</b><span>Addresses allocated</span></div>
    <div class="stat"><b id="a-used">-</b><span>Hosts in use</span></div>
    <div class="stat"><b id="a-eff">-</b><span>Efficiency</span></div>
    <div class="stat"><b id="a-sites">-</b><span>Sites like this that fit in one /16</span></div>
  </div>
  <div class="tw"><table id="altable"></table></div>
  <div id="ban" class="banner"></div>
  <figcaption class="cap">Teaching model. Classful: a segment takes a whole Class C (254 hosts) or, if too big, a whole Class B (65,534 hosts). One fixed mask: every segment gets the block the largest segment needs. VLSM: each segment gets the smallest power-of-two block that holds its hosts plus the network and broadcast addresses. The default host counts are invented.</figcaption>`);
  el.replaceWith(w);
  const $=s=>w.querySelector(s);
  let mode='vlsm',hosts=[400,90,28,12,2,2];
  const inp=$('#inputs');
  hosts.forEach((h,i)=>{const l=document.createElement('label');l.innerHTML=`${names[i]} <input type="number" min="1" max="60000" value="${h}" style="width:76px;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:4px 6px">`;
    l.querySelector('input').oninput=e=>{hosts[i]=Math.max(1,Math.min(60000,+e.target.value||1));draw()};inp.appendChild(l)});
  const bitsFor=n=>Math.max(2,Math.ceil(Math.log2(n+2)));
  function blocks(){
    if(mode==='vlsm')return hosts.map(h=>{const b=bitsFor(h);return {size:Math.pow(2,b),prefix:32-b}});
    if(mode==='flsm'){const b=bitsFor(Math.max(...hosts));return hosts.map(()=>({size:Math.pow(2,b),prefix:32-b}))}
    return hosts.map(h=>h<=254?{size:256,prefix:24}:h<=65534?{size:65536,prefix:16}:{size:16777216,prefix:8});
  }
  const fmt=n=>n.toLocaleString();
  function draw(){
    const bl=blocks(),total=bl.reduce((a,b)=>a+b.size,0),used=hosts.reduce((a,b)=>a+b,0);
    let s=label(450,18,'Blocks drawn to scale. Filled = hosts in use. Hollow = wasted. Width = '+fmt(total)+' addresses.','mute','middle',12);
    let x=20;const W=860;
    bl.forEach((b,i)=>{
      const bw=Math.max(2,W*b.size/total),uw=Math.min(bw,Math.max(1.5,W*hosts[i]/total));
      s+=`<rect x="${x}" y="40" width="${bw-1}" height="60" fill="none" stroke="${C.coral}" stroke-width="1.5"/>`;
      s+=`<rect x="${x}" y="40" width="${uw}" height="60" fill="${C.teal}"/>`;
      if(bw>60)s+=label(x+bw/2,120,names[i],'mute','middle',11)+label(x+bw/2,136,'/'+b.prefix,'yellow','middle',12);
      x+=bw;
    });
    s+=label(450,175,mode==='class'?'A Class B swallowed the warehouse. The other blocks are slivers.':mode==='flsm'?'Every segment got the warehouse-sized block, including the 2-host WAN links.':'Largest block first. The WAN links get a /30 each.','mute','middle',13);
    $('#alsvg').innerHTML=s;
    $('#a-alloc').textContent=fmt(total);$('#a-used').textContent=fmt(used);
    const eff=100*used/total;$('#a-eff').textContent=(eff<10?eff.toFixed(2):eff.toFixed(1))+'%';
    const sites=Math.floor(65536/total);$('#a-sites').textContent=sites===0?'0 (needs its own Class B)':fmt(sites);
    let t='<thead><tr><th>Segment</th><th>Hosts</th><th>Prefix</th><th>Block</th><th>Usable</th><th>Wasted</th></tr></thead><tbody>';
    bl.forEach((b,i)=>{t+=`<tr><td>${names[i]}</td><td>${fmt(hosts[i])}</td><td>/${b.prefix}</td><td>${fmt(b.size)}</td><td>${fmt(b.size-2)}</td><td>${fmt(Math.max(0,b.size-2-hosts[i]))}</td></tr>`});
    $('#altable').innerHTML=t+'</tbody>';
    const ban=$('#ban');
    if(mode==='class'){ban.className='banner bad';ban.textContent=`Classful: ${fmt(total)} addresses spent to serve ${fmt(used)} hosts. Efficiency ${eff.toFixed(2)}%. This is the waste that drained the Class B pool.`}
    else if(mode==='flsm'){ban.className='banner warn';ban.textContent=`One mask for everything: ${fmt(total)} addresses for ${fmt(used)} hosts. Only ${sites} copies of this site fit in a /16.`}
    else{ban.className='banner good';ban.textContent=`VLSM: ${fmt(total)} addresses for ${fmt(used)} hosts. ${sites} copies of this site fit in a /16, against ${Math.floor(65536/(Math.pow(2,bitsFor(Math.max(...hosts)))*hosts.length))} with one fixed mask.`}
  }
  w.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;w.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));draw()});
  window.__alloc={setMode:m=>w.querySelector(`[data-m=${m}]`).click(),get stats(){return {alloc:$('#a-alloc').textContent,used:$('#a-used').textContent,eff:$('#a-eff').textContent,sites:$('#a-sites').textContent}}};
  draw();
}

/* ---------- NAT / PAT table stress ---------- */
function natSim(el){
  const CAP=64512; // ports 1024 to 65535, per public address (assumed)
  const w=mkFig(`
  <div class="ctl">
    <label>Inside hosts <input id="nh" type="range" min="1" max="3000" value="40"> <b id="nhv">40</b></label>
    <label>Connections per host <input id="nc" type="range" min="1" max="100" value="10"> <b id="ncv">10</b></label>
  </div>
  <div class="ctl">
    <label><input id="pf" type="checkbox"> Port-forward rule for 192.168.1.20 port 443</label>
    <label><input id="dn" type="checkbox"> Second NAT layer in front (double NAT)</label>
  </div>
  <svg id="natsvg" viewBox="0 0 900 250" role="img" aria-label="Inside hosts share one public address through a translation table. Stats below report table use."></svg>
  <div class="stats">
    <div class="stat"><b id="n-rows">-</b><span>Translation rows needed</span></div>
    <div class="stat"><b id="n-cap">64,512</b><span>Source ports on one public address (assumed)</span></div>
    <div class="stat"><b id="n-load">-</b><span>Table load</span></div>
    <div class="stat"><b id="n-in">-</b><span>Inbound probe to 192.168.1.20:443</span></div>
  </div>
  <div class="tw"><table id="nattable"></table></div>
  <div id="nban" class="banner"></div>
  <figcaption class="cap">Teaching model. One public address from the documentation range 203.0.113.0/24, one protocol, and about 64,512 usable source ports (1024 to 65535). Real devices vary: they may reuse a port for different destinations, expire idle rows quickly, or hold several public addresses. Not a measurement of any device.</figcaption>`);
  el.replaceWith(w);
  const $=s=>w.querySelector(s);
  function draw(){
    const h=+$('#nh').value,c=+$('#nc').value,rows=h*c,load=rows/CAP,pf=$('#pf').checked,dn=$('#dn').checked;
    $('#nhv').textContent=h;$('#ncv').textContent=c;
    const ok=Math.min(1,load);
    let s=group(20,30,250,190,'Inside (private)','blue')+group(640,30,240,190,'Internet (public)','teal');
    for(let i=0;i<Math.min(8,h);i++)s+=`<rect x="${40+(i%4)*52}" y="${60+Math.floor(i/4)*36}" width="40" height="26" rx="5" fill="${C.fill}" stroke="${C.blue}"/>`;
    s+=label(145,150,'192.168.1.x','blue','middle',12)+label(145,170,h+' hosts','mute','middle',12);
    s+=box(330,80,170,64,'NAT / PAT device','yellow','translation table');
    if(dn)s+=box(540,80,80,64,'NAT 2','coral','');
    s+=box(670,80,180,64,'203.0.113.5','teal','one public address');
    s+=arrow(270,112,330,112,'blue','',false)+arrow(500,112,dn?540:670,112,'teal','',false)+(dn?arrow(620,112,670,112,'teal','',false):'');
    s+=`<rect x="330" y="170" width="300" height="16" rx="8" fill="#1e2340" stroke="${C.line}"/><rect x="330" y="170" width="${300*ok}" height="16" rx="8" fill="${load<.5?C.teal:load<1?C.yellow:C.coral}"/>`+label(480,164,'Table load','mute','middle',12);
    s+=label(480,210,pf?'Forward rule present: inbound 443 maps to the printer inside.':'No row, no rule: an inbound packet has nowhere to go.',pf?'teal':'coral','middle',12);
    $('#natsvg').innerHTML=s;
    $('#n-rows').textContent=rows.toLocaleString();$('#n-load').textContent=Math.round(load*100)+'%';
    $('#n-in').textContent=pf?(dn?'Dropped at NAT 2':'Delivered'):'Dropped';
    let t='<thead><tr><th>Inside address:port</th><th>Translated to</th></tr></thead><tbody>';
    for(let i=0;i<Math.min(5,rows);i++){const hh=1+(i%h),p=1024+i;t+=`<tr><td>192.168.1.${hh+9}:${49152+i}</td><td>203.0.113.5:${p}</td></tr>`}
    $('#nattable').innerHTML=t+(rows>5?'<tr><td colspan="2" style="color:var(--mute)">... '+(rows-5).toLocaleString()+' more rows</td></tr>':'')+'</tbody>';
    const ban=$('#nban');
    if(load>1){ban.className='banner bad';ban.textContent=`Port exhaustion. ${rows.toLocaleString()} conversations need rows and the table has about ${CAP.toLocaleString()}. New connections time out while old ones keep working. Add public addresses, shorten idle timers, or cut the connection count.`}
    else if(dn&&pf){ban.className='banner warn';ban.textContent='Double NAT. The first device forwards, the second never saw a rule. Inbound still dies. Forwarding has to exist on every NAT in the path.'}
    else if(!pf){ban.className='banner warn';ban.textContent='Outbound works. Inbound is dropped. Hiding the inside was a side effect of translation, not a security design.'}
    else{ban.className='banner good';ban.textContent='One public address is serving the whole inside, and the forwarding rule makes the printer reachable from outside.'}
  }
  w.querySelectorAll('input').forEach(i=>i.oninput=draw);
  w.querySelectorAll('input[type=checkbox]').forEach(i=>i.onchange=draw);
  window.__nat={set(h,c,pf,dn){$('#nh').value=h;$('#nc').value=c;$('#pf').checked=pf;$('#dn').checked=dn;draw()},get load(){return $('#n-load').textContent},get inbound(){return $('#n-in').textContent},get banner(){return $('#nban').textContent}};
  draw();
}

function mount(q){
  staticFig(q('strata'),dStrata(),'The strata of IPv4 addressing. Every layer is a scar from the failure beneath it.');
  allocation(q('allocation'));
  natSim(q('nat'));
}
