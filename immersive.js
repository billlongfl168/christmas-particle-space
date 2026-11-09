import * as T from './model/three.module.js';
import {Dust,particles,uniforms,quality,makeFir,makeGift,makeBell,surface,starShape,ground,orbitStreams} from './particle-art.js';
import {populateWorld} from './christmas-worlds.js';

const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setClearColor(0x030813);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;
document.body.prepend(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(47,1,.03,80);
const previewCamera=new T.PerspectiveCamera(47,1,.03,80);
const ray=new T.Raycaster();
const video=document.querySelector('video');
const start=document.querySelector('#start'),error=document.querySelector('#error');
const zoomLockButton=document.querySelector('#zoom-lock');
let zoomLocked=false;
const worlds=new Map(),states=new Map(),gifts=[],hands=new Map();
const invisible=new T.MeshBasicMaterial({visible:false});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let current='tree',model,stream,transition=null,lastVideo=-1,lastDetection=0,lastFrame=0,frame=0;
let enteredGift=null,hasInteracted=false,lastHandVisible=0;
let openingGift=null;
function createWorld(id) {
  const root=new T.Group(),left=new T.Group(),right=new T.Group(),inner=new T.Group();
  root.add(left,right,inner);scene.add(root);
  const w={id,root,left,right,inner,animations:[],detail:0,proxies:[]};
  worlds.set(id,w);
  states.set(id,{pitch:id==='1'?.32:0,yaw:0,zoom:7.1,displayZoom:7.1,vx:0,vy:0});
  root.visible=id===current;
  return w;
}
function subjectProxy(w,geometry,parent=w.root) {
  const mesh=new T.Mesh(geometry,invisible);mesh.userData={kind:'subject',world:w.id};
  parent.add(mesh);w.proxies.push(mesh);return mesh;
}
const tree=createWorld('tree');
makeFir(tree);
ground(tree.inner,2,-1.97);
orbitStreams(tree,true);
for(const side of [-1,1]){
  const proxy=subjectProxy(tree,new T.ConeGeometry(1.65,3.7,18,1,false,side<0?Math.PI:0,Math.PI),side<0?tree.left:tree.right);

}
const star=surface(tree.inner,new T.ShapeGeometry(starShape(.20)),0xffe7a0,1600,.015);star.position.y=2.02;
const colors=[0xffd790,0xdf4663,0xa8ddf6,0x55b09b,0x728ede];
const anchors=[
  {a:-.6,y:.24,r:.90}, {a:.71,y:-.41,r:1.2},
  {a:2.25,y:-.08,r:1.08}, {a:3.39,y:-.77,r:1.38},
  {a:4.65,y:-1.12,r:1.59},
];
for(let i=0;i<5;i++){
  const anchor=anchors[i],parent=Math.sin(anchor.a)<0?tree.left:tree.right;
  const gift=makeGift(parent,colors[i]);
  gift.id=String(i);
  gift.root.position.set(Math.sin(anchor.a)*anchor.r,anchor.y,Math.cos(anchor.a)*anchor.r);
  gift.root.rotation.y=anchor.a;
  gift.restRotation=anchor.a;
  const support=new Dust();
  support.line([0,anchor.y+.64,0],[gift.root.position.x,anchor.y+.58,gift.root.position.z],650,0x816d4b,.014);
  support.object(parent,.011);
  gift.bodyTarget=new T.Mesh(new T.BoxGeometry(.46,.34,.40),invisible);
  gift.root.add(gift.bodyTarget);
  gift.bodyTarget.userData={kind:'gift',gift};
  gift.lidTarget.userData={kind:'lid',gift};
  gift.rimTarget.userData={kind:'mouth',gift};
  gifts.push(gift);
  if(i===0){
    const charm=surface(gift.root,new T.ShapeGeometry(starShape(.055)),0xfff0b4,500,.009);
    charm.position.set(.13,-.06,.205);
  }
}
const bells=[];
for(let i=0;i<5;i++){
  const a=i*1.37+.3,r=1.0+i*.09;
  const bell=makeBell(Math.sin(a)<0?tree.left:tree.right,Math.sin(a)*r,-.6-i*.12,Math.cos(a)*r,.65);
  bells.push(bell);
}
function build(id) {
  if(worlds.has(id))return worlds.get(id);
  const w=createWorld(id);
  populateWorld(w,id);
  if(id==='0'){
    const shape=starShape(2.05);shape.holes.push(new T.Path(starShape(.58).getPoints().reverse()));
    const geometry=new T.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:false});geometry.translate(0,0,-.19);
    const plain=geometry.toNonIndexed();
    for(const side of [-1,1]){
      const coordinates=plain.attributes.position.array,triangles=[];
      for(let i=0;i<coordinates.length;i+=9){
        const center=(coordinates[i]+coordinates[i+3]+coordinates[i+6])/3;
        if(center*side<0)continue;
        for(let vertex=0;vertex<3;vertex++){
          const offset=i+vertex*3;
          triangles.push(side*Math.max(0,coordinates[offset]*side),coordinates[offset+1],coordinates[offset+2]);
        }
      }
      const half=new T.BufferGeometry();
      half.setAttribute('position',new T.Float32BufferAttribute(triangles,3));
      half.computeVertexNormals();
      subjectProxy(w,half,side<0?w.left:w.right);
    }
    geometry.dispose();plain.dispose();
  }else{
    for(const side of [-1,1]){
      const proxy=subjectProxy(w,new T.BoxGeometry(2,3.4,3.5),side<0?w.left:w.right);
      proxy.position.x=side*.95;
    }
  }
  return w;
}
const snowDust=new Dust();
for(let i=0;i<900*quality;i++)snowDust.add((Math.random()-.5)*14,(Math.random()-.5)*10,(Math.random()-.5)*9,0xb3c6e1,.25+Math.random()*.5);
const snow=snowDust.object(scene,.013);
const snowStart=snow.geometry.attributes.position.array.slice();
const returnGift=makeGift(scene,0xe6c393);
returnGift.root.scale.setScalar(.66);returnGift.open=1;returnGift.lid.position.y=.54;returnGift.lid.rotation.z=-.7;returnGift.rim.visible=true;
returnGift.root.visible=false;
returnGift.bodyTarget=new T.Mesh(new T.BoxGeometry(.46,.34,.40),invisible);
returnGift.root.add(returnGift.bodyTarget);
for(const target of [returnGift.bodyTarget,returnGift.lidTarget,returnGift.rimTarget]){
 target.userData={kind:'gift',gift:returnGift};
}

const cursorDust=new Dust();
for(let i=0;i<95;i++){
 const a=i/95*Math.PI*2;cursorDust.add(Math.cos(a)*.065,Math.sin(a)*.065,0,0xffe4b5,1);
}
const cursors=[0,1].map(()=>{
 const p=particles(cursorDust.positions,cursorDust.colors,.019);
 p.material.depthTest=false;p.renderOrder=100;scene.add(p);p.visible=false;return p;
});
const mainTarget=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType});
const compositeScene=new T.Scene();
const compositeCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
const compositeMaterial=new T.ShaderMaterial({
 uniforms:{source:{value:mainTarget.texture},texel:{value:new T.Vector2(1/innerWidth,1/innerHeight)}},
 vertexShader:'varying vec2 uvScreen; void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`
 uniform sampler2D source; uniform vec2 texel; varying vec2 uvScreen;
 vec3 bright(vec2 at){vec3 c=texture2D(source,at).rgb;float l=max(c.r,max(c.g,c.b));return c*smoothstep(.28,.9,l);}
 void main(){
  vec3 base=texture2D(source,uvScreen).rgb;
  vec3 bloom=vec3(0.);
  float weight=0.;
  for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){
   float w=exp(-float(x*x+y*y)*.48);
   bloom+=bright(uvScreen+vec2(float(x),float(y))*texel*1.7)*w;
   weight+=w;
  }
  gl_FragColor=vec4(base+bloom/weight*.7,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`,
 depthTest:false,depthWrite:false,
});
compositeScene.add(new T.Mesh(new T.PlaneGeometry(2,2),compositeMaterial));
const feedbackDust=new Dust();
for(let i=0;i<180;i++){
 const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.12;
 feedbackDust.add(Math.cos(a)*r,Math.sin(a)*r,(Math.random()-.5)*.05,0xffeac0,.8+Math.random()*.5);
}
const feedback=[0,1].map(()=>{
 const p=particles(feedbackDust.positions,feedbackDust.colors,.018);
 p.material.depthWrite=false;p.visible=false;scene.add(p);return p;
});
const portalScene=new T.Scene();
const portalCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
const portalMaterial=new T.MeshBasicMaterial({depthTest:false,depthWrite:false,transparent:true});
const portalQuad=new T.Mesh(new T.PlaneGeometry(2,2),portalMaterial);portalScene.add(portalQuad);

function setCamera(cam,state) {
 cam.position.set(0,.12,(state.displayZoom??state.zoom)*Math.max(1,.85/camera.aspect));
 cam.lookAt(0,0,0);cam.aspect=camera.aspect;cam.updateProjectionMatrix();cam.updateMatrixWorld();
}
function applyState(w) {
 const s=states.get(w.id);
 w.root.rotation.set(s.pitch,s.yaw,0);
 w.detail=T.MathUtils.clamp((3.5-s.zoom)/2.8,0,1);
 w.left.position.x=0;w.right.position.x=0;
 const granular=w.detail>.12;
 if(w.granular!==granular){
  w.granular=granular;
  w.root.traverse(object=>{
   if(object.userData.particleOccluder)object.visible=!granular;
   if(object.isPoints)object.material.depthWrite=!granular;
  });
 }
}
function setGiftOpen(gift,value) {
 gift.open=T.MathUtils.clamp(value,0,1);
 gift.lid.position.set(-gift.open*.10,.18+gift.open*.55,0);
 gift.lid.rotation.z=-gift.open*1.05;
 gift.bow.scale.setScalar(1+Math.sin(gift.open*Math.PI)*.45);
 gift.rim.visible=gift.open>.80;
 if(gift.open>.12&&!gift.preview) {
  build(gift.id);
  const target=new T.WebGLRenderTarget(384,384);
  target.texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:target.texture,side:T.DoubleSide});
  const opening=new T.Mesh(new T.PlaneGeometry(.405,.345),material);
  opening.rotation.x=-Math.PI/2;opening.position.y=.155;
  gift.root.add(opening);gift.preview={target,opening};
 }
 if(gift.preview)gift.preview.opening.visible=gift.open>.12;
}
function renderPreview(gift,time) {
 if(!gift.preview)return;
 const w=build(gift.id);
 const visibility=[...worlds.values()].map(item=>[item,item.root.visible]);
 for(const item of worlds.values())item.root.visible=item===w;
 const snowVisible=snow.visible;snow.visible=false;
 const returnVisible=returnGift.root.visible;returnGift.root.visible=false;
 const cursorVisibility=cursors.map(c=>c.visible);cursors.forEach(c=>c.visible=false);
 const feedbackVisibility=feedback.map(c=>c.visible);feedback.forEach(c=>c.visible=false);
 applyState(w);w.animations.forEach(fn=>fn(time));
 setCamera(previewCamera,states.get(gift.id));
 renderer.setRenderTarget(gift.preview.target);renderer.render(scene,previewCamera);renderer.setRenderTarget(null);
 for(const [item,visible]of visibility)item.root.visible=visible;
 snow.visible=snowVisible;returnGift.root.visible=returnVisible;cursors.forEach((c,i)=>c.visible=cursorVisibility[i]);feedback.forEach((c,i)=>c.visible=feedbackVisibility[i]);
}
function projectPoint(point) {
 const p=point.clone().project(camera);
 return {x:(p.x+1)/2,y:(1-p.y)/2};
}
function screenPoint(x,y,distance) {
 return new T.Vector3(x*2-1,1-y*2,.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(distance).add(camera.position);
}
function cancelGrabs() {
 for(const hand of hands.values()){hand.target=null;hand.lastTap=null;hand.armed=false;hand.blocked=true;}
}
function startTransition(gift,returning=false) {
 if(transition)return;
 cancelGrabs();
 const p=new T.Vector3();
 if(returning){
  current='tree';
  for(const [id,w]of worlds)w.root.visible=id==='tree';
  returnGift.root.visible=false;
  applyState(tree);setCamera(camera,states.get('tree'));scene.updateMatrixWorld(true);
 }
 gift.root.getWorldPosition(p);
 const screen=projectPoint(p);
 transition={gift,returning,start:performance.now(),screen};
 enteredGift=gift;
 if(!returning){
  const color=new T.Color(colors[Number(gift.id)]);
  const paper=[...returnGift.body.children.slice(0,-1),returnGift.lid.children[0]];
  for(const object of paper){
   const attribute=object.geometry?.attributes.color;
   if(!attribute)continue;
   for(let i=0;i<attribute.count;i++){
    const brightness=.60+(i%11)/22;
    attribute.setXYZ(i,color.r*brightness,color.g*brightness,color.b*brightness);
   }
   attribute.needsUpdate=true;
  }
 }
}
function finishTransition() {
 current=transition.returning?'tree':transition.gift.id;
 for(const [id,w]of worlds)w.root.visible=id===current;
 returnGift.root.visible=current!=='tree';transition=null;cancelGrabs();
}
function toggleZoomLock() {
 if(transition||openingGift)return;
 zoomLocked=!zoomLocked;
 zoomLockButton.setAttribute('aria-pressed',String(zoomLocked));
 const state=states.get(current);
 if(zoomLocked)state.zoom=state.displayZoom;
 for(const hand of hands.values()){
  hand.zoomAperture=hand.openness;
  hand.zoomDelta=0;
  hand.lastZoomAt=undefined;
 }
}
zoomLockButton.onclick=toggleZoomLock;

function hit(hand) {
 if(!zoomLockButton.hidden){
  const bounds=zoomLockButton.getBoundingClientRect();
  const dx=hand.x*innerWidth-(bounds.left+bounds.width/2);
  const dy=hand.y*innerHeight-(bounds.top+bounds.height/2);
  if(Math.hypot(dx,dy)<=bounds.width/2+12)return {kind:'zoom-lock'};
 }
 ray.setFromCamera(new T.Vector2(hand.x*2-1,1-hand.y*2),camera);
 const w=worlds.get(current);
 const objects=[...w.proxies];
 if(current==='tree'){
  for(const gift of gifts){objects.push(gift.bodyTarget,gift.lidTarget);if(gift.open>.80)objects.push(gift.rimTarget);}
 }else objects.push(returnGift.bodyTarget,returnGift.lidTarget,returnGift.rimTarget);
 const hits=ray.intersectObjects(objects,true);
 const nearest=hits[0];
 const direct=nearest?.object.userData.kind?nearest.object.userData:nearest?.object.parent.userData;
 if(direct?.gift)return {kind:direct.kind,gift:direct.gift,open:direct.gift.open,point:nearest.point.clone()};

 // Allow a finger-sized screen margin, but reject branch gifts behind the tree.
 let candidate=null,best=Infinity;
 for(const gift of current==='tree'?gifts:[returnGift]){
  const center=gift.bodyTarget.getWorldPosition(new T.Vector3());
  const screen=projectPoint(center);
  const pixels=Math.hypot((screen.x-hand.x)*innerWidth,(screen.y-hand.y)*innerHeight);
  const radius=Math.max(38,Math.min(innerWidth,innerHeight)*.065);
  if(pixels>radius||pixels>=best)continue;
  if(gift!==returnGift){
   ray.setFromCamera(new T.Vector2(screen.x*2-1,1-screen.y*2),camera);
   const obstruction=ray.intersectObjects(w.proxies,true)[0];
   if(obstruction&&obstruction.distance+.32<camera.position.distanceTo(center))continue;
  }
  candidate={kind:'gift',gift,open:gift.open,point:center};best=pixels;
 }
 if(candidate)return candidate;
 if(direct?.kind==='subject')return {kind:'rotate',point:nearest.point.clone()};
 return {kind:'zoom'};
}
function beginGrab(hand,now,target) {
 if(!hand.armed||hand.blocked||transition||openingGift)return;
 const previous=hand.lastTap;
 const sticky=previous&&now-previous.time<=1300&&Math.hypot(hand.x-previous.x,hand.y-previous.y)<.14;
 if(target.kind==='zoom-lock'){
  if(![...hands.values()].some(other=>other.target?.kind==='zoom-lock'))toggleZoomLock();
  hand.lastTap=null;
 }
 hand.target=sticky&&target.kind!=='zoom-lock'?{kind:'gift',gift:previous.gift,open:previous.gift.open}:target;
 if(hand.target.point)hand.target.localPoint=worlds.get(current).root.worldToLocal(hand.target.point.clone());
 hand.start={x:hand.x,y:hand.y};hand.last={...hand.start};hand.grabAt=now;
 hasInteracted=true;
 const state=states.get(current);state.vx=state.vy=0;
}
function releaseGrab(hand,now=null) {
 const target=hand.target;
 hand.target=null;
 if(now===null||!target?.gift){
  hand.lastTap=null;
  return;
 }
 const moved=Math.hypot(hand.x-hand.start.x,hand.y-hand.start.y);
 if(now-hand.grabAt>700||moved>.10){
  hand.lastTap=null;
  return;
 }
 const previous=hand.lastTap;
 if(previous?.gift===target.gift&&now-previous.time<=1300&&!openingGift&&!transition){
  const gift=target.gift;
  gift.tapUntil=0;
  if(gift===returnGift){
   startTransition(enteredGift,true);
  }else{
   openingGift={gift,start:performance.now(),from:gift.open};
   cancelGrabs();
  }
 }else{
  hand.lastTap={gift:target.gift,time:now,x:hand.x,y:hand.y};
  target.gift.tapUntil=performance.now()+1300;
 }
}
function trackHands(result,now) {
 if(result.landmarks.length){lastHandVisible=now;if(error.dataset.tracking==='true'){error.textContent='';delete error.dataset.tracking;}}
 const seen=new Set();
 let wave=0;
 for(let i=0;i<result.landmarks.length;i++){
  const p=result.landmarks[i],id=result.handedness[i][0].categoryName;
  seen.add(id);
  let h=hands.get(id);
  const raw={x:1-p[8].x,y:p[8].y};
  if(!h){h={...raw,pinched:false,armed:false,blocked:true,count:0,seen:now};hands.set(id,h);}
  const dt=Math.min(.1,(now-h.seen)/1000);h.seen=now;
  const smoothing=1-Math.exp(-Math.max(.016,dt)*17);
  h.x+=(raw.x-h.x)*smoothing;h.y+=(raw.y-h.y)*smoothing;
  const aspect=video.videoWidth/video.videoHeight||4/3;
  const distance=(a,b)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y);
  const palmX=1-(p[0].x+p[5].x+p[9].x+p[13].x+p[17].x)/5;
  const previousPalm=h.palmX;
  h.palmX=previousPalm===undefined?palmX:previousPalm+(palmX-previousPalm)*smoothing;
  const extended=[8,12,16,20].filter(tip=>distance(p[tip],p[0])>distance(p[tip-2],p[0])*1.12).length;
  const palmLength=Math.max(.025,distance(p[0],p[9]));
  const aperture=[12,16,20].reduce((sum,tip)=>sum+distance(p[tip],p[tip-3])/palmLength,0)/3;
  const openness=T.MathUtils.clamp((aperture-.20)/.95,0,1);
  const previousOpenness=h.openness;
  h.openness=previousOpenness===undefined?openness:previousOpenness+(openness-previousOpenness)*smoothing;
  h.openDelta=previousOpenness===undefined?0:h.openness-previousOpenness;
  const ratio=distance(p[8],p[4])/palmLength;
  const openPalm=extended>=3;
  const aim=hit(h);
  h.overZoomLock=aim.kind==='zoom-lock';
  const pendingTap=h.lastTap&&now-h.lastTap.time<=1300&&Math.hypot(h.x-h.lastTap.x,h.y-h.lastTap.y)<.14;
  if(!h.pinched&&aim.gift)h.giftAim={target:aim,time:now,x:h.x,y:h.y};
  const recentAim=h.giftAim&&now-h.giftAim.time<=200&&Math.hypot(h.x-h.giftAim.x,h.y-h.giftAim.y)<.06;
  const target=h.overZoomLock||aim.gift||!recentAim?aim:h.giftAim.target;
  const giftGesture=!!(h.target?.gift||pendingTap||target.gift);
  const fingersReady=distance(p[8],p[0])/palmLength>1.05;
  if(!h.pinched&&ratio>=.42){h.armed=true;h.blocked=false;}
  if(!h.pinched)h.openRatio=Math.max(ratio,(h.openRatio??ratio)-.025);

  // Compare with the user's own opening, then latch a release distance for this pinch.
  const closing=ratio<.36||ratio<.56&&(h.openRatio??ratio)-ratio>.12;
  const pressed=h.pinched?ratio<h.releaseRatio:
   h.armed&&!h.blocked&&closing&&(h.overZoomLock||giftGesture||fingersReady&&Math.abs(h.openDelta)<.035);
  if(pressed!==h.pinched)h.count++;else h.count=0;
  if(h.count>=2){
   h.count=0;h.pinched=pressed;
   if(pressed){
    h.releaseRatio=T.MathUtils.clamp(ratio+.13,.40,.65);
    beginGrab(h,now,target);
   }else{
    h.openRatio=ratio;
    releaseGrab(h,now);
   }
  }

  if(zoomLocked||h.overZoomLock||h.zoomAperture===undefined||h.pinched||pressed||transition||openingGift)h.zoomAperture=h.openness;
  const apertureChange=h.openness-h.zoomAperture;
  h.zoomDelta=0;
  if(Math.abs(apertureChange)>.024){
   h.zoomDelta=apertureChange;h.zoomAperture=h.openness;h.lastZoomAt=now;
  }
  if(openPalm&&h.openPalm&&previousPalm!==undefined&&!h.pinched&&!pressed&&
    !h.overZoomLock&&(zoomLocked||Math.abs(h.openDelta)<.018&&now-(h.lastZoomAt??-Infinity)>120)){
   const delta=h.palmX-previousPalm;
   if(Math.abs(delta)>.002&&Math.abs(delta)<.10&&Math.abs(delta)>Math.abs(wave))wave=delta;
  }
  h.openPalm=openPalm;
 }
 for(const [id,h]of hands){
  if(!seen.has(id)){
   states.get(current).vx=states.get(current).vy=0;h.openPalm=false;h.palmX=undefined;h.openness=undefined;h.openDelta=0;h.zoomAperture=undefined;h.giftAim=null;h.count=0;
   if(now-h.seen>260){
    releaseGrab(h);h.armed=false;h.blocked=true;hands.delete(id);
   }
  }
 }
 zoomLockButton.toggleAttribute('data-hand-hover',[...hands.entries()].some(([id,h])=>seen.has(id)&&h.overZoomLock));
 if(transition||openingGift)return;
 if([...hands.entries()].some(([id,h])=>h.target&&!seen.has(id)))return;
 const active=[...hands.values()].filter(h=>h.pinched&&h.target&&!h.blocked);
 const s=states.get(current);
 const palms=[...hands.entries()]
  .filter(([id,h])=>seen.has(id)&&!h.target&&!h.pinched)
  .map(([,h])=>h);
 if(!active.length&&palms.length){
  const delta=palms.reduce((sum,h)=>sum+h.zoomDelta,0)/palms.length;
  if(!zoomLocked&&delta){
   s.vx=s.vy=0;
   s.zoom=T.MathUtils.clamp(s.zoom*Math.exp(-delta*2.65),.72,12);
   hasInteracted=true;
  }else if(wave){
   s.yaw+=wave*7.5;s.vx=wave*.45;s.vy=0;
   hasInteracted=true;
  }
 }
 for(const h of active){
  const dx=h.x-h.last.x,dy=h.y-h.last.y,target=h.target;
  if(target.kind==='rotate'){
   s.yaw+=dx*6;s.pitch=T.MathUtils.clamp(s.pitch+dy*5,-1.5,1.5);
   s.vx=dx*1.2;s.vy=dy;
  }else if(target.kind==='lid'){
   setGiftOpen(target.gift,Math.min(target.open,target.open+(h.start.y-h.y)*4.5));
  }
  h.last={x:h.x,y:h.y};
 }
}
start.onclick=async()=>{
 if(start.disabled)return;
 start.disabled=true;start.textContent='正在开启…';
 try{
  stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
  video.srcObject=stream;await video.play();
  const {FilesetResolver,HandLandmarker}=await import('./model/vision_bundle.mjs');
  model??=await HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('./model/wasm'),{
   baseOptions:{modelAssetPath:'./model/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,
   minHandDetectionConfidence:.55,minTrackingConfidence:.6,
  });
  start.hidden=true;zoomLockButton.hidden=false;error.textContent='';lastHandVisible=performance.now();
  stream.getVideoTracks()[0].addEventListener('ended',()=>{
   cancelGrabs();hands.clear();start.hidden=false;zoomLockButton.hidden=true;error.textContent='摄像头已断开，请重新开启。';
  });
 }catch(e){
  stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;
  error.textContent=e.name==='NotAllowedError'?'请允许摄像头访问后重试。':'摄像头或手势模型无法启动，请重试。';
 }finally{start.disabled=false;start.textContent='开启摄像头';}
};
addEventListener('pagehide',()=>{stream?.getTracks().forEach(track=>track.stop());cancelGrabs();});
function resize(){
 renderer.setSize(innerWidth,innerHeight);
 mainTarget.setSize(Math.floor(innerWidth*renderer.getPixelRatio()),Math.floor(innerHeight*renderer.getPixelRatio()));
 compositeMaterial.uniforms.texel.value.set(1/mainTarget.width,1/mainTarget.height);
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
let frameAverage=16.7,adjusted=false;
renderer.setAnimationLoop(now=>{
 const dt=Math.min(.05,(now-(lastFrame||now))/1000);lastFrame=now;frame++;
 const time=reducedMotion.matches?0:now/1000;uniforms.time.value=time;
 if(model&&stream&&video.readyState>=2&&video.currentTime!==lastVideo&&now-lastDetection>50){
  lastVideo=video.currentTime;lastDetection=now;
  try{trackHands(model.detectForVideo(video,now),now);}
  catch{cancelGrabs();hands.clear();stream.getTracks().forEach(track=>track.stop());stream=null;model.close();model=null;start.hidden=false;zoomLockButton.hidden=true;error.textContent='手势识别中断，请重新开启摄像头。';}
 }
 if(stream&&model&&now-lastHandVisible>1800){
  error.dataset.tracking='true';
  error.textContent='未识别到手，请将整只手放进镜头，并先张开拇指和食指。';
 }
 if(openingGift){
  const {gift,start:openedAt,from}=openingGift;
  const progress=T.MathUtils.clamp((now-openedAt)/550,0,1);
  setGiftOpen(gift,T.MathUtils.lerp(from,1,progress*progress*(3-2*progress)));
  if(progress===1){
   openingGift=null;startTransition(gift);
  }
 }
 const s=states.get(current),w=worlds.get(current);
 s.displayZoom=T.MathUtils.lerp(s.displayZoom??s.zoom,s.zoom,1-Math.exp(-dt*10));
 if(!hasInteracted&&!reducedMotion.matches&&current==='tree')s.yaw=Math.sin(time*.12)*.13;
 if(![...hands.values()].some(h=>h.target)&&!transition){
  s.yaw+=s.vx*dt*60;s.pitch=T.MathUtils.clamp(s.pitch+s.vy*dt*60,-1.5,1.5);
  s.vx*=Math.exp(-dt*10);s.vy*=Math.exp(-dt*10);
 }
 applyState(w);setCamera(camera,s);
 w.animations.forEach(fn=>fn(time));
 for(const bell of bells){bell.root.rotation.z=Math.sin(time*1.4+bell.root.position.x)*.025+s.vx*.4;bell.clapper.rotation.z=Math.sin(time*1.4-.6)*.04;}
 for(const gift of gifts){
  gift.root.rotation.z=Math.sin(time*1.1+gift.root.position.x)*.012+s.vx*.2;
  if(!openingGift){
   const pulse=now<(gift.tapUntil||0)?1.4:1+Math.sin(gift.open*Math.PI)*.45;
   gift.bow.scale.lerp(new T.Vector3(pulse,pulse,pulse),1-Math.exp(-dt*12));
  }
  const holding=[...hands.values()].some(h=>h.target?.kind==='mouth'&&h.target.gift===gift);
  if(gift.preview&&!holding&&!transition)gift.preview.opening.scale.lerp(new T.Vector3(1,1,1),1-Math.exp(-dt*6));
 }
 const snowPositions=snow.geometry.attributes.position.array;
 for(let i=0;i<snowPositions.length;i+=3){
  snowPositions[i]=snowStart[i]+Math.sin(time*.13+i)*.08;
  snowPositions[i+1]=((snowStart[i+1]+5-time*.045)%10+10)%10-5;
 }
 snow.geometry.attributes.position.needsUpdate=true;
 returnGift.root.position.copy(screenPoint(.12,.83,camera.position.z*.72));
 returnGift.root.scale.setScalar(.66*s.displayZoom/7.1);
 returnGift.root.rotation.set(.35,.2,0);
 returnGift.bow.scale.setScalar(now<(returnGift.tapUntil||0)?1.4:1);
 const tracked=[...hands.values()];
 cursors.forEach((cursor,i)=>{
  const h=tracked[i];cursor.visible=!!h;
  if(!h){feedback[i].visible=false;return;}
  cursor.position.copy(screenPoint(h.x,h.y,camera.position.z*.55));
  cursor.scale.setScalar((h.pinched?.62:1)*s.displayZoom/7.1);
  cursor.material.uniforms.pointSize.value=h.pinched?.035:.019;
  if(frame%4===0&&!h.target)h.hover=hit(h);
  const target=h.target||h.hover;
  cursor.material.uniforms.pointSize.value=h.pinched?.045:(target?.kind==='zoom'?.017:.028);
  const sparkle=feedback[i];
  sparkle.visible=!!target&&target.kind!=='zoom';
  const attachment=target?.localPoint?w.root.localToWorld(target.localPoint.clone()):target?.point;
  sparkle.position.copy(attachment||cursor.position);
  const radius=h.pinched?.35:1;
  sparkle.scale.lerp(new T.Vector3(radius,radius,radius),1-Math.exp(-dt*12));
  sparkle.rotation.z=time*.3;
 });
 if(current==='tree'){
  for(let i=0;i<gifts.length;i++)if(gifts[i].open>.12&&frame%10===i*2)renderPreview(gifts[i],time);
 }
 if(transition)renderPreview(transition.gift,time);
 renderer.setRenderTarget(mainTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);
 renderer.render(compositeScene,compositeCamera);
 if(transition){
  const u=T.MathUtils.clamp((now-transition.start)/950,0,1),ease=u*u*(3-2*u);
  const amount=transition.returning?1-ease:ease;
  portalMaterial.map=transition.gift.preview.target.texture;
  portalMaterial.opacity=transition.returning?Math.min(1,(1-u)*3):1;
  const start=transition.screen;
  portalQuad.position.set((start.x*2-1)*(1-amount),(1-start.y*2)*(1-amount),0);
  portalQuad.scale.set(.06+.94*amount,.06+.94*amount,1);
  renderer.autoClear=false;renderer.clearDepth();renderer.render(portalScene,portalCamera);renderer.autoClear=true;
  if(u>=1)finishTransition();
 }
 frameAverage=frameAverage*.97+dt*1000*.03;
 if(frame>120&&!adjusted&&frameAverage>27){
  const ratio=Math.min(devicePixelRatio,1.15);renderer.setPixelRatio(ratio);uniforms.pixelRatio.value=ratio;resize();adjusted=true;
 }
});
