/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 5: THE SWIM (ENHANCED EDITION)
 * Theme: "Tomás vs. Canelinhas vs. Reizinho — Olympic Sprint"
 * Fixes: Fixed lanes on finish & swimming direction right-to-left for emoji alignment.
 * ==========================================================================*/
(function() {
  const L = { id: 5 };

  L.enter = function(game) {
    this.resetRace();

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🏊 LEVEL 5 — THE SWIM', 3.2);
    }

    Dialogue.start([
      { speaker: 'NATAÇÃO', text: 'GRANDE FINAL DOS 200m LIVRES!' },
      { speaker: 'REGRAS DE ESTAMINA', text: 'Gasta a tua energia com estratégia! Braçadas rápidas consomem estamina.' },
      { speaker: 'CONTROLO', text: 'Carrega [ ESPAÇO ] no centro da barra para acelerar. Se a estamina esgotar, ficas exausto!' }
    ], () => {
      this.state = 'race';
      this.timer = 0;
    });
  };

  L.resetRace = function() {
    this.state = 'intro'; // 'intro' | 'race' | 'complete'
    this.timer = 0;
    this.raceDistance = 200; // Corrida de 200m

    // Sistema de Estamina
    this.stamina = 100;
    this.maxStamina = 100;
    this.isExhausted = false;

    // Nadadores em pistas fixas (Tomás: Pista 0, Canelinhas: Pista 1, Reizinho: Pista 2)
    this.swimmers = [
      { id: 'tomas', name: 'TOMÁS', emoji: '🏊🏼‍♂️', color: '#38bdf8', pos: 0, speed: 0, laneIndex: 0, isPlayer: true },
      { id: 'canelinhas', name: 'CANELINHAS', emoji: '🏊🏼', color: '#f43f5e', pos: 0, speed: 11, laneIndex: 1 },
      { id: 'reizinho', name: 'REIZINHO', emoji: '🏊🏽‍♂️', color: '#fbbf24', pos: 0, speed: 10, laneIndex: 2 }
    ];

    // Timing
    this.barPos = 0;
    this.barDir = 1;
    this.barSpeed = 2.0;
    this.targetZone = { start: 0.42, end: 0.58 };
    this.goodZone = { start: 0.25, end: 0.75 };

    this.particles = [];
    this.lastFeedback = '';
    this.feedbackTimer = 0;
  };

  L.spawnSplash = function(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.8) * 30,
        life: 0.4
      });
    }
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

    if (this.state !== 'race' || (typeof Dialogue !== 'undefined' && Dialogue.active)) return;

    // 1. Atualizar Partículas de Salpicos
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 2. Cursor de Ritmo
    this.barPos += this.barDir * this.barSpeed * dt;
    if (this.barPos >= 1) { this.barPos = 1; this.barDir = -1; }
    if (this.barPos <= 0) { this.barPos = 0; this.barDir = 1; }

    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;

    // 3. IA dos Oponentes
    const canelinhas = this.swimmers.find(s => s.id === 'canelinhas');
    const reizinho = this.swimmers.find(s => s.id === 'reizinho');
    const tomas = this.swimmers.find(s => s.id === 'tomas');

    const sprintFactor = (canelinhas.pos > this.raceDistance * 0.7) ? 1.3 : 1.0;
    canelinhas.pos += (12.5 * sprintFactor + Math.sin(this.timer * 3) * 2) * dt;
    reizinho.pos += (11.5 * sprintFactor + Math.cos(this.timer * 2.5) * 2) * dt;

    // 4. Estamina & Velocidade
    if (this.isExhausted) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 25 * dt);
      tomas.speed = 6;
      if (this.stamina >= 50) this.isExhausted = false;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 4 * dt);
      tomas.pos += tomas.speed * dt;
      tomas.speed = Math.max(0, tomas.speed - 9 * dt);
    }

    // 5. Input do Jogador
    if ((Input.once(' ') || Input.once('Enter')) && !this.isExhausted) {
      // Posição visual x ajustada da direita para a esquerda
      const screenX = Math.max(40, (game.W - 50) - (tomas.pos / this.raceDistance) * (game.W - 90));
      this.spawnSplash(screenX, game.H / 4 * 0.5);

      if (this.barPos >= this.targetZone.start && this.barPos <= this.targetZone.end) {
        tomas.speed = 32;
        this.stamina = Math.max(0, this.stamina - 12);
        this.lastFeedback = '⚡ BRAÇADA PERFEITA!';
      } else if (this.barPos >= this.goodZone.start && this.barPos <= this.goodZone.end) {
        tomas.speed = 20;
        this.stamina = Math.max(0, this.stamina - 7);
        this.lastFeedback = '🏊 BOA BRAÇADA!';
      } else {
        tomas.speed = 5;
        this.stamina = Math.max(0, this.stamina - 4);
        this.lastFeedback = '💦 SALPICO FORA DE RITMO!';
      }

      this.feedbackTimer = 0.5;

      if (this.stamina <= 0) {
        this.isExhausted = true;
        this.lastFeedback = '😮‍💨 EXAUSTO! A RECUPERAR...';
      }
    }

    // 6. Fim da Prova & Validação de Vitória (Sem alterar a ordem no array das pistas)
    if (this.swimmers.some(s => s.pos >= this.raceDistance)) {
      // Encontrar vencedor sem reordenar o array `this.swimmers`
      const winner = [...this.swimmers].sort((a, b) => b.pos - a.pos)[0];

      if (winner.id === 'tomas') {
        // Vitória do Tomás!
        this.state = 'complete';
        this.timer = 0;
      } else {
        // Derrota — Reiniciar o nível
        this.state = 'intro';
        Dialogue.start([
          { speaker: 'DERROTA!', text: `O ${winner.name} ganhou a prova! 🥇` },
          { speaker: 'RUI BORGES', text: 'Gere melhor a tua estamina e acerta o ritmo! Vamos tentar de novo.' }
        ], () => {
          this.resetRace();
          this.state = 'race';
          this.timer = 0;
        });
      }
    }
  };

  L.nextLevel = function(game) {
    if (Game.levels[6]) Game.startLevel(6);
    else Game.setOverlay({
      update(){},
      draw(ctx, g) {
        const W = g.W, H = g.H;
        ctx.fillStyle = '#05060d'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 26px ' + TEXT_FONT_STACK;
        ctx.fillText('TO BE CONTINUED...', W / 2, H / 2 - 10);
        ctx.fillStyle = '#9ab'; ctx.font = '16px ' + TEXT_FONT_STACK;
        ctx.fillText('Nível 5 concluído com sucesso!', W / 2, H / 2 + 24);
        ctx.textAlign = 'left';
      }
    });
  };

  L.draw = function(ctx, game) {
    const W = game.W, H = game.H;

    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (['intro', 'race'].includes(this.state)) {
      // Fundo da Piscina
      const poolGrad = ctx.createLinearGradient(0, 0, 0, H - 110);
      poolGrad.addColorStop(0, '#0284c7');
      poolGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = poolGrad;
      ctx.fillRect(0, 0, W, H - 110);

      // Ondas de fundo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      for (let y = 15; y < H - 110; y += 20) {
        ctx.beginPath();
        for (let x = 0; x < W; x += 30) {
          ctx.lineTo(x, y + Math.sin((x + this.timer * 40) * 0.05) * 3);
        }
        ctx.stroke();
      }

      // Separadores de Pistas
      const laneH = (H - 110) / 3;
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(0, laneH * i); ctx.lineTo(W, laneH * i); ctx.stroke();
      }

      // Linha de Chegada (Á Esquerda — 40px)
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, H - 110); ctx.stroke();

      // Partículas de Água
      ctx.fillStyle = '#e0f2fe';
      this.particles.forEach(p => ctx.fillRect(p.x, p.y, 3, 3));

      // Render dos Nadadores (Mantendo sempre a ordem fixa das pistas)
      this.swimmers.forEach((s) => {
        const laneY = laneH * s.laneIndex + laneH / 2;
        // Posição no ecrã invertida (Parte de W - 50 e avança para a esquerda até 40)
        const screenX = Math.max(40, (W - 50) - (s.pos / this.raceDistance) * (W - 90));

        // Rasto de Água (À direita do nadador já que ele nada para a esquerda)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(screenX + 12, laneY + 4, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Emoji OPAQUE (Originalmente virado para a esquerda)
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        ctx.font = emojiFont(28);
        ctx.textAlign = 'center';
        ctx.fillText(s.emoji, screenX, laneY + 8);
        ctx.restore();

        ctx.fillStyle = s.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, screenX, laneY - 16);
      });

      // Painel de Controlo Inferior
      const barBoxH = 110;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, H - barBoxH, W, barBoxH);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
      ctx.strokeRect(0, H - barBoxH, W, 2);

      // Estamina
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('ESTAMINA DO TOMÁS:', 20, H - 88);

      const stamW = 120, stamH = 10, stamX = 145, stamY = H - 96;
      ctx.fillStyle = '#1e293b'; roundRect(ctx, stamX, stamY, stamW, stamH, 4); ctx.fill();
      ctx.fillStyle = this.isExhausted ? '#ef4444' : '#22c55e';
      roundRect(ctx, stamX, stamY, (this.stamina / this.maxStamina) * stamW, stamH, 4); ctx.fill();

      // Timing Bar
      const mWidth = Math.min(W - 40, 320);
      const mHeight = 22;
      const mX = (W - mWidth) / 2;
      const mY = H - 55;

      ctx.fillStyle = '#1e293b'; roundRect(ctx, mX, mY, mWidth, mHeight, 6); ctx.fill();

      const gx = mX + mWidth * this.goodZone.start;
      const gw = mWidth * (this.goodZone.end - this.goodZone.start);
      ctx.fillStyle = '#eab308'; ctx.fillRect(gx, mY, gw, mHeight);

      const px = mX + mWidth * this.targetZone.start;
      const pw = mWidth * (this.targetZone.end - this.targetZone.start);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(px, mY, pw, mHeight);

      const indX = mX + mWidth * this.barPos;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(indX - 3, mY - 3, 6, mHeight + 6);

      ctx.textAlign = 'center';
      if (this.feedbackTimer > 0) {
        ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 12px monospace';
        ctx.fillText(this.lastFeedback, W / 2, H - 64);
      } else {
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ] NA ZONA VERDE!', W / 2, H - 64);
      }
    }

    // Overlay Level Complete (Só visível em caso de vitória)
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

      ctx.fillStyle = '#100e1a'; roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace';
      ctx.fillText('🏆 NÍVEL 5 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('VITÓRIA NA NATAÇÃO!', W / 2, boxY + 54);

      const cardW = boxW - 32; const cardH = 92;
      const cardX = boxX + 16; const cardY = boxY + 72;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; roundRect(ctx, cardX, cardY, cardW, cardH, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 1; roundRect(ctx, cardX, cardY, cardW, cardH, 8); ctx.stroke();

      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.font = emojiFont(26);
      ctx.fillText('🥇 🏊‍♂️ 🏆', W / 2, cardY + 32);
      ctx.restore();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px ' + TEXT_FONT_STACK;
      ctx.fillText('1º LUGAR: TOMÁS!', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f'; ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ CAMPEÃO DOS 200m LIVRES', W / 2, cardY + 76);

      if (this.timer > 0.6) {
        ctx.fillStyle = '#d1d5db'; ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('Excelente gestão de estamina e ritmo!', W / 2, boxY + 195);
        ctx.fillStyle = '#ffe27a'; ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Prepara-te para o próximo desafio.', W / 2, boxY + 213);
      }

      if (this.timer > 1.2) {
        const btnPulse = Math.sin(this.timer * 6) * 0.2 + 0.8;
        ctx.save();
        ctx.globalAlpha = btnPulse * progress;
        const btnW = 180, btnH = 28, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 40;
        ctx.fillStyle = '#ffe27a'; roundRect(ctx, btnX, btnY, btnW, btnH, 5); ctx.fill();
        ctx.fillStyle = '#100e1a'; ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 18);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.textAlign = 'left';
  };

  Game.addLevel(5, L);
})();