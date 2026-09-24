/* ============================================================================
 * LEVEL 2 — FRIENDS
 * Best Friends Test. Two important characters: Félix and Pinho.
 * Part 1: Félix's best-friend quiz. Part 2: chase Félix through his own
 * dropped junk. Part 3: Pinho's "what are we doing" combo puzzle.
 * Ending: BEST FRIENDS UNLOCKED + friendship medal.
 * ==========================================================================*/
(function(){
  const L = { id: 2 };
  let world, player, quest, found;

  // ---- RENDERIZADORES CUSTOMIZADOS DAS PERSONAGENS -------------------------
  function drawFelix(ctx, e) {
    const isUp = e.dir === 'up';
    const isLeft = e.dir === 'left';
    const isRight = e.dir === 'right';
    const sideSign = isLeft ? -1 : (isRight ? 1 : 0);

    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calças e Hoodie
    ctx.fillStyle = '#0a1d49';
    roundRect(ctx, -5, 2, 4, 8, 1); ctx.fill();
    roundRect(ctx, 1, 2, 4, 8, 1); ctx.fill();

    ctx.fillStyle = '#1e293b';
    roundRect(ctx, -7, -6, 14, 9, 2); ctx.fill();

    if (!isUp) {
      ctx.fillStyle = '#0a7537';
      ctx.fillRect(-3, -4, 6, 7);
    }

    if (isUp) {
      ctx.fillStyle = '#8d5b4c'; ctx.fillRect(-7, -13, 2, 4); ctx.fillRect(5, -13, 2, 4);
      ctx.fillStyle = '#1c1917';
      roundRect(ctx, -6, -20, 12, 13, 4); ctx.fill();
    } else {
      ctx.font = emojiFont(20);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧑🏻', sideSign * 2, -12);
    }

    ctx.restore();
  }

  function drawPinho(ctx, e) {
    const isUp = e.dir === 'up';
    const isLeft = e.dir === 'left';
    const isRight = e.dir === 'right';
    const sideSign = isLeft ? -1 : (isRight ? 1 : 0);

    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calças e Casaco
    ctx.fillStyle = '#334155';
    roundRect(ctx, -5, 2, 4, 8, 1); ctx.fill();
    roundRect(ctx, 1, 2, 4, 8, 1); ctx.fill();

    ctx.fillStyle = '#047857';
    roundRect(ctx, -7, -6, 14, 9, 2); ctx.fill();

    if (!isUp) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -4, 6, 7);
    }

    if (isUp) {
      ctx.fillStyle = '#b88a6d'; ctx.fillRect(-7, -13, 2, 4); ctx.fillRect(5, -13, 2, 4);
      ctx.fillStyle = '#d97706';
      roundRect(ctx, -6, -20, 12, 13, 4); ctx.fill();
    } else {
      ctx.font = emojiFont(20);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👱🏻‍♂️', sideSign * 2, -12);
    }

    ctx.restore();
  }

  // ---- Félix chase state -----------------------------------------------------
  const FELIX_DROPS = [['⚽','ball'],['🍺','beer'],['💶','money'],['👟','sneaker']];
  let felixEnt = null;
  let felixState = 'idle';     // idle -> quiz -> fleeing -> caught
  let felixDropTimer = 0;
  let felixDropIdx = 0;
  let felixFleeClock = 0;
  const FELIX_HEAD_START = 1.3;

  // ---- best-friend quiz -------------------------------------------------------
  const QUIZ = [
    { q:'Quem sobreviveria mais tempo num apocalipse zumbi?',
      a:['Félix','Pinho'], correct:0,
      right:'Obviamente. Eu subiria a alguma coisa.', wrong:'...você também subiria a alguma coisa, mas mais devagar.' },
    { q:'Quem é mais provável de fazer 189 sons de pai quando se senta num sofá?',
      a:['Félix','Pinho'], correct:1,
      right:'Haha! Pelo menos alguém está a prestar atenção.', wrong:'Por favor. Eu sento-me em completo silêncio.' },
    { q:"Quem iria ao Japão e diria que não experimentou sushi porque o sushi é mau no Japão?",
      a:['Félix','Pinho'], correct:0,
      right:'Isso é... extremamente específico. E verdadeiro.', wrong:'Mentiras. Difamação. Eu nunca faria.' },
  ];

  function askQuiz(i, onAllDone){
    if(i>=QUIZ.length){ onAllDone(); return; }
    const item = QUIZ[i];
    Dialogue.start([
      { prompt:item.q, choice:[
        { label:item.a[0], cb:()=>afterAnswer(i,0,onAllDone) },
        { label:item.a[1], cb:()=>afterAnswer(i,1,onAllDone) },
      ]}
    ]);
  }
  function afterAnswer(i, picked, onAllDone){
    const item = QUIZ[i];
    const ok = picked===item.correct;
    Dialogue.say('FÉLIX', ok ? item.right : item.wrong, ()=>askQuiz(i+1, onAllDone));
  }

  function startFelixQuiz(){
    felixState='quiz';
    Dialogue.start([
      {speaker:'FÉLIX', text:'Antes de te ajudar, preciso de saber uma coisa.'},
      {speaker:'', text:'❓ BEST FRIEND QUIZ'},
    ], ()=>{
      askQuiz(0, ()=>{
        Dialogue.say('FÉLIX','Nada mau.', startFelixChase);
      });
    });
  }

  function startFelixChase(){
    felixState='fleeing';
    felixDropTimer = 0.9; felixDropIdx = 0;
    felixFleeClock = 0;
    quest = 'Persegue o Félix! Desvia-te do que ele deixa cair. 🏃';
    Toast.show('🏃 OLHA QUE O FÉLIX CORRER BEM!', 2.6);
  }

  function updateFelixFlee(dt){
    if(felixState!=='fleeing' || !felixEnt) return;
    felixFleeClock += dt;
    const fcx = felixEnt.x+felixEnt.w/2, fcy = felixEnt.y+felixEnt.h/2;
    const dx = fcx-player.x, dy = fcy-player.y;
    const dist = Math.hypot(dx,dy)||1;

    if(dist < 30 && felixFleeClock > FELIX_HEAD_START){
      felixState='caught';
      world.entities = world.entities.filter(e=>e.tag!=='obstacle');
      Dialogue.say('FÉLIX','Está bem vai lá ter com o Pinho que eu agora tenho de tratar de umas merdas.', ()=>markFound('felix'));
      return;
    }

    const speed = 78;
    let mx = dx/dist, my = dy/dist;
    const wob = Math.sin(performance.now()/220 + felixEnt._seed)*0.5;
    const nmx = mx*Math.cos(wob) - my*Math.sin(wob);
    const nmy = mx*Math.sin(wob) + my*Math.cos(wob);
    tryMoveEnt(felixEnt, nmx*speed*dt, nmy*speed*dt);

    felixDropTimer -= dt;
    if(felixDropTimer<=0 && felixDropIdx<FELIX_DROPS.length){
      felixDropTimer = 1.0;
      const [emoji] = FELIX_DROPS[felixDropIdx++];
      world.add({tag:'obstacle', solid:true, interact:false,
        x:felixEnt.x+(Math.random()*16-8), y:felixEnt.y+(Math.random()*16-8),
        w:22, h:22, emoji, size:24});
    }
  }

  function tryMoveEnt(e, dx, dy){
    const step=(nx,ny)=>{
      const tx0=Math.floor(nx/TILE), tx1=Math.floor((nx+e.w)/TILE);
      const ty0=Math.floor(ny/TILE), ty1=Math.floor((ny+e.h)/TILE);
      for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++) if(world.isSolid(tx,ty)) return false;
      return true;
    };
    if(dx){ const nx=clamp(e.x+dx,0,(world.cols-1)*TILE); if(step(nx,e.y)) e.x=nx; }
    if(dy){ const ny=clamp(e.y+dy,0,(world.rows-1)*TILE); if(step(e.x,ny)) e.y=ny; }
  }

  // ---- Pinho's "what are we doing" combo puzzle ------------------------------
  const PINHO_ROUNDS = [
    { prompt:'"Estamos em Venade. O que é estamos a fazer?"',
      options:[
        {label:'🍺⚽ Cervejinha & Remates à Baliza', ok:true},
        {label:'🎬 Ver um filme', ok:false},
        {label:'🛌 Dormir', ok:false},
      ], right:'FAHHHHHH. Planinho de eleição.', wrong:'Estás a brincar ou....?' },
    { prompt:'"Não concordamos em alguma coisa. Como se resolve?"',
      options:[
        {label:'🤝 Falamos calmamente e concordamos em discordar', ok:false},
        {label:'🫯 Discussãozinha saudável timeee!', ok:true},
        {label:'😶 Ninguém fala, passamos à frente', ok:false},
      ], right:'Certissimo. Provavelmente nenhum tem razão.', wrong:'Não me parece, tenta outra vez.' },
    { prompt:"\"É o 1º fim de semana de Junho. Qual é o plano?\"",
      options:[
        {label:'👨🏽‍💻🧑🏼‍💻 Trabalhar', ok:false},
        {label:'🎞️ Discutir o top dos filmes dos Oscars', ok:false},
        {label:'🎟️ Prima', ok:true},
      ], right:'Está feito. Parece que afinal não estás a dormir nesta amizade.', wrong:'...não. Anda lá. Primeiro fim de semana de Junho. Tenta outra vez.' },
  ];

  function askPinhoRound(i, onAllDone){
    if(i>=PINHO_ROUNDS.length){ onAllDone(); return; }
    const r = PINHO_ROUNDS[i];
    Dialogue.start([
      { prompt:r.prompt, choice:r.options.map(o=>({label:o.label, cb:()=>{
        if(o.ok){ Dialogue.say('PINHO', r.right, ()=>askPinhoRound(i+1, onAllDone)); }
        else    { Dialogue.say('PINHO', r.wrong, ()=>askPinhoRound(i, onAllDone)); }
      }})) }
    ]);
  }

  // ---- interactions -----------------------------------------------------------
  function interact(e){
    if(e.tag==='felix'){
      if(found.felix){ Dialogue.say('FÉLIX','Vai lá. O Pinho está à tua espera.'); return; }
      if(felixState==='fleeing'){ Dialogue.say('FÉLIX','Só sabes nadar ou também sabes correr? Apanha-me.'); return; }
      if(felixState==='idle'){
        Dialogue.say('TOMÁS','Félix. Preciso da tua ajuda.', startFelixQuiz);
      }
      return;
    }
    if(e.tag==='pinho'){
      if(found.pinho){ Dialogue.say('PINHO','Ainda estás aqui? Já te disse que vais ter de falar com o Félix primeiro.'); return; }
      if(!found.felix){ Dialogue.say('PINHO','Vai ter com o Félix primeiro. Não sou eu que tomo as decisões aqui (idealmente em lado nenhum).'); return; }
      if(Game.flag('pinho_quiz_started')){ Dialogue.say('PINHO','Foca-te. Responde às perguntas.'); return; }
      Game.flag('pinho_quiz_started', true);
      Dialogue.start([
        {speaker:'PINHO', text:'Já vi que o Félix está in. Muito bem.'},
        {speaker:'PINHO', text:"Antes de eu estar também, tenho algumas perguntas."},
        {speaker:'', text:'🎵 QUAL É O PLANO?'},
      ], ()=>{
        askPinhoRound(0, ()=>{
          Dialogue.start([
            {speaker:'PINHO', text:'Acho que desta vez ele passa.'},
            {speaker:'FÉLIX', text:'Sim, mas da próxima leva um cachaço.'},
          ], ()=>markFound('pinho'));
        });
      });
      return;
    }
    if(e.tag==='prop'){ Dialogue.say('', e.flavor||'Umas merdas.'); return; }
  }

  function markFound(key){
    if(found[key]) return;
    found[key]=true; Game.flag('l2_found_'+key, true);
    const count=(found.felix?1:0)+(found.pinho?1:0);
    if(key==='felix'){ quest = 'Encontra o Pinho - ele está rodeado das coisas dele.'; Toast.show('🤝 FÉLIX IS IN', 2.8); }
    if(count>=2){ quest=''; Toast.show('BEST FRIENDS: 2/2', 3); setTimeout(friendsUnlocked, 900); }
  }


  function friendsUnlocked() {
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

      // Fundo do Painel (Gradiente Azul/Violeta Profundo)
      const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      roundRect(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.fill();

      // Borda Externa Néon
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      roundRect(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.stroke();

      // Borda Interna Subtil (Brilho de vidro)
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
      ctx.fillText('🎉 NÍVEL COMPLETO', W / 2, boxY + 33);

      // Título Dourado
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 18px monospace';
      ctx.fillText('AMIGOS ENCONTRADOS', W / 2, boxY + 65);

      // --- 4. GRELHA 2x2 DA FAMÍLIA (Resolve o problema do Bernardo) ---
      const family = [
        { name: 'Félix', emoji: '🧑🏻' },
        { name: 'Pinho', emoji: '👱🏻‍♂️' }
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

      // --- 5. MENSAGEM NARRATIVA ---
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
        ctx.fillText('Família... Amigos...', W / 2, boxY + 200);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'italic 12px monospace';
        ctx.fillText('Mas ainda faltam pessoas para encontrar...', W / 2, boxY + 220);
      }

      // --- 6. BOTÃO CONTINUAR ---
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
    if(Game.levels[3]) Game.startLevel(3);
    else Game.setOverlay({
      update(){}, draw(ctx,g){ const W=g.W,H=g.H;
        ctx.fillStyle='#05060d'; ctx.fillRect(0,0,W,H); ctx.textAlign='center';
        ctx.fillStyle='#ffe27a'; ctx.font='bold 26px '+TEXT_FONT_STACK;
        ctx.fillText('LEVEL 3 — ???', W/2, H/2-10);
        ctx.fillStyle='#9ab'; ctx.font='16px '+TEXT_FONT_STACK;
        ctx.fillText('Coming soon. (We build it next!)', W/2, H/2+24); ctx.textAlign='left'; }
    });
  }

  // ---- level definition -------------------------------------------------------
  L.enter = function(game){
    world = new World(28, 20);

    // --- 1. TERRENO E ESTRADAS ---
    const roadColor = '#8c765c', roadEdge = '#5c4a38', plazaColor = '#9e876b';
    const grassAlt1 = '#3a663b', grassAlt2 = '#2e542f';

    for(let x=0; x<world.cols; x++){
      for(let y=0; y<world.rows; y++){
        if ((x * 7 + y * 13) % 11 === 0) world.paint[x+','+y] = grassAlt1;
        else if ((x * 3 + y * 17) % 13 === 0) world.paint[x+','+y] = grassAlt2;
      }
    }

    for(let y=0; y<world.rows; y++){ 
      world.paint['13,'+y] = roadColor; world.paint['14,'+y] = roadColor;
      world.paint['12,'+y] = roadEdge;  world.paint['15,'+y] = roadEdge; 
    }
    for(let x=0; x<world.cols; x++){ 
      world.paint[x+',10'] = roadColor; 
      world.paint[x+',9']  = roadEdge;  world.paint[x+',11'] = roadEdge; 
    }

    for(let y=8; y<=12; y++){
      for(let x=11; x<=16; x++){
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
    connectPath(5, 6, 12, 6);
    connectPath(15, 6, 22, 6);

    // --- 2. JOGADOR E QUEST ---
    player = new Player(7*TILE, 16*TILE);
    quest = 'Encontra o Félix - deve andar por aí com um maço de notas na mão.';
    found = { felix:!!game.flag('l2_found_felix'), pinho:!!game.flag('l2_found_pinho') };
    felixState = found.felix ? 'caught' : 'idle';
    if(found.pinho) quest='';

    // Edifícios com flag 'door: true'
    function building(tx, ty, tw, th, color, roof, label, emoji){
      world.block(tx, ty, tw, th);
      const x = tx * TILE, y = ty * TILE, w = tw * TILE, h = th * TILE;
      world.add({ box: true, x, y, w, h, color, roof, label, emoji, door: true });
    }

    // --- 3. EDIFÍCIOS & SPOTS DOS AMIGOS ---
    building(3, 2, 5, 4, '#3d344d', '#9c5a3c', 'FÉLIX\'S SPOT', '💰');
    
    felixEnt = world.add({
      tag: 'felix', interact: true, 
      x: 5.5 * TILE, y: 6.5 * TILE, w: 24, h: 24,
      _seed: Math.random() * 10,
      render: drawFelix
    });

    building(19.5, 2, 6, 4, '#40384a', '#a56cc4', 'PINHO\'S CRIB', '🎧');
    
    world.add({
      tag: 'pinho', interact: true, 
      x: 22.5 * TILE, y: 6.5 * TILE, w: 24, h: 24,
      render: drawPinho
    });

    world.add({tag:'prop', interact:true, x:18*TILE, y:5*TILE, w:22, h:22, emoji:'🍺', size:24, flavor:'Uma cerveja. Cheia. Completamente morta. Suspeito.'});
    world.add({tag:'prop', interact:true, x:26*TILE, y:8*TILE, w:22, h:22, emoji:'⚽', size:24, flavor:'Uma bola meia murcha.'});
    world.add({tag:'prop', interact:true, x:18*TILE, y:8*TILE, w:22, h:22, emoji:'🎟️', size:24, flavor:'Bilhetes para um concerto.'});
    world.add({tag:'prop', interact:true, x:26*TILE, y:5*TILE, w:22, h:22, emoji:'🎸', size:24, flavor:'Uma guitarra. Está a arejar porque esteve 4 anos debaixo da cama.'});
    world.add({tag:'prop', interact:true, x:22*TILE, y:9*TILE, w:22, h:22, emoji:'🎮', size:24, flavor:'Um comando da switch. Provavelmente foi a Dani que se esqueceu de arrumar.'});

    // --- 4. DECORAÇÃO DA VILA ---
    world.add({emoji:'⛲', x:13.5*TILE, y:10*TILE, w:28, h:28, size:40});
    world.add({emoji:'🪴', x:11.8*TILE, y:10.5*TILE, w:22, h:22, size:24});
    world.add({emoji:'🪴', x:15.5*TILE, y:10.5*TILE, w:22, h:22, size:24});
    
    world.add({emoji:'🌳', x:9*TILE, y:14*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌲', x:21*TILE, y:14*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌳', x:2*TILE, y:16*TILE, w:28, h:28, size:34});
    world.add({emoji:'🌲', x:25*TILE, y:16*TILE, w:28, h:28, size:34});
    world.add({emoji:'🍄', x:10*TILE, y:15*TILE, w:18, h:18, size:20});

    world.add({emoji:'🌻', x:17*TILE, y:4*TILE, w:22, h:22, size:24});
    world.add({emoji:'🌷', x:10*TILE, y:4*TILE, w:22, h:22, size:24});
    world.add({emoji:'🚦', x:15*TILE, y:8*TILE, w:24, h:24, size:26});
    world.add({emoji:'🐦', x:16*TILE, y:4*TILE, w:20, h:20, size:22});
    world.add({emoji:'🦋', x:14*TILE, y:13*TILE, w:18, h:18, size:20});

    Toast.show('QUEST 02 — BEST FRIENDS', 3.2);
  };

  L.update = function(dt, game){
    player.update(dt, world);
    updateFelixFlee(dt);
    if(Input.once(' ')){ const f=player.facing(world); if(f) interact(f); }
  };

  L.draw = function(ctx, game){
    renderWorld(ctx, world, player, game.W, game.H, {
      hud(ctx){
        if(quest){
          const qw = game.W - 20, qh = 42, qx = 10, qy = game.H - 52;
          ctx.fillStyle = 'rgba(16, 14, 26, 0.9)'; 
          roundRect(ctx, qx, qy, qw, qh, 8); ctx.fill();
          ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5;
          roundRect(ctx, qx, qy, qw, qh, 8); ctx.stroke();

          ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace'; 
          ctx.fillText('📜 QUEST ATIVA', qx + 12, qy + 16);
          ctx.fillStyle = '#fff'; ctx.font = textFont(13); 
          ctx.fillText(quest, qx + 12, qy + 32);
        }
        
        const count = (game.flag('l2_found_felix')?1:0) + (game.flag('l2_found_pinho')?1:0);
        const cw = 145, ch = 28, cx = game.W - cw - 10, cy = 10;
        ctx.fillStyle = 'rgba(16, 14, 26, 0.9)'; 
        roundRect(ctx, cx, cy, cw, ch, 6); ctx.fill();
        ctx.strokeStyle = '#7fd97f'; ctx.lineWidth = 1;
        roundRect(ctx, cx, cy, cw, ch, 6); ctx.stroke();

        ctx.fillStyle = '#e8f5e9'; ctx.font = 'bold 13px ' + TEXT_FONT_STACK; 
        ctx.fillText('🤝 Amigos: ' + count + '/2', cx + 12, cy + 18);
      }
    });
  };
L.friendsUnlocked = friendsUnlocked;
  Game.addLevel(2, L);
})();