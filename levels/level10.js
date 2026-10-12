/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 10: O MESTRE DA AGENDA (EDIÇÃO CORRIDA A PÉ)
 * Mecânica: Corrida pedonal em 3 faixas, gestão de tempo e desvio de imprevistos
 * ==========================================================================*/
(function() {
  const L = { id: 10 };

  // Helper seguro para retângulos arredondados com suporte nativo e fallback
  function roundRectLocal(ctx, x, y, width, height, radius) {
    if (!ctx || width <= 0 || height <= 0) return;
    radius = Math.min(radius || 0, width / 2, height / 2);
    if (radius < 0) radius = 0;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    ctx.closePath();
  }

  L.enter = function(game) {
    this.gameRef = game || window.Game;
    this.resetLevel(this.gameRef);
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🏃 LEVEL 10 - CORRIDA DA AGENDA', 3.2);
    }
  };

  
  L.exit = function() {
    this.removeListeners();
  };

  L.removeListeners = function() {
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
      this.boundKeyDown = null;
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp);
      this.boundKeyUp = null;
    }
    if (this.boundPointerDown) {
      window.removeEventListener('pointerdown', this.boundPointerDown);
      this.boundPointerDown = null;
    }
  };

  L.resetLevel = function(game) {
    this.removeListeners();

    this.state = 'intro_dialog'; // 'intro_dialog' | 'playing' | 'complete' | 'gameover'
    this.introStep = 1; // 1: Contexto | 2: Instruções
    this.timer = 0;
    this.stateTimer = 0;
    this.lives = 3;
    this.distanceToGoal = 120;
    this.checkpointsCollected = 0;
    this.targetCheckpoints = 3;
    this.gameOverReason = ''; // 'traffic' | 'missed_schedule'

    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    // Configuração das 3 Pistas de Corrida no Passeio/Corredor
    this.lanesY = [H * 0.52, H * 0.65, H * 0.78];

    // Tomás a Correr
    this.player = {
      lane: 1,
      x: W * 0.18,
      y: this.lanesY[1],
      targetY: this.lanesY[1],
      width: 32,
      height: 38,
      speedBoostTimer: 0
    };

    // Obstáculos e colecionáveis
    this.obstacles = [];
    this.items = [];

    this.spawnTimer = 0;
    this.feedbackMsg = 'Usa [SETAS CIMA/BAIXO] para mudar de pista!';
    this.feedbackTimer = 4.0;
    this.feedbackIsError = false;

    // Gestão de Teclas
    this.keys = {};
    this.boundKeyDown = (e) => {
      const k = e.key;
      const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (blockedKeys.includes(k)) {
        e.preventDefault();
      }
      this.keys[k] = true;
      if (!e.repeat) {
        this.handleKeyPress(k, game);
      }
    };

    this.boundKeyUp = (e) => { 
      this.keys[e.key] = false; 
    };

    // Suporte para clique/toque em ecrãs táteis
    this.boundPointerDown = (e) => {
      if (this.state === 'intro_dialog' || this.state === 'complete' || this.state === 'gameover') {
        this.handleKeyPress(' ', game);
        return;
      }
      if (this.state === 'playing') {
        const clickY = e.clientY;
        const screenH = window.innerHeight || 480;
        if (clickY < screenH / 2) {
          this.handleKeyPress('ArrowUp', game);
        } else {
          this.handleKeyPress('ArrowDown', game);
        }
      }
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('pointerdown', this.boundPointerDown);
  };

  L.handleKeyPress = function(key, game) {
    const isActionKey = (key === ' ' || key === 'Space' || key === 'Spacebar' || key === 'Enter');
    const g = game || this.gameRef || window.Game;

    // 1. Ecrã de Vitória
    if (this.state === 'complete') {
      if (this.stateTimer < 0.4) return;
      if (isActionKey) {
        this.removeListeners();
        if (typeof g !== 'undefined' && g.startLevel) {
          if (g.levels && g.levels[11]) g.startLevel(11);
          else g.startLevel(1);
        } else if (typeof Game !== 'undefined' && Game.startLevel) {
          if (Game.levels && Game.levels[11]) Game.startLevel(11);
          else Game.startLevel(1);
        }
        return;
      }
    }

    // 2. Ecrã de GameOver
    if (this.state === 'gameover') {
      if (this.stateTimer < 0.4) return;
      if (isActionKey) {
        this.resetLevel(g);
        return;
      }
    }

    // 3. Diálogo Inicial em 2 Cartões
    if (this.state === 'intro_dialog' && isActionKey) {
      if (this.stateTimer < 0.2) return;
      if (this.introStep === 1) {
        this.introStep = 2;
        this.stateTimer = 0;
      } else {
        this.state = 'playing';
        this.stateTimer = 0;
      }
      return;
    }

    // 4. Mudança de Pista durante a corrida
    if (this.state === 'playing') {
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        if (this.player.lane > 0) {
          this.player.lane--;
          this.player.targetY = this.lanesY[this.player.lane];
        }
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        if (this.player.lane < 2) {
          this.player.lane++;
          this.player.targetY = this.lanesY[this.player.lane];
        }
      }
    }
  };

  L.update = function(dt, game) {
    const g = game || this.gameRef || window.Game;
    const W = (g && g.W) ? g.W : 640;

    this.timer += dt;
    this.stateTimer += dt;

    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;
    if (this.state !== 'playing') return;

    // Movimento suave entre faixas
    this.player.y += (this.player.targetY - this.player.y) * dt * 14;

    // Velocidade de corrida
    let baseSpeed = 3.8;
    if (this.player.speedBoostTimer > 0) {
      this.player.speedBoostTimer -= dt;
      baseSpeed = 5.5;
    }

    // Sprint / Passo lento
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) baseSpeed += 1.2;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) baseSpeed -= 1.2;

    // Progresso até ao destino
    this.distanceToGoal -= dt * baseSpeed;
    if (this.distanceToGoal <= 0) {
      this.distanceToGoal = 0;
      if (this.checkpointsCollected >= this.targetCheckpoints) {
        this.state = 'complete';
        this.stateTimer = 0;
      } else {
        this.state = 'gameover';
        this.stateTimer = 0;
        this.gameOverReason = 'missed_schedule';
      }
    }

    // Gerador de Elementos (Imprevistos e Colecionáveis)
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.05) {
      this.spawnTimer = 0;
      const targetLane = Math.floor(Math.random() * 3);
      const laneY = this.lanesY[targetLane];

      const r = Math.random();
      if (r < 0.45) {
        // Imprevistos (Obstáculos): Notificações 📱, Conversas 🗣️, Obras 🚧, Multidão 🚶
        const obsTypes = ['notification', 'conversation', 'obras', 'traffic'];
        const type = obsTypes[Math.floor(Math.random() * obsTypes.length)];
        this.obstacles.push({
          type: type,
          lane: targetLane,
          x: W + 40,
          y: laneY,
          speed: 130 + Math.random() * 50
        });
      } else {
        // Colecionáveis: Agendas 📅, Calendários 📆, Post-its 📝 e Cafés ☕
        const itemTypes = ['agenda', 'calendar', 'postit', 'coffee'];
        const isCoffee = Math.random() < 0.25;
        const selectedType = isCoffee ? 'coffee' : itemTypes[Math.floor(Math.random() * 3)];
        
        this.items.push({
          type: selectedType,
          lane: targetLane,
          x: W + 30,
          y: laneY,
          collected: false,
          speed: 125
        });
      }
    }

    // Atualizar Imprevistos (Obstáculos)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= obs.speed * dt;

      if (Math.abs(this.player.x - obs.x) < 28 && Math.abs(this.player.y - obs.y) < 20) {
        this.obstacles.splice(i, 1);
        let msg = '📱 Distraído com notificações!';
        if (obs.type === 'conversation') msg = '🗣️ Preso numa conversa de corredor!';
        if (obs.type === 'obras') msg = '🚧 Cuidado com as Obras no passeio!';
        if (obs.type === 'traffic') msg = '🚶 Encurralado na multidão!';
        this.triggerPenalty(msg);
        continue;
      }

      if (obs.x < -50) this.obstacles.splice(i, 1);
    }

    // Atualizar Colecionáveis
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.x -= item.speed * dt;

      if (!item.collected) {
        if (Math.abs(this.player.x - item.x) < 28 && Math.abs(this.player.y - item.y) < 20) {
          item.collected = true;
          if (item.type === 'coffee') {
            this.player.speedBoostTimer = 3.0;
            this.feedbackMsg = '☕ Café Expresso! Sprint de Pontualidade!';
            this.feedbackIsError = false;
          } else {
            this.checkpointsCollected++;
            let name = 'Agenda';
            if (item.type === 'calendar') name = 'Calendário';
            if (item.type === 'postit') name = 'Post-it';
            this.feedbackMsg = `📝 ${name} Organizado! (${this.checkpointsCollected}/${this.targetCheckpoints})`;
            this.feedbackIsError = false;
          }
          this.feedbackTimer = 2.2;
        }
      }

      if (item.x < -30) this.items.splice(i, 1);
    }
  };

  L.triggerPenalty = function(msg) {
    this.lives--;
    this.feedbackMsg = `${msg} Restam ${Math.max(0, this.lives)} Vidas!`;
    this.feedbackTimer = 2.8;
    this.feedbackIsError = true;

    if (this.lives <= 0) {
      this.state = 'gameover';
      this.stateTimer = 0;
      this.gameOverReason = 'traffic';
    }
  };

  L.draw = function(ctx, game) {
    if (!ctx) return;
    const g = game || this.gameRef || window.Game;
    const W = (g && g.W) ? g.W : (ctx.canvas ? ctx.canvas.width : 640);
    const H = (g && g.H) ? g.H : (ctx.canvas ? ctx.canvas.height : 480);

    ctx.save();

    // 1. CENÁRIO & AMBIENTE (Corredor / Passeio)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Edifícios / Janelas do Corredor ao fundo
    ctx.fillStyle = '#1e293b';
    for (let bx = 0; bx < W; bx += 50) {
      const bH = 80 + (bx % 3) * 20;
      ctx.fillRect(bx, H * 0.44 - bH, 44, bH);
      ctx.fillStyle = '#38bdf8';
      if ((bx + Math.floor(this.timer * 3)) % 2 === 0) {
        ctx.fillRect(bx + 12, H * 0.44 - bH + 18, 10, 14);
        ctx.fillRect(bx + 26, H * 0.44 - bH + 40, 10, 14);
      }
      ctx.fillStyle = '#1e293b';
    }

    // Chão do Passeio / Corredor
    const floorTop = H * 0.44;
    const floorH = H * 0.44;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, floorTop, W, floorH);

    // Linhas dos Mosaicos / Linhas Guias das Faixas
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 20]);
    ctx.lineDashOffset = -this.timer * 160;

    ctx.beginPath();
    ctx.moveTo(0, H * 0.58); ctx.lineTo(W, H * 0.58);
    ctx.moveTo(0, H * 0.71); ctx.lineTo(W, H * 0.71);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bordas do Passeio
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, floorTop - 4, W, 6);
    ctx.fillRect(0, floorTop + floorH - 2, W, 6);

    // 2. IMPREVISTOS (OBSTÁCULOS)
    for (let obs of this.obstacles) {
      ctx.font = typeof emojiFont === 'function' ? emojiFont(24) : '24px sans-serif';
      ctx.textAlign = 'center';
      if (obs.type === 'notification') ctx.fillText('📱', obs.x, obs.y + 6);
      else if (obs.type === 'conversation') ctx.fillText('🗣️', obs.x, obs.y + 6);
      else if (obs.type === 'obras') ctx.fillText('🚧', obs.x, obs.y + 6);
      else ctx.fillText('🚶', obs.x, obs.y + 6);
    }

    // 3. COLECIONÁVEIS
    for (let item of this.items) {
      if (item.collected) continue;
      ctx.font = typeof emojiFont === 'function' ? emojiFont(24) : '24px sans-serif';
      ctx.textAlign = 'center';
      if (item.type === 'agenda') ctx.fillText('📅', item.x, item.y + 6);
      else if (item.type === 'calendar') ctx.fillText('📆', item.x, item.y + 6);
      else if (item.type === 'postit') ctx.fillText('📝', item.x, item.y + 6);
      else ctx.fillText('☕', item.x, item.y + 6);
    }

    // 4. TOMÁS A CORRER
const p = this.player;
    ctx.save();

    // Sombra debaixo dos pés
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 16, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Efeito de Velocidade Turbo (Café)
    if (p.speedBoostTimer > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.ellipse(p.x - 12, p.y, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Avatar do Tomás a correr (Redefinir cor opaca para o emoji não ficar transparente)
    ctx.fillStyle = '#ffffff';
    ctx.font = typeof emojiFont === 'function' ? emojiFont(28) : '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏃🏽‍➡️', p.x, p.y + 10);

    ctx.restore();

    // 5. HUD (Barra Superior)
    ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.stroke();

    ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(Math.max(0, this.lives || 0)), 30, 44);

    ctx.fillStyle = '#facc15'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`📝 AGENDA: ${this.checkpointsCollected}/${this.targetCheckpoints}`, 125, 44);

    // Relógio Digital
    const progressPct = Math.max(0, Math.min(1, 1 - (this.distanceToGoal / 120)));
    const totalMinutes = Math.floor(8 * 60 + progressPct * (12 * 60));
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');

    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`⏰ HORA: ${hours}:${mins}`, 275, 44);

    const barW = 120, barX = W - 140;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`REUNIÃO: ${Math.ceil(this.distanceToGoal)}m`, barX - 10, 44);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRectLocal(ctx, barX, 32, barW, 12, 4); ctx.fill();
    ctx.fillStyle = '#22c55e';
    if (progressPct > 0) {
      roundRectLocal(ctx, barX, 32, barW * progressPct, 12, 4); ctx.fill();
    }

    // Feedback
    if (this.feedbackTimer > 0) {
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(this.feedbackMsg).width || 200;
      const boxW = Math.min(W - 60, textWidth + 40);
      ctx.fillStyle = this.feedbackIsError ? 'rgba(153, 27, 27, 0.92)' : 'rgba(20, 83, 45, 0.92)';
      roundRectLocal(ctx, (W - boxW) / 2, H * 0.88, boxW, 28, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(this.feedbackMsg, W / 2, H * 0.88 + 18);
    }

    // Rodapé
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MUDAR PISTA: [SETAS CIMA / BAIXO]  |  SPRINT: [SETAS ESQ / DIR]', W / 2, H - 7);

    // 6. DIÁLOGOS E FINAL
    if (this.state === 'intro_dialog') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.65)';
      ctx.fillRect(0, 0, W, H);

      const boxH = 132, pad = 18;
      const x = 16, w = W - 32;
      const y = H - boxH - 16;

      ctx.fillStyle = 'rgba(10,12,26,0.92)';
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.stroke();

      if (this.introStep === 1) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(15, true) : 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('QUEST', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(12) : '12px monospace';
        
        const contentY = y + pad + 22;
        ctx.fillText('O Tomás precisa de chegar ao cinema a tempo!', x + pad, contentY);
        ctx.fillText('Atravessa a cidade a passo apressado, assegura-te que cumpres tudo o que está', x + pad, contentY + 18);
        ctx.fillText('na agenda.', x + pad, contentY + 36);
        ctx.fillText('Cuidado com conversas de xaxa e distrações no caminho...', x + pad, contentY + 54);


        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para continuar ➔', x + w - pad, y + boxH - 14);
      } else if (this.introStep === 2) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(15, true) : 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('🎮 INSTRUÇÕES', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(11) : '11px monospace';
        
        const contentY = y + pad + 20;
        ctx.fillText('1. Usa [SETAS CIMA / BAIXO] para mudar entre as 3 pistas 🏃', x + pad, contentY);
        ctx.fillText('2. Evita Notificações 📱, Conversas 🗣️, Obras 🚧 e Multidões 🚶', x + pad, contentY + 16);
        ctx.fillText('3. Apanha Agendas 📅, Calendários 📆, Post-its 📝 e bebe Cafés ☕!', x + pad, contentY + 32);

        ctx.fillStyle = '#38bdf8';
        ctx.font = typeof textFont === 'function' ? textFont(10, true) : 'bold 10px monospace';
        ctx.fillText('CONTROLO: [CIMA/BAIXO] Mudar Pista', x + pad, contentY + 52);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para arrancar!', x + w - pad, y + boxH - 14);
      }
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';

      if (this.gameOverReason === 'missed_schedule') {
        ctx.fillText('📅 FALHASTE A AGENDA!', W / 2, H / 2 - 30);
        ctx.fillStyle = '#f87171'; ctx.font = '14px monospace';
        ctx.fillText(`Organizaste apenas ${this.checkpointsCollected}/${this.targetCheckpoints} compromissos do dia!`, W / 2, H / 2);
      } else {
        ctx.fillText('💥 ATRASO INADMISSÍVEL!', W / 2, H / 2 - 30);
        ctx.fillStyle = '#f87171'; ctx.font = '14px monospace';
        ctx.fillText('Ficaste preso em demasiadas distrações pelo caminho!', W / 2, H / 2);
      }

      ctx.fillStyle = '#ffffff'; ctx.font = '13px monospace';
      ctx.fillText('Pressiona [ ESPAÇO ] para tentar novamente', W / 2, H / 2 + 45);
    }

    if (this.state === 'complete') {
      const progress = Math.min(1, this.stateTimer * 2.0);

      ctx.fillStyle = `rgba(16, 14, 26, ${0.92 * progress})`;
      ctx.fillRect(0, 0, W, H);

      const boxW = Math.min(W - 32, 340), boxH = 280;
      const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;

      ctx.save();
      ctx.globalAlpha = progress;

      ctx.fillStyle = '#100e1a';
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 11px monospace';
      ctx.fillText('🏃 NÍVEL 10 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PONTUALIDADE PERFEITA!', W / 2, boxY + 54);

      const cardW = boxW - 32, cardH = 90;
      const cardX = boxX + 16, cardY = boxY + 72;

      ctx.fillStyle = '#181528';
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.stroke();

      ctx.font = typeof emojiFont === 'function' ? emojiFont(26) : '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📅 📆 📝 ☕', W / 2, cardY + 34);

      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('MESTRE DO PLANEAMENTO', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f'; ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ TODOS OS COMPROMISSOS CUMPRIDOS', W / 2, cardY + 78);

      if (this.stateTimer > 0.6) {
        const btnPulse = Math.sin(this.timer * 6) * 0.2 + 0.8;
        ctx.globalAlpha = btnPulse;
        const btnW = 180, btnH = 28, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 40;
        ctx.fillStyle = '#38bdf8';
        roundRectLocal(ctx, btnX, btnY, btnW, btnH, 5); ctx.fill();
        ctx.fillStyle = '#100e1a'; ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 18);
      }

      ctx.restore();
    }

    ctx.restore();
  };

  // Registo Ultra-Robusto do Nível 10 no Game Engine
  function tryRegisterLevel10() {
    const g = (typeof Game !== 'undefined') ? Game : window.Game;
    if (g && typeof g.addLevel === 'function') {
      g.addLevel(10, L);
      return true;
    }
    return false;
  }

  if (!tryRegisterLevel10()) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', tryRegisterLevel10);
    }
    window.addEventListener('load', tryRegisterLevel10);
    
    // Polling de reserva em caso de carregamento assíncrono
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryRegisterLevel10() || attempts > 50) {
        clearInterval(interval);
      }
    }, 100);
  }
})();