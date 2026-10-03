/* One geometry definition drives both the visible road and the vehicle. */
(() => {
 const segments = [
  [[-140,615],[55,680],[257,778],[440,869]],
  [[440,869],[623,960],[703,1010],[850,1080]]
 ];
 const path = `M ${segments[0][0].join(' ')} ` + segments.map(s=>`C ${s.slice(1).map(p=>p.join(' ')).join(' ')}`).join(' ');
 const pointAt = (s,t) => {
  const u=1-t;
  return {x:u*u*u*s[0][0]+3*u*u*t*s[1][0]+3*u*t*t*s[2][0]+t*t*t*s[3][0],
   y:u*u*u*s[0][1]+3*u*u*t*s[1][1]+3*u*t*t*s[2][1]+t*t*t*s[3][1],
   dx:3*u*u*(s[1][0]-s[0][0])+6*u*t*(s[2][0]-s[1][0])+3*t*t*(s[3][0]-s[2][0]),
   dy:3*u*u*(s[1][1]-s[0][1])+6*u*t*(s[2][1]-s[1][1])+3*t*t*(s[3][1]-s[2][1])};
 };
 const samples=[];let length=0;
 for(const [j,s] of segments.entries())for(let i=j?1:0;i<=240;i++){
  const p=pointAt(s,i/240), previous=samples.at(-1);
  if(previous)length+=Math.hypot(p.x-previous.x,p.y-previous.y);
  samples.push({...p,distance:length});
 }
 function at(distance, offset=0) {
  distance=Math.min(length,Math.max(0,distance));
  let lo=0,hi=samples.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(samples[mid].distance<distance)lo=mid+1;else hi=mid;}
  const a=samples[Math.max(0,lo-1)], b=samples[lo], t=(distance-a.distance)/(b.distance-a.distance||1);
  const angle=Math.atan2(a.dy+(b.dy-a.dy)*t,a.dx+(b.dx-a.dx)*t);
  return {x:a.x+(b.x-a.x)*t-Math.sin(angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(angle)*offset,angle};
 }
 window.VillageRoad={path,length,at,width:46,speed:18,cycleSeconds:length/18+3};
})();
