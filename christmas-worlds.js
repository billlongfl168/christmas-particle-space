import * as T from './model/three.module.js';
import {Dust,quality,surface,boxSurface,makeFir,makeBell,ground,starWorld,orbitStreams} from './particle-art.js';

function terrain(w) {
  for(const side of [-1,1]){
    const group=side<0?w.left:w.right;
    const top=new Dust(),rock=new Dust();
    for(let i=0;i<14000*quality;i++){
      const x=Math.random()*2.25*side,z=(Math.random()-.5)*3.5;
      const y=-.50+.18*Math.sin(z*1.7)+.09*Math.cos(x*3);
      top.add(x,y,z,0xc4d5e7,.45+Math.random()*.5);
      if(i%2===0)rock.add(x,y-Math.random()*.75,z,0x6c8198,.45+Math.random()*.4);
    }
    top.object(group,.014);rock.object(group,.013);
  }
}
function cabin(parent,x,z,size=1) {
  const g=new T.Group();g.position.set(x,-.15,z);g.scale.setScalar(size);parent.add(g);
  boxSurface(g,.40,.43,.42,0x94725a,3200);
  const roof=surface(g,new T.ConeGeometry(.36,.25,4),0xdfebf0,2300,.012);
  roof.rotation.y=Math.PI/4;roof.position.y=.31;
  const windows=new Dust();
  for(const side of [-1,1])for(let i=0;i<350*quality;i++){
    windows.add(side*.11+(Math.random()-.5)*.075,.025+(Math.random()-.5)*.12,.216,0xffdb86,1.1);
  }
  windows.object(g,.012);
  const eaves=new Dust();
  for(let i=0;i<16;i++){
    const x=(i/15-.5)*.42;eaves.line([x,.23,.23],[x,.16-Math.random()*.05,.23],35,0xe3e9ef,.003);
  }
  eaves.object(g,.009);
  const chimney=boxSurface(g,.07,.21,.08,0x9a8b7c,300);chimney.position.set(.11,.39,-.07);
}
function trackPosition(a) {
  return new T.Vector3(Math.cos(a)*1.52,-.54-.35*(.5+.5*Math.sin(a)),Math.sin(a)*1.15);
}
function village(w) {
  terrain(w);
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2;
    cabin(Math.cos(a)<0?w.left:w.right,Math.cos(a)*.94,Math.sin(a)*.75,.85);
  }
  const rails=new Dust();
  for(let i=0;i<8000*quality;i++){
    const a=Math.random()*Math.PI*2,p=trackPosition(a);
    const side=i%2?-1:1;
    rails.add(p.x+Math.cos(a)*side*.065,p.y,p.z+Math.sin(a)*side*.065,0xb1bfc8,.7);
    if(i%10===0)rails.line([p.x-.11,p.y-.018,p.z],[p.x+.11,p.y-.018,p.z],10,0x7b6a57,.018);
  }
  rails.object(w.inner,.012);
  const bridge=new Dust();
  for(let n=0;n<8;n++){
    const a=n*.09-.34,p=trackPosition(a);
    bridge.line([p.x,p.y-.04,p.z],[p.x,-1.3,p.z],180,0x9e8c77,.023);
    if(n<7){const next=trackPosition(a+.09);bridge.line([p.x,-1.1,p.z],[next.x,next.y,next.z],130,0x8b806f,.02);}
  }
  bridge.object(w.inner,.012);
  const tunnel=surface(w.inner,new T.TorusGeometry(.25,.055,10,38,Math.PI),0x667b8b,1900,.014);
  tunnel.rotation.y=Math.PI/2;tunnel.position.copy(trackPosition(Math.PI));tunnel.position.y+=.04;
  const tunnelPath=[];
  for(let i=0;i<=20;i++){
    const p=trackPosition(Math.PI-.36+i/20*.72);
    p.y+=.07;tunnelPath.push(p);
  }
  surface(w.inner,new T.TubeGeometry(new T.CatmullRomCurve3(tunnelPath),32,.265,20,false),0x576b7f,6200,.013);
  const train=new T.Group();w.inner.add(train);
  boxSurface(train,.34,.19,.14,0x8c2239,1800);
  const locomotive=surface(train,new T.CylinderGeometry(.062,.062,.23,20),0xdea66b,1100,.011);
  locomotive.rotation.z=Math.PI/2;locomotive.position.set(.12,.035,0);
  const windows=new Dust();
  for(const side of [-1,1])for(let i=0;i<240*quality;i++)windows.add((Math.random()-.5)*.22,.04+(Math.random()-.5)*.07,side*.074,0xffda8b,1);
  windows.object(train,.01);
  const wheels=[];
  for(const x of [-.11,.02,.14])for(const z of [-.09,.09]){
    const wheel=surface(train,new T.TorusGeometry(.039,.008,6,20),0xc6b29b,180,.009);
    wheel.position.set(x,-.105,z);wheels.push(wheel);
  }
  w.animations.push(t=>{
    const a=t*.26;train.position.copy(trackPosition(a));train.position.y+=.12;
    train.rotation.y=-Math.atan2(-Math.cos(a)*1.15,-Math.sin(a)*1.52);
    wheels.forEach(wheel=>wheel.rotation.z=t*5);
  });
  const horse=new T.Group();horse.position.set(0,-.20,0);w.inner.add(horse);
  const body=surface(horse,new T.SphereGeometry(.12,18,12),0xb78b62,1700,.01);body.scale.set(1.5,.65,.6);
  const neck=boxSurface(horse,.06,.18,.055,0xd2a777,450);neck.position.set(.12,.11,0);neck.rotation.z=-.3;
  const head=surface(horse,new T.SphereGeometry(.06,12,10),0xc59a6c,500,.009);head.position.set(.16,.2,0);head.scale.x=1.4;
  const rocker=new Dust();
  for(let i=0;i<1500*quality;i++){const a=Math.random()*1.6+3.9;rocker.add(Math.cos(a)*.25,.02+Math.sin(a)*.23,(i%2?1:-1)*.075,0xe1b879,.8)}
  rocker.object(horse,.009);w.animations.push(t=>horse.rotation.z=Math.sin(t*1.4)*.09);
}
function snowForest(w) {
  const centralTree={left:new T.Group(),right:new T.Group(),inner:new T.Group()};
  w.inner.add(centralTree.left,centralTree.right,centralTree.inner);
  makeFir(centralTree,2.9,new T.Vector3(0,-.1,0),.75);
  ground(w.inner,2,-1.6);
  for(const side of [-1,1]){
    const shell=new Dust(),ice=new Dust();
    for(let i=0;i<11000*quality;i++){
      const y=Math.random()*2-1,a=Math.random()*Math.PI+(side<0?Math.PI:0),r=Math.sqrt(1-y*y)*2;
      shell.add(Math.sin(a)*r,y*2,Math.cos(a)*r,0xa4d6f3,.2+Math.random()*.4);
    }
    shell.object(side<0?w.left:w.right,.009);
    for(let i=0;i<7;i++){
      const x=side*(.8+i*.12),z=-.7+i*.22;
      ice.line([x,-1.5,z],[x*.9,-.3-i*.09,z],250,0xb7d9f7,.009);
      for(let b=0;b<5;b++)ice.line([x,-1.2+b*.16,z],[x+side*.19,-1.05+b*.16,z+.12],100,0xa1cce8,.008);
    }
    ice.object(side<0?w.left:w.right,.011);
  }
  for(let layer=0;layer<4;layer++){
    const snow=new Dust();
    for(let i=0;i<1400*quality;i++){
      const a=Math.random()*6.283,r=.3+Math.random()*1.3;
      snow.add(Math.cos(a)*r,(layer-1.5)*.6+Math.random()*.15,Math.sin(a)*r,0xd2e9fa,.5+Math.random()*.5);
    }
    const ring=snow.object(w.inner,.013);
    w.animations.push(t=>{ring.rotation.y=t*(.08+layer*.04);ring.position.y=-((t*.06+layer*.07)%.4)});
  }
}
function clockTower(w) {
  for(const side of [-1,1]){
    const g=side<0?w.left:w.right;
    const post=boxSurface(g,.15,3.3,.18,0x82959c,4200);post.position.set(side*1.28,0,0);
    const beam=boxSurface(g,1.35,.15,.24,0xb8a68c,2200);beam.position.set(side*.65,1.25,0);
    const braces=new Dust();braces.line([side*1.25,.65,0],[side*.65,1.25,0],800,0xc3b096,.05);braces.object(g,.013);
    const bell=makeBell(g,side*.57,.5,0,2.8);
    const axle=surface(g,new T.CylinderGeometry(.045,.045,.9,14),0xbbad8a,850,.012);axle.rotation.z=Math.PI/2;axle.position.set(side*.57,.96,0);
    const pulse=new Dust();
    for(let i=0;i<1800*quality;i++){
      const a=Math.random()*6.283;
      pulse.add(Math.cos(a)*.64,-.02,Math.sin(a)*.64,0xffdd8e,.8);
    }
    const ring=pulse.object(g,.015);ring.position.x=side*.57;
    let contacting=false,lastImpact=-10;
    w.animations.push(t=>{
      const phase=t*1.5+side*.8;
      bell.root.rotation.z=Math.sin(phase)*.14;
      bell.clapper.rotation.z=Math.sin(phase-.8)*.40;
      const contact=Math.abs(Math.sin(phase-.8))>.96;
      if(contact&&!contacting)lastImpact=t;
      contacting=contact;
      const age=Math.min(1,(t-lastImpact)/1.3);
      ring.scale.set(1+age*1.4,1,1+age*1.4);
      ring.material.uniforms.pointSize.value=.018*(1-age);
      ring.visible=age<.85;
    });
  }
  ground(w.inner,1.8,-1.75,0x8299ae,4500);
}
function auroraValley(w) {
  terrain(w);
  for(let layer=0;layer<6;layer++){
    const dust=new Dust(),n=6500*quality;
    for(let i=0;i<n;i++){
      const x=Math.random()*4.6-2.3,u=Math.random();
      dust.add(x,.2+u*1.5, (layer-2.5)*.42,layer%3===0?0xb19ae9:0x5ae5b2,.25+u*.65);
    }
    const curtain=dust.object(layer<3?w.left:w.right,.013);
    const original=curtain.geometry.attributes.position.array.slice();
    w.animations.push(t=>{
      const array=curtain.geometry.attributes.position.array;
      for(let i=0;i<array.length;i+=3){
        const x=original[i],y=original[i+1];
        array[i+1]=y+Math.sin(x*1.7+t*.27+layer)*.33;
        array[i+2]=original[i+2]+Math.sin(x*2.2+t*.2+layer)*.18+Math.sin(y*4+t*.4)*.06;
      }
      curtain.geometry.attributes.position.needsUpdate=true;
    });
  }
  const ridges=new Dust();
  for(let i=0;i<12000*quality;i++){
    const x=(Math.random()-.5)*6,z=-1.7-Math.random()*.8;
    const y=-.5+Math.abs(Math.sin(x*1.7))*.65-Math.random()*.4;
    ridges.add(x,y,z,0x657d9d,.3+Math.random()*.5);
  }
  ridges.object(w.inner,.014);
  for(let i=0;i<7;i++){
    const side=i<3?w.left:w.right,x=(i-3)*.55,z=1.1+Math.sin(i)*.2;
    const trees=new Dust();
    for(let k=0;k<1600*quality;k++){
      const t=Math.random(),a=Math.random()*6.283,r=t*.22;
      trees.add(x+Math.sin(a)*r,.1-t*.85, z+Math.cos(a)*r,0x709f9c,.3+Math.random()*.4);
    }
    trees.object(side,.011);
  }
}
export function populateWorld(w,id) {
  if(id==='0')starWorld(w);
  else if(id==='1')village(w);
  else if(id==='2')snowForest(w);
  else if(id==='3')clockTower(w);
  else auroraValley(w);
  if(id==='0')orbitStreams(w);
}
