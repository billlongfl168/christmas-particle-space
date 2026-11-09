import * as T from './model/three.module.js';

export const quality = innerWidth < 600 ? .58 : 1;
export const uniforms = {
  time: { value: 0 },
  pixelRatio: { value: Math.min(devicePixelRatio, 1.75) },
};
const vertexShader = `
attribute vec3 color;
attribute float seed;
uniform float time;
uniform float pointSize;
uniform float pixelRatio;
varying vec3 tint;
varying float shine;
varying float grainVisibility;
void main() {
  vec3 p = position;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  float pulse = .9 + .1 * sin(time * .75 + seed * 127.);
  tint = color * pulse;
  shine = seed;
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp(pointSize * pixelRatio * 760. / max(.12, -view.z) * (.7 + seed * .65), 1.25, 64. * pixelRatio);
  float density = mix(1., .13, smoothstep(5., 30., gl_PointSize / pixelRatio));
  grainVisibility = step(fract(seed * 37.19), density);
}`;
const fragmentShader = `
varying vec3 tint;
varying float shine;
varying float grainVisibility;
void main() {
  float r = length(gl_PointCoord - .5) * 2.;
  if (r > 1. || grainVisibility < .5) discard;
  float core = exp(-r*r*3.7);
  float halo = exp(-r*r*2.) * .18;
  gl_FragColor = vec4(tint * (1. + core * .35), min(1., (core + halo) * 1.12));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function particles(positions, colors, size = .018) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('seed', new T.Float32BufferAttribute(Array.from({length:positions.length/3}, () => Math.random()), 1));
  const material = new T.ShaderMaterial({
    uniforms: { ...uniforms, pointSize: { value: size } },
    vertexShader, fragmentShader, transparent: true, depthWrite: true,
  });
  return new T.Points(geometry, material);
}
export class Dust {
  constructor() { this.positions=[]; this.colors=[]; }
  add(x,y,z,color,brightness=1) {
    this.positions.push(x,y,z);
    const c=new T.Color(color).multiplyScalar(brightness);
    this.colors.push(c.r,c.g,c.b);
  }
  line(a,b,count,color,width=.006) {
    count=Math.ceil(count*quality);
    for(let i=0;i<count;i++) {
      const t=Math.random();
      this.add(
        T.MathUtils.lerp(a[0],b[0],t)+(Math.random()-.5)*width,
        T.MathUtils.lerp(a[1],b[1],t)+(Math.random()-.5)*width,
        T.MathUtils.lerp(a[2],b[2],t)+(Math.random()-.5)*width,
        color,.65+Math.random()*.6);
    }
  }
  object(parent,size=.018) {
    const p=particles(this.positions,this.colors,size);parent.add(p);return p;
  }
}
export function surface(parent,geometry,color,count=2000,size=.016) {
  const position=geometry.attributes.position, index=geometry.index;
  const triangleCount=Math.floor((index?index.count:position.count)/3);
  const areas=[], triangles=[];
  let total=0;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=0;i<triangleCount;i++) {
    const ids=[0,1,2].map(k=>index?index.getX(i*3+k):i*3+k);
    a.fromBufferAttribute(position,ids[0]);b.fromBufferAttribute(position,ids[1]);c.fromBufferAttribute(position,ids[2]);
    const normal=b.clone().sub(a).cross(c.clone().sub(a));
    total+=normal.length()*.5;
    areas.push(total);triangles.push({a:a.clone(),b:b.clone(),c:c.clone(),normal:normal.normalize()});
  }
  const dust=new Dust();
  for(let i=0;i<count*quality;i++) {
    const choice=Math.random()*total;
    let low=0,high=areas.length-1;
    while(low<high){const middle=(low+high)>>1;if(areas[middle]<choice)low=middle+1;else high=middle;}
    const triangle=triangles[low];
    let u=Math.random(),v=Math.random();if(u+v>1){u=1-u;v=1-v;}
    const p=triangle.a.clone().multiplyScalar(1-u-v).addScaledVector(triangle.b,u).addScaledVector(triangle.c,v);
    const shade=.50+.35*Math.max(0,triangle.normal.dot(new T.Vector3(.4,.8,.5).normalize()))+Math.random()*.25;
    dust.add(p.x,p.y,p.z,color,shade);
  }
  const object=dust.object(parent,size);
  const depthMaterial=new T.MeshBasicMaterial({
    colorWrite:false,depthWrite:true,side:T.DoubleSide,
    polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1,
  });
  const depthSurface=new T.Mesh(geometry,depthMaterial);
  depthSurface.renderOrder=-2;
  depthSurface.userData.particleOccluder=true;
  object.add(depthSurface);
  return object;
}
export function boxSurface(parent,w,h,d,color,count=2500) {
  return surface(parent,new T.BoxGeometry(w,h,d),color,count);
}
export function starShape(radius) {
  const shape=new T.Shape();
  for(let i=0;i<10;i++) {
    const a=Math.PI/2+i*Math.PI/5,r=radius*(i%2?.43:1);
    if(i)shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  shape.closePath();return shape;
}
function splitDust(w,left,right,size=.014) {
  left.object(w.left,size);right.object(w.right,size);
}
export function makeFir(w,height=3.7,offset=new T.Vector3(),scale=1) {
  const foliage=[new Dust(),new Dust()], timber=[new Dust(),new Dust()], frost=[new Dust(),new Dust()];
  const lights=[new Dust(),new Dust()];
  const green=[0x327553,0x539871,0x82b5a0,0x206044,0xb3d0c0];
  for(let tier=0;tier<17;tier++) {
    const t=tier/16,y=height*.5-t*height*.92,length=(.12+Math.pow(t,.87)*1.62)*scale;
    const branches=7+Math.floor(t*4);
    for(let j=0;j<branches;j++) {
      const a=j/branches*Math.PI*2+tier*2.399;
      const side=Math.sin(a)<0?0:1;
      const point=(r,sideways=0,up=0)=>[
        offset.x+Math.sin(a)*r+Math.cos(a)*sideways,
        offset.y+y*scale-.19*scale*(r/length)**2+up,
        offset.z+Math.cos(a)*r-Math.sin(a)*sideways,
      ];
      timber[side].line(point(0),point(length),230,0x7e6549,.017*scale);
      const sprigs=Math.floor(8+length*11);
      for(let k=0;k<sprigs;k++) {
        const along=(k+.2)/sprigs*length;
        const branchWidth=(1-along/length)*.22*scale+.025;
        for(const direction of [-1,1]) {
          const start=point(along),end=point(along+branchWidth*.34,direction*branchWidth,.035*scale);
          timber[side].line(start,end,30,0x6b7c4e,.006);
          for(let needle=0;needle<9;needle++) {
            const u=needle/9;
            const base=start.map((value,axis)=>T.MathUtils.lerp(value,end[axis],u));
            const needleLength=(.023+Math.random()*.041)*scale;
            const angle=a+direction*(.5+Math.random()*1.8);
            const tip=[base[0]+Math.sin(angle)*needleLength,base[1]+(.012+Math.random()*.025)*scale,base[2]+Math.cos(angle)*needleLength];
            foliage[side].line(base,tip,4,green[Math.floor(Math.random()*green.length)],.003);
            if(tier>1&&needle%5===0&&Math.random()<.38)frost[side].line(tip,[tip[0]+.017,tip[1]+.003,tip[2]],5,0xc9dde9,.007);
          }
        }
      }
    }
  }
  for(let i=0;i<340;i++){
    const t=i/340,a=t*Math.PI*12,r=(.14+t*1.68)*scale;
    const x=offset.x+Math.sin(a)*r,y=offset.y+(height*.48-t*height*.91)*scale,z=offset.z+Math.cos(a)*r;
    const side=x<offset.x?0:1;
    lights[side].add(x,y,z,0xffe4a3,1.6);
    if(i%3===0)for(let k=0;k<18;k++)foliage[side].add(x+(Math.random()-.5)*.09,y+(Math.random()-.5)*.07,z+(Math.random()-.5)*.09,0xbfb66f,.5);
  }
  splitDust(w,foliage[0],foliage[1],.011);
  splitDust(w,timber[0],timber[1],.012);
  splitDust(w,frost[0],frost[1],.012);
  splitDust(w,lights[0],lights[1],.046);
  const trunk=surface(w.inner,new T.CylinderGeometry(.055*scale,.14*scale,height*scale,24),0x8a6242,2500*scale,.012);
  trunk.position.copy(offset);
}
export function makeBell(parent,x,y,z,scale=1) {
  const root=new T.Group();root.position.set(x,y,z);root.scale.setScalar(scale);parent.add(root);
  const outline=[];
  for(let i=0;i<=35;i++){
    const t=i/35;
    outline.push(new T.Vector2(.065+.025*t+.14*t**4,.19-t*.37));
  }
  const shell=surface(root,new T.LatheGeometry(outline,48),0xf5ca77,6500,.012);
  const lip=surface(root,new T.TorusGeometry(.23,.012,8,64),0xffebaf,900,.014);lip.rotation.x=Math.PI/2;lip.position.y=-.18;
  const clapper=new T.Group();clapper.position.y=.12;root.add(clapper);
  const rod=surface(clapper,new T.CylinderGeometry(.009,.009,.30,8),0xbd9b61,240,.012);rod.position.y=-.15;
  const ball=surface(clapper,new T.SphereGeometry(.038,16,12),0xffe2a1,500,.014);ball.position.y=-.31;
  return {root,clapper,shell};
}
export function makeGift(parent,color) {
  const root=new T.Group();parent.add(root);
  const body=new T.Group();root.add(body);
  const wall=.012,w=.44,h=.32,d=.38;
  const bottom=boxSurface(body,w,wall,d,color,1600);bottom.position.y=-h/2;
  for(const side of [-1,1]){
    const front=boxSurface(body,w,h,wall,color,2200);front.position.z=side*d/2;
    const lateral=boxSurface(body,wall,h,d,color,1800);lateral.position.x=side*w/2;
  }
  const lid=new T.Group();lid.position.y=.18;root.add(lid);
  boxSurface(lid,w+.025,.045,d+.025,color,2300);
  const ribbon=new Dust();
  for(const side of [-1,1]){
    ribbon.line([-.22,-.16,side*.196],[-.22,.15,side*.196],80,0xffd79c);
    for(let i=0;i<6;i++){
      const x=(i-2.5)*.008;
      ribbon.line([x,-.16,side*.196],[x,.15,side*.196],90,0xffdfaf);
    }
  }
  ribbon.object(body,.011);
  const bow=new T.Group();lid.add(bow);
  const bowDust=new Dust();
  for(const side of [-1,1])for(let i=0;i<1700*quality;i++){
    const a=Math.random()*Math.PI*2,t=(Math.random()-.5)*.018;
    bowDust.add(side*(.045+.055*Math.cos(a)),.035+.038*Math.sin(a),t+.015*Math.sin(a*2),0xffedbd,.6+Math.random()*.6);
  }
  bowDust.object(bow,.012);
  const rimDust=new Dust();
  for(const side of [-1,1]){
    rimDust.line([-.21,.165,side*.18],[.21,.165,side*.18],450,0xfff0ba);
    rimDust.line([side*.21,.165,-.18],[side*.21,.165,.18],400,0xfff0ba);
  }
  const rim=rimDust.object(root,.022);rim.visible=false;
  const ropeDust=new Dust();ropeDust.line([0,.24,0],[0,.58,0],250,0xd4bd8a,.003);ropeDust.object(root,.009);
  const proxyMaterial=new T.MeshBasicMaterial({visible:false});
  const lidTarget=new T.Mesh(new T.BoxGeometry(.48,.12,.43),proxyMaterial);lidTarget.position.y=.025;lid.add(lidTarget);
  const rimTarget=new T.Group();rimTarget.position.y=.16;root.add(rimTarget);
  for(const side of [-1,1]){
    const horizontal=new T.Mesh(new T.BoxGeometry(.46,.07,.045),proxyMaterial);
    horizontal.position.z=side*.18;rimTarget.add(horizontal);
    const vertical=new T.Mesh(new T.BoxGeometry(.045,.07,.38),proxyMaterial);
    vertical.position.x=side*.21;rimTarget.add(vertical);
  }
  return {root,body,lid,bow,rim,lidTarget,rimTarget,open:0,preview:null};
}
export function starWorld(w) {
  const outer=starShape(2.05),hole=starShape(.58);
  outer.holes.push(new T.Path(hole.getPoints().reverse()));
  const geometry=new T.ExtrudeGeometry(outer,{depth:.34,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:2,steps:1});
  geometry.translate(0,0,-.17);
  const temporary=new T.Group();
  const p=surface(temporary,geometry,0xd7cee0,105000,.014);
  const positions=p.geometry.attributes.position.array,colors=p.geometry.attributes.color.array;
  const sides=[new Dust(),new Dust()];
  for(let i=0;i<positions.length;i+=3) {
    const x=positions[i],y=positions[i+1],z=positions[i+2];
    const r=Math.hypot(x,y);
    const color=new T.Color().setRGB(colors[i],colors[i+1],colors[i+2]);
    color.lerp(new T.Color(0xffedcb),Math.max(0,1-r/2));
    sides[x<0?0:1].add(x,y,z,color,(.55+Math.random()*.4)*Math.max(.22,1.4-r*.55));
  }
  const edge=starShape(.59).getPoints(10);
  for(let i=0;i<edge.length-1;i++){
    const a=edge[i],b=edge[i+1];
    const side=(a.x+b.x)<0?0:1;
    for(let k=0;k<1100*quality;k++){
      const u=Math.random(),z=(Math.random()-.5)*.36;
      sides[side].add(T.MathUtils.lerp(a.x,b.x,u)+(Math.random()-.5)*.018,T.MathUtils.lerp(a.y,b.y,u)+(Math.random()-.5)*.018,z,0xfff5e1,.85+Math.random()*.45);
    }
  }
  splitDust(w,sides[0],sides[1],.015);
  p.geometry.dispose();p.material.dispose();
  const dust=new Dust();
  for(let i=0;i<1800*quality;i++){
    const a=Math.random()*6.283,r=2.15+Math.random()*1.2;
    dust.add(Math.cos(a)*r,Math.sin(a)*r,(Math.random()-.5)*2,0x9da4d1,.2+Math.random()*.4);
  }
  dust.object(w.inner,.009);
}
export function orbitStreams(w,tree=false) {
  for(let layer=0;layer<3;layer++){
    const dust=new Dust(),count=1400;
    for(let i=0;i<count*quality;i++){
      const t=Math.random(),a=t*Math.PI*(tree?10:2),r=.21+layer*.16;
      dust.add(Math.cos(a)*r,tree?t*3.1-1.5:Math.sin(a)*r,tree?Math.sin(a)*r:(layer-1)*.22,layer%2?0xa7d6ac:0xf1dda3,.75);
    }
    const stream=dust.object(w.inner,.012);
    w.animations.push(time=>{
      stream.visible=w.detail>.1;
      stream.rotation[tree?'y':'z']=time*(.26+layer*.17)*(layer===1?-1:1);
    });
  }
}
export function ground(parent,radius=2.1,y=-1.8,color=0xb5cbdf,count=9000) {
  const dust=new Dust();
  for(let i=0;i<count*quality;i++){
    const a=Math.random()*6.283,r=Math.sqrt(Math.random())*radius;
    dust.add(Math.cos(a)*r,y+.035*Math.sin(r*8)+Math.random()*.02,Math.sin(a)*r,color,.35+Math.random()*.55);
  }
  return dust.object(parent,.014);
}
