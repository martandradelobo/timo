/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 3: LOVE
 * ==========================================================================*/

Game.addLevel(3, {
  state: 'sofa', // 'sofa' | 'phone_ring' | 'photo' | 'quest' | 'date_select' | 'date_scene' | 'complete'
  timer: 0,
  selectedDate: null,

  enter(game) {
    this.state = 'sofa';
    this.timer = 0;
    this.selectedDate = null;
    Toast.show('❤️ LEVEL 3 — LOVE', 3.2);
  },

  update(dt, game) {
    this.timer += dt;

    if (this.state === 'complete') {
      if (Input.once(' ') && this.timer > 1.2) {
        Game.clearOverlay();
        this.nextLevel(game);
      }
      return;
    }

    if (this.state === 'sofa' && this.timer > 1.2) {
      this.state = 'phone_ring';
      this.timer = 0;
    }

    if (this.state === 'phone_ring' && (Input.once(' ') || Input.once('Enter'))) {
      this.state = 'photo';
      this.timer = 0;
    }

    if (this.state === 'photo' && (Input.once(' ') || Input.once('Enter'))) {
      this.startQuestDialogue(game, true);
    }
  },

  nextLevel(game) {
    if (Game.levels[4]) Game.startLevel(4);
    else Game.setOverlay({
      update(){}, 
      draw(ctx, g){ 
        const W = g.W, H = g.H;
        ctx.fillStyle = '#05060d'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 26px ' + TEXT_FONT_STACK;
        ctx.fillText('TO BE CONTINUED...', W / 2, H / 2 - 10);
        ctx.fillStyle = '#9ab'; ctx.font = '16px ' + TEXT_FONT_STACK;
        ctx.fillText('Obrigado por jogares Tomás: The Quest!', W / 2, H / 2 + 24); 
        ctx.textAlign = 'left'; 
      }
    });
  },

  startQuestDialogue(game, showIntro = true) {
    this.state = 'quest';
    
    const questionDialog = {
      prompt: 'Escolhe a tua primeira abordagem:',
      choice: [
        { label: 'A - Forte sonoro', cb: () => this.handleOpeningChoice(game, 'A') },
        { label: 'B - Queres ser minha amiga?', cb: () => this.handleOpeningChoice(game, 'B') }
      ]
    };

    if (showIntro) {
      Dialogue.start([
        { speaker: 'QUEST', text: 'FALA COM A KIU - O Tomás tem de tentar começar uma conversa.' },
        questionDialog
      ]);
    } else {
      Dialogue.start([ questionDialog ]);
    }
  },

  handleOpeningChoice(game, choice) {
    if (choice === 'A') {
      Dialogue.start([
        { speaker: 'TOMÁS', text: '❤️ FORTE SONORO!' },
        { speaker: 'KIU', text: 'Haha! Forte Timóteo' }
      ], () => {
        this.startDateChoice(game, true);
      });
    } else {
      Dialogue.start([
        { speaker: 'TOMÁS', text: 'Queres ser minha amiga?' },
        { speaker: 'KIU', text: 'Hmm, isso é um bocado tono... Tenta outra vez!' }
      ], () => {
        this.startQuestDialogue(game, false);
      });
    }
  },

  startDateChoice(game, showIntro = true) {
    this.state = 'date_select';

    const dateQuestionDialog = {
      prompt: 'Onde deve o Tomás levar a Kiu?',
      choice: [
        { label: '🍝 Jantar', cb: () => this.handleDateChoice(game, 'dinner') },
        { label: '🍹 Beber um copo', cb: () => this.handleDateChoice(game, 'drinks') },
        { label: '🎬 Cinema', cb: () => this.handleDateChoice(game, 'cinema') }
      ]
    };

    if (showIntro) {
      Dialogue.start([
        { speaker: '', text: 'ENCONTRO DESBLOQUEADO! Escolhe um plano para o primeiro encontro:' },
        dateQuestionDialog
      ]);
    } else {
      Dialogue.start([ dateQuestionDialog ]);
    }
  },

  handleDateChoice(game, pick) {
    if (pick === 'drinks') {
      this.selectedDate = 'drinks';
      this.state = 'date_scene';
      this.timer = 0;
      Dialogue.start([
        { speaker: 'KIU', text: '🍹 Sangria parece-me bem!' },
        { speaker: 'TOMÁS', text: 'Ótimo, vou-te buscar às 17h.' }
      ], () => {
        this.runDateScene(game);
      });
    } else {
      const msg = pick === 'dinner' ? '🍝 Jantar parece um bocado sério para um primeiro encontro. ' : '🎬 Cinema? Nem sequer se pode falar durante um filme! ';
      Dialogue.start([
        { speaker: 'KIU', text: msg + 'Escolhe outra coisa.' }
      ], () => {
        this.startDateChoice(game, false);
      });
    }
  },

  runDateScene(game) {
    Dialogue.start([
      { speaker: '', text: 'O Tomás e a Kiu encontram-se no Bocca para beber uma sangria...' },
      { speaker: 'KIU', text: 'Gostei muito, o próximo pago eu!' },
      { speaker: 'TOMÁS', text: 'Eu também, fav girl.' }
    ], () => {
      this.state = 'complete';
      this.timer = 0;
    });
  },

  draw(ctx, game) {
    const W = game.W, H = game.H;

    // Repor definições base do contexto
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (['sofa', 'phone_ring', 'photo', 'quest', 'date_select'].includes(this.state)) {
      const wallGrad = ctx.createLinearGradient(0, 0, 0, H * 0.58);
      wallGrad.addColorStop(0, '#180e25');
      wallGrad.addColorStop(1, '#2e1b3c');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, H * 0.58);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let x = 0; x < W; x += 16) {
        ctx.fillRect(x, 0, 8, H * 0.58);
      }

      ctx.fillStyle = '#412743';
      ctx.fillRect(0, H * 0.58 - 12, W, 12);
      ctx.fillStyle = '#221225';
      ctx.fillRect(0, H * 0.58 - 3, W, 3);

      const floorGrad = ctx.createLinearGradient(0, H * 0.58, 0, H);
      floorGrad.addColorStop(0, '#522f23');
      floorGrad.addColorStop(1, '#301a13');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, H * 0.58, W, H * 0.42);

      ctx.strokeStyle = '#22100a'; ctx.lineWidth = 1.5;
      for (let y = H * 0.58; y < H; y += 22) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      const moonGlow = ctx.createRadialGradient(W / 2, 60, 20, W / 2, H * 0.7, 180);
      moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.08)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, W, H);

      const wx = W / 2 - 45, wy = 20, ww = 90, wh = 75;
      ctx.fillStyle = '#0a0f1d'; roundRect(ctx, wx, wy, ww, wh, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5;
      ctx.fillRect(wx + 15, wy + 20, 2, 2); ctx.fillRect(wx + 65, wy + 15, 2, 2); ctx.fillRect(wx + 40, wy + 45, 2, 2);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fef08a'; ctx.font = emojiFont(20); ctx.textAlign = 'center'; 
      ctx.fillText('🌙', wx + 65, wy + 38);
      ctx.strokeStyle = '#543b62'; ctx.lineWidth = 4; roundRect(ctx, wx, wy, ww, wh, 8); ctx.stroke();
      ctx.strokeStyle = '#2d1e38'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx, wy + wh/2); ctx.lineTo(wx + ww, wy + wh/2); ctx.stroke();

      ctx.fillStyle = '#140c1e'; roundRect(ctx, W * 0.12, 35, 54, 44, 4); ctx.fill();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5; roundRect(ctx, W * 0.12, 35, 54, 44, 4); ctx.stroke();
      ctx.font = emojiFont(20); ctx.textAlign = 'center'; ctx.fillText('🎨', W * 0.12 + 27, 65);

      ctx.fillStyle = '#140c1e'; roundRect(ctx, W * 0.78, 45, 48, 48, 4); ctx.fill();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5; roundRect(ctx, W * 0.78, 45, 48, 48, 4); ctx.stroke();
      ctx.font = emojiFont(20); ctx.fillText('🖼️', W * 0.78 + 24, 77);

      const rx = W / 2 - 140, ry = H * 0.54, rw = 280, rh = 105;
      ctx.fillStyle = '#781c3c'; roundRect(ctx, rx, ry, rw, rh, 16); ctx.fill();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5; roundRect(ctx, rx + 4, ry + 4, rw - 8, rh - 8, 12); ctx.stroke();

      ctx.fillStyle = '#33170e'; roundRect(ctx, W / 2 - 175, H * 0.45, 38, 55, 4); ctx.fill();
      ctx.font = emojiFont(24); ctx.textAlign = 'center'; ctx.fillText('🪴', W / 2 - 156, H * 0.45);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(W / 2 - 110, H * 0.40 + 60, 220, 18);

      const sx = W / 2 - 100, sy = H * 0.40, sw = 200, sh = 85;
      ctx.fillStyle = '#610f27'; roundRect(ctx, sx, sy, sw, 50, 12); ctx.fill();
      ctx.fillStyle = '#420618'; // Braços do sofá
      roundRect(ctx, sx - 16, sy + 12, 26, 52, 8); ctx.fill();
      roundRect(ctx, sx + sw - 10, sy + 12, 26, 52, 8); ctx.fill();
      ctx.fillStyle = '#8f0f32'; // Almofadas do assento
      roundRect(ctx, sx + 8, sy + 28, sw / 2 - 12, 36, 6); ctx.fill();
      roundRect(ctx, sx + sw / 2 + 4, sy + 28, sw / 2 - 12, 36, 6); ctx.fill();

      ctx.font = emojiFont(36); ctx.textAlign = 'center';
      ctx.fillText('👨🏽‍💻', W / 2, sy + 42);

      if (this.state === 'phone_ring') {
        const bx = W / 2 - 130, by = H * 0.22, bw = 260, bh = 34;
        ctx.fillStyle = 'rgba(16, 14, 26, 0.9)'; roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
        ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5; roundRect(ctx, bx, by, bw, bh, 8); ctx.stroke();
        
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 13px ' + TEXT_FONT_STACK;
        ctx.fillText('📱 NOTIFICAÇÃO! (Espaço / Enter)', W / 2, by + 22);
      }

      if (this.state === 'photo') {
        ctx.fillStyle = 'rgba(8, 6, 15, 0.85)';
        ctx.fillRect(0, 0, W, H);

        const pw = 230, ph = 270, px = (W - pw) / 2, py = (H - ph) / 2;
        ctx.fillStyle = '#100e1a'; roundRect(ctx, px, py, pw, ph, 16); ctx.fill();
        ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 2; roundRect(ctx, px, py, pw, ph, 16); ctx.stroke();

        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('📱 NEW STORY', W / 2, py + 30);
        
        ctx.fillStyle = '#201530'; roundRect(ctx, W / 2 - 45, py + 48, 90, 90, 45); ctx.fill();
        ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 2; roundRect(ctx, W / 2 - 45, py + 48, 90, 90, 45); ctx.stroke();

        ctx.font = emojiFont(56); ctx.fillText('👱🏼‍♀️', W / 2, py + 115);
        ctx.fillStyle = '#ff6b8b'; ctx.font = 'bold 22px ' + TEXT_FONT_STACK; ctx.fillText('KIU', W / 2, py + 172);
        
        ctx.fillStyle = '#e2e8f0'; ctx.font = textFont(13); ctx.fillText('💿 Now Playing 💿', W / 2, py + 190);
        ctx.fillStyle = '#e2e8f0'; ctx.font = textFont(13); ctx.fillText('LOrange & Jeremiah Jae', W / 2, py + 210);
        ctx.fillStyle = '#e2e8f0'; ctx.font = textFont(13); ctx.fillText('Taken by the Night', W / 2, py + 225);
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 12px monospace'; ctx.fillText('Pressiona Espaço ▸', W / 2, py + 242);
      }
    }

    if (this.state === 'date_scene') {
      const barGrad = ctx.createLinearGradient(0, 0, 0, H);
      barGrad.addColorStop(0, '#120718');
      barGrad.addColorStop(0.6, '#230e2c');
      barGrad.addColorStop(1, '#0d0512');
      ctx.fillStyle = barGrad; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#36183f'; ctx.fillRect(W * 0.1, H * 0.22, W * 0.8, 8);
      ctx.font = emojiFont(20); ctx.textAlign = 'center';
      ctx.fillText('🍾', W * 0.2, H * 0.21);
      ctx.fillText('🍷', W * 0.35, H * 0.21);
      ctx.fillText('🍸', W * 0.5, H * 0.21);
      ctx.fillText('🍹', W * 0.65, H * 0.21);
      ctx.fillText('🥂', W * 0.8, H * 0.21);

      ctx.fillStyle = '#3b1c10'; ctx.fillRect(0, H * 0.58, W, H * 0.42);
      ctx.fillStyle = '#63311f'; ctx.fillRect(0, H * 0.56, W, 14); 
      ctx.fillStyle = '#9e4e30'; ctx.fillRect(0, H * 0.56, W, 3);

      const glow = ctx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, 170);
      glow.addColorStop(0, 'rgba(255, 183, 77, 0.22)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      ctx.font = emojiFont(52); ctx.textAlign = 'center';
      ctx.fillText('🧑🏽‍💼', W * 0.36, H * 0.54);
      ctx.fillText('👩🏼‍💼', W * 0.64, H * 0.54);

      ctx.font = emojiFont(28);
      ctx.fillText('🍹', W * 0.45, H * 0.56);
      ctx.fillText('🍹', W * 0.55, H * 0.56);
    }

    if (this.state === 'complete') {
      const progress = Math.min(1, this.timer * 1.5);

      // Overlay de Fundo
      ctx.fillStyle = `rgba(16, 14, 26, ${0.9 * progress})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = progress;

      const boxW = Math.min(W - 32, 340);
      const boxH = 290;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      // Fundo do Painel
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

      // Cabeçalho
      ctx.textAlign = 'center';
      
      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('🏆 NÍVEL 3 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('LUV DESBLOQUEADO!', W / 2, boxY + 54);

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
      ctx.fillText('❤️', W / 2, cardY + 34);
      ctx.restore();
      
      ctx.fillStyle = '#ff6b8b';
      ctx.font = 'bold 16px ' + TEXT_FONT_STACK;
      ctx.fillText('KIU & TOMÁS', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ PRIMEIRO ENCONTRO CONCLUÍDO', W / 2, cardY + 76);

      // Texto de Continuação
      if (this.timer > 0.6) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('A jornada do Tomás continua...', W / 2, boxY + 195);
        
        ctx.fillStyle = '#ffe27a';
        ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('O futuro ainda agora começou!', W / 2, boxY + 213);
      }

      // Botão Continuar
      if (this.timer > 1.2) {
        const pulse = Math.sin(this.timer * 6) * 0.2 + 0.8;
        
        ctx.save();
        ctx.globalAlpha = pulse * progress;

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
  }
});