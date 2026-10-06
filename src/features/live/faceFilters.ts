export type FaceFilter = 'off' | 'beauty' | 'blush' | 'glasses' | 'cat' | 'rabbit' | 'dog' | 'crown' | 'halo' | 'heart-glasses' | 'sunglasses' | 'flowers' | 'butterfly' | 'moustache' | 'mask' | 'stars';
export type FacePoint = { x: number; y: number; z?: number };
export type FilterCategory = 'all' | 'animals' | 'accessories' | 'beauty';
export const FACE_FILTERS: { id: FaceFilter; label: string; category: FilterCategory }[] = [
  { id: 'off', label: 'Nguyên bản', category: 'all' },
  { id: 'cat', label: 'Mèo dễ thương', category: 'animals' },
  { id: 'rabbit', label: 'Tai thỏ', category: 'animals' },
  { id: 'dog', label: 'Cún con', category: 'animals' },
  { id: 'crown', label: 'Vương miện', category: 'accessories' },
  { id: 'halo', label: 'Thiên thần', category: 'accessories' },
  { id: 'heart-glasses', label: 'Kính trái tim', category: 'accessories' },
  { id: 'sunglasses', label: 'Kính đen', category: 'accessories' },
  { id: 'glasses', label: 'Kính vàng', category: 'accessories' },
  { id: 'flowers', label: 'Vòng hoa', category: 'accessories' },
  { id: 'butterfly', label: 'Bướm trên má', category: 'beauty' },
  { id: 'moustache', label: 'Râu ngộ nghĩnh', category: 'accessories' },
  { id: 'mask', label: 'Mặt nạ dạ hội', category: 'accessories' },
  { id: 'stars', label: 'Má sao lấp lánh', category: 'beauty' },
  { id: 'beauty', label: 'Làm đẹp nhẹ', category: 'beauty' },
  { id: 'blush', label: 'Má hồng', category: 'beauty' },
];

const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

export function drawFaceEffect(ctx: CanvasRenderingContext2D, source: CanvasImageSource, points: FacePoint[], filter: FaceFilter, amount: number, time = 0) {
  if (filter === 'off' || points.length < 468) return;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const p = (id: number) => ({ x: points[id].x * w, y: points[id].y * h });
  const left = p(33), right = p(263);
  const size = Math.hypot(right.x - left.x, right.y - left.y);
  if (size < 2) return;
  const roll = Math.atan2(right.y - left.y, right.x - left.x);
  ctx.save();

  if (filter === 'beauty' || filter === 'blush') {
    ctx.beginPath();
    FACE_OVAL.forEach((id, index) => { const pt = p(id); if (index === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
    ctx.closePath(); ctx.clip();
    ctx.globalAlpha = amount * 0.32;
    ctx.filter = `blur(${Math.max(1, size * 0.012)}px) brightness(1.08)`;
    ctx.drawImage(source, 0, 0, w, h);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    if (filter === 'blush') [50, 280].forEach((id) => {
      const cheek = p(id), radius = size * 0.19;
      const gradient = ctx.createRadialGradient(cheek.x, cheek.y, 0, cheek.x, cheek.y, radius);
      gradient.addColorStop(0, `rgba(232,104,125,${amount * 0.5})`);
      gradient.addColorStop(1, 'rgba(232,104,125,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(cheek.x - radius, cheek.y - radius, radius * 2, radius * 2);
    });
    ctx.restore(); return;
  }

  // Work in face-sized coordinates, anchored to an actual facial landmark.
  const anchor = (id: number, paint: () => void) => {
    const pt = p(id); ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(roll); ctx.scale(size, size);
    ctx.lineWidth = 0.018; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    paint(); ctx.restore();
  };
  const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, stroke?: string) => {
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill();
    if (stroke) { ctx.strokeStyle=stroke; ctx.stroke(); }
  };
  const path = (vertices: number[][], fill: string, stroke?: string) => {
    ctx.beginPath(); vertices.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  };
  const star = (x: number, y: number, r: number, color: string) => {
    path(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2, radius=i%2?r*0.4:r;return [x+Math.cos(a)*radius,y+Math.sin(a)*radius];}),color);
  };
  const heart = (x: number, y: number, r: number, color: string, stroke?: string) => {
    ctx.beginPath();ctx.moveTo(x,y+r*0.85);
    ctx.bezierCurveTo(x-r*1.6,y-r*0.2,x-r*0.9,y-r*1.3,x,y-r*0.55);
    ctx.bezierCurveTo(x+r*0.9,y-r*1.3,x+r*1.6,y-r*0.2,x,y+r*0.85);
    ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  };
  const whiskers = () => [50,280].forEach((id,index)=>anchor(id,()=>{
    ctx.strokeStyle='#634738';ctx.lineWidth=0.013;
    const side=index===0?-1:1;
    [-0.04,0.04,0.12].forEach(y=>{ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(side*0.26,y-0.06);ctx.stroke();});
  }));
  ctx.globalAlpha = 0.65 + amount * 0.35;

  if (filter === 'cat' || filter === 'rabbit' || filter === 'dog') {
    anchor(10,()=>{
      [-1,1].forEach(side=>{
        ctx.save();ctx.translate(side*0.48,0.06);ctx.rotate(side*0.16);
        if(filter==='cat'){
          path([[-0.19,0.12],[-0.15,-0.5],[0.2,0.07]],'#F7E9DD','#B79273');
          path([[-0.1,0.02],[-0.09,-0.32],[0.12,0.02]],'#E9A1B2');
        }else if(filter==='rabbit'){
          ellipse(0,-0.34,0.16,0.52,'#FFF8F3','#C8A694');
          ellipse(0,-0.34,0.085,0.38,'#F2ACBE');
        }else{
          ellipse(side*0.09,0.23,0.22,0.47,'#A4724E','#714931');
          ellipse(side*0.08,0.22,0.11,0.3,'#D9AB8D');
        }ctx.restore();
      });
    });
    anchor(1,()=>{
      if(filter==='dog')ellipse(0,0.01,0.11,0.075,'#382B25');
      else heart(0,0.02,0.06,'#D98199');
    });
    if(filter!=='dog')whiskers();
    else anchor(14,()=>{ellipse(0,0.15,0.095,0.19,'#ED90A3','#B86276');ctx.strokeStyle='#B86276';ctx.beginPath();ctx.moveTo(0,0.04);ctx.lineTo(0,0.23);ctx.stroke();});
  } else if (filter === 'crown') {
    anchor(10,()=>{
      const gold=ctx.createLinearGradient(0,-0.45,0,0.1);gold.addColorStop(0,'#FFE8A5');gold.addColorStop(1,'#C59B58');
      ctx.beginPath();ctx.moveTo(-0.52,0.1);ctx.lineTo(-0.61,-0.38);ctx.lineTo(-0.28,-0.18);ctx.lineTo(0,-0.55);ctx.lineTo(0.28,-0.18);ctx.lineTo(0.61,-0.38);ctx.lineTo(0.52,0.1);ctx.closePath();ctx.fillStyle=gold;ctx.fill();ctx.strokeStyle='#9C7133';ctx.stroke();
      [-0.3,0,0.3].forEach(x=>ellipse(x,-0.02,0.045,0.06,x===0?'#CD6F88':'#FFFFFF'));
      star(0,-0.55,0.08,'#FFE9A4');
    });
  } else if (filter === 'halo') {
    anchor(10,()=>{
      ctx.shadowColor='#FFD66B';ctx.shadowBlur=size*0.1;
      ctx.strokeStyle='#E9BB57';ctx.lineWidth=0.06;ctx.beginPath();ctx.ellipse(0,-0.38,0.6,0.13,0,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;star(-0.65,-0.23,0.07,'#E9BB57');star(0.7,-0.4,0.06,'#E9BB57');
    });
  } else if (['glasses','heart-glasses','sunglasses','mask'].includes(filter)) {
    const eyes=[p(133),p(362)];
    const eyeCenters=[{x:(left.x+eyes[0].x)/2,y:(left.y+eyes[0].y)/2},{x:(right.x+eyes[1].x)/2,y:(right.y+eyes[1].y)/2}];
    eyeCenters.forEach(eye=>{
      ctx.save();ctx.translate(eye.x,eye.y);ctx.rotate(roll);ctx.scale(size,size);ctx.lineWidth=0.025;
      if(filter==='heart-glasses')heart(0,0,0.23,'rgba(226,117,149,0.45)','#AE426E');
      else if(filter==='mask'){
        ellipse(0,0,0.3,0.22,'#49364F','#C59B58');
        // Open eye holes preserve the actual camera pixels beneath the mask.
        ctx.save();ctx.beginPath();ctx.ellipse(0,0,0.16,0.085,0,0,Math.PI*2);ctx.clip();
        ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(source,0,0,w,h);ctx.restore();
        star(0,-0.17,0.04,'#E2BD71');
      }else{
        ellipse(0,0,0.23,filter==='sunglasses'?0.16:0.19,filter==='sunglasses'?'#282326':`rgba(35,29,21,${0.1+amount*0.5})`,filter==='sunglasses'?'#1A1612':'#C59B58');
        ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=0.014;ctx.beginPath();ctx.moveTo(-0.12,-0.05);ctx.lineTo(-0.04,-0.1);ctx.stroke();
      }ctx.restore();
    });
    anchor(168,()=>{ctx.strokeStyle=filter==='heart-glasses'?'#AE426E':filter==='mask'?'#C59B58':'#C59B58';ctx.lineWidth=0.025;ctx.beginPath();ctx.moveTo(-0.07,0);ctx.quadraticCurveTo(0,-0.06,0.07,0);ctx.stroke();});
  } else if (filter === 'flowers') {
    anchor(10,()=>{
      ctx.strokeStyle='#A29465';ctx.beginPath();ctx.ellipse(0,0,0.63,0.15,0,Math.PI,Math.PI*2);ctx.stroke();
      [-0.55,-0.28,0,0.28,0.55].forEach((x,index)=>{
        const y=-0.12+Math.abs(x)*0.13;
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*0.075,y+Math.sin(a)*0.075,0.064,0.064,index%2?'#EFB0BC':'#FFF3E6','#DEB3A0');}
        ellipse(x,y,0.035,0.035,'#D4AB59');
      });
    });
  } else if (filter === 'butterfly') {
    [50,280].forEach((id,index)=>anchor(id,()=>{
      ctx.rotate(index===0?-0.2:0.2);const flutter=0.8+Math.sin(time/180)*0.16;
      [-1,1].forEach(side=>{ctx.save();ctx.scale(flutter,1);ellipse(side*0.09,-0.05,0.095,0.12,'#D7A7E4','#A96BB7');ellipse(side*0.065,0.07,0.07,0.08,'#ECC0DB','#B679A7');ctx.restore();});
      ellipse(0,0,0.018,0.1,'#644374');ctx.strokeStyle='#644374';ctx.beginPath();ctx.moveTo(0,-0.07);ctx.lineTo(-0.04,-0.16);ctx.moveTo(0,-0.07);ctx.lineTo(0.04,-0.16);ctx.stroke();
    }));
  } else if (filter === 'moustache') {
    anchor(164,()=>{
      ctx.fillStyle='#493429';[-1,1].forEach(side=>{ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(0.1,-0.12,0.24,0.14,0.38,-0.05);ctx.bezierCurveTo(0.34,0.22,0.08,0.16,0,0.04);ctx.closePath();ctx.fill();ctx.restore();});
    });
  } else if (filter === 'stars') {
    [50,280].forEach(id=>anchor(id,()=>{
      ctx.globalAlpha*=0.75+Math.sin(time/300)*0.2;
      star(-0.12,-0.02,0.07,'#D4AB59');star(0.05,0.05,0.05,'#E4B08A');star(0.16,-0.04,0.055,'#D4AB59');
      ellipse(0.02,-0.08,0.012,0.012,'#CF946E');ellipse(-0.06,0.08,0.012,0.012,'#CF946E');
    }));
  }
  ctx.restore();
}

// The catalog uses the same renderer as the live video, with a vector avatar.
export function drawFilterPreview(ctx: CanvasRenderingContext2D, filter: FaceFilter) {
  const {width:w,height:h}=ctx.canvas;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#FAF8F5';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#D6B992';ctx.beginPath();ctx.ellipse(w*0.5,h*0.91,w*0.29,h*0.17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#503F34';ctx.beginPath();ctx.ellipse(w*0.5,h*0.53,w*0.245,h*0.31,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#F3D6BA';ctx.beginPath();ctx.ellipse(w*0.5,h*0.56,w*0.205,h*0.27,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#503F34';[0.42,0.58].forEach(x=>{ctx.beginPath();ctx.ellipse(w*x,h*0.52,w*0.017,h*0.024,0,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle='#AB7766';ctx.lineWidth=w*0.012;ctx.beginPath();ctx.arc(w*0.5,h*0.66,w*0.065,0.15,Math.PI-0.15);ctx.stroke();
  const points: FacePoint[]=Array.from({length:478},()=>({x:0.5,y:0.56}));
  FACE_OVAL.forEach((id,i)=>{const a=-Math.PI/2+i*Math.PI*2/FACE_OVAL.length;points[id]={x:0.5+Math.cos(a)*0.205,y:0.56+Math.sin(a)*0.27};});
  const set=(id:number,x:number,y:number)=>{points[id]={x,y};};
  set(33,0.37,0.52);set(133,0.47,0.52);set(263,0.63,0.52);set(362,0.53,0.52);
  set(168,0.5,0.52);set(1,0.5,0.61);set(164,0.5,0.66);set(14,0.5,0.7);set(50,0.365,0.635);set(280,0.635,0.635);
  const source=document.createElement('canvas');source.width=w;source.height=h;source.getContext('2d')?.drawImage(ctx.canvas,0,0);
  drawFaceEffect(ctx,source,points,filter,0.8,150);
}
