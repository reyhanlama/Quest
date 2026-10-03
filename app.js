const $ = s => document.querySelector(s);
const content = window.journalContent;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentPlace = null, selectedShelf = 'essays', transitionTimer, toastTimer, previousFocus, audioContext, audioGain;
let visited = new Set();
try { visited = new Set(JSON.parse(localStorage.getItem('mountain-journal-visited') || '[]')); } catch {}
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderMap() {
 $('#places').innerHTML = content.places.map(p => `<button class="place ${p.x>80?'label-left':''} ${visited.has(p.id) ? 'is-visited' : ''}" data-place="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="Visit ${p.name}: ${p.category}"><span class="sign paper"><span class="icon" aria-hidden="true">${p.icon}</span><span><strong>${p.name}</strong><small>${p.category}</small></span></span><span class="pin" aria-hidden="true"></span></button>`).join('');
 $('#place-index').innerHTML = content.places.map(p => `<button data-place="${p.id}">${p.icon} ${p.name}<small>${p.category}</small></button>`).join('');
 $('#place-index').insertAdjacentHTML('afterbegin','<button data-page="profile">♙ Meet Reyhan<small>About me</small></button>');
 $('#visited').textContent = `${visited.size} / ${content.places.length} visited`;
}
function announce(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('show'); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function indexClose() { $('#place-index').hidden = true; $('#index-button').setAttribute('aria-expanded','false'); }
function setHash(value) { const target=value ? `#${value}` : ''; if(location.hash!==target) history.pushState(null,'',target || location.pathname); }
function closePanel(updateHistory=true) {
 saveReadingPosition();
 $('#destination').hidden=true; $('#panel-backdrop').hidden=true;
 document.body.classList.remove('panel-open');
 $('#room').inert=false; $('#map-viewport').inert=!!currentPlace;
 for(const selector of ['#index-button','#place-index','#back-map','#map-controls']) $(selector).inert=false;
 if(updateHistory && location.hash.includes('/')) history.replaceState(null,'',currentPlace ? `#${currentPlace.id}` : location.pathname);
 if(previousFocus?.isConnected && !previousFocus.closest('[inert],[hidden]')) previousFocus.focus({preventScroll:true});
}
function panel(body, mode='default') {
 saveReadingPosition(); indexClose();
 if($('#destination').hidden) previousFocus=document.activeElement;
 const destination=$('#destination');
 destination.dataset.mode=mode; delete destination.dataset.reading;
 destination.innerHTML=`<button class="close-panel" aria-label="Close panel">×</button>${body}`;
 destination.hidden=false; $('#panel-backdrop').hidden=false;
 document.body.classList.add('panel-open');
 $('#room').inert=true; $('#map-viewport').inert=true;
 for(const selector of ['#index-button','#place-index','#back-map','#map-controls']) $(selector).inert=true;
 destination.scrollTop=0; destination.querySelector('.close-panel').focus({preventScroll:true});
}
function returnToMap(updateHistory=true) {
 const from=currentPlace?.id;
 rememberRoom(); clearTimeout(transitionTimer); closePanel(false); currentPlace=null;
 $('#room').hidden=true; $('#back-map').hidden=true;
 $('#world').classList.remove('zoomed'); $('#world').style.transform='';
 $('#app').classList.remove('hide-map-ui'); $('#map-viewport').inert=false;
 indexClose(); if(updateHistory)setHash('');
 const marker=from ? document.querySelector(`#places [data-place="${from}"]`) : $('#village-character');
 marker?.focus({preventScroll:true});
 restorePosition($('#map-viewport'), travelState.map, .35, .4);
}
function enterPlace(id, updateHistory=true, afterEnter) {
 const place = content.places.find(p => p.id === id); if(!place) return;
 rememberRoom(); if(!currentPlace) rememberMap();
 clearTimeout(transitionTimer); closePanel(false); indexClose(); $('#room').hidden = true; currentPlace = place; visited.add(id); try { localStorage.setItem('mountain-journal-visited',JSON.stringify([...visited])); } catch {} renderMap();
 $('#app').classList.add('hide-map-ui'); $('#back-map').hidden = false; $('#map-viewport').inert = true;
 const viewport = $('#map-viewport'), world = $('#world');
 const x = world.offsetWidth * place.x / 100, y = world.offsetHeight * place.y / 100;
 const centerX = viewport.scrollLeft + viewport.clientWidth / 2, centerY = viewport.scrollTop + viewport.clientHeight / 2;
 const scale = 1.8;
 const dx = Math.min(viewport.scrollLeft + (scale-1)*x, Math.max(viewport.scrollLeft+viewport.clientWidth-scale*world.offsetWidth+(scale-1)*x, centerX-x));
 const dy = Math.min(viewport.scrollTop + (scale-1)*y, Math.max(viewport.scrollTop+viewport.clientHeight-scale*world.offsetHeight+(scale-1)*y, centerY-y));
 world.style.transformOrigin = `${x}px ${y}px`; world.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`; world.classList.add('zoomed');
 if(updateHistory) setHash(id);
 transitionTimer = setTimeout(() => {
  renderRoom(place); $('#back-map').focus({preventScroll:true}); afterEnter?.();
 }, reducedMotion ? 0 : 650);
}

function renderRoom(place) {
 const room=window.villageRooms[place.id];
 $('#room').setAttribute('aria-label',`Inside ${place.name}`);
 $('#room').dataset.place=place.id;
 $('#room-scene').innerHTML=`<img src="assets/${room.image}" alt="Pixel-art interior of ${place.name}" decoding="async" draggable="false">${room.objects.map((o,i)=>`<button class="room-hotspot ${o.x>75?'label-left':''}" data-room-object="${i}" style="--x:${o.x}%;--y:${o.y}%" aria-label="${escapeHtml(o.name)}: ${escapeHtml(o.detail)}"><span class="object-dot" aria-hidden="true"></span><span class="object-label paper"><strong>${o.name}</strong><small>${o.detail}</small></span></button>`).join('')}`;
 $('#room .eyebrow').textContent=room.eyebrow;
 $('#room h2').textContent=place.name;
 $('#room .room-description').textContent=room.description;
 $('#room-index').innerHTML=room.objects.map((o,i)=>`<button data-room-object="${i}">${o.name}<span>↗</span></button>`).join('');
 $('#room').hidden=false; $('#room').inert=false;
 const view=$('#room-viewport');
 restorePosition(view, travelState.rooms[place.id], place.id==='tea'?.57:.5, .5);
}
function showItem(index) {
 const item=currentPlace?.items?.[index];if(!item)return;
 panel(`<button class="text-button" id="back-room">← Back to ${currentPlace.name}</button><p class="eyebrow">${item.type}</p><h2 id="destination-title">${item.title}</h2><p>${item.body}</p>`);
}
function activateRoomObject(index) {
 if(!currentPlace)return;
 const o=window.villageRooms[currentPlace.id].objects[index];if(!o)return;
 if(o.action==='shelf')renderShelf(o.value);
 else if(o.action==='projects')renderProjects();
 else if(o.action==='project')showProject(o.value);
 else if(o.action==='albums')renderAlbums();
 else if(o.action==='item')showItem(o.value);
 else if(o.action==='letter')renderDestination(currentPlace);
 else if(o.action==='bell')announce('Ding! The writing desk is ready for your note.');
 else if(o.action==='tea')announce('One warm cup of tea. Take your time. ♨');
}

function renderDestination(place) {
 if(place.id === 'contact') {
 panel(`<p class="eyebrow">THE VILLAGE POST OFFICE</p><h2 id="destination-title">Leave a little letter.</h2><p class="subtitle">Good conversations start with hello.</p><p>Have a question, an idea, or just a story from your own corner of the world?</p><form id="contact-form" name="contact" method="POST" data-netlify="true"><input type="hidden" name="form-name" value="contact"><p class="form-honeypot" aria-hidden="true"><label>Leave this field empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><label for="sender-name">Your name</label><input id="sender-name" name="name" autocomplete="name" required><label for="sender-email">Your email</label><input id="sender-email" name="email" type="email" autocomplete="email" required><label for="letter">Your note</label><textarea id="letter" name="message" required placeholder="Hello Reyhan, I stopped by your village…"></textarea><button class="solid-button" type="submit">Send my letter ↗</button><p class="form-status" role="status" aria-live="polite"></p></form>${content.contactEmail ? `<a class="text-button" href="mailto:${escapeHtml(content.contactEmail)}">Or send an email directly ↗</a>` : ''}`); return;
 }
 panel(`<p class="eyebrow">${escapeHtml(place.category)} · ${place.icon}</p><h2 id="destination-title">${place.name}</h2><p class="subtitle">${place.description}</p><p>${place.intro}</p><div>${place.items.map((item,i) => `<button class="entry" data-item="${i}"><span class="entry-meta">${item.type}</span><span class="arrow">↗</span><strong>${item.title}</strong></button>`).join('')}</div><p class="sample-note">A first sketch of this place. Sample entries await your own stories and work.</p>`);
}
function showPage(page) {
 indexClose();
 if(page==='profile') panel(`<div class="profile-intro"><img src="assets/character-compact.webp" alt="Reyhan’s village character"><div><p class="eyebrow">A HELLO FROM THE MOUNTAINS</p><h2 id="destination-title">Hi, I’m Reyhan.</h2><p>A product designer from the mountains of Sikkim.</p></div></div><p>This little village holds the things I’m making, learning, and writing along the way.</p><div class="profile-links"><button class="entry" id="explore"><strong>Explore the village →</strong></button><button class="entry" data-page="about"><strong>About this place →</strong></button><button class="entry" data-page="journey"><strong>My journey →</strong></button><button class="entry" data-place="contact"><strong>Leave a letter →</strong></button></div>`);
 else if(page==='about') panel(`<p class="eyebrow">WELCOME, WANDERER</p><h2 id="destination-title">A life in<br>little places.</h2><p class="subtitle">A portfolio you can wander through.</p><p>Every place in this village holds a different part of my world. The tea house is for writing. The studio is for work. The greenhouse gives small ideas room to grow.</p><p>There is no right route, and no finish line. Follow a path, open a notebook, and stay for a cup of tea.</p><button class="solid-button" data-place="tea">Start at the tea house →</button><p class="sample-note">Local prototype · Inspired by your Sikkim village reference. Content is illustrative until you add your own.</p>`);
 else panel(`<p class="eyebrow">A PATH STILL UNFOLDING</p><h2 id="destination-title">My journey</h2><p class="subtitle">The places that shape a person.</p><div class="journey-row"><strong>Roots · Sikkim</strong><p>The mountains, and a sense of place.</p></div><div class="journey-row"><strong>Practice · Design</strong><p>Learning to turn questions into useful things.</p></div><div class="journey-row"><strong>Now · Still exploring</strong><p>Making, writing, noticing.</p></div><p class="sample-note">A sample outline. Add your real milestones, roles, and dates here.</p>`);
}
document.addEventListener('click', async e => {
 const b = e.target.closest('button'); if(!b)return;
 if(b.dataset.place) {
  if(b.classList.contains('place') && matchMedia('(hover: none)').matches && !b.classList.contains('touch-reveal')) {
   document.querySelectorAll('.touch-reveal').forEach(el=>el.classList.remove('touch-reveal')); b.classList.add('touch-reveal'); return;
  }
  enterPlace(b.dataset.place);
 }
 else if(b.id === 'village-character') showPage('profile');
 else if(b.dataset.roomObject != null) activateRoomObject(Number(b.dataset.roomObject));
 else if(b.dataset.page) showPage(b.dataset.page);
 else if(b.dataset.shelf) renderShelf(b.dataset.shelf);
 else if(b.dataset.tab) renderShelf(b.dataset.tab);
 else if(b.dataset.writing) showWriting(b.dataset.writing);
 else if(b.dataset.item != null && currentPlace) showItem(Number(b.dataset.item));
 else if(b.classList.contains('close-panel') || b.id === 'back-room') closePanel();
 else if(b.id === 'back-destination') closePanel();
 else if(b.id === 'back-map' || b.id === 'home') returnToMap();
 else if(b.id === 'explore') { closePanel(); announce('Follow a dot to find your way in.'); }
 else if(b.id === 'index-button') { const expanded=b.getAttribute('aria-expanded')==='true'; b.setAttribute('aria-expanded',String(!expanded)); $('#place-index').hidden=expanded; }
 else if(b.id === 'pour-tea') announce('One warm cup of tea. Take your time. ♨');
 else if(b.id === 'sound') toggleSound();
});
document.addEventListener('submit',async e=>{
 const form=e.target.closest('#contact-form');if(!form)return;
 e.preventDefault();const button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-status');
 button.disabled=true;button.textContent='Sending…';status.textContent='';
 try{const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});if(!response.ok)throw new Error('Request failed');form.reset();status.textContent='Your letter is on its way. Thank you for stopping by.';button.textContent='Letter sent ✓';}
 catch{status.textContent='The post office could not send that yet. Please try again in a moment.';button.disabled=false;button.textContent='Send my letter ↗';}
});
document.addEventListener('keydown', e => {
 if(e.key==='Escape') { if(!$('#destination').hidden) closePanel(); else if(!$('#place-index').hidden) {indexClose();$('#index-button').focus();} else if(currentPlace) returnToMap(); else { indexClose(); document.querySelectorAll('.touch-reveal').forEach(el=>el.classList.remove('touch-reveal')); } }
 if(e.key==='Tab' && !$('#destination').hidden) { const els=[...$('#destination').querySelectorAll('button,a,textarea,input')].filter(el=>!el.disabled && el.getClientRects().length); const first=els[0],last=els.at(-1); if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();} }
});
window.addEventListener('popstate',()=>restoreRoute());
let drag;
$('#map-viewport').addEventListener('pointerdown',e=>{if(e.target.closest('button')||currentPlace)return;drag={x:e.clientX,y:e.clientY,left:$('#map-viewport').scrollLeft,top:$('#map-viewport').scrollTop};$('#map-viewport').setPointerCapture(e.pointerId);$('#map-viewport').classList.add('dragging');});
$('#map-viewport').addEventListener('pointermove',e=>{if(!drag)return;$('#map-viewport').scrollLeft=drag.left-e.clientX+drag.x;$('#map-viewport').scrollTop=drag.top-e.clientY+drag.y;});
for(const event of ['pointerup','pointercancel']) $('#map-viewport').addEventListener(event,()=>{drag=null;$('#map-viewport').classList.remove('dragging');});
async function toggleSound() {
 try {
 if(!audioContext) { audioContext=new (window.AudioContext||window.webkitAudioContext)(); audioGain=audioContext.createGain(); audioGain.gain.value=0;audioGain.connect(audioContext.destination); const buffer=audioContext.createBuffer(1,audioContext.sampleRate*4,audioContext.sampleRate); const data=buffer.getChannelData(0); let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}const source=audioContext.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;source.connect(filter);filter.connect(audioGain);source.start(); }
 await audioContext.resume();const on=$('#sound').getAttribute('aria-pressed')!=='true';audioGain.gain.setTargetAtTime(on?.35:0,audioContext.currentTime,.3);$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',on?'Turn off ambient sound':'Turn on ambient sound');$('#sound span').textContent=on?'Sound on':'Sound off';
 } catch { announce('Ambient sound is unavailable in this browser.'); }
}
renderMap();
$('.fireflies').innerHTML=Array.from({length:14},(_,i)=>`<i class="mote" style="left:${12+(i*17)%80}%;top:${38+(i*13)%57}%;animation-delay:${i*-.8}s"></i>`).join('');
const loadingScreen=$('#loading-screen'),mainLandscape=$('.landscape');
function dismissLoading(){if(!loadingScreen||loadingScreen.classList.contains('is-gone'))return;loadingScreen.classList.add('is-gone');setTimeout(()=>loadingScreen.remove(),500);}
if(mainLandscape.complete)dismissLoading();else mainLandscape.addEventListener('load',dismissLoading,{once:true});
setTimeout(dismissLoading,5000);
requestAnimationFrame(()=>{restorePosition($('#map-viewport'),travelState.map,.35,.4);restoreRoute();});

document.querySelector('#places').addEventListener('pointerover',e=>{const p=e.target.closest('[data-place]');if(p){const img=new Image();img.src='assets/'+window.villageRooms[p.dataset.place].image;}});

// Native touch scrolling and mouse drag use the same room coordinate plane.
const roomViewport = $('#room-viewport');
let roomDrag;
roomViewport.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;
 roomDrag={x:e.clientX,y:e.clientY,left:roomViewport.scrollLeft,top:roomViewport.scrollTop};
 roomViewport.setPointerCapture(e.pointerId);roomViewport.classList.add('dragging');
});
roomViewport.addEventListener('pointermove',e=>{
 if(!roomDrag)return;
 roomViewport.scrollLeft=roomDrag.left+roomDrag.x-e.clientX;
 roomViewport.scrollTop=roomDrag.top+roomDrag.y-e.clientY;
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])roomViewport.addEventListener(event,()=>{roomDrag=null;roomViewport.classList.remove('dragging');});
roomViewport.addEventListener('keydown',e=>{
 if(e.target!==roomViewport)return;
 const moves={ArrowLeft:[-120,0],ArrowRight:[120,0],ArrowUp:[0,-120],ArrowDown:[0,120]};
 if(moves[e.key]){e.preventDefault();roomViewport.scrollBy({left:moves[e.key][0],top:moves[e.key][1],behavior:reducedMotion?'instant':'smooth'});}
});
