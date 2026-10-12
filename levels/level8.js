/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 8: FRONTLINE
 * ==========================================================================*/
(function() {
  const L = { id: 8 };

  // Helper corrigido para retângulos arredondados
  function roundRectLocal(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  L.enter = function(game) {
    this.resetLevel(game);
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🎸 LEVEL 8 — FRONTLINE', 3.2);
    }
  };

  L.resetLevel = function(game) {
    this.state = 'intro_dialog'; // 'intro_dialog' | 'playing' | 'complete' | 'gameover'
    this.introStep = 1; // 1: Contexto da História | 2: Instruções & Controlo
    this.timer = 0;
    this.stateTimer = 0;
    this.lives = 3;
    this.distanceToStage = 100;
    this.vipPassesCollected = 0;
    this.targetVipPasses = 3;
    this.gameOverReason = ''; // Guarda o motivo exato da derrota ('crowd' ou 'no_passes')

    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    // Jogador (Tomás)
    this.player = {
      x: W * 0.15,
      y: H * 0.70,
      vy: 0,
      isGrounded: true,
      onShoulders: false,
      speed: 180,
      width: 24,
      height: 40
    };

    // Obstáculos e colecionáveis
    this.obstacles = [];
    this.shoulders = [];
    this.items = [];

    this.spawnTimer = 0;
    this.feedbackMsg = 'Usa [SETAS] para mover e [ESPAÇO] para saltar!';
    this.feedbackTimer = 4.0;
    this.feedbackIsError = false;

    // Teclas
    this.keys = {};
    if (!this.boundKeyDown) {
      this.boundKeyDown = (e) => {
        this.keys[e.key] = true;
        this.handleKeyPress(e.key, game);
      };
      this.boundKeyUp = (e) => { this.keys[e.key] = false; };
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    }
  };

  L.handleKeyPress = function(key, game) {
    // 1. Tela de Vitória (exige 0.5s de espera no card antes de aceitar Espaço)
    if (this.state === 'complete') {
      if (this.stateTimer < 0.5) return; // 🛡️ Evita fechar acidentalmente ao jogar

      if (key === ' ' || key === 'Enter') {
        if (this.boundKeyDown) {
          window.removeEventListener('keydown', this.boundKeyDown);
          window.removeEventListener('keyup', this.boundKeyUp);
          this.boundKeyDown = null;
          this.boundKeyUp = null;
        }
        if (typeof Game !== 'undefined' && Game.startLevel) {
          if (Game.levels[9]) Game.startLevel(9);
          else Game.startLevel(1);
        }
        return;
      }
    }

    // 2. Tela de Derrota / GameOver (exige 0.5s de espera no card antes de reiniciar)
    if (this.state === 'gameover') {
      if (this.stateTimer < 0.5) return; // 🛡️ Evita reiniciar instantaneamente

      if (key === ' ' || key === 'Enter') {
        this.resetLevel(game);
        return;
      }
    }

    // 3. Diálogo Inicial em 2 Cartões
    if (this.state === 'intro_dialog' && (key === ' ' || key === 'Enter')) {
      if (this.stateTimer < 0.25) return; // Trava de segurança
      
      if (this.introStep === 1) {
        this.introStep = 2;
        this.stateTimer = 0;
      } else {
        this.state = 'playing';
        this.stateTimer = 0;
      }
      return;
    }

    // 4. Ações de Pulo durante o jogo
    if (this.state === 'playing' && (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W')) {
      if (this.player.isGrounded || this.player.onShoulders) {
        this.player.vy = -340;
        this.player.isGrounded = false;
        this.player.onShoulders = false;
      }
      return;
    }
  };

  L.update = function(dt, game) {
    const W = game.W || 640;
    const H = game.H || 480;
    this.timer += dt;
    this.stateTimer += dt;

    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;
    if (this.state !== 'playing') return;

    // Progresso em direção ao palco
    this.distanceToStage -= dt * 3.5;
    if (this.distanceToStage <= 0) {
      this.distanceToStage = 0;
      if (this.vipPassesCollected >= this.targetVipPasses) {
        this.state = 'complete';
        this.stateTimer = 0;
      } else {
        // Derrota por falta de bilhetes VIP ao chegar ao final do mapa
        this.state = 'gameover';
        this.stateTimer = 0;
        this.gameOverReason = 'no_passes';
      }
    }

    // Movimentação do Tomás
    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveDir -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveDir += 1;

    this.player.x += moveDir * this.player.speed * dt;
    this.player.x = Math.max(30, Math.min(W - 40, this.player.x));

    // Gravidade e Física de Salto
    const gravity = 850;
    const groundY = H * 0.72;

    this.player.vy += gravity * dt;
    this.player.y += this.player.vy * dt;

    // Verificação de Aterragem nos Ombros
    let landedOnShoulders = false;
    for (let s of this.shoulders) {
      if (
        this.player.vy > 0 &&
        this.player.x + this.player.width > s.x &&
        this.player.x < s.x + s.width &&
        this.player.y + this.player.height >= s.y &&
        this.player.y + this.player.height <= s.y + 15
      ) {
        this.player.y = s.y - this.player.height;
        this.player.vy = 0;
        this.player.onShoulders = true;
        this.player.isGrounded = false;
        landedOnShoulders = true;
        break;
      }
    }

    if (!landedOnShoulders) {
      this.player.onShoulders = false;
      if (this.player.y >= groundY) {
        this.player.y = groundY;
        this.player.vy = 0;
        this.player.isGrounded = true;
      }
    }

    // Geração Contínua
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.4) {
      this.spawnTimer = 0;

      const r = Math.random();
      if (r < 0.4) {
        this.obstacles.push({
          type: 'mosh',
          x: W + 30,
          y: groundY + 10,
          radius: 22,
          speed: 120 + Math.random() * 40
        });
      } else if (r < 0.7) {
        this.obstacles.push({
          type: 'dancer',
          x: W + 30,
          y: groundY - 5,
          width: 25,
          height: 35,
          speed: 100 + Math.random() * 30
        });
      }

      if (Math.random() < 0.45) {
        this.shoulders.push({
          x: W + 40,
          y: groundY - 35,
          width: 45,
          height: 12,
          speed: 90
        });
      }

      if (Math.random() < 0.5) {
        const isVip = Math.random() < 0.4;
        this.items.push({
          type: isVip ? 'vip' : 'cup',
          x: W + 20,
          y: isVip ? groundY - 65 : groundY - 15,
          collected: false,
          speed: 100
        });
      }
    }

    // Atualizar Obstáculos
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= obs.speed * dt;

      if (!this.player.onShoulders) {
        let hit = false;
        if (obs.type === 'mosh') {
          const dx = (this.player.x + 12) - obs.x;
          const dy = (this.player.y + 20) - obs.y;
          if (Math.sqrt(dx * dx + dy * dy) < obs.radius + 12) hit = true;
        } else {
          if (
            this.player.x < obs.x + obs.width &&
            this.player.x + this.player.width > obs.x &&
            this.player.y < obs.y + obs.height &&
            this.player.y + this.player.height > obs.y
          ) hit = true;
        }

        if (hit) {
          this.obstacles.splice(i, 1);
          this.triggerPenalty('💥 Não tens olhos na cara?');
          continue;
        }
      }

      if (obs.x < -50) this.obstacles.splice(i, 1);
    }

    // Atualizar Ombros
    for (let i = this.shoulders.length - 1; i >= 0; i--) {
      let s = this.shoulders[i];
      s.x -= s.speed * dt;
      if (s.x < -60) this.shoulders.splice(i, 1);
    }

    // Atualizar Colecionáveis
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.x -= item.speed * dt;

      if (!item.collected) {
        if (
          this.player.x < item.x + 20 &&
          this.player.x + this.player.width > item.x &&
          this.player.y < item.y + 20 &&
          this.player.y + this.player.height > item.y
        ) {
          item.collected = true;
          if (item.type === 'vip') {
            this.vipPassesCollected++;
            this.feedbackMsg = `🎟️ Apanhaste um Bilhooo! (${this.vipPassesCollected}/${this.targetVipPasses})`;
          } else {
            this.feedbackMsg = '🍺 Cervejinha à pala! (+Pontos)';
          }
          this.feedbackTimer = 2.0;
          this.feedbackIsError = false;
        }
      }

      if (item.x < -30) this.items.splice(i, 1);
    }
  };

  L.triggerPenalty = function(msg) {
    this.lives--;
    this.feedbackMsg = `${msg} Restam ${this.lives} Vidas!`;
    this.feedbackTimer = 2.8;
    this.feedbackIsError = true;

    if (this.lives <= 0) {
      this.state = 'gameover';
      this.stateTimer = 0;
      this.gameOverReason = 'crowd'; // Perdeu todas as vidas a ser atingido na multidão
    }
  };

  L.draw = function(ctx, game) {
    const W = game.W || 640;
    const H = game.H || 480;

    ctx.save();

    // ---------------- 1. CENÁRIO DO FESTIVAL & LUZES ----------------
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    const stageY = H * 0.22;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(W * 0.1, stageY, W * 0.8, H * 0.35);

    const ledColor = Math.sin(this.timer * 8) > 0 ? '#ec4899' : '#3b82f6';
    ctx.fillStyle = ledColor;
    ctx.fillRect(W * 0.15, stageY + 15, 80, 50);
    ctx.fillRect(W * 0.85 - 80, stageY + 15, 80, 50);

    ctx.save();
    ctx.globalAlpha = 0.25;
    const lightAngle = Math.sin(this.timer * 3) * 0.4;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(W * 0.3, stageY);
    ctx.lineTo(W * 0.3 + Math.tan(lightAngle - 0.3) * 200, H);
    ctx.lineTo(W * 0.3 + Math.tan(lightAngle + 0.3) * 200, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(W * 0.7, stageY);
    ctx.lineTo(W * 0.7 + Math.tan(-lightAngle - 0.3) * 200, H);
    ctx.lineTo(W * 0.7 + Math.tan(-lightAngle + 0.3) * 200, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Silhuetas da Multidão
    ctx.fillStyle = '#0f172a';
    for (let x = 0; x < W; x += 18) {
      const hOffset = Math.sin(x * 0.1 + this.timer * 5) * 6;
      ctx.beginPath();
      ctx.arc(x + 9, H * 0.58 + hOffset, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x, H * 0.58 + hOffset, 18, 60);
    }

    // Chão
    const groundY = H * 0.72;
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, groundY + 30, W, H - (groundY + 30));

    // ---------------- 2. OMBROS ----------------
    for (let s of this.shoulders) {
      ctx.fillStyle = '#334155';
      roundRectLocal(ctx, s.x, s.y + 12, s.width, 30, 6); ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(s.x + s.width / 2, s.y + 6, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      roundRectLocal(ctx, s.x, s.y, s.width, 6, 3); ctx.fill();
    }

    // ---------------- 3. OBSTÁCULOS ----------------
    for (let obs of this.obstacles) {
      if (obs.type === 'mosh') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.font = typeof emojiFont === 'function' ? emojiFont(20) : '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌀', obs.x, obs.y + 6);
      } else if (obs.type === 'dancer') {
        ctx.font = typeof emojiFont === 'function' ? emojiFont(26) : '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕺', obs.x + 12, obs.y + 25);
      }
    }

    // ---------------- 4. COLECCIONÁVEIS ----------------
    for (let item of this.items) {
      if (item.collected) continue;
      ctx.font = typeof emojiFont === 'function' ? emojiFont(22) : '22px sans-serif';
      ctx.textAlign = 'center';
      if (item.type === 'vip') {
        ctx.fillText('🎟️', item.x + 10, item.y + 15);
      } else {
        ctx.fillText('🍺', item.x + 10, item.y + 15);
      }
    }

    // ---------------- 5. JOGADOR ----------------
    if (typeof drawPlayer === 'function') {
      drawPlayer(ctx, this.player);
    }

    // ---------------- 6. HUD ----------------
    ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.fill();
    ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2;
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.stroke();

    ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(this.lives), 30, 44);

    ctx.fillStyle = '#facc15'; ctx.font = 'bold 14px monospace';
    ctx.fillText(`🎟️ BILHOS: ${this.vipPassesCollected}/${this.targetVipPasses}`, 125, 44);

    const barW = 160;
    const barX = W - 180;
    const progressPct = 1 - (this.distanceToStage / 100);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`PALCO: ${Math.ceil(this.distanceToStage)}m`, barX - 10, 44);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRectLocal(ctx, barX, 32, barW, 12, 4); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    roundRectLocal(ctx, barX, 32, barW * Math.max(0, progressPct), 12, 4); ctx.fill();

    // Feedback
    if (this.feedbackTimer > 0) {
      ctx.textAlign = 'center';
      const boxW = Math.min(W - 60, ctx.measureText(this.feedbackMsg).width + 40);
      ctx.fillStyle = this.feedbackIsError ? 'rgba(153, 27, 27, 0.92)' : 'rgba(20, 83, 45, 0.92)';
      roundRectLocal(ctx, (W - boxW) / 2, H * 0.84, boxW, 30, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(this.feedbackMsg, W / 2, H * 0.84 + 19);
    }

    // Rodapé
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MOVER: [SETAS]  |  SALTAR / SUBIR NOS OMBROS: [ESPAÇO]', W / 2, H - 7);

    // ---------------- 7. DIÁLOGOS E FINAL ----------------
    // 7a. Diálogo Inicial Dividido em 2 Cartões
    if (this.state === 'intro_dialog') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.65)';
      ctx.fillRect(0, 0, W, H);

      const boxH = 132, pad = 18;
      const x = 16, w = W - 32;
      const y = H - boxH - 16;

      ctx.fillStyle = 'rgba(10,12,26,0.92)';
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#8ad'; ctx.lineWidth = 3;
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.stroke();

      // CARTÃO 1: Contexto da História
      if (this.introStep === 1) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(15, true) : 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('QUEST', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(13) : '13px monospace';
        
        const contentY = y + pad + 22;
        ctx.fillText('Foste à casa de banho (para variar) e a Kiu ficou à tua espera', x + pad, contentY);
        ctx.fillText('na primeira fila do palco Primavera!', x + pad, contentY + 18);
        ctx.fillText('Tens de atravessar a multidão para a encontrares...', x + pad, contentY + 36);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para continuar ➔', x + w - pad, y + boxH - 14);
      }

      // CARTÃO 2: Regras & Instruções
      else if (this.introStep === 2) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(15, true) : 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('INSTRUÇÕES', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(12) : '12px monospace';
        
        const contentY = y + pad + 20;
        ctx.fillText('1. Podes saltar para cima dos ombros dos festivaleyros', x + pad, contentY);
        ctx.fillText('2. Evita a poeira 🌀 e o povinho 🕺🏼 mas traz cervejinhas pra malta 🍺', x + pad, contentY + 16);
        ctx.fillText('3. Apanha no mínimo 3 bilhos 🎟️ no caminho!', x + pad, contentY + 32);

        ctx.fillStyle = '#38bdf8';
        ctx.font = typeof textFont === 'function' ? textFont(10, true) : 'bold 10px monospace';
        ctx.fillText('[SETAS] Andar  |  [ESPAÇO] Saltar / Subir para os Ombros', x + pad, contentY + 52);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para começar!', x + w - pad, y + boxH - 14);
      }
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444'; 
      ctx.font = 'bold 22px monospace'; 
      ctx.textAlign = 'center';

      if (this.gameOverReason === 'no_passes') {
        // Derrota por não recolher bilhetes suficientes
        ctx.fillText('🎟️ FALTAM BILHOS!', W / 2, H / 2 - 30);
        ctx.fillStyle = '#f87171';
        ctx.font = '14px monospace';
        ctx.fillText(`Apanhaste apenas ${this.vipPassesCollected}/${this.targetVipPasses} bilhos!`, W / 2, H / 2);
      } else {
        // Derrota por perder as 3 vidas
        ctx.fillText('💥 PERDESTE-TE NA MULTIDÃO!', W / 2, H / 2 - 30);
        ctx.fillStyle = '#f87171';
        ctx.font = '14px monospace';
        ctx.fillText('Foste esmagadinho pelo povinho e estás cheio de pó na cara!', W / 2, H / 2);
      }

      ctx.fillStyle = '#ffffff'; 
      ctx.font = '13px monospace';
      ctx.fillText('Pressiona [ ESPAÇO ] para tentar novamente', W / 2, H / 2 + 45);
    }

    if (this.state === 'complete') {
      const progress = Math.min(1, this.stateTimer * 2.0);

      ctx.fillStyle = `rgba(16, 14, 26, ${0.92 * progress})`;
      ctx.fillRect(0, 0, W, H);

      const boxW = Math.min(W - 32, 340);
      const boxH = 280;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      ctx.save();
      ctx.globalAlpha = progress;

      // Card Principal
      ctx.fillStyle = '#100e1a';
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 11px monospace';
      ctx.fillText('🎸 NÍVEL 8 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px ' + (typeof TEXT_FONT_STACK !== 'undefined' ? TEXT_FONT_STACK : 'sans-serif');
      ctx.fillText('CHEGASTE à FRONTLINE!', W / 2, boxY + 54);

      // Sub-card
      const cardW = boxW - 32;
      const cardH = 90;
      const cardX = boxX + 16;
      const cardY = boxY + 72;

      ctx.fillStyle = '#181528';
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.fill();
      ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 1.5;
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.stroke();

      ctx.restore();
      ctx.save();
      ctx.font = typeof emojiFont === 'function' ? emojiFont(26) : '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎟️ 🎸 🤘', W / 2, cardY + 34);

      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('FESTIVAL PASS: HUSBAND MATERIAL', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f'; ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ ENCONTRASTE A KIU NA PRIMEIRA FILA', W / 2, cardY + 78);

      if (this.stateTimer > 0.6) {
        const btnPulse = Math.sin(this.timer * 6) * 0.2 + 0.8;
        ctx.globalAlpha = btnPulse;
        const btnW = 180, btnH = 28, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 40;
        ctx.fillStyle = '#facc15';
        roundRectLocal(ctx, btnX, btnY, btnW, btnH, 5); ctx.fill();
        ctx.fillStyle = '#100e1a'; ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 18);
      }

      ctx.restore();
    }

    ctx.restore();
  };

  if (typeof Game !== 'undefined' && Game.addLevel) {
    Game.addLevel(8, L);
  }
})();