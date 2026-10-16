/* ============================================================================
 * LEVEL 1 — FAMILY
 * ==========================================================================*/
(function(){
  const L = { id: 1 };
  let world, player, quest, found;

 // ---- driving mini-game overlay (Mission 3) --------------------------------
  function DrivingGame(onWin){
    return {
      lane: 1, laneX:[0.28,0.5,0.72], px:0.5, dist:0, goal:100, obstacles:[], t:0, spawn:0, hit:0,
      points: 20, // Começa com 20 pontos
      enter(){ Toast.show('← → Desvia-te! Chega ao fim sem perder os 20 pontos!', 3); },
      
      resetGame(){
        this.points = 20;
        this.dist = 0;
        this.obstacles = [];
        this.lane = 1;
        this.px = 0.5;
        this.hit = 0;
        Toast.show('💥 Ficaste sem pontos! A recomeçar...', 2);
      },

      update(dt, game){
        this.t+=dt; this.dist += dt*14;
        if(this.hit>0) this.hit-=dt;
        
        // steer between 3 lanes
        if(Input.once('ArrowLeft'))  this.lane=Math.max(0,this.lane-1);
        if(Input.once('ArrowRight')) this.lane=Math.min(2,this.lane+1);
        this.px += (this.laneX[this.lane]-this.px)*Math.min(1,dt*10);
        
        // spawn obstacles mais rápido (intervalo menor: 0.35s a 0.7s)
        this.spawn-=dt;
        if(this.spawn<=0){
          this.spawn=0.35+Math.random()*0.35;
          const kinds=[['🚗','#c33'],['🚦','#e93'],['🕳️','#111'],['🚶','#6cf'],['🚧','#f90']];
          const k=kinds[(Math.random()*kinds.length)|0];
          this.obstacles.push({lane:(Math.random()*3)|0, y:-0.1, e:k[0]});
        }
        
        for(const o of this.obstacles){
          o.y += dt*0.75;
          if(Math.abs(o.y-0.82)<0.06 && o.lane===this.lane && !o.done){
            o.done=true; 
            this.hit=0.5; 
            
            // Perde 5 pontos ao bater
            this.points -= 5;
            Toast.show(`💥 -5 Pontos! (${this.points} restantes)`, 1);
            
            // Se chegar a 0 (ou menos), recomeça o jogo
            if(this.points <= 0){
              this.resetGame();
              return;
            }
          }
        }
        
        this.obstacles=this.obstacles.filter(o=>o.y<1.1);
        if(this.dist>=this.goal){ game.clearOverlay(); onWin(); }
      },
      
      draw(ctx, game){
        const W=game.W,H=game.H;
        ctx.fillStyle='#2b2b34'; ctx.fillRect(0,0,W,H);
        
        // road
        const rw=W*0.6, rx=(W-rw)/2;
        ctx.fillStyle='#3a3a44'; ctx.fillRect(rx,0,rw,H);
        
        // lane dashes scrolling
        ctx.strokeStyle='#ccc'; ctx.lineWidth=4; ctx.setLineDash([24,24]);
        ctx.lineDashOffset=-(this.t*320)%48; // Animação de velocidade da estrada mais rápida
        for(let i=1;i<3;i++){ const x=rx+rw*(i/3); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        ctx.setLineDash([]);
        
        // obstacles
        ctx.fillStyle='#fff';
        for(const o of this.obstacles){ ctx.font=emojiFont(30); ctx.textAlign='center';
          ctx.fillText(o.e, rx+rw*(o.lane/3)+rw/6, o.y*H); }
        
        // car
        const cx=rx+rw*(this.px-0.5)+rw/2, cy=H*0.82;
        ctx.fillStyle='#fff';
        if(this.hit>0 && ((this.hit*20)|0)%2) ctx.globalAlpha=0.4;
        ctx.font=emojiFont(34); ctx.textAlign='center'; ctx.fillText('🚗', cx, cy); ctx.globalAlpha=1;
        
        // progress bar & UI HUD
        ctx.fillStyle='#000a'; ctx.fillRect(0,0,W,30);
        ctx.fillStyle='#7fd97f'; ctx.fillRect(0,0,W*(this.dist/this.goal),30);
        
        // Texto de Progresso e Contador de Pontos
        ctx.fillStyle='#fff'; ctx.font='14px monospace'; ctx.textAlign='left';
        ctx.fillText(`→ BONAPARTE | 🏆 Pontos: ${this.points}`, 10, 20);
        
        ctx.textAlign='center'; ctx.font=emojiFont(16); ctx.fillText('🍺', W-20, 20); ctx.textAlign='left';
      }
    };
  }

  // ---- arrival at Bonaparte -------------
function arrivalScene(onDone){
    return {
      t: 0,
      update(dt){ 
        this.t += dt; 
        if(this.t > 1.4 && (Input.once(' ') || Input.once('Enter'))) onDone(); 
      },
      draw(ctx, g){
        const W = g.W, H = g.H;

        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#100c2a');
        sky.addColorStop(0.45, '#3b1d40');
        sky.addColorStop(0.72, '#9d3d3d');
        sky.addColorStop(0.85, '#e07a48');
        sky.addColorStop(1, '#231828');
        ctx.fillStyle = sky; 
        ctx.fillRect(0, 0, W, H);

        // Estrelas 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for(let i=0; i<15; i++) {
          const sx = ((i * 97) % W), sy = ((i * 43) % (H * 0.45));
          ctx.fillRect(sx, sy, (i%2)+1, (i%2)+1);
        }

        // Chão 
        const groundY = H * 0.70;
        ctx.fillStyle = '#161219'; 
        ctx.fillRect(0, groundY, W, H - groundY);

        ctx.fillStyle = '#2d2433';
        ctx.fillRect(0, groundY, W, 4);

        const bw = 280, bh = 170;
        const bx = W/2 - bw/2, by = groundY - bh + 8;

        const floorGlow = ctx.createRadialGradient(W/2, groundY + 20, 10, W/2, groundY + 20, 180);
        floorGlow.addColorStop(0, 'rgba(255, 180, 70, 0.35)');
        floorGlow.addColorStop(1, 'rgba(255, 180, 70, 0)');
        ctx.fillStyle = floorGlow;
        ctx.fillRect(0, groundY, W, H - groundY);

        ctx.fillStyle = '#2a1a1f'; 
        roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
        
        ctx.fillStyle = '#201317';
        for(let y = by + 30; y < by + bh; y += 12) {
          ctx.fillRect(bx, y, bw, 1);
        }

        const winW = 92, winH = 65, winY = by + 65;
        const win1X = bx + 22, win2X = bx + bw - winW - 22;

        const drawWindow = (wx, wy) => {
          const winGlow = ctx.createLinearGradient(wx, wy, wx, wy + winH);
          winGlow.addColorStop(0, '#ffe082');
          winGlow.addColorStop(1, '#ff9800');
          ctx.fillStyle = winGlow;
          roundRect(ctx, wx, wy, winW, winH, 4); ctx.fill();

          ctx.strokeStyle = '#150a08'; ctx.lineWidth = 4;
          roundRect(ctx, wx, wy, winW, winH, 4); ctx.stroke();
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wx + winW/2, wy); ctx.lineTo(wx + winW/2, wy + winH);
          ctx.stroke();
        };

        drawWindow(win1X, winY);
        drawWindow(win2X, winY);

        ctx.font = emojiFont(35); 
        ctx.fillStyle = '#2b1408'; 
        // Pai (Esquerda)
        ctx.fillText('🧓🏼', win1X + winW/2 - 30, winY + winH - 12);
        // TIMO (Direita)
        ctx.fillText('🧑🏽', win1X + winW/2 - 2, winY + winH - 12);

        const doorW = 38, doorH = 75;
        const doorX = W/2 - doorW/2, doorY = by + bh - doorH;
        ctx.fillStyle = '#180d0d';
        roundRect(ctx, doorX, doorY, doorW, doorH, 2); ctx.fill();
        ctx.strokeStyle = '#3d231d'; ctx.lineWidth = 2;
        roundRect(ctx, doorX, doorY, doorW, doorH, 2); ctx.stroke();
        ctx.fillStyle = '#ffb74d';
        roundRect(ctx, doorX + 6, doorY + 10, doorW - 12, 28, 2); ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(doorX + doorW - 8, doorY + 44, 3, 6);

        const awnY = by + 28, awnH = 22, awnW = bw + 16, awnX = bx - 8;
        ctx.save();
        roundRect(ctx, awnX, awnY, awnW, awnH, 4); ctx.clip();
        ctx.fillStyle = '#7a1c1c'; ctx.fillRect(awnX, awnY, awnW, awnH);
        ctx.fillStyle = '#f5e6c8';
        for(let x = awnX; x < awnX + awnW + 20; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, awnY); ctx.lineTo(x + 10, awnY);
          ctx.lineTo(x + 4, awnY + awnH); ctx.lineTo(x - 6, awnY + awnH);
          ctx.fill();
        }
        ctx.restore();

        const signY = by - 10;
        // Moldura do Letreiro
        ctx.fillStyle = '#110a08';
        roundRect(ctx, W/2 - 95, signY - 18, 190, 36, 6); ctx.fill();
        ctx.strokeStyle = '#5a3825'; ctx.lineWidth = 2;
        roundRect(ctx, W/2 - 95, signY - 18, 190, 36, 6); ctx.stroke();

        const neonPulse = 0.8 + Math.sin(this.t * 4) * 0.2;
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 12 * neonPulse;

        ctx.fillStyle = '#fff8e1';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BONAPARTE', W/2, signY + 6);
        ctx.shadowBlur = 0; // Reset da sombra

        ctx.font = emojiFont(24);
        ctx.fillText('🍺', W/2, signY - 24);

        const boxW = Math.min(420, W - 40), boxH = 68;
        const boxX = W/2 - boxW/2, boxY = H - 85;

        const dlgBg = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
        dlgBg.addColorStop(0, 'rgba(20, 16, 28, 0.95)');
        dlgBg.addColorStop(1, 'rgba(10, 8, 15, 0.98)');
        ctx.fillStyle = dlgBg;
        roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.fill();

        ctx.strokeStyle = '#ffb74d'; 
        ctx.lineWidth = 1.5; 
        roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.stroke();

        // Texto do Diálogo
        ctx.fillStyle = '#fff'; 
        ctx.font = '500 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAPA: "São duas canecas, por favor."', W/2, boxY + 28);

        // Prompt para Avançar
        if(this.t > 1.4){ 
          const alpha = 0.6 + Math.sin(this.t * 6) * 0.4;
          ctx.fillStyle = `rgba(255, 226, 122, ${alpha})`; 
          ctx.font = 'bold 13px monospace';
          ctx.fillText('▶ Pressiona [ Espaço / Enter ] para voltar', W/2, boxY + 52); 
        }

        ctx.textAlign = 'left'; // Reset final do alinhamento
      }
    };
}

  // ---- Maki catch mini choice  -----------------------------------
  function makiEncounter(makiEnt){
    Dialogue.start([
      {speaker:'', text:'🐕 A Maki está a olhar para ti. Cauda a abanar. Zero intenção de obedecer.'},
      {prompt:'O que fazes?', choice:[
        {label:'Chamar a Maki',   cb:()=>makiResult(false,'Chamas. A Maki inclina a cabeça... e olha para outro lado. Clássico.')},
        {label:'Oferecer um brinquedo',  cb:()=>makiResult(true, 'Um brinquedo. Claro. A Maki começa a andar ao teu lado instantaneamente. 🐕')},
        {label:'Perseguir a Maki',  cb:()=>makiResult(false,'Persegues. A Maki pensa que é uma brincadeira e foge para longe. 💨')},
      ]}
    ]);
  }
  function makiResult(ok, text){
    Dialogue.say('', text, ()=>{
      if(ok){
        Game.flag('maki_party', true);
        makiJoin();
        Toast.show('🐕 MAKI JOINED THE PARTY', 3);
      }
    });
  }
  let makiFollow=null;
  let flowerFollow=null;
  function makiJoin(){
    // remove wandering maki, attach a follower
    world.entities = world.entities.filter(e=>e.tag!=='maki');
    makiFollow = {emoji:'🐕', x:player.x, y:player.y+20, w:20,h:20};
  }

  // ---- interactions ---------------------------------------------------------
  function interact(e){
    if(e.tag==='home'){ Dialogue.say('','🏠 Não está ninguém em casa...'); return; }

    if(e.tag==='mom'){
      if(found.mom) { Dialogue.say('MUM','Meu filhinho ❤️'); return; }
      if(Game.flag('has_flowers')){
        Game.flag('has_flowers', false); flowerFollow=null;
        Dialogue.start([
          {speaker:'TIMO', text:'Aqui estão!'},
          {speaker:'MUM', text:'Obrigada, só coisas boas meus amores 🥂❤️'},
        ], ()=>markFound('mom','Mom'));
      } else if(Game.flag('mom_quest')){
        Dialogue.say('MUM','Tens as minhas flores? A florista fica a Este. 🌸');
      } else {
        Game.flag('mom_quest', true);
        quest = 'A mum quer flores - visita a 🌸 Florista.';
        Dialogue.start([
          {speaker:'MUM', text:'Meu filhinho mais lindo!!!!!'},
          {speaker:'TIMO', text:'Olá minha Mum!'},
          {speaker:'MUM', text:'Podias fazer-me um favor...'},
          {speaker:'MUM', text:'🌷 Trazes-me flores?'},
        ]);
      }
      return;
    }

    if(e.tag==='florist'){
      if(Game.flag('mom_quest') && !Game.flag('has_flowers') && !found.mom){
        Game.flag('has_flowers', true);
        Dialogue.start([
          {speaker:'TIMO', text:'Olá, queria este ramo de flores, por favor.'},
          {speaker:'FLORISTA', text:'Aqui tem, obrigada!'},
        ], ()=>{ Toast.show('🌷 FLORES JÁ CÁ CANTAM', 2.6);
                 flowerFollow={x:player.x,y:player.y+18};
                 quest='Leva as flores à Mum.'; });
      } else {
        Dialogue.say('FLORISTA','💐 Florista. Aberto!');
      }
      return;
    }

    if(e.tag==='sofiabernardo'){
      if(found.sofia){ Dialogue.say('SOFIA','Obrigada por teres trazido a Maki de volta!'); return; }
      if(Game.flag('maki_party')){
        Dialogue.start([
          {speaker:'SOFIA', text:'Cá está ela!'},
          {speaker:'BERNARDO', text:'Finalmente.'},
        ], ()=>{ makiFollow=null;
                 world.entities=world.entities.filter(e=>e.tag!=='maki');
                 markFound('sofia','Sofia & Bernardo'); });
      } else if(Game.flag('maki_quest')){
        Dialogue.say('SOFIA','Por favor, encontra a Maki! Ela fugiu para algum lado.');
      } else {
        Game.flag('maki_quest', true);
        quest='Encontra a Maki 🐕 (ela anda solta por aí).';
        Dialogue.start([
          {speaker:'SOFIA', text:'Viste a Maki?'},
          {speaker:'BERNARDO', text:'Ela estava literalmente aqui há dois segundos.'},
          {speaker:'', text:'🐕 ENCONTRA A MAKI'},
        ]);
      }
      return;
    }

    if(e.tag==='maki'){
      if(!Game.flag('maki_quest')){ Dialogue.say('','🐕 Um cãozinho lindíssimo. Parece pertencer a alguém.'); return; }
      if(!Game.flag('maki_party')) makiEncounter(e);
      return;
    }

    if(e.tag==='dad'){
      if(found.dad){ Dialogue.say('PAPA','Então Tomás?'); return; }
      Dialogue.start([
        {speaker:'PAPA', text:'O que andas a fazer?'},
        {speaker:'TIMO', text:'À tua procura.'},
        {speaker:'PAPA', text:'Entra.'},
        {speaker:'', text:'🚗 VAMOS PARA O BONAPARTE'},
      ], ()=>{
        Game.setOverlay(DrivingGame(()=>{
          // arrival is its own scene overlay so the frame is never blank
          Game.setOverlay(arrivalScene(()=>{
            Game.clearOverlay();          // back to the map
            markFound('dad','Papa');
          }));
        }));
      });
      return;
    }

    if(e.tag==='bonaparte'){ Dialogue.say('','🍺 Bonaparte. Aberto!'); return; }
  }

  function markFound(key, nice){
    if(found[key]) return;
    found[key]=true; Game.flag('found_'+key, true);
    const count = (found.mom?1:0)+(found.dad?1:0)+(found.sofia?2:0);
    quest = count>=4 ? '' : 'Continua a procurar a tua família.';
    Toast.show('FAMILY FOUND: '+count+'/4', 3);
    if(count>=4) setTimeout(levelComplete, 900);
  }

function levelComplete() {
  Game.setOverlay({
    t: 0,
    update(dt) {
      this.t += dt;
      if (Input.once(' ') && this.t > 1.6) {
        Game.clearOverlay();
        nextLevel();
      }
    },
    draw(ctx, g) {
      const W = g.W, H = g.H;
      const progress = Math.min(1, this.t * 1.5);

      // --- 1. OVERLAY DE FUNDO ---
      ctx.fillStyle = `rgba(3, 7, 18, ${0.88 * progress})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = progress;

      // --- 2. CONTAINER PRINCIPAL ---
      const boxW = Math.min(W - 32, 340);
      const boxH = 300;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      // Sombra projetada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      roundRect(ctx, boxX + 6, boxY + 8, boxW, boxH, 16);
      ctx.fill();

      const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      roundRect(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      roundRect(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, boxX + 3, boxY + 3, boxW - 6, boxH - 6, 13);
      ctx.stroke();

      // --- 3. CABEÇALHO ---
      ctx.textAlign = 'center';

      // Badge de Topo
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      roundRect(ctx, W / 2 - 70, boxY + 18, 140, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('🎉 NÍVEL 1 CONCLUÍDO', W / 2, boxY + 33);

      // Título Dourado
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 18px monospace';
      ctx.fillText('FAMÍLIA ENCONTRADA', W / 2, boxY + 65);

      // --- 4. GRELHA 2x2 DA FAMÍLIA ---
      const family = [
        { name: 'Mum', emoji: '👩🏽' },
        { name: 'Papa', emoji: '🧓🏼' },
        { name: 'Sofia', emoji: '👩🏻' },
        { name: 'Bernardo', emoji: '🧑🏻' }
      ];

      const cardW = 135;
      const cardH = 34;
      const gapX = 12;
      const gapY = 8;
      const startX = W / 2 - cardW - gapX / 2;
      const startY = boxY + 82;

      family.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = startX + col * (cardW + gapX);
        const cy = startY + row * (cardH + gapY);

        // Fundo do Card
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        roundRect(ctx, cx, cy, cardW, cardH, 8);
        ctx.fill();

        // Borda do Card
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, cx, cy, cardW, cardH, 8);
        ctx.stroke();

        // Conteúdo
        ctx.textAlign = 'left';
        
        // Emoji
        ctx.font = '15px monospace';
        ctx.fillText(m.emoji, cx + 8, cy + 22);

        // Nome
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(m.name, cx + 30, cy + 21);

        // Checkmark
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('✓', cx + cardW - 18, cy + 21);
      });

      if (this.t > 0.8) {
        ctx.globalAlpha = Math.min(1, (this.t - 0.8) * 2);
        ctx.textAlign = 'center';

        // Divisória
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(boxX + 24, boxY + 176);
        ctx.lineTo(boxX + boxW - 24, boxY + 176);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.fillText('Encontraste toda a tua família!', W / 2, boxY + 200);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'italic 12px monospace';
        ctx.fillText('Mas ainda há pessoas à tua espera...', W / 2, boxY + 220);
      }

      if (this.t > 1.6) {
        const pulse = Math.sin(this.t * 5) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.textAlign = 'center';

        // Botão Estilizado
        const btnW = 160;
        const btnH = 28;
        const btnX = W / 2 - btnW / 2;
        const btnY = boxY + boxH - 42;

        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 6);
        ctx.fill();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        roundRect(ctx, btnX, btnY, btnW, btnH, 6);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('[ ESPAÇO ]  CONTINUAR', W / 2, btnY + 18);
      }

      ctx.restore();
      ctx.textAlign = 'left';
    }
  });
}

  function nextLevel(){
    if(Game.levels[2]) Game.startLevel(2);
    else Game.setOverlay({
      update(){}, draw(ctx,g){ const W=g.W,H=g.H;
        ctx.fillStyle='#05060d'; ctx.fillRect(0,0,W,H); ctx.textAlign='center';
        ctx.fillStyle='#ffe27a'; ctx.font='bold 26px monospace';
        ctx.fillText('LEVEL 2 — FRIENDS', W/2, H/2-10);
        ctx.fillStyle='#9ab'; ctx.font='16px monospace';
        ctx.fillText('Coming soon. (We build it next!)', W/2, H/2+24); ctx.textAlign='left'; }
    });
  }
// ---- level definition -----------------------------------------------------
  L.enter = function(game){
    world = new World(30, 22);

    const roadColor = '#8c765c', roadEdge = '#5c4a38', plazaColor = '#9e876b';
    const grassAlt1 = '#3a663b', grassAlt2 = '#2e542f';

    // Variações de cor na relva base para não ficar plano
    for(let x=0; x<world.cols; x++){
      for(let y=0; y<world.rows; y++){
        if ((x * 7 + y * 13) % 11 === 0) world.paint[x+','+y] = grassAlt1;
        else if ((x * 3 + y * 17) % 13 === 0) world.paint[x+','+y] = grassAlt2;
      }
    }

    // Avenida Vertical + Rua Horizontal com margens de pedra
    for(let y=0; y<world.rows; y++){ 
      world.paint['14,'+y] = roadColor; world.paint['15,'+y] = roadColor;
      world.paint['13,'+y] = roadEdge;  world.paint['16,'+y] = roadEdge; 
    }
    for(let x=0; x<world.cols; x++){ 
      world.paint[x+',11'] = roadColor; 
      world.paint[x+',10'] = roadEdge;  world.paint[x+',12'] = roadEdge; 
    }

    for(let y=9; y<=13; y++){
      for(let x=12; x<=17; x++){
        world.paint[x+','+y] = plazaColor;
      }
    }

    const connectPath = (x1, y1, x2, y2) => {
      for(let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++) {
        for(let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++) {
          world.paint[x+','+y] = '#7a6853';
        }
      }
    };
    connectPath(6, 17, 13, 17); // Caminho da Home -> Avenida
    connectPath(6, 7, 13, 7);   // Caminho da Des Autres -> Avenida
    connectPath(21, 5, 21, 10);  // Caminho Sofia -> Rua Horizontal
    connectPath(24, 13, 24, 12); // Caminho Florista -> Rua Horizontal

    // --- 2. JOGADOR E QUESTS ---
    player = new Player(6*TILE, 18*TILE);
    quest = 'Encontra a tua família — 4 membros estão espalhados por aí.';
    found = { mom:!!game.flag('found_mom'), dad:!!game.flag('found_dad'), sofia:!!game.flag('found_sofia') };

    function building(tx, ty, tw, th, color, roof, label, emoji) {
      world.block(tx, ty, tw, th);
      const x = tx * TILE, y = ty * TILE, w = tw * TILE, h = th * TILE;
      world.add({ box: true, x, y, w, h, color, roof, label, emoji });
    }

    // Sofia + Bernardo (Norte)
    building(18, 1, 7, 4, '#32334a', '#3c529c', 'SOFIA + BERNARDO', '👩🏻🧑🏻');
    world.add({ tag: 'sofiabernardo', interact: true, x: (18 + 7 / 2) * TILE - TILE / 2, y: 4.5 * TILE - 6, w: TILE, h: TILE, emoji: '' });

    // Des Autres / Mãe (Noroeste)
    building(3, 3, 6, 4, '#3d5c44', '#529457', 'DES AUTRES', '👩🏽');
    world.add({ tag: 'mom', interact: true, x: (3 + 6 / 2) * TILE - TILE / 2, y: 6.5 * TILE - 6, w: TILE, h: TILE, emoji: '' });

    // TIMO' house — HOME (Sudoeste)
    building(4, 13, 4, 4, '#3d344d', '#7b5294', 'HOME', '🏠');
    world.add({ tag: 'home', interact: true, x: (4 + 4 / 2) * TILE - TILE / 2, y: 16.5 * TILE - 6, w: TILE, h: TILE, emoji: '' });

    // Florista (Este)
    building(24, 9, 5, 4, '#4d2e3b', '#c45880', 'FLORISTA', '🌸');
    world.add({ tag: 'florist', interact: true, x: (24 + 5 / 2) * TILE - TILE / 2, y: 12.5 * TILE - 6, w: TILE, h: TILE, emoji: '' });

    // Dad's car (Estacionado perto da praça)
    world.add({ tag: 'dad', interact: true, x: 14 * TILE + 4, y: 17 * TILE, w: 26, h: 26, emoji: '🚙', name: 'Papa', size: 38 });

    // Bonaparte Pub (Sudeste)
    building(24, 16, 5, 4, '#3b3827', '#a89d3b', 'BONAPARTE', '🍺');
    world.add({ tag: 'bonaparte', interact: true, x: (24 + 5 / 2) * TILE - TILE / 2, y: 19.5 * TILE - 6, w: TILE, h: TILE, emoji: ''});

    if(!found.sofia){
      const maki=world.add({tag:'maki',interact:true,x:20*TILE,y:14*TILE,w:24,h:24,emoji:'🐕',name:'Maki',size:26,
                            _t:Math.random()*6, _ox:20*TILE,_oy:14*TILE});
      world._maki=maki;
    }
    if(game.flag('maki_party') && !found.sofia){ makiFollow={emoji:'🐕',x:player.x,y:player.y+20,w:20,h:20};
      world.entities=world.entities.filter(e=>e.tag!=='maki'); }
    if(game.flag('has_flowers')){ flowerFollow={x:player.x,y:player.y+18}; }

    // Praça Central
    world.add({emoji:'⛲', x:14.2*TILE+8, y:11*TILE, w:28, h:28, size:40}); // Chafariz no centro
    world.add({emoji:'🪴', x:12.5*TILE, y:11*TILE, w:22, h:22, size:24});   // Banco esq.
    world.add({emoji:'🪴', x:16.5*TILE, y:11*TILE, w:22, h:22, size:24});   // Banco dir.
    world.add({emoji:'🛴', x:13*TILE, y:9.2*TILE, w:20, h:20, size:30});    // Candeeiro praça
    world.add({emoji:'🐈', x:19*TILE, y:5.2*TILE, w:20, h:20, size:24});    // Candeeiro praça

    // Pequeno Bosque (Norte)
    world.add({emoji:'🌳', x:1*TILE, y:1*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌲', x:3*TILE, y:1*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌳', x:10*TILE, y:2*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌲', x:12*TILE, y:1*TILE, w:28, h:28, size:34});
    world.add({emoji:'🍄', x:11*TILE, y:3*TILE, w:18, h:18, size:20});

    // Zona de Jardim & Flores junto da Florista
    world.add({emoji:'🌷', x:22*TILE, y:9*TILE, w:22, h:22, size:24});
    world.add({emoji:'🌻', x:22*TILE, y:10*TILE, w:22, h:22, size:24});
    world.add({emoji:'🪻', x:23*TILE, y:9.5*TILE, w:22, h:22, size:24});
    world.add({emoji:'🌼', x:22*TILE, y:15*TILE, w:22, h:22, size:24});
    world.add({emoji:'🌷', x:23*TILE, y:16*TILE, w:22, h:22, size:24});

    // Zona Sul (Árvores e Detalhes)
    world.add({emoji:'🌳', x:1*TILE, y:18*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌳', x:2*TILE, y:20*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌳', x:11*TILE, y:19*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌳', x:28*TILE, y:4*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌲', x:28*TILE, y:20*TILE, w:28, h:28, size:34});

    // Animais e Sinalização
    world.add({emoji:'🐦‍⬛', x:9*TILE, y:5*TILE, w:20, h:20, size:22});
    world.add({emoji:'🐩', x:5*TILE, y:10*TILE, w:18, h:18, size:25});
    world.add({emoji:'🚶🏼‍♀️', x:6*TILE, y:10*TILE, w:18, h:18, size:40});


    Toast.show('🧑‍🧑‍🧒‍🧒 LEVEL 1 — FAM', 3.2);
  };

  L.update = function(dt, game){
    player.update(dt, world);
    // wander maki
    const m=world._maki;
    if(m && world.entities.includes(m)){
      m._t+=dt; m.x=m._ox+Math.sin(m._t)*40; m.y=m._oy+Math.cos(m._t*0.7)*24;
    }
    // maki follower trails player
    if(makiFollow){
      const tx=player.x - (player.dir==='left'?-18:18), ty=player.y+16;
      makiFollow.x += (tx-makiFollow.x)*Math.min(1,dt*6);
      makiFollow.y += (ty-makiFollow.y)*Math.min(1,dt*6);
    }
    // flowers held in hand trail slightly behind
    if(flowerFollow){
      const tx=player.x + (player.dir==='left'?-14:14), ty=player.y-2;
      flowerFollow.x += (tx-flowerFollow.x)*Math.min(1,dt*10);
      flowerFollow.y += (ty-flowerFollow.y)*Math.min(1,dt*10);
    }
    if(Input.once(' ')){ const f=player.facing(world); if(f) interact(f); }
  };

  L.draw = function(ctx, game){
    renderWorld(ctx, world, player, game.W, game.H, {
      hud(ctx){
        if(quest){
          const qw = game.W - 20, qh = 42, qx = 10, qy = game.H - 52;
          ctx.fillStyle = 'rgba(16, 14, 26, 0.9)'; 
          roundRect(ctx, qx, qy, qw, qh, 8); ctx.fill();
          ctx.strokeStyle = '#e0a96d'; ctx.lineWidth = 1.5;
          roundRect(ctx, qx, qy, qw, qh, 8); ctx.stroke();

          ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace'; 
          ctx.fillText('📜 QUEST', qx + 12, qy + 16);
          ctx.fillStyle = '#fff'; ctx.font = textFont(13); 
          ctx.fillText(quest, qx + 12, qy + 32);
        }
        // Family counter UI
        const count = (game.flag('found_mom')?1:0) + (game.flag('found_dad')?1:0) + (game.flag('found_sofia')?2:0);
        const cw = 145, ch = 28, cx = game.W - cw - 10, cy = 10;
        ctx.fillStyle = 'rgba(16, 14, 26, 0.9)'; 
        roundRect(ctx, cx, cy, cw, ch, 6); ctx.fill();
        ctx.strokeStyle = '#7fd97f'; ctx.lineWidth = 1;
        roundRect(ctx, cx, cy, cw, ch, 6); ctx.stroke();

        ctx.fillStyle = '#e8f5e9'; ctx.font = 'bold 13px ' + TEXT_FONT_STACK; 
        ctx.fillText('👪 FAM: ' + count + '/4', cx + 12, cy + 18);
      }
    });

    // Desenhar seguidores no topo
    if(makiFollow || flowerFollow){
      const camX = clamp(player.x - game.W/2, 0, world.cols*TILE - game.W);
      const camY = clamp(player.y - game.H/2, 0, world.rows*TILE - game.H);
      ctx.save(); ctx.translate(-Math.round(camX), -Math.round(camY));
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      if(makiFollow){ ctx.font = emojiFont(22); ctx.fillText('🐕', makiFollow.x, makiFollow.y); }
      if(flowerFollow){ ctx.font = emojiFont(20); ctx.fillText('💐', flowerFollow.x, flowerFollow.y); }
      ctx.textAlign = 'left'; ctx.restore();
    }
  };
L.levelComplete = levelComplete;
  Game.addLevel(1, L);
})();