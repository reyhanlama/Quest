/* Ambient layers share the map's coordinates, so they pan and zoom with it. */
(() => {
 const world = document.querySelector('#world');
 const bus = document.querySelector('#hill-bus');
 const atmosphere = document.querySelector('#atmosphere');
 const motionButton = document.querySelector('#motion-toggle');
 const preference = matchMedia('(prefers-reduced-motion: reduce)');
 let paused = preference.matches, elapsed = 23000, frame, lastTime = 0;
 const road = window.VillageRoad;
 const roadCanvas = document.querySelector('#village-road');
 const roadCtx = roadCanvas.getContext('2d');
 const busCtx = bus.getContext('2d');

 const cloud = '<img src="assets/mountain-cloud.webp" alt="" draggable="false">';
 atmosphere.innerHTML = [
  [20,7,13,58,-9],[56,3,12,74,-27],[65,22,18,67,-14],[78,30,14,81,-39]
 ].map(([x,y,w,d,delay])=>`<div class="moving-cloud" style="left:${x}%;top:${y}%;width:${w}%;--duration:${d}s;--delay:${delay}s">${cloud}</div>`).join('') +
 `<div class="chimney-smoke" style="left:39.8%;top:48.4%">${Array.from({length:5},(_,i)=>`<i style="--delay:${i*-1.15}s"></i>`).join('')}</div>`;
 // The paving and stone embankment are drawn at the map's native resolution.
 // A seeded palette keeps the hand-laid stones stable between visits.
 function drawRoad() {
  const c=roadCtx;
  c.clearRect(0,0,1536,1024);
  let seed=831;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function polygon(points,fill){c.beginPath();points.forEach((p,i)=>i?c.lineTo(Math.round(p.x),Math.round(p.y)):c.moveTo(Math.round(p.x),Math.round(p.y)));c.closePath();c.fillStyle=fill;c.fill();}
  function strip(near,far,color,y=0){const points=[];for(let d=0;d<=road.length;d+=3){const p=road.at(d,near);points.push({x:p.x,y:p.y+y});}for(let d=road.length;d>=0;d-=3){const p=road.at(d,far);points.push({x:p.x,y:p.y+y});}polygon(points,color);}
  const sample=(d,n,y=0)=>{const p=road.at(d,n);return {x:p.x,y:p.y+y};};
  // A cool stone retaining face picks up the palette of the village's rocky terraces.
  const wall=[];for(let d=0;d<=road.length;d+=3)wall.push(sample(d,22));for(let d=road.length;d>=0;d-=3)wall.push(sample(d,22,18));polygon(wall,'#526570');
  const wallTones=['#9d9f91','#8a938b','#b5ad93','#748687','#abb0a0','#87958f'];
  for(let row=0;row<2;row++)for(let d=-row*11;d<road.length;){const size=14+Math.floor(random()*14);const a=sample(d+.8,22,row*8+1),b=sample(d+size-1,22,row*8+1);polygon([a,b,{x:b.x,y:b.y+7},{x:a.x,y:a.y+7}],wallTones[Math.floor(random()*wallTones.length)]);c.strokeStyle='#d3c9ad';c.lineWidth=1;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();d+=size;}
  strip(-23,22,'#786f48');strip(-21,20,'#c4a46a');
  // Irregular, individually shaded flagstones instead of the former smooth checkerboard.
  const stoneTones=['#dfbf87','#e5c993','#d4b47d','#edcd96','#caae77','#ddc18c','#dbb783'];
  for(let row=0;row<3;row++)for(let d=-row*8;d<road.length;){
   const size=12+Math.floor(random()*14),n=-19+row*12.5;
   const color=stoneTones[Math.floor(random()*stoneTones.length)];
   const points=[sample(d+2,n+1),sample(d+size-3,n+.5),sample(d+size-1,n+3),sample(d+size-2,n+10.5),sample(d+3,n+11.5),sample(d+1,n+8)];
   polygon(points,color);
   const highA=sample(d+3,n+2),highB=sample(d+size-4,n+2);
   c.strokeStyle='#f3dba7';c.lineWidth=1;c.beginPath();c.moveTo(highA.x,highA.y);c.lineTo(highB.x,highB.y);c.stroke();
   const fleck=sample(d+4+random()*(size-8),n+4+random()*5);c.fillStyle=random()>.5?'#bd9b64':'#f1d399';c.fillRect(Math.round(fleck.x),Math.round(fleck.y),2,1);
   d+=size;
  }
  for(let d=0;d<road.length;d+=19){const a=sample(d+.5,19),b=sample(d+17,19),c1=sample(d+17,23),e=sample(d+.5,23);polygon([a,b,c1,e],random()>.5?'#d2c5a1':'#bcb595');}
  // Sparse stout timber posts, rather than a thin continuous fence.
  for(const elevation of [7,15]){c.beginPath();for(let d=0;d<=road.length;d+=4){const p=sample(d,-23,-elevation);d?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}c.lineWidth=4;c.strokeStyle='#65482e';c.stroke();c.lineWidth=1.5;c.strokeStyle='#bd8c4b';c.stroke();}
  for(let d=7;d<road.length;d+=52){const p=sample(d,-23);c.fillStyle='#4c402c';c.fillRect(Math.round(p.x)-2,Math.round(p.y)-23,5,25);c.fillStyle='#c99a52';c.fillRect(Math.round(p.x)-2,Math.round(p.y)-23,2,22);c.fillStyle='#eed49a';c.fillRect(Math.round(p.x)-2,Math.round(p.y)-24,5,2);}
  // Broken verges tuck the new geometry into the painted meadow.
  for(let i=0,d=2;d<road.length;d+=4,i++)for(const side of [-1,1]){
   const p=sample(d,side*(23+random()*6),side>0?16:0);c.fillStyle=['#5c762a','#829532','#a9b743','#b7b848','#718836'][i%5];
   c.fillRect(Math.round(p.x),Math.round(p.y)-3,2+Math.floor(random()*4),3);if(i%3===0)c.fillRect(Math.round(p.x)+1,Math.round(p.y)-5,1,3);
  }
 }
 // Compact bus, constructed at game scale: all faces share the road's ground plane.
 function drawPixelBus(position) {
  const c=busCtx, angle=position.angle, cos=Math.cos(angle),sin=Math.sin(angle);
  const project=(length,across,z=0)=>({x:Math.round(position.x+length*1.18*cos-across*.9*sin),y:Math.round(position.y+length*1.18*sin+across*.9*cos-z*.9)});
  function face(coords,color,outline=false){const points=coords.map(p=>project(...p));c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=color;c.fill();if(outline){c.strokeStyle='#34454a';c.lineWidth=1;c.stroke();}}
  // Tight contact shadow; the tires touch the road at z=0.
  face([[-35,-10,0],[35,-10,0],[35,12,0],[-35,12,0]],'#3c493942');
  // Dark far-side chassis and two near-side tires behind the body.
  face([[-34,-10,5],[34,-10,5],[34,11,5],[-34,11,5]],'#33434a');
  for(const l of [-23,23]){const p=project(l,11,4);c.fillStyle='#273239';c.beginPath();c.ellipse(p.x,p.y,4,6,0,0,Math.PI*2);c.fill();c.fillStyle='#78838a';c.fillRect(p.x-1,p.y-2,2,3);}
  // Red side panels, shaded front, and warm cream upper cabin.
  face([[-35,11,7],[35,11,7],[35,11,29],[-35,11,29]],'#b84c3b',true);
  face([[35,-11,7],[35,11,7],[35,11,29],[35,-11,29]],'#a14135',true);
  face([[-35,11,17],[35,11,17],[35,11,29],[-35,11,29]],'#e5d2a3');
  face([[35,-11,17],[35,11,17],[35,11,29],[35,-11,29]],'#cfbc91');
  // Big readable windows, with a two-tone sky reflection.
  for(let l=-31;l<29;l+=12){face([[l,11.2,19],[l+9,11.2,19],[l+9,11.2,27],[l,11.2,27]],'#36566b');face([[l+1,11.3,24],[l+8,11.3,24],[l+8,11.3,27],[l+1,11.3,27]],'#7295a5');}
  face([[35.2,-9,19],[35.2,8,19],[35.2,8,27],[35.2,-9,27]],'#36546b');
  face([[35.3,-8,24],[35.3,7,24],[35.3,7,27],[35.3,-8,27]],'#7994a2');
  // Restrained roof with a slightly raised central panel.
  face([[-36,-9,29],[-33,-12,29],[32,-12,29],[36,-9,29],[36,9,29],[33,12,29],[-33,12,29],[-36,9,29]],'#f0ddb0',true);
  face([[-31,-8,30],[29,-8,30],[31,6,30],[-30,7,30]],'#e5cca0');
  for(const l of [-17,12]){
   face([[l,-4,30],[l+7,-4,30],[l+7,2,30],[l,2,30]],'#b9ac89');
   face([[l,-4,31],[l+7,-4,31],[l+7,1,31],[l,1,31]],'#f0dcaf');
  }
  // Driver's door and a small inset destination panel, with no illegible micro-text.
  face([[28,11.4,8],[33,11.4,8],[33,11.4,18],[28,11.4,18]],'#943c32');
  face([[29,11.5,9],[32,11.5,9],[32,11.5,17],[29,11.5,17]],'#bc6c4f');
  face([[35.4,-4,27],[35.4,5,27],[35.4,5,29],[35.4,-4,29]],'#374a50');
  face([[-35,11.3,15],[34,11.3,15],[34,11.3,17],[-35,11.3,17]],'#f1d7a3');
  face([[35.4,-10,8],[35.4,10,8],[35.4,10,10],[35.4,-10,10]],'#8e9792');
  for(const across of [-7,7]){const p=project(35.5,across,13);c.fillStyle='#ffe6a0';c.fillRect(p.x-1,p.y-1,3,2);}
 }
 function paintBus() {
  const seconds=(elapsed/1000)%road.cycleSeconds;
  const position=road.at(Math.min(road.length,seconds*road.speed));
  busCtx.clearRect(0,0,bus.width,bus.height);
  drawPixelBus(position);
  bus.dataset.distance=(seconds*road.speed).toFixed(2);
  bus.dataset.heading=(position.angle*180/Math.PI).toFixed(2);
 }
 drawRoad();
 function tick(time) {
  if(lastTime) elapsed+=Math.min(time-lastTime,80);
  lastTime=time; paintBus(); frame=requestAnimationFrame(tick);
 }
 function sync() {
  cancelAnimationFrame(frame); lastTime=0;
  const stopped=paused || document.hidden;
  document.documentElement.classList.toggle('scenery-paused',stopped);
  motionButton.setAttribute('aria-pressed',String(!paused));
  motionButton.setAttribute('aria-label',paused?'Resume scenery animation':'Pause scenery animation');
  motionButton.title=paused?'Resume scenery animation':'Pause scenery animation';
  motionButton.querySelector('.motion-icon').textContent=paused?'▶':'Ⅱ';
  if(!stopped) frame=requestAnimationFrame(tick);
 }
 motionButton.addEventListener('click',()=>{paused=!paused;sync();});
 preference.addEventListener('change',e=>{paused=e.matches;sync();});
 document.addEventListener('visibilitychange',sync);
 paintBus();sync();
})();
