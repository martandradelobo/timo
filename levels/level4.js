/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 4: THE RELATIONSHIP
 * Theme: "How well does Tomás actually know Kiu?"
 * Fixed: Emoji transparency on Level Complete overlay & Fast Quiz retry.
 * ==========================================================================*/
(function() {
  const L = { id: 4 };
  let world, player;

  L.enter = function(game) {
    this.state = 'quiz'; // 'quiz' | 'hunt' | 'ultimatum' | 'complete'
    this.quizStep = 0;
    this.score = 0;
    this.foundCount = 0;
    this.timer = 0;

    // Quizzes Expandidos com 3 escolhas
    this.quizzes = [
      {
        prompt: '☕ Bebida preferida da Kiu para começar o dia?',
        options: [
          { label: 'A - Um balde de café ☕', correct: true, msg: 'Certíssimo!' },
          { label: 'B - Suminho de Laranja 🧃', correct: false, msg: 'Fruta só inteira.' },
          { label: 'C - Chá Verde Detox 🍵', correct: false, msg: 'Chá é bom mas logo de manhã?' }
        ]
      },
      {
        prompt: '🏖️ Onde prefere passar as férias de verão?',
        options: [
          { label: 'A - Apanhar sol na Praia 🏖️', correct: true, msg: 'Exato! Mesmo sem saber nadar.' },
          { label: 'B - Retiro nas Montanhas 🏔️', correct: false, msg: 'Muito bonito, mas não.' },
          { label: 'C - Maratona de Museus na Cidade 🏛️', correct: false, msg: 'Não. Muito calor para isso.' }
        ]
      },
      {
        prompt: '👸🏼 Princesa da Disney preferida?',
        options: [
          { label: 'A - Ariel 🧜‍♀️', correct: false, msg: 'Gosta, mas não é a favorita.' },
          { label: 'B - Cinderella 👸🏼', correct: true, msg: 'Isso mesmo! Cinderelli Cinderelli!' },
          { label: 'C - Elsa ❄️', correct: false, msg: 'Não. Drama queen.' }
        ]
      },
      {
        prompt: 'O snack preferido quando está triste?:',
        options: [
          { label: 'A - Pipocas 🍿', correct: false, msg: 'Só no cinema!' },
          { label: 'B - Gelado 🍦', correct: false, msg: 'Bom para o Verão, mas não o favorito.' },
          { label: 'C - Chocolate 🍫', correct: true, msg: 'Bingo!' }
        ]
      }
    ];

    // Construção do Quarto / Sala Acolhedora
    world = new World(22, 16);
    player = new Player(11 * TILE, 12 * TILE);

    // Chão de Madeira
    const baseWood = '#3b2019', lightWood = '#45261e', darkWood = '#2e1812';
    for (let y = 0; y < world.rows; y++) {
      for (let x = 0; x < world.cols; x++) {
        const pattern = (x * 3 + y * 7) % 11;
        if (pattern === 0) world.paint[x + ',' + y] = lightWood;
        else if (pattern === 1) world.paint[x + ',' + y] = darkWood;
        else world.paint[x + ',' + y] = baseWood;
      }
    }

    // Paredes Perimétricas
    world.block(0, 0, world.cols, 1);
    world.block(0, world.rows - 1, world.cols, 1);
    world.block(0, 0, 1, world.rows);
    world.block(world.cols - 1, 0, 1, world.rows);

    // Móveis
    function addFurniture(tx, ty, tw, th, color, emoji) {
      world.block(tx, ty, tw, th);
      world.add({
        box: true,
        x: tx * TILE, y: ty * TILE,
        w: tw * TILE, h: th * TILE,
        color: color, emoji: emoji
      });
    }

    addFurniture(2, 2, 4, 2, '#5e172d', '🛋️'); 
    addFurniture(16, 2, 4, 2, '#212d40', '🛏️'); 
    addFurniture(2, 10, 3, 2, '#38220f', '📚'); 
    addFurniture(17, 10, 3, 2, '#2a3821', '🪴'); 

    // Itens
    this.items = [
      { id: 'dog', name: 'Cãozinho', emoji: '🐕', x: 5 * TILE, y: 5 * TILE, isKiu: true, collected: false },
      { id: 'choc', name: 'Tablete de Chocolate', emoji: '🍫', x: 8 * TILE, y: 13 * TILE, isKiu: true, collected: false },
      { id: 'bag', name: 'Saco de Compras', emoji: '🛍️', x: 15 * TILE, y: 5 * TILE, isKiu: true, collected: false },
      { id: 'bear', name: 'Peluche', emoji: '🧸', x: 18 * TILE, y: 13 * TILE, isKiu: true, collected: false },
      { id: 'tomas', name: 'Carta de Amor do Tomás', emoji: '💌', x: 11 * TILE, y: 3 * TILE, isKiu: true, isTomas: true, collected: false },

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
      { speaker: 'QUEST', text: 'Explora o quarto e recolhe 5 coisas que pertencem à Kiu! Evita os objetos do Tomás.' }
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
                { speaker: 'OBJETO ENCONTRADO', text: 'CARTA DE AMOR DO TOMÁS (+15%)' },
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
              { speaker: 'OPS!', text: `Esse(a) ${item.name} ${item.emoji} pertence ao Tomás! (-10% Conhecimento)` }
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

      // Emoji Render - Cor branca pura e alpha correto para evitar transparências indesejadas
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