/* Room collections, local reading state, and resumable exploration. */
function loadLocal(key, fallback) {
 try { const value=JSON.parse(localStorage.getItem(key)); return value && typeof value==='object' && !Array.isArray(value) ? value : fallback; } catch { return fallback; }
}
const storedTravel=loadLocal('mountain-journal-travel',{});
const travelState={map:storedTravel.map, rooms:storedTravel.rooms && typeof storedTravel.rooms==='object' ? storedTravel.rooms : {}};
const readingState=loadLocal('mountain-journal-reading',{});
let activeAlbum=null, activePhoto=0, restoringReading=false, positionTimer;
function persist(key,value) { try {localStorage.setItem(key,JSON.stringify(value));} catch {} }
function bounded(value,fallback=0) {return Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : fallback;}
function scrollExtent(view) {const isMap=view.id==='map-viewport';return {x:Math.max(0,(isMap?$('#world').offsetWidth:view.scrollWidth)-view.clientWidth),y:Math.max(0,(isMap?$('#world').offsetHeight:view.scrollHeight)-view.clientHeight)};}
function positionOf(view) {const extent=scrollExtent(view);return {x:view.scrollLeft/Math.max(1,extent.x),y:view.scrollTop/Math.max(1,extent.y)};}
function restorePosition(view,saved,x=.5,y=.5) {const extent=scrollExtent(view);view.scrollLeft=extent.x*bounded(saved?.x,x);view.scrollTop=extent.y*bounded(saved?.y,y);}
function rememberMap() {travelState.map=positionOf($('#map-viewport'));persist('mountain-journal-travel',travelState);}
function rememberRoom() {if(currentPlace && !$('#room').hidden){travelState.rooms[currentPlace.id]=positionOf($('#room-viewport'));persist('mountain-journal-travel',travelState);}}
for(const id of ['#map-viewport','#room-viewport']) $(id).addEventListener('scroll',()=>{clearTimeout(positionTimer);positionTimer=setTimeout(()=>{if(currentPlace)rememberRoom();else rememberMap();},180);},{passive:true});
window.addEventListener('pagehide',()=>{saveReadingPosition();rememberRoom();if(!currentPlace)rememberMap();});

function collectionHeader(kicker,title,description) {return `<header class="collection-heading"><p class="eyebrow">${kicker}</p><h2 id="destination-title">${title}</h2><p class="collection-description">${description}</p></header>`;}
function sampleLabel(text='Sample collection') {return `<span class="sample-stamp">${text}</span>`;}
function routePanel(path,updateHistory) {if(updateHistory)setHash(path);}

function renderShelf(shelf='essays',updateHistory=true) {
 selectedShelf=['essays','notes','saved'].includes(shelf)?shelf:'essays';
 const books=content.writings.filter(w=>selectedShelf==='saved'?readingState[w.id]?.saved:w.shelf===selectedShelf);
 panel(`${collectionHeader('Tea house / The bookshelf','A little room for thought.','Essays, passing thoughts, and notes from the long way round.')}
 <div class="collection-toolbar"><div class="tabs" aria-label="Writing categories">${[['essays','Essays'],['notes','Field notes'],['saved','Saved for later']].map(([id,name])=>`<button data-tab="${id}" class="${selectedShelf===id?'active':''}" aria-pressed="${selectedShelf===id}">${name}</button>`).join('')}</div>${sampleLabel('Sample writing')}</div>
 <div class="journal-shelf">${books.map((w,i)=>{const progress=bounded(readingState[w.id]?.progress);return `<button class="journal-book ${w.color}" data-writing="${w.id}"><span class="book-spine" aria-hidden="true"></span><span class="book-number">${String(content.writings.indexOf(w)+1).padStart(2,'0')} / ${w.shelf==='essays'?'ESSAYS':'FIELD NOTES'}</span><strong>${escapeHtml(w.title)}</strong><span class="book-ornament" aria-hidden="true">${w.shelf==='essays'?'✳':'✎'}</span><span class="book-bottom">${w.time} read <span aria-hidden="true">↗</span></span><span class="book-progress">${progress>=.98?'Read · Open again':progress>.02?`Continue · ${Math.round(progress*100)}%`:'Open this notebook'}</span></button>`;}).join('') || '<div class="empty-shelf"><span aria-hidden="true">▤</span><h3>A space for something good.</h3><p>Open a piece and choose “Save for later” to keep it here.</p><button class="text-button" data-tab="essays">Browse the essays →</button></div>'}</div>
 <footer class="collection-footer"><span>Pull up a cushion. There’s no hurry.</span><span>♨</span></footer>`,'shelf');
 routePanel(`tea/shelf/${selectedShelf}`,updateHistory);
}
function showWriting(id,updateHistory=true) {
 const w=content.writings.find(w=>w.id===id);if(!w)return;
 const state=readingState[id]||{}, progress=bounded(state.progress);
 panel(`<div class="reader-toolbar"><button class="text-button" data-tab="${w.shelf}">← The bookshelf</button><button class="reader-action" data-save="${id}" aria-pressed="${!!state.saved}">${state.saved?'✓ Saved':'＋ Save for later'}</button></div>
 <div class="reading-progress" aria-hidden="true"><i style="width:${progress*100}%"></i></div>
 <article class="long-reading ${readingState.largeText?'large-text':''}"><header><p class="eyebrow">${escapeHtml(w.type)} · ${w.time} read</p><h2 id="destination-title">${escapeHtml(w.title)}</h2><p class="reader-deck">${escapeHtml(w.summary)}</p><div class="reader-byline"><span>From the tea house <span aria-hidden="true">/</span> Sample writing</span><button class="reader-action type-toggle" aria-pressed="${!!readingState.largeText}" aria-label="Use larger reading text">A<span>A</span></button></div></header><div class="essay-body">${w.body.map(p=>`<p>${escapeHtml(p)}</p>`).join('')}</div><footer class="reader-end"><span aria-hidden="true">✳</span><p>A little pause, before the next thing.</p><p class="sample-note">Fictional sample writing for this village.</p><button class="text-button" data-tab="${w.shelf}">Back to the bookshelf →</button></footer></article>`,'reader');
 routePanel(`tea/read/${id}`,updateHistory);
 restoringReading=true; $('#destination').dataset.reading=id;
 requestAnimationFrame(()=>{
  if($('#destination').dataset.reading!==id){restoringReading=false;return;}
  $('#destination').scrollTop=progress*($('#destination').scrollHeight-$('#destination').clientHeight);
  restoringReading=false; updateReadingProgress();
 });
}
function updateReadingProgress() {
 const d=$('#destination'),bar=d.querySelector('.reading-progress i');if(!bar)return;
 const progress=bounded(d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight));bar.style.width=`${progress*100}%`;
}
function saveReadingPosition() {
 const d=$('#destination'),id=d.dataset.reading;
 if(!id || d.hidden || restoringReading)return;
 readingState[id]={...readingState[id],progress:bounded(d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight))};
 persist('mountain-journal-reading',readingState);
}
$('#destination').addEventListener('scroll',()=>{updateReadingProgress();saveReadingPosition();},{passive:true});

function projectVisual(p) {
 if(p.kind==='village')return `<div class="project-visual village-preview"><img src="assets/village-open-meadows.webp" loading="lazy" decoding="async" alt="The illustrated mountain village prototype"><span class="preview-caption">A LIFE IN LITTLE PLACES</span></div>`;
 if(p.kind==='hillpost')return `<div class="project-visual hillpost-preview"><div class="route-line" aria-hidden="true"><i></i><i></i><i></i></div><div class="ticket"><span class="ticket-brand">hillpost <span>↗</span></span><small>YOUR NEXT RIDE · DEMO</small><strong>Let’s get you<br>home.</strong><div class="ticket-route">Market square <span>→</span> Upper ridge</div><div class="ticket-time"><b>10:40</b><span>Estimated departure<br>Meet by the old clock</span></div></div></div>`;
 return `<div class="project-visual margin-preview"><div class="margin-sheet"><span>MARGIN <span>THURSDAY, 08:12</span></span><strong>A thought<br>worth keeping.</strong><p>What if we made a little more<br>room for the unfinished?</p><span class="pencil-line" aria-hidden="true"></span><small>ONE NOTE. NO HURRY.</small></div></div>`;
}
function renderProjects(updateHistory=true) {
 panel(`${collectionHeader('Design studio / The project board','From a question to a thing.','A few things made with curiosity, care, and a willingness to try again.')}
 <div class="board-meta"><span>SELECTED WORK · 3 STORIES</span>${sampleLabel('Includes fictional projects')}</div>
 <div class="project-board">${window.villageCollection.projects.map(p=>`<button class="project-card" data-project="${p.id}"><span class="paper-tape" aria-hidden="true"></span>${projectVisual(p)}<span class="project-card-meta">${p.category}<span>${p.year}</span></span><strong>${p.title}<span>↗</span></strong><span class="project-card-summary">${p.summary}</span><span class="project-kind">${p.label}</span></button>`).join('')}</div>
 <footer class="collection-footer"><span>The process is part of the story.</span><span>↗</span></footer>`,'board');
 routePanel('studio/work',updateHistory);
}
function showProject(id,updateHistory=true) {
 const p=window.villageCollection.projects.find(p=>p.id===id);if(!p)return;
 panel(`<div class="case-top"><button class="text-button" data-projects>← The project board</button>${sampleLabel(p.label)}</div>${collectionHeader(p.category,p.title,p.summary)}${projectVisual(p)}
 <div class="case-facts"><div><span>ROLE</span><strong>${p.role}</strong></div><div><span>FORMAT</span><strong>${p.format}</strong></div></div><div class="case-story"><section><p class="eyebrow">THE STARTING QUESTION</p><h3>${p.question}</h3><p>${p.intro}</p></section><section><p class="eyebrow">A FEW DECISIONS ALONG THE WAY</p>${p.decisions.map(([title,body],i)=>`<div class="design-decision"><span>0${i+1}</span><div><h4>${title}</h4><p>${body}</p></div></div>`).join('')}</section><section class="case-reflection"><p class="eyebrow">STILL EXPLORING</p><p>${p.reflection}</p></section><button class="text-button" data-projects>Back to the project board →</button></div>`,'case');
 routePanel(`${currentPlace?.id==='projects'?'projects':'studio'}/project/${id}`,updateHistory);
}

function renderAlbums(updateHistory=true) {
 activeAlbum=null;
 panel(`${collectionHeader('Forest cabin / The photo albums','A few things worth keeping.','The small moments between wherever we were going.')}
 <div class="album-note">${sampleLabel('Illustrated placeholders')}<p>These sample albums use village artwork. Your photographs will take their place.</p></div>
 <div class="album-shelf">${window.villageCollection.albums.map((a,i)=>`<button class="album-cover" data-album="${a.id}"><span class="album-picture"><img src="assets/${a.cover}" alt="Illustrated cover for ${a.title}"><span class="album-count">0${i+1} / ${a.photos.length} FRAMES</span></span><strong>${a.title}</strong><span>${a.subtitle}</span></button>`).join('')}</div><footer class="collection-footer"><span>Look a little closer.</span><span>⌑</span></footer>`,'albums');
 routePanel('trail/albums',updateHistory);
}
function showAlbum(id,index=0,updateHistory=true) {
 const a=window.villageCollection.albums.find(a=>a.id===id);if(!a)return;
 const safeIndex=Math.max(0,Math.min(a.photos.length-1,Number.isFinite(index)?index:0)),p=a.photos[safeIndex];
 activeAlbum=id;activePhoto=safeIndex;
 panel(`<header class="album-view-header"><button class="text-button" data-albums>← All albums</button><span>${safeIndex+1} / ${a.photos.length}</span></header><div class="album-view-title"><p class="eyebrow">${a.title} · Illustrated sample</p><h2 id="destination-title">${p.title}</h2></div><figure class="photo-frame"><img src="assets/${p.image}" alt="Illustrated placeholder: ${p.title}" style="object-position:${p.position}"><figcaption>${p.caption}</figcaption></figure><div class="album-navigation"><button class="photo-arrow" data-photo="${safeIndex-1}" aria-label="Previous picture" ${safeIndex===0?'disabled':''}>←</button><div class="filmstrip" aria-label="Pictures in this album">${a.photos.map((photo,i)=>`<button data-photo="${i}" aria-label="Picture ${i+1}: ${photo.title}" aria-pressed="${i===safeIndex}"><img src="assets/${photo.image}" alt="" style="object-position:${photo.position}"></button>`).join('')}</div><button class="photo-arrow" data-photo="${safeIndex+1}" aria-label="Next picture" ${safeIndex===a.photos.length-1?'disabled':''}>→</button></div><p class="album-key-hint">← → Browse pictures <span>Village artwork · photo placeholders</span></p>`,'album');
 routePanel(`trail/album/${id}/${safeIndex+1}`,updateHistory);
}

// Internal links are local hashes, so reload and browser Back also restore a view.
function restoreRoute() {
 const [placeId,view,id,frame]=location.hash.slice(1).split('/');
 if(!content.places.some(p=>p.id===placeId)){returnToMap(false);return;}
 const show=()=>{
  if(view==='shelf' && placeId==='tea')renderShelf(id,false);
  else if(view==='read' && placeId==='tea' && content.writings.some(w=>w.id===id))showWriting(id,false);
  else if(view==='work' && placeId==='studio')renderProjects(false);
  else if(view==='project' && ['studio','projects'].includes(placeId) && window.villageCollection.projects.some(p=>p.id===id))showProject(id,false);
  else if(view==='albums' && placeId==='trail')renderAlbums(false);
  else if(view==='album' && placeId==='trail' && window.villageCollection.albums.some(a=>a.id===id))showAlbum(id,Math.max(0,(parseInt(frame,10)||1)-1),false);
  else {closePanel(false); if(view)history.replaceState(null,'',`#${placeId}`);}
 };
 if(currentPlace?.id===placeId && !$('#room').hidden)show();else enterPlace(placeId,false,show);
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-projects')) {
  if(currentPlace?.id==='studio')renderProjects();else enterPlace('studio',true,()=>renderProjects());
 }
 else if(b.dataset.project)showProject(b.dataset.project);
 else if(b.hasAttribute('data-albums'))renderAlbums();
 else if(b.dataset.album)showAlbum(b.dataset.album);
 else if(b.dataset.photo!=null && activeAlbum) {const focusLabel=b.getAttribute('aria-label');showAlbum(activeAlbum,Number(b.dataset.photo));const focusTarget=[...$('#destination').querySelectorAll('button')].find(el=>el.getAttribute('aria-label')===focusLabel && !el.disabled);focusTarget?.focus({preventScroll:true});}
 else if(b.dataset.save){const id=b.dataset.save;readingState[id]={...readingState[id],saved:!readingState[id]?.saved};persist('mountain-journal-reading',readingState);b.setAttribute('aria-pressed',String(readingState[id].saved));b.textContent=readingState[id].saved?'✓ Saved':'＋ Save for later';announce(readingState[id].saved?'Saved to your bookshelf.':'Removed from saved writing.');}
 else if(b.classList.contains('type-toggle')){const d=$('#destination'),ratio=positionOf(d).y;readingState.largeText=!readingState.largeText;d.querySelector('.long-reading').classList.toggle('large-text',readingState.largeText);b.setAttribute('aria-pressed',String(readingState.largeText));d.scrollTop=ratio*(d.scrollHeight-d.clientHeight);persist('mountain-journal-reading',readingState);}
});
document.addEventListener('keydown',e=>{
 if($('#destination').hidden || $('#destination').dataset.mode!=='album' || !activeAlbum)return;
 const a=window.villageCollection.albums.find(a=>a.id===activeAlbum);
 if(e.key==='ArrowRight' && activePhoto<a.photos.length-1){e.preventDefault();showAlbum(activeAlbum,activePhoto+1);}
 if(e.key==='ArrowLeft' && activePhoto>0){e.preventDefault();showAlbum(activeAlbum,activePhoto-1);}
});
