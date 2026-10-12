/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 6: BABY TOTTI 
 * ==========================================================================*/
(function() {
  const L = { id: 6 };

  L.enter = function(game) {
    this.resetLevel();

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('👶🏼 NÍVEL 6 - BABY TOTTI', 3.2);
    }

    Dialogue.start([
      { speaker: 'BEBÉ TOTTI', text: 'AHHHHHHHHHH 👶🏼⚡️' },
      { speaker: 'QUEST', text: 'O Tomás é agora tio... mas precisa de decifrar o que a Totti precisa!' },
      { speaker: 'INSTRUÇÕES', text: 'Presta atenção ao balão de pensamento da Totti. Pressiona [1], [2], [3] ou [4] para a acalmar. Tens de ser rápido.' }
    ], () => {
      this.state = 'playing';
      this.nextNeed();
    });
  };

  L.resetLevel = function() {
    this.state = 'intro'; // 'intro' | 'playing' | 'complete'
    this.timer = 0;
    this.round = 1;
    this.maxRounds = 10; // Aumentado de 6 para 10 rondas

    // Status da Totti (0 a 3)
    this.status = {
      hunger: 3,
      happiness: 3,
      sleep: 3,
      diaper: 3
    };

    // Tarefas com ícones e cores
    this.tasks = [
      { id: 'feed', name: 'BIBERÃO', icon: '🍼', clueEmoji: '🥛', targetKey: '1', color: '#fb7185', bg: '#fff1f2' },
      { id: 'burp', name: 'ARROTINHO', icon: '💨', clueEmoji: '😮‍💨', targetKey: '2', color: '#38bdf8', bg: '#f0f9ff' },
      { id: 'diaper', name: 'FRALDA', icon: '🩲', clueEmoji: '💩', targetKey: '3', color: '#facc15', bg: '#fefce8' },
      { id: 'sleep', name: 'ACONCHEGAR', icon: '🧑🏽‍🍼', clueEmoji: '💤', targetKey: '4', color: '#c084fc', bg: '#faf5ff' }
    ];

    this.currentNeed = null;
    this.distractionNeed = null; // Falso alarme
    this.reactionText = '';
    this.reactionTimer = 0;
    this.reactionSuccess = true;
    this.needTimer = 0;
    this.needMaxTime = 4.0;
    this.particles = [];
    this.activeKey = null;
    this.activeKeyTimer = 0;
  };

  L.nextNeed = function() {
    if (this.round > this.maxRounds) {
      this.state = 'complete';
      this.timer = 0;
      return;
    }

    const randomIndex = Math.floor(Math.random() * this.tasks.length);
    this.currentNeed = this.tasks[randomIndex];

    // Tempo reduz significativamente com o progresso das rondas (De 4.0s até 1.5s)
    this.needMaxTime = Math.max(1.5, 4.2 - (this.round - 1) * 0.3);
    this.needTimer = this.needMaxTime;

    // A partir da ronda 4, surge um "Falso Alarme / Distração" por um brevíssimo instante
    if (this.round >= 4 && Math.random() < 0.5) {
      let otherIndex;
      do {
        otherIndex = Math.floor(Math.random() * this.tasks.length);
      } while (otherIndex === randomIndex);
      this.distractionNeed = this.tasks[otherIndex];
    } else {
      this.distractionNeed = null;
    }
  };

  L.spawnParticles = function(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color: color,
        life: 0.8,
        maxLife: 0.8,
        size: Math.random() * 5 + 3
      });
    }
  };

  L.update = function(dt, game) {
    this.timer += dt;

    if (this.activeKeyTimer > 0) this.activeKeyTimer -= dt;

    if (this.state === 'complete') {
      if (Input.once(' ') && this.timer > 1.2) {
        Game.clearOverlay();
        this.nextLevel(game);
      }
      return;
    }

    if (this.state !== 'playing' || (typeof Dialogue !== 'undefined' && Dialogue.active)) return;

    // Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.needTimer -= dt;
    if (this.reactionTimer > 0) this.reactionTimer -= dt;

    if (this.needTimer <= 0) {
      this.applyPenalty('⏰ Demoraste muito! A Totti está aos berros!');
      this.nextNeed();
      return;
    }

    let selectedTask = null;
    if (Input.once('1')) { selectedTask = 'feed'; this.activeKey = '1'; this.activeKeyTimer = 0.15; }
    if (Input.once('2')) { selectedTask = 'burp'; this.activeKey = '2'; this.activeKeyTimer = 0.15; }
    if (Input.once('3')) { selectedTask = 'diaper'; this.activeKey = '3'; this.activeKeyTimer = 0.15; }
    if (Input.once('4')) { selectedTask = 'sleep'; this.activeKey = '4'; this.activeKeyTimer = 0.15; }

    if (selectedTask) {
      if (selectedTask === this.currentNeed.id) {
        this.reactionText = '⚡️ Boa! Resposta rápida!';
        this.reactionSuccess = true;
        this.reactionTimer = 0.8;
        this.spawnParticles(game.W / 2 + 35, game.H / 2 - 20, '#f472b6');
        this.round++;
        
        if (this.status.happiness < 3) this.status.happiness++;
        else if (this.status.hunger < 3) this.status.hunger++;

        this.nextNeed();
      } else {
        this.applyPenalty('😭 Tás-te a passar...?');
      }
    }
  };

  L.applyPenalty = function(msg) {
    this.reactionText = msg;
    this.reactionSuccess = false;
    this.reactionTimer = 1.2;

    // Penalização duplicada (perde 2 pontos por erro)
    let penaltiesLeft = 2;
    const stats = ['happiness', 'hunger', 'sleep', 'diaper'];
    
    for (let st of stats) {
      while (this.status[st] > 0 && penaltiesLeft > 0) {
        this.status[st]--;
        penaltiesLeft--;
      }
    }

    const totalStatus = this.status.hunger + this.status.happiness + this.status.sleep + this.status.diaper;
    if (totalStatus <= 0) {
      this.state = 'intro';
      Dialogue.start([
        { speaker: 'BEBÉ TOTTI', text: '😭😭😭😭😭 AHHHHH!' },
        { speaker: 'DESAFIO FALHADO', text: 'A Totti ficou demasiado stressada! Vais ter de tentar a sequência desde o início!' }
      ], () => {
        this.resetLevel();
        this.state = 'playing';
        this.nextNeed();
      });
    }
  };

  L.nextLevel = function(game) {
    if (Game.levels[7]) Game.startLevel(7);
    else Game.setOverlay({
      update(){},
      draw(ctx, g) {
        const W = g.W, H = g.H;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
        ctx.fillStyle = '#f472b6'; ctx.font = 'bold 24px ' + (typeof TEXT_FONT_STACK !== 'undefined' ? TEXT_FONT_STACK : 'monospace');
        ctx.fillText('TO BE CONTINUED...', W / 2, H / 2 - 10);
        ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace';
        ctx.fillText('Nível da Totti Concluído com Sucesso!', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
      }
    });
  };

  L.draw = function(ctx, game) {
    const W = game.W, H = game.H;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (['intro', 'playing'].includes(this.state)) {
      // 1. FUNDO CÁLIDO
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.68);
      bgGrad.addColorStop(0, '#fdf2f8');
      bgGrad.addColorStop(0.6, '#fce7f3');
      bgGrad.addColorStop(1, '#fbcfe8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H * 0.68);

      // Nuvens decorativas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 85) + Math.sin(this.timer * 0.8 + i) * 10) % W;
        const cy = (i * 28 + 30) % (H * 0.45);
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.arc(cx + 10, cy - 5, 14, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. CHÃO E TAPETE
      const floorGrad = ctx.createLinearGradient(0, H * 0.68, 0, H);
      floorGrad.addColorStop(0, '#e5be9e');
      floorGrad.addColorStop(1, '#c39874');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, H * 0.68, W, H * 0.32);

      ctx.strokeStyle = 'rgba(140, 90, 50, 0.15)';
      ctx.lineWidth = 1;
      for (let y = H * 0.68; y < H; y += 18) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
      ctx.beginPath();
      ctx.ellipse(W / 2 + 10, H * 0.74, 130, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.stroke();

      // 3. BERÇO
      const cribX = W / 2 + 45;
      const cribY = H * 0.52;

      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(cribX, cribY + 40, 55, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      if (typeof roundRect === 'function') {
        roundRect(ctx, cribX - 50, cribY, 100, 42, 8); ctx.fill();
      } else {
        ctx.fillRect(cribX - 50, cribY, 100, 42);
      }

      ctx.fillStyle = '#ffffff';
      if (typeof roundRect === 'function') {
        roundRect(ctx, cribX - 44, cribY - 8, 88, 14, 4); ctx.fill();
      } else {
        ctx.fillRect(cribX - 44, cribY - 8, 88, 14);
      }

      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      for (let gx = cribX - 42; gx <= cribX + 42; gx += 14) {
        ctx.beginPath(); ctx.moveTo(gx, cribY - 12); ctx.lineTo(gx, cribY + 36); ctx.stroke();
      }

      // 4. PERSONAGENS
      const tomasObj = {
        x: (W / 2 - 70) / 1.25,
        y: (H * 0.65) / 1.25,
        dir: 'right',
        step: this.timer * 4
      };

      if (typeof drawPlayer === 'function') {
        ctx.save();
        ctx.scale(1.25, 1.25);
        drawPlayer(ctx, tomasObj);
        ctx.restore();
      }

      // TOTTI no Berço
      const TOTTIBob = Math.sin(this.timer * 6) * 3.5; // Animação de bob mais agitada
      const isUrgent = this.needTimer < 1.5;
      const babyEmoji = isUrgent ? '😭' : (this.reactionTimer > 0 && this.reactionSuccess ? '🥰' : '👶🏼');

      ctx.save();
      ctx.font = typeof emojiFont === 'function' ? emojiFont(36) : '36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(babyEmoji, cribX, cribY - 14 + TOTTIBob);
      ctx.restore();

      // 5. BALÃO DE PENSAMENTO (COM EFEITO DE FALSO ALARME)
      if (this.currentNeed) {
        const bubbleX = cribX + 22;
        const bubbleY = cribY - 80 + TOTTIBob;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath(); ctx.arc(cribX + 10, cribY - 44, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cribX + 16, cribY - 54, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(bubbleX + 6, bubbleY + 6, 22, 0, Math.PI * 2);
        ctx.arc(bubbleX - 10, bubbleY + 8, 16, 0, Math.PI * 2);
        ctx.arc(bubbleX + 22, bubbleY + 8, 16, 0, Math.PI * 2);
        ctx.arc(bubbleX + 14, bubbleY - 8, 18, 0, Math.PI * 2);
        ctx.arc(bubbleX - 2, bubbleY - 8, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Revela o ícone real após uma fração de segundo se houver distração
        let displayedClue = this.currentNeed.clueEmoji;
        if (this.distractionNeed && (this.needMaxTime - this.needTimer < 0.35)) {
          displayedClue = this.distractionNeed.clueEmoji;
        }

        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(24) : '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(displayedClue, bubbleX + 6, bubbleY + 12);
        ctx.restore();
      }

      // Partículas
      this.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 6. HUD SUPERIOR
      const hudY = 8;
      const hudW = W - 20;
      const hudX = 10;
      const hudH = 58;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 8;
      if (typeof roundRect === 'function') roundRect(ctx, hudX, hudY, hudW, hudH, 14); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)'; ctx.lineWidth = 1.5;
      if (typeof roundRect === 'function') roundRect(ctx, hudX, hudY, hudW, hudH, 14); ctx.stroke();

      const itemW = hudW / 4;
      const statusList = [
        { label: 'FOME', val: this.status.hunger, color: '#e11d48', icon: '🍼' },
        { label: 'ALEGRIA', val: this.status.happiness, color: '#0284c7', icon: '😊' },
        { label: 'SONO', val: this.status.sleep, color: '#7c3aed', icon: '😴' },
        { label: 'FRALDA', val: this.status.diaper, color: '#d97706', icon: '💩' }
      ];

      statusList.forEach((st, idx) => {
        const ix = hudX + idx * itemW + itemW / 2;

        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(18) : '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(st.icon, ix - 16, hudY + 24);
        ctx.restore();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(st.label, ix - 4, hudY + 22);

        ctx.fillStyle = st.color;
        ctx.font = 'bold 12px monospace';
        const heartStr = '❤️'.repeat(st.val) + '🖤'.repeat(3 - st.val);
        ctx.fillText(heartStr, ix - 10, hudY + 42);
      });

      // BARRA DE TEMPO RESTANTE
      if (this.currentNeed) {
        const barW = W - 60;
        const barH = 6;
        const barX = 30;
        const barY = H * 0.73;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        if (typeof roundRect === 'function') roundRect(ctx, barX, barY, barW, barH, 3); ctx.fill();

        const pct = Math.max(0, this.needTimer / this.needMaxTime);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        
        if (pct < 0.35) {
          barGrad.addColorStop(0, '#ef4444');
          barGrad.addColorStop(1, '#dc2626');
        } else {
          barGrad.addColorStop(0, '#f472b6');
          barGrad.addColorStop(1, '#38bdf8');
        }

        ctx.fillStyle = barGrad;
        if (typeof roundRect === 'function') roundRect(ctx, barX, barY, barW * pct, barH, 3); ctx.fill();
      }

      // Mensagem de Feedback
      if (this.reactionTimer > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = this.reactionSuccess ? '#059669' : '#dc2626';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(this.reactionText, W / 2, H * 0.78);
      }

      // 7. PAINEL INFERIOR DE BOTÕES
      const panelH = 78;
      const panelY = H - panelH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, panelY, W, panelH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, panelY, W, 2);

      ctx.fillStyle = '#facc15'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`⚡️ RONDA ${Math.min(this.round, this.maxRounds)} / ${this.maxRounds} - RAPIDEZ MÁXIMA!`, W / 2, panelY + 14);

      const cardW = (W - 32) / 4;
      const cardH = 48;
      const startX = 16;

      this.tasks.forEach((t, i) => {
        const cx = startX + i * cardW + (i * 3);
        const cy = panelY + 20;

        const isPressed = this.activeKey === t.targetKey && this.activeKeyTimer > 0;
        const pressOffsetY = isPressed ? 2 : 0;

        ctx.fillStyle = isPressed ? t.bg : '#1e293b';
        if (typeof roundRect === 'function') roundRect(ctx, cx, cy + pressOffsetY, cardW - 3, cardH, 8); ctx.fill();

        ctx.strokeStyle = isPressed ? t.color : 'rgba(255,255,255,0.1)'; 
        ctx.lineWidth = isPressed ? 2 : 1;
        if (typeof roundRect === 'function') roundRect(ctx, cx, cy + pressOffsetY, cardW - 3, cardH, 8); ctx.stroke();

        ctx.fillStyle = t.color;
        if (typeof roundRect === 'function') roundRect(ctx, cx + 6, cy + 6 + pressOffsetY, 16, 14, 4); ctx.fill();
        
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(t.targetKey, cx + 14, cy + 16 + pressOffsetY);

        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(18) : '18px monospace';
        ctx.fillText(t.icon, cx + (cardW - 3) / 2 + 8, cy + 18 + pressOffsetY);
        ctx.restore();

        ctx.fillStyle = isPressed ? '#0f172a' : '#cbd5e1'; 
        ctx.font = 'bold 8px monospace';
        ctx.fillText(t.name, cx + (cardW - 3) / 2, cy + 38 + pressOffsetY);
      });
    }

    // 8. OVERLAY DE VITÓRIA
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

      ctx.fillText('🏆 NÍVEL 6 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('A TOTTI ADORMECEU!', W / 2, boxY + 52);

      const cardW = boxW - 32; const cardH = 80;
      const cardX = boxX + 16; const cardY = boxY + 68;

      ctx.fillStyle = '#fdf2f8'; 
      if (typeof roundRect === 'function') roundRect(ctx, cardX, cardY, cardW, cardH, 12); ctx.fill();

      ctx.save();
      ctx.font = typeof emojiFont === 'function' ? emojiFont(24) : '24px monospace';
      ctx.fillText('😴 👶 🍼', W / 2, cardY + 32);
      ctx.restore();

      ctx.fillStyle = '#db2777';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('REFLEXOS DE AÇO!', W / 2, cardY + 58);

      if (this.timer > 0.6) {
        ctx.fillStyle = '#64748b'; ctx.font = '12px monospace';
        ctx.fillText('Conseguiste superar o desafio Totti!', W / 2, boxY + 175);
        ctx.fillStyle = '#059669'; ctx.font = 'italic 11px monospace';
        ctx.fillText('A Totti está finalmente a dormir profundamente.', W / 2, boxY + 192);
      }

      if (this.timer > 1.2) {
        const btnPulse = Math.sin(this.timer * 6) * 0.15 + 0.85;
        ctx.save();
        ctx.globalAlpha = btnPulse * progress;
        const btnW = 180, btnH = 32, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 42;
        ctx.fillStyle = '#f472b6'; 
        if (typeof roundRect === 'function') roundRect(ctx, btnX, btnY, btnW, btnH, 8); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 20);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  };

  Game.addLevel(6, L);
})();