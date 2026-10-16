// Hype Games shared runtime: input (keyboard, touch, Gamepad API), audio, saves, UI chrome, pause.
(function(){
const HG=window.HG={keys:{},pad:{},touch:{},paused:false,onPress:null,onPause:null,axes:[0,0]};
const KM={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',' ':'a',z:'a',x:'b',Enter:'a',Escape:'start',p:'start'};
addEventListener('keydown',e=>{const k=KM[e.key];if(!k)return;e.preventDefault();if(!HG.keys[k])press(k);HG.keys[k]=true});
addEventListener('keyup',e=>{const k=KM[e.key];if(k)HG.keys[k]=false});
function press(k){if(HG.inTitle){if(k=='a'&&HG._go)HG._go();else HG.titleNav&&HG.titleNav(k);return}if(k=='start'){HG.togglePause();return}if(HG.paused){menuNav(k);return}HG.onPress&&HG.onPress(k)}
HG.held=k=>!!(HG.keys[k]||HG.pad[k]||HG.touch[k]);
let prev={};
function poll(){const ps=navigator.getGamepads?navigator.getGamepads():[];const s={};HG.axes=[0,0];
 for(const p of ps){if(!p)continue;const b=i=>p.buttons[i]&&p.buttons[i].pressed;const ax=p.axes||[];
  const x=Math.abs(ax[0])>.25?ax[0]:0,y=Math.abs(ax[1])>.25?ax[1]:0;if(x||y)HG.axes=[x,y];
  s.left=s.left||b(14)||x<-.5;s.right=s.right||b(15)||x>.5;s.up=s.up||b(12)||y<-.5;s.down=s.down||b(13)||y>.5;
  s.a=s.a||b(0)||b(7);s.b=s.b||b(1)||b(2);s.start=s.start||b(9)||b(8);}
 for(const k in s){if(s[k]&&!prev[k])press(k)}prev=s;HG.pad=s;requestAnimationFrame(poll)}
poll();
// Touch buttons: HG.touchButtons([{k:'left',label:'◀',style:'left:20px;bottom:20px'}])
HG.touchButtons=list=>{const w=document.createElement('div');w.className='tbtns';list.forEach(o=>{const b=document.createElement('button');b.className='tbtn';b.textContent=o.label;b.style.cssText=(o.style||'').replace(/(left|right|bottom):(\d+)px/g,(m,p,v)=>p+':calc('+v+'px*var(--ts) + var(--s'+p[0]+'))').replace(/(\d+)px(?!\*)/g,(m,v)=>'calc('+v+'px*var(--ts))');
 const dn=e=>{e.preventDefault();if(!HG.touch[o.k])press(o.k);HG.touch[o.k]=true},up=e=>{e.preventDefault();HG.touch[o.k]=false};
 b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up);w.appendChild(b)});document.getElementById('stage').appendChild(w)};
// Audio: tiny procedural synth (original sounds, no external files)
let ac;HG.sfx=t=>{try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();HG.ac=ac;if(ac.state=="suspended")ac.resume();
 const P={jump:[440,880,.12,'square'],coin:[988,1319,.1,'square'],shoot:[880,220,.07,'sawtooth'],hit:[200,60,.2,'sawtooth'],boom:[120,30,.4,'noise'],power:[523,1047,.3,'triangle'],level:[523,1568,.5,'triangle'],click:[660,660,.04,'square'],pop:[300,700,.08,'sine']}[t];if(!P)return;
 const now=ac.currentTime,g=ac.createGain();g.gain.setValueAtTime(.15,now);g.gain.exponentialRampToValueAtTime(.001,now+P[2]);g.connect(ac.destination);
 if(P[3]=='noise'){const n=ac.createBufferSource(),bf=ac.createBuffer(1,ac.sampleRate*P[2],ac.sampleRate),d=bf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=bf;n.connect(g);n.start()}
 else{const o=ac.createOscillator();o.type=P[3];o.frequency.setValueAtTime(P[0],now);o.frequency.exponentialRampToValueAtTime(P[1],now+P[2]);o.connect(g);o.start();o.stop(now+P[2])}}catch(e){}};
// Saves
HG.best=g=>+localStorage.getItem('hg_best_'+g)||0;
HG.save=(g,s)=>{if(s>HG.best(g))localStorage.setItem('hg_best_'+g,s);return HG.best(g)};
HG.get=(k,d)=>{try{return JSON.parse(localStorage.getItem('hg_'+k))??d}catch(e){return d}};HG.set=(k,v)=>localStorage.setItem('hg_'+k,JSON.stringify(v));
// Chrome + pause menu
HG.chrome=title=>{document.body.insertAdjacentHTML('afterbegin','<div class="warn">⚠ Play only while parked. Never use while driving.</div><div class="bar"><a class="hbtn" href="../index.html">⌂ Home</a><b>'+title+'</b><button class="hbtn" id="pbtn">❚❚ Pause</button></div><div id="stage"></div><div id="pause" class="ov"><div class="menu"><h2>Paused</h2><button data-a="resume">Resume</button><button data-a="restart">Restart</button><button data-a="home">Home</button></div></div>');
 document.body.insertAdjacentHTML('beforeend','<footer>Hype Games is independent and not affiliated with, endorsed or sponsored by any vehicle manufacturer. Art: Kenney (CC0). See CREDITS.md.</footer>');
 document.getElementById('pbtn').onclick=()=>HG.togglePause();
 document.querySelectorAll('#pause button').forEach(b=>b.onclick=()=>act(b.dataset.a))};
let mi=0;const mb=()=>[...document.querySelectorAll('#pause button')];
function menuNav(k){const b=mb();if(k=='up')mi=(mi+b.length-1)%b.length;if(k=='down')mi=(mi+1)%b.length;if(k=='a')return act(b[mi].dataset.a);if(k=='b')return act('resume');b.forEach((x,i)=>x.classList.toggle('sel',i==mi))}
function act(a){if(a=='resume')HG.togglePause(false);if(a=='restart')location.reload();if(a=='home')location='../index.html'}
HG.togglePause=v=>{HG.paused=v===undefined?!HG.paused:v;document.getElementById('pause').classList.toggle('on',HG.paused);mi=0;mb().forEach((x,i)=>x.classList.toggle('sel',i==0));HG.onPause&&HG.onPause(HG.paused)};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!HG.paused)HG.togglePause(true)});
HG.qs=new URLSearchParams(location.search);
})();
// Title screen: HG.title({name,sub,ctl:[...],c1,c2,c3,game}).then(start)
HG.title=o=>new Promise(res=>{if(HG.qs.has('demo')||HG.qs.has('test'))return res();const st=document.getElementById('stage'),d=document.createElement('div');d.className='title';
 d.style.cssText=`--c1:${o.c1};--c2:${o.c2};--c3:${o.c3}`;d.innerHTML=`<h1>${o.name}</h1><p>${o.sub}</p><p>BEST: ${HG.best(o.game)}</p>${o.extra||''}<div class="go">TAP OR PRESS A</div><div class="ctl">${o.ctl.map(c=>'<span>'+c+'</span>').join('')}</div>`;
 st.appendChild(d);HG.inTitle=true;const go=()=>{if(!HG.inTitle)return;HG.inTitle=false;HG.sfx('level');d.classList.add('hide');setTimeout(()=>d.remove(),400);res()};
 d.querySelector('.go').addEventListener('pointerdown',go);if(!o.extra)d.addEventListener('pointerdown',go);HG._go=go});
HG.popText=(x,y,t,c='#fff',sz=26)=>{const e=document.createElement('div');e.className='pop';e.textContent=t;e.style.cssText=`left:${x}px;top:${y}px;color:${c};font-size:${sz}px`;document.getElementById('stage').appendChild(e);setTimeout(()=>e.remove(),800)};
// Music: tiny step sequencer. HG.music({bpm,root,scale,lead:[..steps],bass:[..],wave}) ; notes are scale degrees, null = rest
HG.muted=HG.get('muted',false);
HG.music=cfg=>{HG._mcfg=cfg;if(HG._mt)return;let step=0,next=0;
 const midi=(deg,oct)=>{const sc=cfg.scale||[0,2,3,5,7,8,10],n=sc.length;const o=Math.floor(deg/n);return cfg.root+12*(oct+o)+sc[((deg%n)+n)%n]};
 const note=(m,t,d,type,vol)=>{const o=HG.ac.createOscillator(),g=HG.ac.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(m-69)/12);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(HG._mg);o.start(t);o.stop(t+d+.02)};
 const kick=t=>{const o=HG.ac.createOscillator(),g=HG.ac.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(HG._mg);o.start(t);o.stop(t+.16)};
 const hat=t=>{const n=HG.ac.createBufferSource(),b=HG.ac.createBuffer(1,2000,HG.ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=b;const f=HG.ac.createBiquadFilter();f.type='highpass';f.frequency.value=7000;const g=HG.ac.createGain();g.gain.value=.12;n.connect(f);f.connect(g);g.connect(HG._mg);n.start(t)};
 HG._mt=setInterval(()=>{if(!HG.ac||HG.muted||HG.paused||HG.inTitle&&!cfg.title)return;if(!HG._mg){HG._mg=HG.ac.createGain();HG._mg.gain.value=.22;HG._mg.connect(HG.ac.destination)}
  const c=HG._mcfg,sd=60/c.bpm/4;if(next<HG.ac.currentTime)next=HG.ac.currentTime+.05;
  while(next<HG.ac.currentTime+.2){const L=c.lead,B=c.bass;const ln=L[step%L.length],bn=B[step%B.length];
   if(ln!=null)note(midi(ln,1),next,sd*1.8,c.wave||'square',.07);if(bn!=null)note(midi(bn,-1),next,sd*1.6,'triangle',.18);
   if(c.drums){if(step%4==0)kick(next);if(step%2==1)hat(next)}next+=sd;step++}},50)};
// ensure audio context exists after first gesture
addEventListener('pointerdown',()=>HG.sfx('none'),{once:true});addEventListener('keydown',()=>HG.sfx('none'),{once:true});
HG.toggleMute=()=>{HG.muted=!HG.muted;HG.set('muted',HG.muted);const b=document.getElementById('mbtn');if(b)b.textContent=HG.muted?'🔇':'♪'};
document.addEventListener('DOMContentLoaded',()=>{const pb=document.getElementById('pbtn');if(pb){pb.insertAdjacentHTML('beforebegin','<button class="hbtn" id="mbtn" style="min-width:70px;margin-left:auto;margin-right:12px">'+(HG.muted?'🔇':'♪')+'</button>');document.getElementById('mbtn').onclick=HG.toggleMute}});
// Pixel art helper: rows of chars -> canvas, palette map char->color
HG.pix=(rows,pal,scale=1)=>{const h=rows.length,w=rows[0].length,c=document.createElement('canvas');c.width=w*scale;c.height=h*scale;const x=c.getContext('2d');
 rows.forEach((r,y)=>[...r].forEach((ch,i)=>{if(pal[ch]){x.fillStyle=pal[ch];x.fillRect(i*scale,y*scale,scale,scale)}}));return c};
HG.strip=frames=>{const w=frames[0].width,h=frames[0].height,c=document.createElement('canvas');c.width=w*frames.length;c.height=h;const x=c.getContext('2d');frames.forEach((f,i)=>x.drawImage(f,i*w,0));return c};
addEventListener('orientationchange',()=>setTimeout(()=>dispatchEvent(new Event('resize')),250));
HG.rotHint=()=>{const f=()=>{let e=document.querySelector('.rot');const need=innerHeight>innerWidth&&innerWidth<600;if(need&&!e&&!HG._rotX){e=document.createElement('div');e.className='rot';e.textContent='↻ Rotate for best experience';e.onclick=()=>{HG._rotX=1;e.remove()};(document.getElementById('stage')||document.body).appendChild(e)}else if(!need&&e)e.remove()};f();addEventListener('resize',f)};
