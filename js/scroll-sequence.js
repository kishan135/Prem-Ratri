(()=>{'use strict';
const FRAME_COUNT=1233, PAD=4, CACHE_LIMIT=110, PRELOAD_RADIUS=22;
const sequence=document.getElementById('sequence'),canvas=document.getElementById('sequenceCanvas'),ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
const loading=document.getElementById('loading'),loadPercent=document.getElementById('loadPercent'),cue=document.getElementById('scrollCue');
const cache=new Map();let dpr=1,cw=0,ch=0,target=0,current=0,lastDraw=-1,ready=0,raf=0;
const src=i=>`frames/frame_${String(i+1).padStart(PAD,'0')}.jpg`;
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);cw=innerWidth;ch=innerHeight;canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.width=cw+'px';canvas.style.height=ch+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';lastDraw=-1;draw(Math.round(current));}
function load(i,priority=false){if(i<0||i>=FRAME_COUNT)return Promise.resolve(null);if(cache.has(i)){const v=cache.get(i);v.t=performance.now();return v.p;}const item={t:performance.now()};item.p=new Promise(res=>{const im=new Image();im.decoding='async';if(priority)im.fetchPriority='high';im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src(i)});cache.set(i,item);trim();return item.p}
function trim(){if(cache.size<=CACHE_LIMIT)return;const protectedFrame=Math.round(current);[...cache.entries()].sort((a,b)=>a[1].t-b[1].t).forEach(([k])=>{if(cache.size>CACHE_LIMIT&&Math.abs(k-protectedFrame)>PRELOAD_RADIUS)cache.delete(k)})}
function cover(im){const iw=im.naturalWidth,ih=im.naturalHeight,s=Math.max(cw/iw,ch/ih),w=iw*s,h=ih*s,x=(cw-w)/2,y=(ch-h)/2;ctx.fillStyle='#000';ctx.fillRect(0,0,cw,ch);ctx.drawImage(im,x,y,w,h)}
async function draw(i){if(i===lastDraw)return;const im=await load(i,true);if(!im)return;if(Math.abs(i-Math.round(current))>4)return;cover(im);lastDraw=i;}
function prefetch(center){for(let r=1;r<=PRELOAD_RADIUS;r++){load(center+r);load(center-r)}}
function progress(){const rect=sequence.getBoundingClientRect(),dist=sequence.offsetHeight-innerHeight;return Math.max(0,Math.min(1,-rect.top/Math.max(1,dist)))}
function onScroll(){target=progress()*(FRAME_COUNT-1);if(progress()>.015)cue.style.opacity='0';else cue.style.opacity='.78'}
function loop(){current+=(target-current)*.16;if(Math.abs(target-current)<.02)current=target;const i=Math.max(0,Math.min(FRAME_COUNT-1,Math.round(current)));draw(i);prefetch(i);raf=requestAnimationFrame(loop)}
async function boot(){resize();const starters=[];for(let i=0;i<36;i++){starters.push(load(i,i<4).then(im=>{if(im){ready++;loadPercent.textContent=Math.round(ready/36*100)+'%'}}))}await Promise.all(starters);await draw(0);loading.classList.add('hidden');onScroll();loop();setTimeout(()=>{for(let i=36;i<Math.min(FRAME_COUNT,150);i+=2)load(i)},300)}
addEventListener('resize',resize,{passive:true});addEventListener('scroll',onScroll,{passive:true});boot();
})();
