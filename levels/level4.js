/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 4: THE RELATIONSHIP
 * Theme: "How well does Tomás actually know Kiu?"
 * Fixed: Emoji transparency on Level Complete overlay & Fast Quiz retry.
 * ==========================================================================*/
(function() {
  const L = { id: 4 };
  let world, player;

  // ---- BEACH PROPS -------------------------
  function drawSunbeds(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(e.w / 2, e.h - 4, e.w * 0.46, 6, 0, 0, Math.PI * 2); ctx.fill();

    // umbrella pole
    ctx.fillStyle = '#8a6240';
    ctx.fillRect(e.w / 2 - 2, 10, 4, e.h - 14);
    // umbrella canopy
    ctx.fillStyle = '#ff6b8b';
    ctx.beginPath(); ctx.moveTo(e.w / 2, -4); ctx.lineTo(e.w / 2 - 36, 16); ctx.lineTo(e.w / 2 + 36, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath(); ctx.moveTo(e.w / 2 - 36, 16); ctx.lineTo(e.w / 2 - 12, -2); ctx.lineTo(e.w / 2 - 12, 16); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.w / 2 + 36, 16); ctx.lineTo(e.w / 2 + 12, -2); ctx.lineTo(e.w / 2 + 12, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(e.w / 2, -4); ctx.lineTo(e.w / 2, 16); ctx.stroke();

    // two sunbeds
    [0.12, 0.62].forEach(fx => {
      const bx = e.w * fx, by = e.h - 22;
      ctx.fillStyle = '#1f6fb2';
      roundRect(ctx, bx, by, e.w * 0.3, 18, 4); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) ctx.fillRect(bx + 3 + i * (e.w * 0.3 - 6) / 3, by + 3, (e.w * 0.3 - 6) / 3 - 2, 12);
      ctx.fillStyle = '#d4a24c';
      ctx.fillRect(bx - 2, by + 16, e.w * 0.3 + 4, 3);
    });
    ctx.restore();
  }

  function drawPalmCluster(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const trunks = [e.w * 0.25, e.w * 0.7];
    trunks.forEach((tx, i) => {
      const h = e.h - 18 - (i % 2) * 8;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(tx, e.h - 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, e.h - 6);
      ctx.quadraticCurveTo(tx + (i ? -10 : 10), e.h - h * 0.6, tx + (i ? -6 : 6), e.h - h);
      ctx.stroke();

      const topX = tx + (i ? -6 : 6), topY = e.h - h;
      ctx.fillStyle = '#2f8f4e';
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(topX + Math.cos(ang) * 14, topY + Math.sin(ang) * 8, 14, 5, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#5a3a1e';
      ctx.beginPath(); ctx.arc(topX, topY, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawTikiBar(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const roofH = Math.min(e.h * 0.55, 30);
    const cx = e.w / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx, e.h - 2, e.w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();

    // counter
    ctx.fillStyle = '#b4815a';
    roundRect(ctx, 0, roofH, e.w, e.h - roofH, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, e.h - 10, e.w, 10);

    // thatched roof
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.moveTo(-6, roofH); ctx.lineTo(cx, -4); ctx.lineTo(e.w + 6, roofH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a9742a'; ctx.lineWidth = 1.5;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-6 + (e.w + 12) * (i / 6), roofH - 1);
      ctx.lineTo(cx + (e.w + 12) * (i / 6 - 0.5) * 0.15, roofH - 10);
      ctx.stroke();
    }

    // sign
    ctx.fillStyle = '#1a1420'; roundRect(ctx, cx - 44, roofH + 4, 88, 16, 4); ctx.fill();
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1; roundRect(ctx, cx - 44, roofH + 4, 88, 16, 4); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('CHIRINGUITO', cx, roofH + 15);

    ctx.font = emojiFont(20); ctx.textBaseline = 'middle';
    ctx.fillText('🍹', cx, e.h - 18);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawLifeguardTower(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const cx = e.w / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx, e.h - 2, e.w * 0.46, 5, 0, 0, Math.PI * 2); ctx.fill();

    // stilts
    ctx.strokeStyle = '#8a6240'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(8, e.h - 6); ctx.lineTo(16, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e.w - 8, e.h - 6); ctx.lineTo(e.w - 16, 18); ctx.stroke();

    // cabin
    ctx.fillStyle = '#e8e4d9';
    roundRect(ctx, 6, 0, e.w - 12, 20, 3); ctx.fill();
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(6, 0, e.w - 12, 5);
    ctx.fillStyle = '#1f6fb2';
    roundRect(ctx, cx - 10, 6, 20, 10, 2); ctx.fill();

    // flag
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, -16); ctx.stroke();
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.moveTo(cx, -16); ctx.lineTo(cx + 12, -12); ctx.lineTo(cx, -8); ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  L.enter = function(game) {
    this.state = 'quiz'; // 'quiz' | 'hunt' | 'ultimatum' | 'complete'
    this.quizStep = 0;
    this.score = 0;
    this.foundCount = 0;
    this.timer = 0;

    // Quizzes Expandidos com 3 escolhas
    this.quizzes = [
      {
        prompt: 'Bebida preferida da Kiu para começar o dia?',
        options: [
          { label: 'A - Um balde de café ☕️', correct: true, msg: 'Certíssimo!' },
          { label: 'B - Suminho de Laranja 🧃', correct: false, msg: 'Fruta só inteira.' },
          { label: 'C - Chá Verde Detox 🍵', correct: false, msg: 'Chá é bom mas logo de manhã?' }
        ]
      },
      {
        prompt: 'Onde prefere passar as férias de verão?',
        options: [
          { label: 'A - Apanhar sol na Praia 🏖️', correct: true, msg: 'Ciertoo! Mesmo sem saber nadar.' },
          { label: 'B - Retiro nas Montanhas 🏔️', correct: false, msg: 'Muito bonito, mas não.' },
          { label: 'C - Maratona de Museus na Cidade 🏛️', correct: false, msg: 'Não. Muito calor para isso.' }
        ]
      },
      {
        prompt: 'Princesa da Disney preferida?',
        options: [
          { label: 'A - Ariel 🧜‍♀️', correct: false, msg: 'Até gosta, mas não é a favorita.' },
          { label: 'B - Cinderella 👸🏼', correct: true, msg: 'Isso mesmo! Cinderelli Cinderelli!' },
          { label: 'C - Elsa ❄️', correct: false, msg: 'Não. Drama queen.' }
        ]
      },
      {
        prompt: 'Snack preferido quando está triste?',
        options: [
          { label: 'A - Pipocas 🍿', correct: false, msg: 'Só no cinema!' },
          { label: 'B - Gelado 🍦', correct: false, msg: 'Bom, mas não é o favorito.' },
          { label: 'C - Chocolate 🍫', correct: true, msg: 'Bingo!' }
        ]
      }
    ];

    // Construção da Praia Paradisíaca
    world = new World(22, 16);
    player = new Player(11 * TILE, 12 * TILE);

    // Areia dourada
    const sandA = '#f6dca3', sandB = '#eccb8a', sandC = '#e0ba74';
    for (let y = 0; y < world.rows; y++) {
      for (let x = 0; x < world.cols; x++) {
        const pattern = (x * 3 + y * 7) % 11;
        if (pattern === 0) world.paint[x + ',' + y] = sandB;
        else if (pattern === 1) world.paint[x + ',' + y] = sandC;
        else world.paint[x + ',' + y] = sandA;
      }
    }

    // Horizonte de mar no topo + faixa de espuma
    for (let x = 0; x < world.cols; x++) {
      world.paint[x + ',0'] = '#1a6faa';
      world.paint[x + ',1'] = '#dff3ef';
    }
    // Rochas/dunas a fechar a baía nos restantes bordos
    for (let x = 0; x < world.cols; x++) world.paint[x + ',' + (world.rows - 1)] = '#9c7a4a';
    for (let y = 0; y < world.rows; y++) {
      world.paint['0,' + y] = '#9c7a4a';
      world.paint[(world.cols - 1) + ',' + y] = '#9c7a4a';
    }

    // Paredes Perimétricas
    world.block(0, 0, world.cols, 1);
    world.block(0, world.rows - 1, world.cols, 1);
    world.block(0, 0, 1, world.rows);
    world.block(world.cols - 1, 0, 1, world.rows);

    // Elementos da praia (mantêm as mesmas áreas sólidas de antes)
    function addBeachProp(tx, ty, tw, th, render) {
      world.block(tx, ty, tw, th);
      world.add({
        x: tx * TILE, y: ty * TILE,
        w: tw * TILE, h: th * TILE,
        render: render
      });
    }

    addBeachProp(2, 2, 4, 2, drawSunbeds);
    addBeachProp(16, 2, 4, 2, drawPalmCluster);
    addBeachProp(2, 10, 3, 2, drawTikiBar);
    addBeachProp(17, 10, 3, 2, drawLifeguardTower);

    // Decoração solta (não bloqueia passagem)
    const decoSpots = [
      ['🌴', 8.5, 2.4, 30], ['🌴', 13.5, 2.4, 26],
      ['🐚', 6, 8.2, 16], ['⭐', 9.5, 10.5, 16],
      ['🏐', 14.5, 9, 20], ['🌊', 5, 1.4, 20], ['🌊', 10, 1.4, 20], ['🌊', 15, 1.4, 20],
      ['🦀', 12, 13.6, 16], ['🩴', 4.2, 13.2, 18]
    ];
    decoSpots.forEach(([emoji, tx, ty, size]) => {
      world.add({ emoji, x: tx * TILE, y: ty * TILE, w: 28, h: 28, size, shadow: emoji !== '🌊' });
    });

    // Itens
    this.items = [
      { id: 'dog', name: 'Cãozinho', emoji: '🐕', x: 5 * TILE, y: 5 * TILE, isKiu: true, collected: false },
      { id: 'choc', name: 'Tablete de Chocolate', emoji: '🍫', x: 8 * TILE, y: 13 * TILE, isKiu: true, collected: false },
      { id: 'bag', name: 'Saco de Compras', emoji: '🛍️', x: 15 * TILE, y: 5 * TILE, isKiu: true, collected: false },
      { id: 'bear', name: 'Peluche', emoji: '🧸', x: 18 * TILE, y: 13 * TILE, isKiu: true, collected: false },
      { id: 'tomas', name: 'Carta de Amor do Timo', emoji: '💌', x: 11 * TILE, y: 3 * TILE, isKiu: true, isTomas: true, collected: false },

      { id: 'sock', name: 'Meia Usada', emoji: '🧦', x: 6 * TILE, y: 11 * TILE, isKiu: false, collected: false },
      { id: 'game', name: 'Comando da PS5', emoji: '🎮', x: 13 * TILE, y: 13 * TILE, isKiu: false, collected: false },
      { id: 'board', name: 'Smart Zé Igor', emoji: '🚙', x: 18 * TILE, y: 8 * TILE, isKiu: false, collected: false },
      { id: 'fly', name: 'Agenda', emoji: '🗓️', x: 10 * TILE, y: 7 * TILE, isKiu: false, collected: false }
    ];

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🧠 LEVEL 4 — THE RELATIONSHIP', 3.2);
    }

    this.runCurrentQuiz(game, true);
  };

  L.runCurrentQuiz = function(game, showIntro = true) {
    if (this.quizStep >= this.quizzes.length) {
      this.startHuntPhase(game);
      return;
    }

    const current = this.quizzes[this.quizStep];

    const questionDialog = {
      prompt: current.prompt,
      choice: current.options.map(opt => ({
        label: opt.label,
        cb: () => this.handleQuizAnswer(game, opt)
      }))
    };

    if (showIntro) {
      Dialogue.start([
        { speaker: 'QUIZ DA KIU', text: `Pergunta ${this.quizStep + 1} de ${this.quizzes.length}` },
        questionDialog
      ]);
    } else {
      Dialogue.start([ questionDialog ]);
    }
  };

  L.handleQuizAnswer = function(game, option) {
    if (option.correct) {
      this.score = Math.min(100, this.score + 10);
      Dialogue.start([
        { speaker: 'KIU', text: `${option.msg} (+10% Conhecimento)` }
      ], () => {
        this.quizStep++;
        this.runCurrentQuiz(game, true);
      });
    } else {
      Dialogue.start([
        { speaker: 'KIU', text: `${option.msg}` }
      ], () => {
        this.runCurrentQuiz(game, false);
      });
    }
  };

  L.startHuntPhase = function(game) {
    this.state = 'hunt';
    Dialogue.start([
      { speaker: '', text: 'PARTE 2 — CAÇA AOS OBJETOS' },
      { speaker: '📜 QUEST', text: 'Explora a praia e recolhe 5 coisas que pertencem à Kiu! Evita os objetos do Tomás.' }
    ]);
  };

  L.update = function(dt, game) {
    this.timer += dt;

    if (this.state === 'complete') {
      if (Input.once(' ') && this.timer > 1.2) {
        Game.clearOverlay();
        this.nextLevel(game);
      }
      return;
    }

    if (this.state !== 'hunt') return;

    player.update(dt, world);

    if (typeof Dialogue !== 'undefined' && Dialogue.active) return;

    this.items.forEach(item => {
      if (!item.collected) {
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 26) {
          item.collected = true;

          if (item.isKiu) {
            this.score = Math.min(100, this.score + 15);
            this.foundCount++;

            if (item.isTomas) {
              Dialogue.start([
                { speaker: 'ENCONTRADO', text: 'CARTA DE AMOR DO TOMÁS (+15%)' },
                { speaker: 'KIU', text: 'Espero que tenha um desenho para mim! ❤️' }
              ], () => this.checkHuntCompletion(game));
            } else {
              Dialogue.start([
                { speaker: 'ENCONTRADO!', text: `Apanhaste: ${item.name}! ${item.emoji} (+15%)` }
              ], () => this.checkHuntCompletion(game));
            }
          } else {
            this.score = Math.max(0, this.score - 10);
            Dialogue.start([
              { speaker: 'OOPS!', text: `${item.name} ${item.emoji}: Claramente pertence ao Tomás! (-10% Conhecimento)` }
            ]);
          }
        }
      }
    });
  };

  L.checkHuntCompletion = function(game) {
    if (this.foundCount >= 5) {
      this.startUltimatumPhase(game);
    }
  };

  L.startUltimatumPhase = function(game) {
    this.state = 'ultimatum';
    Dialogue.start([
      { speaker: 'KIU', text: 'Muito bem! Apanhaste as minhas coisas todas. Mas falta a prova final...' },
      {
        prompt: '❓ Quanto é que gostas de mim de 0 a 100?',
        choice: [
          {
            label: 'A — 100',
            cb: () => {
              this.score = 100;
              Dialogue.start([
                { speaker: 'KIU', text: 'Certo! ❤️' }
              ], () => {
                this.state = 'complete';
                this.timer = 0;
              });
            }
          },
          {
            label: 'B — 50',
            cb: () => {
              Dialogue.start([
                { speaker: 'KIU', text: '😡 Tenta outra vez.' }
              ], () => this.startUltimatumPhase(game));
            }
          }
        ]
      }
    ]);
  };

  L.nextLevel = function(game) {
    if (Game.levels[5]) Game.startLevel(5);
    else Game.setOverlay({
      update(){},
      draw(ctx, g) {
        const W = g.W, H = g.H;
        ctx.fillStyle = '#05060d'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 26px ' + TEXT_FONT_STACK;
        ctx.fillText('TO BE CONTINUED...', W / 2, H / 2 - 10);
        ctx.fillStyle = '#9ab'; ctx.font = '16px ' + TEXT_FONT_STACK;
        ctx.fillText('Completaste o Nível 4! Em breve haverá mais aventuras.', W / 2, H / 2 + 24);
        ctx.textAlign = 'left';
      }
    });
  };

  L.draw = function(ctx, game) {
    const W = game.W, H = game.H;

    // Repor definições globais
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Renderização do Cenário Principal
    if (['quiz', 'hunt', 'ultimatum'].includes(this.state)) {
      renderWorld(ctx, world, player, W, H, {
        hud: (ctx) => {
          ctx.globalAlpha = 1.0;

          const hw = 260, hh = 40, hx = (W - hw) / 2, hy = 10;
          ctx.fillStyle = 'rgba(16, 14, 26, 0.9)';
          roundRect(ctx, hx, hy, hw, hh, 8); ctx.fill();
          ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 1.5;
          roundRect(ctx, hx, hy, hw, hh, 8); ctx.stroke();

          ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
          ctx.fillText('KIU KNOWLEDGE METER', W / 2, hy + 15);

          const totalBlocks = 10;
          const filledBlocks = Math.round((this.score / 100) * totalBlocks);
          const barStr = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);
          ctx.fillStyle = '#ff4d6d'; ctx.font = 'bold 12px monospace';
          ctx.fillText(barStr + ` ${this.score}%`, W / 2, hy + 31);
        }
      });

      if (this.state === 'hunt') {
        const camX = clamp(player.x - W / 2, 0, world.cols * TILE - W);
        const camY = clamp(player.y - H / 2, 0, world.rows * TILE - H);

        ctx.save();
        ctx.translate(-Math.round(camX), -Math.round(camY));
        ctx.textAlign = 'center';

        const pulse = Math.sin(performance.now() / 200) * 3;

        this.items.forEach(item => {
          if (!item.collected) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(item.x, item.y + 10, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.font = emojiFont(26);
            ctx.fillText(item.emoji, item.x, item.y + pulse);
          }
        });

        ctx.restore();
      }
    }

    // --- OVERLAY LEVEL COMPLETE ---
    if (this.state === 'complete') {
      const progress = Math.min(1, this.timer * 1.5);

      ctx.fillStyle = `rgba(16, 14, 26, ${0.9 * progress})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = progress;

      const boxW = Math.min(W - 32, 340);
      const boxH = 290;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      ctx.fillStyle = '#100e1a';
      roundRect(ctx, boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = 3;
      roundRect(ctx, boxX, boxY, boxW, boxH, 10);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 226, 122, 0.3)';
      ctx.lineWidth = 1;
      roundRect(ctx, boxX + 4, boxY + 4, boxW - 8, boxH - 8, 7);
      ctx.stroke();

      ctx.textAlign = 'center';

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('🏆 NÍVEL 4 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('CONHECIMENTO TOTAL!', W / 2, boxY + 54);

      const cardW = boxW - 32;
      const cardH = 92;
      const cardX = boxX + 16;
      const cardY = boxY + 72;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 107, 139, 0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = progress;
      ctx.fillStyle = '#ffffff';
      ctx.font = emojiFont(28);
      ctx.fillText('👱🏼‍♀️❤️🧑🏽', W / 2, cardY + 34);
      ctx.restore();

      ctx.fillStyle = '#ff6b8b';
      ctx.font = 'bold 15px ' + TEXT_FONT_STACK;
      ctx.fillText('KIU KNOWLEDGE: 100%', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ "SABES TUDO SOBRE MIM!"', W / 2, cardY + 76);

      if (this.timer > 0.6) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('A cumplicidade atingiu o nível máximo...', W / 2, boxY + 195);

        ctx.fillStyle = '#ffe27a';
        ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Pronto para os desafios que se seguem!', W / 2, boxY + 213);
      }

      if (this.timer > 1.2) {
        const btnPulse = Math.sin(this.timer * 6) * 0.2 + 0.8;

        ctx.save();
        ctx.globalAlpha = btnPulse * progress;

        const btnW = 180;
        const btnH = 28;
        const btnX = W / 2 - btnW / 2;
        const btnY = boxY + boxH - 40;

        ctx.fillStyle = '#ffe27a';
        roundRect(ctx, btnX, btnY, btnW, btnH, 5);
        ctx.fill();

        ctx.fillStyle = '#100e1a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 18);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.textAlign = 'left';
  };

  Game.addLevel(4, L);
})();