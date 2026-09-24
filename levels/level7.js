/* ============================================================================
 * TOMÁS: THE QUEST  —  LEVEL 7: A MELHOR COSA QUE JÁ COMI (ADVANCED OVERCOOKED)
 * Theme: "Preparing Kiu's 5-Star Dinner with Real Overcooked Mechanics & Fail Conditions"
 * Features: Prep-Cook-Serve Cycle, Heat Gauge, Fire Emergency, Real Game Over
 * ==========================================================================*/
(function() {
  const L = { id: 7 };

  L.enter = function(game) {
    this.resetLevel();

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🍳 NÍVEL 7 — A MELHOR COISA QUE JÁ COMI', 3.2);
    }

    Dialogue.start([
      { speaker: 'CHEF MIA', text: 'Tomás! A Kiu quer um prato perfeito! Vais ter de preparar, cozinhar no fogão e servir antes que queime!' },
      { speaker: 'TIO TOMÁS', text: 'Preparar, vigiar o fogo e servir? Deixa comigo!' },
      { speaker: 'COMO JOGAR', text: '1. Pega no ingrediente [1-4].\n2. Carrega no [ESPAÇO] para cortar na bancada.\n3. Cuidado com o fogo! Se aquecer muito, usa o [5] (Manta do Fogo).' }
    ], () => {
      this.state = 'playing';
      this.startNewOrder();
    });
  };

  L.resetLevel = function() {
    this.state = 'intro'; // 'intro' | 'playing' | 'gameover' | 'complete'
    this.timer = 0;
    this.ordersDone = 0;
    this.targetOrders = 4;
    this.lives = 3; // 3 Vidas da Cozinha

    // Estado da Estação de Cozinha
    this.station = {
      holdingIngredient: null, // O que Tomás tem na mão
      prepProgress: 0,         // 0 a 100% de corte
      potIngredient: null,     // O que está na panela
      potHeat: 0,              // 0 a 100% (se chegar a 100%, QUEIMA!)
      potCookProgress: 0,      // 0 a 100% (cozinhado com sucesso)
      isCooked: false
    };

    // Ingredientes disponíveis
    this.ingredients = [
      { id: 'tomato', name: 'TOMATE', icon: '🍅', key: '1', color: '#ef4444', bg: '#fef2f2' },
      { id: 'oil', name: 'AZEITE', icon: '🫒', key: '2', color: '#84cc16', bg: '#f7fee7' },
      { id: 'pasta', name: 'MASSA', icon: '🍝', key: '3', color: '#eab308', bg: '#fefce8' },
      { id: 'herbs', name: 'ERVAS', icon: '🌿', key: '4', color: '#10b981', bg: '#ecfdf5' }
    ];

    this.currentOrder = null;
    this.orderTimer = 0;
    this.orderMaxTime = 16.0;

    this.feedbackMsg = '';
    this.feedbackTimer = 0;
    this.particles = [];
    this.activeKey = null;
    this.activeKeyTimer = 0;
  };

  L.startNewOrder = function() {
    if (this.ordersDone >= this.targetOrders) {
      this.state = 'complete';
      this.timer = 0;
      return;
    }

    const randomIndex = Math.floor(Math.random() * this.ingredients.length);
    this.currentOrder = this.ingredients[randomIndex];
    this.orderMaxTime = Math.max(10.0, 15.0 - this.ordersDone * 1.5);
    this.orderTimer = this.orderMaxTime;

    // Reseta bancada
    this.station.holdingIngredient = null;
    this.station.prepProgress = 0;
    this.station.potIngredient = null;
    this.station.potHeat = 0;
    this.station.potCookProgress = 0;
    this.station.isCooked = false;
  };

  L.spawnParticles = function(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 20;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color: color,
        life: 0.7,
        maxLife: 0.7,
        size: Math.random() * 4 + 3
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

    if (this.state === 'gameover') {
      if (Input.once(' ')) {
        this.resetLevel();
        this.state = 'playing';
        this.startNewOrder();
      }
      return;
    }

    if (this.state !== 'playing' || (typeof Dialogue !== 'undefined' && Dialogue.active)) return;

    // Atualiza partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.orderTimer -= dt;
    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;

    // 1. GESTÃO DO FOGÃO & TEMPERATURA
    if (this.station.potIngredient) {
      if (!this.station.isCooked) {
        this.station.potCookProgress += dt * 35; // Tempo para cozinhar
        if (this.station.potCookProgress >= 100) {
          this.station.isCooked = true;
          this.station.potCookProgress = 100;
        }
      } else {
        // Se já cozinhou e continua no fogão, o calor sobe!
        this.station.potHeat += dt * 25;
        if (this.station.potHeat >= 100) {
          this.triggerBurnPenalty('🔥 COMIDA QUEIMOU NO FOGÃO!');
          return;
        }
      }
    }

    // 2. TEMPO LIMITE DA ENCOMENDA
    if (this.orderTimer <= 0) {
      this.triggerBurnPenalty('⏰ A KIU CANSOU-SE DE ESPERAR!');
      return;
    }

    // 3. ENTRADA DE COMANDOS DO JOGADOR
    // Seleção de Ingrediente da Despensa [1-4]
    for (let i = 0; i < this.ingredients.length; i++) {
      if (Input.once((i + 1).toString())) {
        this.activeKey = (i + 1).toString();
        this.activeKeyTimer = 0.15;
        if (!this.station.holdingIngredient && !this.station.potIngredient) {
          this.station.holdingIngredient = this.ingredients[i];
          this.station.prepProgress = 0;
          this.feedbackMsg = `Apanhaste ${this.ingredients[i].name}! Corta na bancada!`;
          this.feedbackTimer = 1.0;
        }
      }
    }

    // Prepara/Corta na Bancada [ESPAÇO]
    if (Input.once(' ') || Input.once('Space')) {
      if (this.station.holdingIngredient && this.station.prepProgress < 100) {
        this.station.prepProgress += 35; // 3 cliques para cortar
        this.spawnParticles(game.W / 2 - 30, game.H * 0.52, '#ffffff');

        if (this.station.prepProgress >= 100) {
          this.station.prepProgress = 100;
          // Passa da bancada para a panela
          this.station.potIngredient = this.station.holdingIngredient;
          this.station.holdingIngredient = null;
          this.feedbackMsg = 'Ingrediente na Panela! A cozinhar...';
          this.feedbackTimer = 1.0;
        }
      } else if (this.station.isCooked) {
        // Servir o prato pronto!
        if (this.station.potIngredient.id === this.currentOrder.id) {
          this.ordersDone++;
          this.spawnParticles(game.W / 2 + 50, game.H * 0.52, '#f59e0b');
          this.feedbackMsg = '✨ PRATO SERVIDO COM SUCESSO!';
          this.feedbackTimer = 1.2;
          this.startNewOrder();
        } else {
          this.triggerBurnPenalty('❌ SERVISTE O INGREDIENTE ERRADO!');
        }
      }
    }

    // Ação de Emergência: Arrefecer Panela [5]
    if (Input.once('5')) {
      this.activeKey = '5';
      this.activeKeyTimer = 0.15;
      if (this.station.potHeat > 0) {
        this.station.potHeat = Math.max(0, this.station.potHeat - 40);
        this.spawnParticles(game.W / 2 + 50, game.H * 0.48, '#38bdf8');
        this.feedbackMsg = '🧯 Fogo arrefecido!';
        this.feedbackTimer = 0.8;
      }
    }
  };

  L.triggerBurnPenalty = function(reason) {
    this.lives--;
    this.spawnParticles(game.W / 2 + 50, game.H * 0.52, '#ef4444');

    if (this.lives <= 0) {
      this.state = 'gameover';
    } else {
      this.feedbackMsg = `${reason} (Vidas restantes: ${this.lives})`;
      this.feedbackTimer = 1.8;
      this.startNewOrder();
    }
  };

  L.nextLevel = function(game) {
    if (Game.levels[8]) Game.startLevel(8);
    else Game.setOverlay({
      update(){},
      draw(ctx, g) {
        const W = g.W, H = g.H;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 24px ' + (typeof TEXT_FONT_STACK !== 'undefined' ? TEXT_FONT_STACK : 'sans-serif');
        ctx.fillText('FIM DA DEMO DE NÍVEIS!', W / 2, H / 2 - 10);
        ctx.fillStyle = '#94a3b8'; ctx.font = '14px sans-serif';
        ctx.fillText('Parabéns! O jantar para a Kiu foi um sucesso total!', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
      }
    });
  };

  L.draw = function(ctx, game) {
    const W = game.W, H = game.H;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';

    if (['intro', 'playing'].includes(this.state)) {
      // 1. AMBIENTE DA COZINHA
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      bgGrad.addColorStop(0, '#fef3c7');
      bgGrad.addColorStop(1, '#fde68a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H * 0.65);

      // Chão
      const floorGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
      floorGrad.addColorStop(0, '#b45309');
      floorGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, H * 0.65, W, H * 0.35);

      // 2. BANCADA E FOGÃO
      const counterY = H * 0.54;
      ctx.fillStyle = '#d97706'; ctx.fillRect(0, counterY, W, H * 0.18);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(0, counterY, W, 6);

      // Estação 1: Tábua de Cortar (Esquerda)
      const prepX = W / 2 - 45;
      ctx.fillStyle = '#b45309';
      if (typeof roundRect === 'function') roundRect(ctx, prepX - 25, counterY - 10, 50, 20, 4); ctx.fill();

      // Estação 2: Fogão e Panela (Direita)
      const potX = W / 2 + 45;
      const potY = counterY - 14;
      ctx.fillStyle = '#334155';
      if (typeof roundRect === 'function') roundRect(ctx, potX - 25, potY + 4, 50, 16, 4); ctx.fill();

      // Panela
      ctx.fillStyle = this.station.potHeat > 60 ? '#ef4444' : '#475569';
      if (typeof roundRect === 'function') roundRect(ctx, potX - 20, potY - 10, 40, 20, 4); ctx.fill();

      // Fumo / Animação de Fogo
      if (this.station.potIngredient) {
        ctx.fillStyle = this.station.potHeat > 50 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.6)';
        for (let s = 0; s < 3; s++) {
          const sx = potX - 8 + s * 8 + Math.sin(this.timer * 5 + s) * 3;
          const sy = potY - 15 - ((this.timer * 25 + s * 10) % 20);
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
        }
      }

      // 3. PERSONAGENS
      const tomasObj = {
        x: (W / 2 - 95) / 1.25,
        y: (H * 0.62) / 1.25,
        dir: 'right',
        step: this.timer * 4
      };

      if (typeof drawPlayer === 'function') {
        ctx.save();
        ctx.scale(1.25, 1.25);
        drawPlayer(ctx, tomasObj);
        ctx.restore();
      }

      // Chef Mia
      const miaX = W / 2 + 125;
      const miaY = H * 0.60;
      ctx.save();
      ctx.font = typeof emojiFont === 'function' ? emojiFont(34) : '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👩‍🍳', miaX, miaY);
      ctx.restore();

      // 4. DESENHO DOS ESTADOS DOS INGREDIENTES
      // Na mão / Na tábua
      if (this.station.holdingIngredient) {
        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(20) : '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.station.holdingIngredient.icon, prepX, counterY - 16);
        ctx.restore();

        // Barra de Corte
        if (this.station.prepProgress < 100) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(prepX - 20, counterY + 12, 40, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(prepX - 20, counterY + 12, 40 * (this.station.prepProgress / 100), 5);
        }
      }

      // Na Panela
      if (this.station.potIngredient) {
        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(18) : '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.station.potIngredient.icon, potX, potY - 16);
        ctx.restore();

        // Barra de Cozedura / Calor
        const bX = potX - 20;
        const bY = potY + 12;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(bX, bY, 40, 5);

        if (!this.station.isCooked) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bX, bY, 40 * (this.station.potCookProgress / 100), 5);
        } else {
          // Mostra indicador de PERIGO de Queimar
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bX, bY, 40 * (this.station.potHeat / 100), 5);
        }
      }

      // 5. BALÃO DA CHEF MIA (PEDIDO LIMPO)
      if (this.currentOrder) {
        const bubbleX = miaX - 45;
        const bubbleY = miaY - 65;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bubbleX + 6, bubbleY + 6, 20, 0, Math.PI * 2);
        ctx.arc(bubbleX - 8, bubbleY + 8, 14, 0, Math.PI * 2);
        ctx.arc(bubbleX + 20, bubbleY + 8, 14, 0, Math.PI * 2);
        ctx.arc(bubbleX + 12, bubbleY - 6, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(22) : '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentOrder.icon, bubbleX + 6, bubbleY + 12);
        ctx.restore();
      }

      // 6. HUD SUPERIOR REFORMULADO
      const hudY = 8; const hudW = W - 20; const hudX = 10; const hudH = 54;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      if (typeof roundRect === 'function') roundRect(ctx, hudX, hudY, hudW, hudH, 12); ctx.fill();
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.5;
      if (typeof roundRect === 'function') roundRect(ctx, hudX, hudY, hudW, hudH, 12); ctx.stroke();

      // Vidas do Restaurante (Corações)
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('❤️'.repeat(this.lives) + '🖤'.repeat(3 - this.lives), hudX + 14, hudY + 22);

      // Instrução Dinâmica
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif';
      let taskGuide = 'Pega no ingrediente [1-4]';
      if (this.station.holdingIngredient) taskGuide = 'Pressiona [ESPAÇO] para cortar!';
      else if (this.station.potIngredient && !this.station.isCooked) taskGuide = 'A cozinhar no fogão...';
      else if (this.station.isCooked) taskGuide = 'PRONTO! Pressiona [ESPAÇO] para servir!';
      ctx.fillText(taskGuide, hudX + 14, hudY + 42);

      // Progresso
      ctx.fillStyle = '#d97706'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`PRATOS SERVIDOS: ${this.ordersDone} / ${this.targetOrders}`, hudX + hudW - 14, hudY + 32);

      // Tempo da Ordem
      const barW = W - 60; const barH = 5; const barX = 30; const barY = H * 0.73;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      if (typeof roundRect === 'function') roundRect(ctx, barX, barY, barW, barH, 3); ctx.fill();
      const pct = Math.max(0, this.orderTimer / this.orderMaxTime);
      ctx.fillStyle = pct < 0.3 ? '#ef4444' : '#f59e0b';
      if (typeof roundRect === 'function') roundRect(ctx, barX, barY, barW * pct, barH, 3); ctx.fill();

      // Feedback Text
      if (this.feedbackTimer > 0) {
        ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText(this.feedbackMsg, W / 2, H * 0.78);
      }

      // 7. PAINEL DE CONTROLO INFERIOR
      const panelH = 78; const panelY = H - panelH;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, panelY, W, panelH);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, panelY, W, 2);

      const cardW = (W - 36) / 5; const cardH = 48; const startX = 12;

      // Botões 1-4
      this.ingredients.forEach((ing, i) => {
        const cx = startX + i * cardW + (i * 3);
        const cy = panelY + 18;
        ctx.fillStyle = '#1e293b';
        if (typeof roundRect === 'function') roundRect(ctx, cx, cy, cardW - 2, cardH, 8); ctx.fill();
        ctx.fillStyle = ing.color; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`[${ing.key}]`, cx + 12, cy + 14);
        ctx.save(); ctx.font = typeof emojiFont === 'function' ? emojiFont(16) : '16px sans-serif';
        ctx.fillText(ing.icon, cx + cardW / 2, cy + 24); ctx.restore();
        ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 7px sans-serif';
        ctx.fillText(ing.name, cx + cardW / 2, cy + 40);
      });

      // Botão 5 (Manta / Arrefecer)
      const cx5 = startX + 4 * cardW + 12;
      const cy5 = panelY + 18;
      ctx.fillStyle = '#1e293b';
      if (typeof roundRect === 'function') roundRect(ctx, cx5, cy5, cardW - 2, cardH, 8); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('[5]', cx5 + 12, cy5 + 14);
      ctx.save(); ctx.font = typeof emojiFont === 'function' ? emojiFont(16) : '16px sans-serif';
      ctx.fillText('🧯', cx5 + cardW / 2, cy5 + 24); ctx.restore();
      ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 7px sans-serif';
      ctx.fillText('ARREFECE', cx5 + cardW / 2, cy5 + 40);
    }

    // 8. TELA DE GAME OVER
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 22px ' + (typeof TEXT_FONT_STACK !== 'undefined' ? TEXT_FONT_STACK : 'sans-serif');
      ctx.fillText('🔥 CAOS NA COZINHA!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#cbd5e1'; ctx.font = '13px sans-serif';
      ctx.fillText('A comida queimou ou a Kiu esperou demasiado tempo.', W / 2, H / 2 + 10);
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('PRESSIONA [ ESPAÇO ] PARA TENTAR DE NOVO', W / 2, H / 2 + 45);
    }

    // 9. OVERLAY DE VITÓRIA
    if (this.state === 'complete') {
      const progress = Math.min(1, this.timer * 1.5);
      ctx.fillStyle = `rgba(15, 23, 42, ${0.88 * progress})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = progress;

      const boxW = Math.min(W - 40, 320); const boxH = 250;
      const boxX = (W - boxW) / 2; const boxY = (H - boxH) / 2;

      ctx.fillStyle = '#ffffff';
      if (typeof roundRect === 'function') roundRect(ctx, boxX, boxY, boxW, boxH, 16); ctx.fill();

      ctx.textAlign = 'center'; ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🏆 NÍVEL 7 CONCLUÍDO', W / 2, boxY + 28);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('A KIU ADOROU O JANTAR!', W / 2, boxY + 52);

      const cardW = boxW - 32; const cardH = 80; const cardX = boxX + 16; const cardY = boxY + 68;
      ctx.fillStyle = '#fef3c7';
      if (typeof roundRect === 'function') roundRect(ctx, cardX, cardY, cardW, cardH, 12); ctx.fill();

      ctx.save(); ctx.font = typeof emojiFont === 'function' ? emojiFont(24) : '24px sans-serif';
      ctx.fillText('🍝 ⭐⭐⭐⭐⭐', W / 2, cardY + 32); ctx.restore();

      ctx.fillStyle = '#b45309'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('CARD: CHEF ESTRELA', W / 2, cardY + 58);

      if (this.timer > 0.6) {
        ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
        ctx.fillText('"Jantar de 5 estrelas aprovado!"', W / 2, boxY + 175);
      }

      if (this.timer > 1.2) {
        const btnPulse = Math.sin(this.timer * 6) * 0.15 + 0.85;
        ctx.save(); ctx.globalAlpha = btnPulse * progress;
        const btnW = 180, btnH = 32, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 42;
        ctx.fillStyle = '#f59e0b';
        if (typeof roundRect === 'function') roundRect(ctx, btnX, btnY, btnW, btnH, 8); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 20); ctx.restore();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  Game.addLevel(7, L);
})();