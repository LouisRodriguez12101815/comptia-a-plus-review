const C={blue:'#58a6ff',teal:'#3ddbb0',yellow:'#ffd166',coral:'#ff6b6b',line:'#3a4270',mute:'#9aa3c7',fill:'#1e2340'};

/* ---------- mini markdown ---------- */
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const inl=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
function md(src){
  const L=src.split('\n');let out=[],i=0,slug=[];
  while(i<L.length){
    const l=L[i];
    let m;
    if(!l.trim()){i++;continue}
    if((m=l.match(/^<!--diagram:(\w+)-->/))){out.push(`<div data-diagram="${m[1]}"></div>`);i++;continue}
    if((m=l.match(/^(#{1,4}) (.*)/))){const n=m[1].length,id='s'+slug.length;slug.push({n,t:m[2],id});out.push(`<h${n} id="${id}">${inl(m[2])}</h${n}>`);i++;continue}
    if(l.startsWith('|')){const rows=[];while(i<L.length&&L[i].startsWith('|')){rows.push(L[i]);i++}
      const cells=r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      const h=cells(rows[0]);let t='<div class="tw"><table><thead><tr>'+h.map(c=>`<th>${inl(c)}</th>`).join('')+'</tr></thead><tbody>';
      rows.slice(2).forEach(r=>{t+='<tr>'+cells(r).map(c=>`<td>${inl(c)}</td>`).join('')+'</tr>'});
      out.push(t+'</tbody></table></div>');continue}
    if(l.startsWith('>')){const b=[];while(i<L.length&&L[i].startsWith('>')){b.push(L[i].replace(/^>\s?/,''));i++}out.push(`<blockquote>${inl(b.join(' '))}</blockquote>`);continue}
    if(/^\d+\. /.test(l)){let t='<ol>';while(i<L.length&&/^\d+\. /.test(L[i])){t+=`<li>${inl(L[i].replace(/^\d+\. /,''))}</li>`;i++}out.push(t+'</ol>');continue}
    if(l.startsWith('- ')){let t='<ul>';
      while(i<L.length&&L[i].startsWith('- ')){t+=`<li>${inl(L[i].slice(2))}`;i++;
        if(i<L.length&&/^\s+\d+\. /.test(L[i])){t+='<ol>';while(i<L.length&&/^\s+\d+\. /.test(L[i])){t+=`<li>${inl(L[i].replace(/^\s+\d+\. /,''))}</li>`;i++}t+='</ol>'}
        t+='</li>'}
      out.push(t+'</ul>');continue}
    out.push(`<p>${inl(l)}</p>`);i++;
  }
  return {html:out.join('\n'),slug};
}

/* ---------- svg helpers ---------- */
const svg=(w,h,inner)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Diagram. The caption below explains it." xmlns="http://www.w3.org/2000/svg"><defs>${['blue','teal','yellow','coral','mute'].map(k=>`<marker id="ar-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C[k]}"/></marker>`).join('')}</defs>${inner}</svg>`;
const box=(x,y,w,h,t,col='blue',sub='',dash=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.fill}" stroke="${C[col]}" stroke-width="2" ${dash?'stroke-dasharray="6 4"':''}/><text x="${x+w/2}" y="${y+h/2+(sub?-2:5)}" text-anchor="middle" font-size="14" font-weight="600">${t}</text>${sub?`<text class="m" x="${x+w/2}" y="${y+h/2+15}" text-anchor="middle" font-size="11">${sub}</text>`:''}`;
const arrow=(x1,y1,x2,y2,col='blue',lab='',dash=false,lx=0,ly=-6,both=false)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[col]}" stroke-width="2" ${dash?'stroke-dasharray="6 4"':''} marker-end="url(#ar-${col})" ${both?`marker-start="url(#ar-${col})"`:''}/>${lab?`<text class="m" x="${(x1+x2)/2+lx}" y="${(y1+y2)/2+ly}" text-anchor="middle" font-size="11">${lab}</text>`:''}`;
const label=(x,y,t,col='mute',a='middle',s=12)=>`<text x="${x}" y="${y}" text-anchor="${a}" font-size="${s}" fill="${C[col]||col}" style="fill:${C[col]||col}">${t}</text>`;
const group=(x,y,w,h,t,col='mute')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="${C[col]}" stroke-width="1.5" stroke-dasharray="4 4"/>${label(x+12,y+20,t,col,'start',13)}`;

/* ---------- toggle wrapper ---------- */
function toggleFig(el,btns,render,cap){
  const wrap=mkFig(`<div class="ctl"><span class="seg"></span></div><div class="canvas"></div><figcaption class="cap">${cap}</figcaption>`);
  const seg=wrap.querySelector('.seg'),cv=wrap.querySelector('.canvas');
  btns.forEach((b,i)=>{const e=document.createElement('button');e.textContent=b[0];e.onclick=()=>{[...seg.children].forEach(x=>x.classList.remove('on'));e.classList.add('on');cv.innerHTML=render(b[1])};seg.appendChild(e);if(i===0)e.click()});
  el.replaceWith(wrap);
}
function mkFig(inner){const h=document.createElement('div');h.innerHTML='<figure class="fig">'+inner+'</figure>';return h.firstChild}
function staticFig(el,html,cap){el.replaceWith(mkFig(html+`<figcaption class="cap">${cap}</figcaption>`))}

/* ---------- boot: runs after the per-document diagrams file defines mount(q) ---------- */
function bootSad(){
  const doc=document.getElementById('doc');
  try{
    const {html,slug}=md(window.SAD_MD);
    doc.innerHTML=html;
    const back=window.SAD_BACK?`<a class="h2" href="${window.SAD_BACK.href}" target="_top">${esc(window.SAD_BACK.label)}</a>`:'';
    document.getElementById('nav').innerHTML=back+'<b style="display:block;margin-top:14px;font-size:13px;color:var(--text)">Contents</b>'+slug.filter(s=>s.n===2||s.n===3).map(s=>`<a class="${s.n===2?'h2':''}" href="#${s.id}">${esc(s.t)}</a>`).join('');
    mount(n=>doc.querySelector(`[data-diagram=${n}]`));
  }catch(err){doc.innerHTML='<p style="color:#ff6b6b">Could not render this document: '+esc(String(err.message||err))+'</p>'}
}
