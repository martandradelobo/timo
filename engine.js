/* ============================================================================
 * TOMÁS: THE QUEST  —  engine.js
 * A tiny dependency-free 2D engine. Everything a level needs lives here so a
 * new level is just a data file that registers itself with Game.addLevel().
 * ==========================================================================*/

const TILE = 32;               // logical tile size
const VIEW_W = 20;             // tiles visible horizontally
const VIEW_H = 15;             // tiles visible vertically

/* -------------------------------------------------------------- emoji font */
const EMOJI_FONT_STACK = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
function emojiFont(px){ return px + 'px ' + EMOJI_FONT_STACK; }

const TEXT_FONT_STACK = 'monospace,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla"';
function textFont(px, bold){ return (bold ? 'bold ' : '') + px + 'px ' + TEXT_FONT_STACK; }

/* ------------------------------------------------------------------ input */
const Input = {
  keys: {},
  pressed: {},                 // one-shot (consumed) presses
  init() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (!this.keys[e.key]) this.pressed[e.key] = true;
      this.keys[e.key] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  },
  down(k){ return !!this.keys[k]; },
  once(k){ if (this.pressed[k]) { this.pressed[k] = false; return true; } return false; },
  clear(){ this.pressed = {}; }
};

/* --------------------------------------------------------------- dialogue */
const Dialogue = {
  queue: [],
  active: false,
  line: null,
  choiceIndex: 0,
  onDone: null,

  start(items, onDone) {
    this.queue = items.slice();
    this.onDone = onDone || null;
    this.active = true;
    this.next();
  },
  say(speaker, text, onDone){ this.start([{speaker, text}], onDone); },

  next() {
    if (this.queue.length === 0) {
      this.active = false; this.line = null;
      const cb = this.onDone; this.onDone = null;
      if (cb) cb();
      return;
    }
    this.line = this.queue.shift();
    this.choiceIndex = 0;
  },

  handle() {
    if (!this.active || !this.line) return;
    if (this.line.choice) {
      const n = this.line.choice.length;
      if (Input.once('ArrowUp'))   this.choiceIndex = (this.choiceIndex - 1 + n) % n;
      if (Input.once('ArrowDown')) this.choiceIndex = (this.choiceIndex + 1) % n;
      if (Input.once(' ') || Input.once('Enter')) {
        const pick = this.line.choice[this.choiceIndex];
        const rest = this.queue; this.queue = [];
        this.line = null; this.active = false;
        const done = this.onDone; this.onDone = null;
        if (pick.cb) pick.cb();
        if (!this.active) {
          if (rest.length) { this.start(rest, done); }
          else if (done) done();
        }
      }
    } else {
      if (Input.once(' ') || Input.once('Enter')) this.next();
    }
  },

  draw(ctx, W, H) {
    if (!this.active || !this.line) return;
    const boxH = 132, pad = 18, y = H - boxH - 16, x = 16, w = W - 32;
    ctx.fillStyle = 'rgba(10,12,26,0.92)';
    roundRect(ctx, x, y, w, boxH, 10); ctx.fill();
    ctx.strokeStyle = '#8ad'; ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, boxH, 10); ctx.stroke();

    if (this.line.choice) {
      ctx.fillStyle = '#fff'; ctx.font = textFont(18);
      const promptLines = this.line.prompt ? wrapText(ctx, this.line.prompt, x+pad, y+pad+16, w-pad*2, 22) : 0;
      const oy = y + pad + (this.line.prompt ? 16 + promptLines*22 + 8 : 8);
      this.line.choice.forEach((c, i) => {
        const sel = i === this.choiceIndex;
        ctx.fillStyle = sel ? '#ffe27a' : '#cdd';
        ctx.font = textFont(18, sel);
        ctx.fillText((sel ? '▶ ' : '   ') + c.label, x+pad, oy + i*26);
      });
    } else {
      if (this.line.speaker) {
        ctx.fillStyle = '#ffe27a'; ctx.font = textFont(16, true);
        ctx.fillText(this.line.speaker, x+pad, y+pad+4);
      }
      ctx.fillStyle = '#fff'; ctx.font = textFont(18);
      wrapText(ctx, this.line.text, x+pad, y+pad+(this.line.speaker?30:8), w-pad*2, 24);
      ctx.fillStyle = '#9ab'; ctx.font = textFont(13);
      ctx.fillText('␣ / Enter ▸', x+w-120, y+boxH-14);
    }
  }
};

/* ------------------------------------------------------------------ toast */
const Toast = {
  msg: null, t: 0,
  show(msg, secs=2.4){ this.msg = msg; this.t = secs; },
  update(dt){ if (this.t > 0) this.t -= dt; },
  draw(ctx, W){
    if (this.t <= 0 || !this.msg) return;
    const a = Math.min(1, this.t);
    ctx.globalAlpha = a;
    ctx.font = textFont(18, true);
    const w = ctx.measureText(this.msg).width + 40;
    const x = (W - w)/2, y = 24;
    ctx.fillStyle = '#1b2a1b'; roundRect(ctx, x, y, w, 40, 8); ctx.fill();
    ctx.strokeStyle = '#7fd97f'; ctx.lineWidth = 2; roundRect(ctx, x, y, w, 40, 8); ctx.stroke();
    ctx.fillStyle = '#c8ffc8'; ctx.textAlign = 'center';
    ctx.fillText(this.msg, W/2, y+26); ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
};

/* -------------------------------------------------------------- draw utils */
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function wrapText(ctx,text,x,y,maxW,lh){
  const words = String(text).split(' '); let line=''; let yy=y; let lines=1;
  for (const w of words){
    const test = line ? line+' '+w : w;
    if (ctx.measureText(test).width > maxW && line){ ctx.fillText(line,x,yy); line=w; yy+=lh; lines++; }
    else line = test;
  }
  if (line) ctx.fillText(line,x,yy);
  return lines;
}

/* -------------------------------------------------------------------- Game */
const Game = {
  ctx:null, W:0, H:0,
  levels:{}, order:[],
  current:null,
  state:{ level:1, flags:{} },
  overlay:null,
  last:0,

  init(canvas){
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width; this.H = canvas.height;
    this.ctx.imageSmoothingEnabled = false;
    Input.init();
    this.load();
    requestAnimationFrame(t => this.loop(t));
  },

  addLevel(id, def){ this.levels[id] = def; if(!this.order.includes(id)) this.order.push(id); },

  startLevel(id){
    this.overlay = null;
    this.current = this.levels[id];
    this.state.level = id;
    this.save();
    if (this.current && this.current.enter) this.current.enter(this);
  },

  setOverlay(o){ this.overlay = o; if (o && o.enter) o.enter(this); },
  clearOverlay(){ this.overlay = null; },

  flag(k,v){ if(v===undefined) return this.state.flags[k]; this.state.flags[k]=v; this.save(); },

  save(){ try{ localStorage.setItem('tomas-quest', JSON.stringify(this.state)); }catch(e){} },
  load(){ try{ const s=localStorage.getItem('tomas-quest'); if(s) this.state=JSON.parse(s);}catch(e){} },
  reset(){ this.state={level:this.order[0]||1, flags:{}}; this.save(); this.startLevel(this.state.level); },

  loop(t){
    try{
      this._frame(t);
    } catch(err){
      console.error('Game loop error (frame skipped):', err);
    }
    requestAnimationFrame(t2 => this.loop(t2));
  },

  _frame(t){
    const dt = Math.min(0.05, (t - this.last)/1000 || 0); this.last = t;
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0c1a'; ctx.fillRect(0,0,this.W,this.H);

    if (this.overlay){
      this.overlay.update && this.overlay.update(dt, this);
      if (this.overlay) this.overlay.draw && this.overlay.draw(ctx, this);
    } else if (this.current){
      if (Dialogue.active){
        Dialogue.handle();
        if (this.current) this.current.draw && this.current.draw(ctx, this);
        Dialogue.draw(ctx, this.W, this.H);
      } else {
        this.current.update && this.current.update(dt, this);
        if (this.current) this.current.draw && this.current.draw(ctx, this);
        Dialogue.draw(ctx, this.W, this.H);
      }
    }
    Toast.update(dt); Toast.draw(ctx, this.W);
    Input.clear();
  }
};

/* ---------------------------------------------------------------- TileMap */
class World {
  constructor(cols, rows){
    this.cols = cols; this.rows = rows;
    this.solid = new Set();
    this.paint = {};
    this.entities = [];
  }
  setSolid(x,y){ this.solid.add(x+','+y); }
  isSolid(x,y){
    if (x<0||y<0||x>=this.cols||y>=this.rows) return true;
    return this.solid.has(x+','+y);
  }
  block(x,y,w,h){ for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.setSolid(x+i,y+j); }
  add(ent){ this.entities.push(ent); return ent; }
}

/* --------------------------------------------------------------- Player */
class Player {
  constructor(x,y){ this.x=x; this.y=y; this.w=20; this.h=24; this.speed=110; this.dir='down'; this.step=0; }
  rect(){ return {x:this.x-this.w/2, y:this.y-this.h/2, w:this.w, h:this.h}; }
  update(dt, world){
    let dx=0, dy=0;
    if (Input.down('ArrowLeft')){ dx-=1; this.dir='left'; }
    if (Input.down('ArrowRight')){ dx+=1; this.dir='right'; }
    if (Input.down('ArrowUp')){ dy-=1; this.dir='up'; }
    if (Input.down('ArrowDown')){ dy+=1; this.dir='down'; }
    if (dx&&dy){ dx*=0.707; dy*=0.707; }
    if (dx||dy) this.step += dt*8; else this.step = 0;
    this.move(dx*this.speed*dt, dy*this.speed*dt, world);
  }
  move(dx,dy,world){
    const tryAxis = (nx,ny)=>{
      const r={x:nx-this.w/2,y:ny-this.h/2,w:this.w,h:this.h};
      const minTX=Math.floor(r.x/TILE), maxTX=Math.floor((r.x+r.w)/TILE);
      const minTY=Math.floor(r.y/TILE), maxTY=Math.floor((r.y+r.h)/TILE);
      for(let ty=minTY;ty<=maxTY;ty++)for(let tx=minTX;tx<=maxTX;tx++)
        if(world.isSolid(tx,ty)) return false;
      for(const e of world.entities){
        if(!e.solid) continue;
        if(rectHit(r,{x:e.x,y:e.y,w:e.w,h:e.h})) return false;
      }
      return true;
    };
    if (dx && tryAxis(this.x+dx, this.y)) this.x += dx;
    if (dy && tryAxis(this.x, this.y+dy)) this.y += dy;
  }
  facing(world){
    let fx=this.x, fy=this.y, d=26;
    if(this.dir==='left')fx-=d; if(this.dir==='right')fx+=d;
    if(this.dir==='up')fy-=d;   if(this.dir==='down')fy+=d;
    const pr={x:fx-14,y:fy-14,w:28,h:28};
    for(const e of world.entities){
      if(!e.interact) continue;
      if(rectHit(pr,{x:e.x,y:e.y,w:e.w,h:e.h})) return e;
    }
    return null;
  }
}
function rectHit(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

function drawEntity(ctx, e) {
  // 1. Renderizador customizado (ex: Félix ou Pinho com corpo)
  if (e.render && typeof e.render === 'function') {
    e.render(ctx, e);
    return;
  }

  // 2. Renderizador de Edifícios (Caixas)
  if (e.box) {
    const roofH = 28;
    const cx = e.x + e.w / 2;

    // Parede
    ctx.fillStyle = e.color || '#3d344d';
    ctx.fillRect(e.x, e.y + roofH, e.w, e.h - roofH);

    // Telhado
    ctx.fillStyle = e.roof || '#9c5a3c';
    ctx.beginPath();
    ctx.moveTo(e.x - 4, e.y + roofH);
    ctx.lineTo(cx, e.y);
    ctx.lineTo(e.x + e.w + 4, e.y + roofH);
    ctx.closePath();
    ctx.fill();

    // Porta Detalhada (se tiver door: true)
    if (e.door) {
      const doorW = 20;
      const doorH = 26;
      const doorX = cx - doorW / 2;
      const doorY = e.y + e.h - doorH;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      roundRect(ctx, doorX - 1, doorY - 1, doorW + 2, doorH + 1, 3);
      ctx.fill();

      ctx.fillStyle = '#5c3a21';
      roundRect(ctx, doorX, doorY, doorW, doorH, 2);
      ctx.fill();

      ctx.fillStyle = '#422815';
      roundRect(ctx, doorX + 3, doorY + 3, doorW - 6, doorH - 5, 1);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(doorX + doorW - 4, doorY + doorH / 2 + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Janelas Laterais
    ctx.fillStyle = 'rgba(255,220,140,0.5)';
    ctx.fillRect(e.x + 10, e.y + roofH + 4, 12, 12);
    ctx.fillRect(e.x + e.w - 22, e.y + roofH + 4, 12, 12);

    // Placa com Nome / Label
    if (e.label) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      roundRect(ctx, cx - 45, e.y + roofH + 6, 90, 18, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = 1;
      roundRect(ctx, cx - 45, e.y + roofH + 6, 90, 18, 4);
      ctx.stroke();

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, cx, e.y + roofH + 18);
      ctx.textAlign = 'left';
    }
    return;
  }

  // 3. Fallback Padrão para Entidades de Emoji (Props, Árvores, etc.)
  if (e.emoji) {
    ctx.font = emojiFont(e.size || 24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji, e.x + e.w / 2, e.y + e.h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

function renderWorld(ctx, world, player, W, H, opts={}){
  const camX = clamp(player.x - W/2, 0, world.cols*TILE - W);
  const camY = clamp(player.y - H/2, 0, world.rows*TILE - H);
  ctx.save(); ctx.translate(-Math.round(camX), -Math.round(camY));

  for(let y=0;y<world.rows;y++)for(let x=0;x<world.cols;x++){
    const key=x+','+y;
    const h=((x*73856093)^(y*19349663))>>>0;
    let c = world.paint[key] || ((h&3)===0 ? '#294a28' : (h&1) ? '#244221' : '#264724');
    if(world.solid.has(key) && !world.paint[key]) c = '#33291f';
    ctx.fillStyle=c; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    if(!world.paint[key] && !world.solid.has(key) && (h&7)===0){
      ctx.fillStyle='rgba(120,180,90,0.35)';
      ctx.fillRect(x*TILE+8,y*TILE+18,3,6); ctx.fillRect(x*TILE+20,y*TILE+22,3,6);
    }
  }
  ctx.strokeStyle='rgba(0,0,0,0.06)';
  for(let x=0;x<=world.cols;x++){ctx.beginPath();ctx.moveTo(x*TILE,0);ctx.lineTo(x*TILE,world.rows*TILE);ctx.stroke();}
  for(let y=0;y<=world.rows;y++){ctx.beginPath();ctx.moveTo(0,y*TILE);ctx.lineTo(world.cols*TILE,y*TILE);ctx.stroke();}

  // Ordenação Y-Sort + Chamada à nova drawEntity
  const ents=[...world.entities].sort((a,b)=>(a.y+a.h)-(b.y+b.h));
  for(const e of ents) drawEntity(ctx, e);

  drawPlayer(ctx, player);

  const f = player.facing(world);
  if (f && f.interact && !Dialogue.active){
    ctx.fillStyle='#ffe27a'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
    ctx.fillText('␣', f.x + (f.w / 2), f.y + 20); ctx.textAlign='left';
  }
  ctx.restore();

  if (opts.hud) opts.hud(ctx, camX, camY);
}

function e_cx(e){ return e.w/2; }

function drawEntity(ctx, e){
  // 1. Suporte para personagens com corpo desenhado por código (Félix / Pinho)
  if (e.render && typeof e.render === 'function') {
    e.render(ctx, e);
    return;
  }

  // 2. Desenho de Edifícios (com o teu estilo e portas originais)
  if(e.box){
    const roofH = Math.min(e.h * 0.5, 34);
    const cx = e.x + e.w / 2;

    // Building Base Body
    ctx.fillStyle = e.color || '#4a3b30';
    roundRect(ctx, e.x, e.y + roofH - 6, e.w, e.h - roofH + 6, 6); ctx.fill();

    // Bottom Base Trim
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, e.x, e.y + e.h - 14, e.w, 14, 6); ctx.fill();

    // Roof Triangle
    ctx.fillStyle = e.roof || '#7a4';
    ctx.beginPath();
    ctx.moveTo(e.x - 4, e.y + roofH);
    ctx.lineTo(cx, e.y - 6);
    ctx.lineTo(e.x + e.w + 4, e.y + roofH);
    ctx.closePath(); ctx.fill();

    // Roof Highlight Overlay
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(cx, e.y - 6);
    ctx.lineTo(e.x + e.w + 4, e.y + roofH);
    ctx.lineTo(cx + 0.5, e.y + roofH);
    ctx.closePath(); ctx.fill();

    // --- DOOR (Original) ---
    const doorW = 20;
    const doorH = 26;
    const doorX = cx - doorW / 2;
    const doorY = e.y + e.h - doorH;

    // Moldura Escura da Porta
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    roundRect(ctx, doorX - 1, doorY - 1, doorW + 2, doorH + 1, 3);
    ctx.fill();

    // Madeira Principal da Porta
    ctx.fillStyle = '#5c3a21';
    roundRect(ctx, doorX, doorY, doorW, doorH, 2);
    ctx.fill();

    // Painel Interno / Detalhe de Madeira Acentuada
    ctx.fillStyle = '#422815';
    roundRect(ctx, doorX + 3, doorY + 3, doorW - 6, doorH - 5, 1);
    ctx.fill();

    // Maçaneta Dourada com Brilho
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(doorX + doorW - 4, doorY + doorH / 2 + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // --- WINDOWS LEFT & RIGHT ---
    ctx.fillStyle = 'rgba(255,220,140,0.5)';
    ctx.fillRect(e.x + 10, e.y + roofH + 4, 12, 12);
    ctx.fillRect(e.x + e.w - 22, e.y + roofH + 4, 12, 12);
    
    // Label Sign Header
    if(e.label){
      ctx.font = 'bold 12px monospace';
      const tw = ctx.measureText(e.label).width;
      const sw = Math.max(tw + 16, 40), sx = cx - sw / 2, sy = e.y + roofH + 2;
      ctx.fillStyle = '#1a1420'; roundRect(ctx, sx, sy, sw, 20, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; roundRect(ctx, sx, sy, sw, 20, 4); ctx.stroke();
      ctx.fillStyle = '#ffe8a0'; ctx.textAlign = 'center'; ctx.fillText(e.label, cx, sy + 14); ctx.textAlign = 'left';
    }

    // Centered Character Emoji inside Building (above the door)
    if(e.emoji){
      ctx.font = emojiFont(22);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.emoji, cx, e.y + e.h - 38);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }
    return;
  }

  // 3. Desenho padrão para Emojis/Props
  const cx=e.x+e.w/2, cy=e.y+e.h/2;
  if(e.shadow!==false){ ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath();
    ctx.ellipse(cx,e.y+e.h-2,e.w*0.38,3.5,0,0,7); ctx.fill(); }
  const sz=e.size||26;
  ctx.fillStyle='#fff';
  ctx.font=emojiFont(sz); ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillText(e.emoji||'', cx, cy+ sz*0.36);
  ctx.textAlign='left';
  if(e.name){ ctx.fillStyle='#dfe'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText(e.name, cx, e.y-4); ctx.textAlign='left'; }
}

function drawPlayer(ctx, p) {
  const isMoving = p.step > 0;
  const bob = isMoving ? Math.sin(p.step * 2) * 1.5 : 0;
  const legOffset = isMoving ? Math.sin(p.step * 2) * 2 : 0;

  ctx.save();
  ctx.translate(p.x, p.y + bob);

  // --- PALETTE ---
  const C = {
    // Hair (usado quando está de costas)
    hairLight:  '#754828',
    hairMain:   '#754828',
    hairShadow: '#7d5619',

    // Clothes
    hoodieMain: '#2e3d52',
    shirtCyan:  '#38bdf8',
    shirtDark:  '#0284c7',
    pants:      '#334155',
    pantsShadow:'#1e293b',
    
    // Shoes & Skin
    skinBase:  '#fed7aa',
    shoeWhite: '#f8fafc',
    shoeCyan:  '#38bdf8'
  };

  const isUp = p.dir === 'up';
  const isLeft = p.dir === 'left';
  const isRight = p.dir === 'right';
  const sideSign = isLeft ? -1 : (isRight ? 1 : 0);

  // --- 1. SHADOW ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- 2. SHOES ---
  if (sideSign !== 0) {
    ctx.fillStyle = C.shoeWhite;
    roundRect(ctx, -6 + sideSign, 12, 10, 4, 1); ctx.fill();
    ctx.fillStyle = C.shoeCyan;
    ctx.fillRect(-2 + sideSign * 2, 12, 4, 2);
  } else {
    ctx.fillStyle = C.shoeWhite;
    roundRect(ctx, -8, 12 + legOffset, 6, 4, 1); ctx.fill();
    roundRect(ctx, 2, 12 - legOffset, 6, 4, 1); ctx.fill();
    
    ctx.fillStyle = C.shoeCyan;
    ctx.fillRect(-7, 14 + legOffset, 4, 1);
    ctx.fillRect(3, 14 - legOffset, 4, 1);
  }

  // --- 3. PANTS ---
  ctx.fillStyle = C.pants;
  if (sideSign !== 0) {
    roundRect(ctx, -4, 4, 7, 9, 1); ctx.fill();
  } else {
    roundRect(ctx, -6, 4, 5, 9, 1); ctx.fill();
    roundRect(ctx, 1, 4, 5, 9, 1); ctx.fill();
    ctx.fillStyle = C.pantsShadow;
    ctx.fillRect(-1, 4, 2, 6);
  }

  // --- 4. HOODIE & T-SHIRT ---
  ctx.fillStyle = C.hoodieMain;
  if (sideSign !== 0) {
    roundRect(ctx, -6, -5, 11, 10, 2); ctx.fill();
  } else {
    roundRect(ctx, -8, -5, 16, 10, 2); ctx.fill();
  }

  if (!isUp) {
    ctx.fillStyle = C.shirtCyan;
    if (sideSign !== 0) {
      ctx.fillRect(sideSign > 0 ? -1 : -4, -3, 5, 8);
    } else {
      ctx.fillRect(-4, -3, 8, 8);
    }
    ctx.fillStyle = C.shirtDark;
    ctx.fillRect(sideSign !== 0 ? (sideSign > 0 ? 0 : -3) : -3, -3, 6, 1.5);
  }

  // --- 5. ARMS ---
  ctx.fillStyle = C.hoodieMain;
  if (sideSign !== 0) {
    roundRect(ctx, -3, -3, 5, 7, 2); ctx.fill();
    ctx.fillStyle = C.skinBase;
    roundRect(ctx, -2, 3, 3, 3, 1); ctx.fill();
  } else {
    roundRect(ctx, -10, -3, 3, 7, 1); ctx.fill();
    roundRect(ctx, 7, -3, 3, 5, 1); ctx.fill();
    
    ctx.fillStyle = C.skinBase;
    roundRect(ctx, -10, 3, 3, 3, 1); ctx.fill();
    roundRect(ctx, 6, 1, 3, 3, 1); ctx.fill();
  }

  // --- 6. CABEÇA ---
// --- 6. CABEÇA & PERFIL ---
  if (isUp) {
    // --- DE COSTAS: Baseado no emoji original ---
    ctx.fillStyle = '#b88a6d'; // Orelhas
    ctx.fillRect(-8, -15, 2, 4);
    ctx.fillRect(6, -15, 2, 4);

    ctx.fillStyle = '#3b2515'; // Nuca
    ctx.fillRect(-5, -10, 10, 2);

    ctx.fillStyle = '#5f4129'; // Cabelo base
    roundRect(ctx, -7, -23, 14, 15, 5); ctx.fill();
    ctx.fillRect(-7.5, -20, 15, 10);

    ctx.fillStyle = '#3b2515'; // Risca
    ctx.fillRect(-2, -23, 1, 10);

    ctx.fillStyle = '#98734f'; // Brilho topo
    ctx.fillRect(-5, -22, 10, 3);
    ctx.fillRect(-3, -23, 6, 2);

    ctx.fillStyle = '#3b2515'; // Sombra inferior
    ctx.fillRect(-6, -11, 12, 2);

  } else if (sideSign !== 0) {
    // --- DE LADO (ESQUERDA / DIREITA) ---
    // 1. Parte de trás do cabelo (para dar profundidade ao perfil)
    ctx.fillStyle = '#5f4129';
    roundRect(ctx, -4 - sideSign * 3, -22, 10, 14, 4); ctx.fill();
    
    // Sombra da nuca de lado
    ctx.fillStyle = '#3b2515';
    ctx.fillRect(-3 - sideSign * 3, -10, 7, 2);

    // Brilho do cabelo no topo/trás
    ctx.fillStyle = '#98734f';
    ctx.fillRect(-2 - sideSign * 3, -22, 5, 2);

    // 2. Emoji da cara (deslocado ligeiramente para onde o player está a olhar)
    ctx.font = emojiFont(22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑🏽', sideSign * 2, -14);

  } else {
    // --- DE FRENTE ---
    ctx.font = emojiFont(22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑🏽', 0, -14);
  }

  ctx.restore();
}

// --- DESENHAR FÉLIX ---
function drawFelix(ctx, e) {
  const isUp = e.dir === 'up';
  const isLeft = e.dir === 'left';
  const isRight = e.dir === 'right';
  const sideSign = isLeft ? -1 : (isRight ? 1 : 0);

  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

  // Paleta do Félix
  const hoodieMain = '#1e293b'; // Hoodie escuro
  const shirtColor = '#e11d48'; // T-Shirt vermelha
  const pantsColor = '#0f172a';

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Calças
  ctx.fillStyle = pantsColor;
  roundRect(ctx, -5, 2, 4, 8, 1); ctx.fill();
  roundRect(ctx, 1, 2, 4, 8, 1); ctx.fill();

  // Hoodie / Tronco
  ctx.fillStyle = hoodieMain;
  roundRect(ctx, -7, -6, 14, 9, 2); ctx.fill();

  if (!isUp) {
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-3, -4, 6, 7);
  }

  // Cabeça / Emoji
  if (isUp) {
    // Trás da cabeça (Tom de pele moreno + Cabelo escuro)
    ctx.fillStyle = '#8d5b4c'; ctx.fillRect(-7, -13, 2, 4); ctx.fillRect(5, -13, 2, 4); // Orelhas
    ctx.fillStyle = '#1c1917'; // Cabelo escuro
    roundRect(ctx, -6, -20, 12, 13, 4); ctx.fill();
  } else {
    ctx.font = emojiFont(20);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('👨🏽‍💻', sideSign * 2, -12);
  }

  ctx.restore();
}

// --- DESENHAR PINHO ---
function drawPinho(ctx, e) {
  const isUp = e.dir === 'up';
  const isLeft = e.dir === 'left';
  const isRight = e.dir === 'right';
  const sideSign = isLeft ? -1 : (isRight ? 1 : 0);

  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

  // Paleta do Pinho
  const jacketMain = '#047857'; // Casaco Verde
  const shirtColor = '#f59e0b'; // T-shirt Amarela
  const pantsColor = '#334155';

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Calças
  ctx.fillStyle = pantsColor;
  roundRect(ctx, -5, 2, 4, 8, 1); ctx.fill();
  roundRect(ctx, 1, 2, 4, 8, 1); ctx.fill();

  // Casaco / Tronco
  ctx.fillStyle = jacketMain;
  roundRect(ctx, -7, -6, 14, 9, 2); ctx.fill();

  if (!isUp) {
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-3, -4, 6, 7);
  }

  // Cabeça / Emoji
  if (isUp) {
    // Trás da cabeça (Pele clara + Cabelo Loiro)
    ctx.fillStyle = '#b88a6d'; ctx.fillRect(-7, -13, 2, 4); ctx.fillRect(5, -13, 2, 4);
    ctx.fillStyle = '#d97706'; // Cabelo loiro
    roundRect(ctx, -6, -20, 12, 13, 4); ctx.fill();
  } else {
    ctx.font = emojiFont(20);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🙆🏼‍♂️', sideSign * 2, -12);
  }

  ctx.restore();
}

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }