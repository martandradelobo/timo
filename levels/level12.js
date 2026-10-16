/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 12: A FESTA DE ANIVERSÁRIO NA MESA DE JANTAR
 * ==========================================================================*/
(function() {
  const L = { id: 12 };
  const TEXT_FONT_STACK = 'sans-serif, "Segoe UI", Roboto, Arial';

  function roundRect(ctx, x, y, width, height, radius) {
    if (!ctx || width <= 0 || height <= 0) return;
    radius = Math.min(radius || 0, width / 2, height / 2);
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

  function emojiFont(px) {
    return px + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  }

  L.enter = function(game) {
    this.gameRef = game || window.Game;
    this.resetLevel(this.gameRef);

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🎂 LEVEL 12 — TIMO\'S B-DAY', 3.5);
    }

    setTimeout(() => {
      // Se entretanto saíste deste nível (ex: ESC -> selecionaste outro), não mostres este diálogo
      const g = (typeof Game !== 'undefined') ? Game : window.Game;
      if (g && g.current !== L) return;
      if (typeof Dialogue !== 'undefined' && Dialogue.say) {
        Dialogue.say('📜 QUEST', 'Toda a família e amigos estão reunidos! Usa as SETAS para apontar e [ESPAÇO] para rebentar os Balões 🎈!');
      }
    }, 150);
  };

  L.exit = function() {};

  L.resetLevel = function(game) {
    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    this.state = 'intro_dialog'; // 'intro_dialog' | 'balloons' | 'cake_blow' | 'complete'
    this.timer = 0;
    this.stateTimer = 0;
    this.score = 0;

    // Mira e Teclado
    this.crosshair = { x: W / 2, y: H / 2 - 30, speed: 320 };
    this.keys = { left: false, right: false, up: false, down: false, spaceHold: false };

    // FASE 1: Balões 🎈
    this.timeLeft = 25.0;
    this.targetPopped = 31;
    this.poppedCount = 0;
    this.balloons = [];
    this.spawnTimer = 0;

    // FASE 2: Velas Individuais com Desafio de Precisão, Vento e Manutenção
    const cakeX = W / 2;
    const cakeY = H - 120;
    const candleCount = 7;
    this.candles = [];
    for (let i = 0; i < candleCount; i++) {
      const t = (i - (candleCount - 1) / 2) / ((candleCount - 1) / 2); // -1..1
      this.candles.push({
        id: i + 1,
        baseX: cakeX + t * 32,
        baseY: cakeY - 44 - Math.pow(t, 2) * 6,
        blown: false,
        holdTimer: 0,
        wanderAmp: 4 + Math.random() * 4,
        wanderSpeed: 3 + Math.random() * 3,
        wanderPhase: Math.random() * Math.PI * 2
      });
    }
    this.cakeTimer = 16.0;
    this.cakeTimerTotal = 16.0;
    this.gustTimer = 3.5 + Math.random() * 1.5;
    this.gustMsg = '';
    this.gustMsgTimer = 0;

    // Letras das Bandeirolas no topo
    this.buntingLetters = ['P', 'A', 'R', 'A', 'B', 'É', 'N', 'S'];

    // Efeitos e Partículas de Fundo
    this.particles = [];
    this.bgConfetti = [];
    for (let i = 0; i < 25; i++) {
      this.bgConfetti.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 15 + Math.random() * 25,
        color: ['#facc15', '#f43f5e', '#38bdf8', '#4ade80', '#a855f7'][Math.floor(Math.random() * 5)],
        size: 2 + Math.random() * 3
      });
    }

    // Luzinhas de fada nas paredes laterais
    this.fairyLights = [];
    for (let i = 0; i < 9; i++) {
      this.fairyLights.push({ x: 14 + (i % 3) * 16, y: 50 + Math.floor(i / 3) * 46, side: 'left', phase: Math.random() * 10 });
      this.fairyLights.push({ x: W - 14 - (i % 3) * 16, y: 50 + Math.floor(i / 3) * 46, side: 'right', phase: Math.random() * 10 });
    }

    // Confetti/flash de conclusão (gerado só quando o nível termina)
    this.confetti = [];
    this.completeFlash = 0;

    this.guestsTop = [
      { name: 'Mum', emoji: '👩🏽', outfit: '#ec4899', hat: '#facc15' },
      { name: 'Papá', emoji: '🧓🏼', outfit: '#3b82f6', hat: '#ef4444' },
      { name: 'Bernardo', emoji: '🧑🏻', outfit: '#10b981', hat: '#a855f7' },
      { name: 'Maki', emoji: '🐶', outfit: '#f59e0b', hat: '#06b6d4' },
      { name: 'Bebé Totti', emoji: '👶🏼', outfit: '#38bdf8', hat: '#f43f5e', isBaby: true },
      { name: 'Sofia', emoji: '👩🏻', outfit: '#8b5cf6', hat: '#10b981' },
      { name: 'Mia', emoji: '👩🏼', outfit: '#ec4899', hat: '#facc15' }
    ];

    this.guestsBottom = [
      { name: 'Dani', emoji: '👩🏾', outfit: '#a855f7', hat: '#f43f5e' },
      { name: 'Pinho', emoji: '👱🏻‍♂️', outfit: '#06b6d4', hat: '#ec4899' },
      { name: 'Félix', emoji: '🧑🏽', outfit: '#84cc16', hat: '#3b82f6' },
      { name: 'Timo', emoji: '🧑🏽', outfit: '#f43f5e', hat: '#👑', isHero: true, isTomás: true },
      { name: 'Kiu', emoji: '👱🏼‍♀️', outfit: '#ec4899', hat: '#f59e0b', isHero: true },
      { name: 'Freitas', emoji: '👨🏽', outfit: '#10b981', hat: '#f43f5e' },
      { name: 'Hugo', emoji: '🧑🏻', outfit: '#6366f1', hat: '#facc15' },
      { name: 'Digga', emoji: '🧑🏽‍🦱', outfit: '#f59e0b', hat: '#10b981' }
    ];

    // Gerar Balões 🎈
    for (let i = 0; i < 10; i++) {
      this.spawnBalloon(W, H, true);
    }

    // Registo de Teclas
    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);

    this.boundKeyDown = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k.toLowerCase() === 'a') this.keys.left = true;
      if (k === 'ArrowRight' || k.toLowerCase() === 'd') this.keys.right = true;
      if (k === 'ArrowUp' || k.toLowerCase() === 'w') this.keys.up = true;
      if (k === 'ArrowDown' || k.toLowerCase() === 's') this.keys.down = true;

      if (k === ' ' || k.toLowerCase() === 'space' || k === 'Enter') {
        e.preventDefault();
        this.keys.spaceHold = true;
        this.triggerShoot(game);
      }
    };

    this.boundKeyUp = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k.toLowerCase() === 'a') this.keys.left = false;
      if (k === 'ArrowRight' || k.toLowerCase() === 'd') this.keys.right = false;
      if (k === 'ArrowUp' || k.toLowerCase() === 'w') this.keys.up = false;
      if (k === 'ArrowDown' || k.toLowerCase() === 's') this.keys.down = false;

      if (k === ' ' || k.toLowerCase() === 'space' || k === 'Enter') {
        this.keys.spaceHold = false;
      }
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // Suporte para Rato
    if (this.boundClick) window.removeEventListener('pointerdown', this.boundClick);
    if (this.boundUp) window.removeEventListener('pointerup', this.boundUp);

    this.boundClick = (e) => {
      const canvas = game.canvas || document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      this.crosshair.x = (e.clientX - rect.left) * (W / rect.width);
      this.crosshair.y = (e.clientY - rect.top) * (H / rect.height);
      this.keys.spaceHold = true;
      this.triggerShoot(game);
    };

    this.boundUp = () => {
      this.keys.spaceHold = false;
    };

    window.addEventListener('pointerdown', this.boundClick);
    window.addEventListener('pointerup', this.boundUp);
  };

  L.spawnBalloon = function(W, H, initial = false) {
    const isSpecial = Math.random() < 0.22;
    this.balloons.push({
      x: 50 + Math.random() * (W - 100),
      y: initial ? 60 + Math.random() * (H - 240) : H + 25,
      size: isSpecial ? 26 : 22,
      speed: 35 + Math.random() * 35,
      isSpecial: isSpecial,
      popped: false,
      swaySeed: Math.random() * 10
    });
  };

  L.addPopParticles = function(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 3, alpha: 1, life: 0.45
      });
    }
  };

  L.spawnCompletionFX = function(W, H) {
    this.completeFlash = 1.0;
    const palette = ['#facc15', '#38bdf8', '#ff6b8b', '#7fd97f', '#ffffff', '#a855f7'];
    for (let i = 0; i < 60; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 90 + Math.random() * 240;
      this.confetti.push({
        x: W / 2, y: H - 140,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 180,
        rot: Math.random() * Math.PI, rotV: (Math.random() - 0.5) * 10,
        size: 4 + Math.random() * 5,
        color: palette[i % palette.length],
        life: 1.3 + Math.random() * 0.9
      });
    }
  };

  L.triggerShoot = function(game) {
    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    if (this.state === 'intro_dialog') {
      this.state = 'balloons';
      this.stateTimer = 0;
      return;
    }

    if (this.state === 'balloons') {
      this.balloons.forEach(b => {
        if (!b.popped) {
          const dist = Math.hypot(b.x - this.crosshair.x, b.y - this.crosshair.y);
          if (dist < b.size + 14) {
            b.popped = true;
            this.poppedCount += b.isSpecial ? 2 : 1;
            this.score += b.isSpecial ? 250 : 100;
            this.addPopParticles(b.x, b.y, b.isSpecial ? '#facc15' : '#f43f5e', 14);
          }
        }
      });

      if (this.poppedCount >= this.targetPopped) {
        this.state = 'cake_blow';
        this.stateTimer = 0;
        this.cakeTimer = this.cakeTimerTotal;
        this.gustTimer = 3.5 + Math.random() * 1.5;
        this.crosshair.x = W / 2;
        this.crosshair.y = H - 140;
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('🎂 SOPRO DE PRECISÃO', 'Mantém a mira em cima de cada chama e SEGURA O [ESPAÇO] durante 0.7s para a apagar! Cuidado — o vento pode reacender alguma que já tenhas apagado!');
        }
      }
    } else if (this.state === 'complete' && this.stateTimer > 0.6) {
      try {
        localStorage.removeItem('tomas-quest');
      } catch(e) {}

      const g = this.gameRef || (typeof Game !== 'undefined' ? Game : window.Game);
      if (g) {
        g.current = null;
        g.state = { level: 1, flags: {} };
      }

      const titleEl = document.getElementById('title');
      const hintEl = document.getElementById('hint');
      const mainMenu = document.getElementById('main-menu');
      const levelSelectMenu = document.getElementById('level-select-menu');
      const creditsMenu = document.getElementById('credits-menu');

      if (titleEl) titleEl.style.display = 'flex';
      if (hintEl) hintEl.style.display = 'block';
      if (mainMenu) mainMenu.style.display = 'flex';
      if (levelSelectMenu) levelSelectMenu.style.display = 'none';
      if (creditsMenu) creditsMenu.style.display = 'none';

      if (typeof checkSave === 'function') {
        checkSave();
      }
    }
  };

  L.update = function(dt, game) {
    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    this.timer += dt;
    this.stateTimer += dt;

    this.bgConfetti.forEach(c => {
      c.y += c.speed * dt;
      if (c.y > H) { c.y = -10; c.x = Math.random() * W; }
    });

    if (this.keys.left) this.crosshair.x -= this.crosshair.speed * dt;
    if (this.keys.right) this.crosshair.x += this.crosshair.speed * dt;
    if (this.keys.up) this.crosshair.y -= this.crosshair.speed * dt;
    if (this.keys.down) this.crosshair.y += this.crosshair.speed * dt;

    this.crosshair.x = Math.max(15, Math.min(W - 15, this.crosshair.x));
    this.crosshair.y = Math.max(15, Math.min(H - 40, this.crosshair.y));

    if (this.state === 'balloons') {
      // Filtrar balões que já saíram do ecrã por cima
      this.balloons = this.balloons.filter(b => b.y > -40);

      // Se por algum motivo houver menos de 6 balões ativos, gera novos imediatamente
      if (this.balloons.length < 6) {
        for (let i = 0; i < (6 - this.balloons.length); i++) {
          this.spawnBalloon(W, H, false);
        }
      }

      // O tempo só decorre se ainda houver balões ativos no ecrã para rebentar
      if (this.balloons.length > 0) {
        this.timeLeft -= dt;
      }

      // Se o tempo esgotar, dá reset limpo ao contador e repõe balões frescos
      if (this.timeLeft <= 0) {
        this.timeLeft = 25.0;
        this.poppedCount = 0;
        this.balloons = [];
        for (let i = 0; i < 10; i++) {
          this.spawnBalloon(W, H, true);
        }
        if (typeof Toast !== 'undefined' && Toast.show) {
          Toast.show('⏳ O tempo esgotou-se! Nova tentativa!', 2.0);
        }
      }

      this.balloons.forEach(b => {
        if (!b.popped) {
          b.y -= b.speed * dt;
          b.x += Math.sin(this.timer * 2 + b.swaySeed) * 0.8;
        }
      });

      this.spawnTimer += dt;
      if (this.spawnTimer > 0.6) {
        this.spawnTimer = 0;
        if (this.balloons.filter(b => !b.popped).length < 12) {
          this.spawnBalloon(W, H, false);
        }
      }
    }

    if (this.state === 'cake_blow') {
      this.cakeTimer -= dt;
      if (this.gustMsgTimer > 0) this.gustMsgTimer -= dt;

      this.candles.forEach((c, idx) => {
        if (!c.blown) {
          const flameX = c.baseX + Math.sin(this.timer * c.wanderSpeed + c.wanderPhase) * c.wanderAmp;
          const flameY = c.baseY + Math.cos(this.timer * (c.wanderSpeed * 1.3) + c.wanderPhase) * (c.wanderAmp * 0.55);

          const dist = Math.hypot(flameX - this.crosshair.x, flameY - this.crosshair.y);

          if (dist < 17 && this.keys.spaceHold) {
            c.holdTimer += dt;
            this.addPopParticles(flameX, flameY, '#38bdf8', 1);

            if (c.holdTimer >= 0.7) {
              c.blown = true;
              this.addPopParticles(flameX, flameY, '#e2e8f0', 20);
              this.addPopParticles(flameX, flameY, '#38bdf8', 12);
            }
          } else {
            c.holdTimer = Math.max(0, c.holdTimer - dt * 2);
          }
        }
      });

      // Rajada de vento ocasional: reacende uma vela já apagada (exceto perto do fim)
      const blownCandles = this.candles.filter(c => c.blown);
      const unblownCandles = this.candles.filter(c => !c.blown);
      this.gustTimer -= dt;
      if (this.gustTimer <= 0 && blownCandles.length > 0 && unblownCandles.length > 0 && this.cakeTimer > 2.5) {
        const victim = blownCandles[Math.floor(Math.random() * blownCandles.length)];
        victim.blown = false;
        victim.holdTimer = 0;
        this.addPopParticles(victim.baseX, victim.baseY, '#facc15', 10);
        this.gustMsg = '💨 Uma corrente de ar reacendeu uma vela!';
        this.gustMsgTimer = 2.0;
        if (typeof Toast !== 'undefined' && Toast.show) Toast.show(this.gustMsg, 1.8);
        this.gustTimer = 3.5 + Math.random() * 2.0;
      }

      if (this.candles.every(c => c.blown)) {
        this.addPopParticles(W / 2, H - 120, '#facc15', 30);
        this.addPopParticles(W / 2, H - 120, '#4ade80', 30);
        this.state = 'complete';
        this.stateTimer = 0;
        this.spawnCompletionFX(W, H);
      }

      if (this.cakeTimer <= 0) {
        this.cakeTimer = this.cakeTimerTotal;
        this.gustTimer = 3.5 + Math.random() * 1.5;
        this.candles.forEach(c => { c.blown = false; c.holdTimer = 0; });
        if (typeof Toast !== 'undefined' && Toast.show) {
          Toast.show('🕯️ AS VELAS REACENDERAM! TENTA DE NOVO!', 2.0);
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const cf = this.confetti[i];
      cf.vy += 420 * dt;
      cf.x += cf.vx * dt; cf.y += cf.vy * dt; cf.rot += cf.rotV * dt;
      cf.life -= dt;
      if (cf.life <= 0) this.confetti.splice(i, 1);
    }
    if (this.completeFlash > 0) this.completeFlash = Math.max(0, this.completeFlash - dt * 2.2);
  };

  L.draw = function(ctx, game) {
    if (!ctx) return;
    const W = ctx.canvas ? ctx.canvas.width : 640;
    const H = ctx.canvas ? ctx.canvas.height : 480;

    ctx.save();

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0b1120');
    bgGrad.addColorStop(0.6, '#161029');
    bgGrad.addColorStop(1, '#2a1220');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    let ceilingGlow = ctx.createRadialGradient(W / 2, 30, 10, W / 2, 30, 260);
    ceilingGlow.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    ceilingGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ceilingGlow;
    ctx.fillRect(0, 0, W, H);

    // Luzinhas de fada a tremeluzir nas paredes laterais
    this.fairyLights.forEach(fl => {
      const tw = 0.55 + Math.sin(this.timer * 3 + fl.phase) * 0.35;
      const lg = ctx.createRadialGradient(fl.x, fl.y, 1, fl.x, fl.y, 14);
      lg.addColorStop(0, `rgba(255, 214, 140, ${0.5 + tw * 0.4})`);
      lg.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(fl.x, fl.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 236, 190, ${0.7 + tw * 0.3})`;
      ctx.beginPath(); ctx.arc(fl.x, fl.y, 2, 0, Math.PI * 2); ctx.fill();
    });

    this.bgConfetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size);
    });

    const tableX = 30;
    const tableY = H - 150;
    const tableW = W - 60;
    const tableH = 70;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    roundRect(ctx, tableX - 6, tableY + 12, tableW + 12, tableH, 14); ctx.fill();

    ctx.fillStyle = '#78350f';
    roundRect(ctx, tableX, tableY, tableW, tableH, 10); ctx.fill();
    // Veios de madeira
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    for (let wy = tableY + 8; wy < tableY + tableH; wy += 7) {
      ctx.beginPath(); ctx.moveTo(tableX + 4, wy); ctx.lineTo(tableX + tableW - 4, wy); ctx.stroke();
    }
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3;
    roundRect(ctx, tableX, tableY, tableW, tableH, 10); ctx.stroke();

    ctx.fillStyle = '#9f1239';
    ctx.fillRect(tableX + 35, tableY, tableW - 70, tableH);
    // Padrão em losango subtil na toalha
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.18)'; ctx.lineWidth = 1;
    for (let dx = tableX + 35; dx < tableX + tableW - 35; dx += 18) {
      ctx.beginPath();
      ctx.moveTo(dx, tableY); ctx.lineTo(dx + 9, tableY + tableH / 2);
      ctx.lineTo(dx, tableY + tableH); ctx.stroke();
    }
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
    ctx.strokeRect(tableX + 35, tableY, tableW - 70, tableH);

    [tableX + 48, tableX + tableW - 58].forEach(px => {
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(px, tableY + 15, 8, 12);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(px + 18, tableY + 22, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    });

    const topSpacing = (tableW - 20) / this.guestsTop.length;
    this.guestsTop.forEach((g, idx) => {
      let gx = tableX + 15 + idx * topSpacing + topSpacing / 2;
      let gy = tableY - 18;
      let bob = Math.sin(this.timer * 4 + idx) * 2.5;
      this.drawPerson(ctx, g, gx, gy + bob, false);
    });

    this.drawCakeOnTable(ctx, W / 2, tableY + 22);

    const bottomSpacing = (tableW - 20) / this.guestsBottom.length;
    this.guestsBottom.forEach((g, idx) => {
      let gx = tableX + 12 + idx * bottomSpacing + bottomSpacing / 2;
      let gy = tableY + tableH + 15;
      let bob = Math.sin(this.timer * 4 + idx + 3) * 2.5;
      this.drawPerson(ctx, g, gx, gy + bob, g.isTomás);
    });

    if (this.state === 'balloons') {
      this.balloons.forEach(b => {
        if (!b.popped && b.y > -30) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = emojiFont(b.size * 1.5);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🎈', b.x, b.y);

          if (b.isSpecial) {
            ctx.font = '10px sans-serif'; ctx.fillStyle = '#facc15';
            ctx.fillText('✨', b.x + 10, b.y - 12);
          }
          ctx.restore();
        }
      });

      this.drawCrosshair(ctx);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      roundRect(ctx, 10, 6, W - 20, 28, 6); ctx.fill();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
      roundRect(ctx, 10, 6, W - 20, 28, 6); ctx.stroke();

      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`TEMPO: ${this.timeLeft.toFixed(1)}s | REBENTADOS: ${this.poppedCount}/${this.targetPopped} 🎈`, 18, 23);
      ctx.textAlign = 'right';
      ctx.fillText(`MIRA: [SETAS / RATO] + [ESPAÇO]`, W - 18, 23);
    }

    if (this.state === 'cake_blow') {
      this.drawCrosshair(ctx);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      roundRect(ctx, W / 2 - 170, 6, 340, 28, 6); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
      roundRect(ctx, W / 2 - 170, 6, 340, 28, 6); ctx.stroke();

      const remaining = this.candles.filter(c => !c.blown).length;
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`🎯 APONTA E SEGURA [ ESPAÇO ]! (${remaining} RESTANTES - ${this.cakeTimer.toFixed(1)}s)`, W / 2, 23);
    }

    const buntingY = 40;
    const flagWidth = 28;
    const flagHeight = 22;
    const buntingColors = ['#f43f5e', '#facc15', '#38bdf8', '#4ade80', '#a855f7', '#ec4899', '#f97316', '#10b981'];

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, buntingY);
    ctx.quadraticCurveTo(W / 2, buntingY + 8, W - 20, buntingY);
    ctx.stroke();

    const startX = (W - (this.buntingLetters.length * flagWidth)) / 2;
    this.buntingLetters.forEach((letra, idx) => {
      let fx = startX + idx * flagWidth;
      let fy = buntingY + Math.sin((idx / 7) * Math.PI) * 4;

      ctx.fillStyle = buntingColors[idx % buntingColors.length];
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + flagWidth, fy);
      ctx.lineTo(fx + flagWidth / 2, fy + flagHeight);
      ctx.closePath();
      ctx.fill();

      // Sombra subtil na metade inferior para dar volume
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.moveTo(fx + 4, fy + flagHeight * 0.45);
      ctx.lineTo(fx + flagWidth - 4, fy + flagHeight * 0.45);
      ctx.lineTo(fx + flagWidth / 2, fy + flagHeight);
      ctx.closePath();
      ctx.fill();

      //ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(letra, fx + flagWidth / 2, fy + 10);
    });

    this.particles.forEach(p => {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });

    if (this.completeFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.completeFlash * 0.75})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.state === 'complete') {
      const progress = Math.min(1, this.stateTimer * 1.5);

      ctx.fillStyle = `rgba(16, 14, 26, ${0.9 * progress})`;
      ctx.fillRect(0, 0, W, H);

      // Confetti a cair sobre o fundo escurecido
      for (const cf of this.confetti) {
        const a = Math.max(0, Math.min(1, cf.life)) * progress;
        if (a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(cf.x, cf.y);
        ctx.rotate(cf.rot);
        ctx.fillStyle = cf.color;
        ctx.fillRect(-cf.size / 2, -cf.size / 2, cf.size, cf.size * 1.6);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = progress;

      const boxW = Math.min(W - 32, 340);
      const boxH = 290;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      ctx.fillStyle = '#100e1a';
      roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.fill();

      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3;
      roundRect(ctx, boxX, boxY, boxW, boxH, 10); ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 226, 122, 0.3)'; ctx.lineWidth = 1;
      roundRect(ctx, boxX + 4, boxY + 4, boxW - 8, boxH - 8, 7); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace';
      ctx.fillText('🏆 NÍVEL 12 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('FESTA DE ANIVERSÁRIO!', W / 2, boxY + 54);

      const cardW = boxW - 32, cardH = 92;
      const cardX = boxX + 16, cardY = boxY + 72;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, cardX, cardY, cardW, cardH, 8); ctx.fill();

      ctx.strokeStyle = 'rgba(255, 107, 139, 0.4)'; ctx.lineWidth = 1;
      roundRect(ctx, cardX, cardY, cardW, cardH, 8); ctx.stroke();

      ctx.save();
      ctx.globalAlpha = progress;
      ctx.fillStyle = '#ffffff'; ctx.font = emojiFont(28);
      ctx.fillText('🎂', W / 2, cardY + 34);
      ctx.restore();

      ctx.fillStyle = '#ff6b8b'; ctx.font = 'bold 16px ' + TEXT_FONT_STACK;
      ctx.fillText('PARABÉNS, TIMO!', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f'; ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ "TIMO: THE QUEST" COMPLETO', W / 2, cardY + 76);

      if (this.stateTimer > 0.6) {
        ctx.fillStyle = '#d1d5db'; ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('Não jogas lá muito bem...', W / 2, boxY + 195);

        ctx.fillStyle = '#ffe27a'; ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Mas o que interessa é participar!', W / 2, boxY + 213);
      }

      if (this.stateTimer > 1.2) {
        const pulse = Math.sin(this.stateTimer * 6) * 0.2 + 0.8;
        ctx.save();
        ctx.globalAlpha = pulse * progress;

        const btnW = 180, btnH = 28;
        const btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 40;

        ctx.fillStyle = '#ffe27a';
        roundRect(ctx, btnX, btnY, btnW, btnH, 5); ctx.fill();

        ctx.fillStyle = '#100e1a'; ctx.font = 'bold 11px monospace';
        ctx.fillText('FIM [ ESPAÇO ]', W / 2, btnY + 18);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.textAlign = 'left';
    ctx.restore();
  };

  L.drawCrosshair = function(ctx) {
    const cx = this.crosshair.x, cy = this.crosshair.y;

    let targetingCandle = null;
    if (this.state === 'cake_blow') {
      targetingCandle = this.candles.find(c => {
        if (c.blown) return false;
        const flameX = c.baseX + Math.sin(this.timer * c.wanderSpeed + c.wanderPhase) * c.wanderAmp;
        const flameY = c.baseY + Math.cos(this.timer * (c.wanderSpeed * 1.3) + c.wanderPhase) * (c.wanderAmp * 0.55);
        return Math.hypot(flameX - cx, flameY - cy) < 17;
      });
    }

    ctx.strokeStyle = targetingCandle ? '#4ade80' : '#facc15';
    ctx.lineWidth = targetingCandle ? 3 : 2;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke();

    if (targetingCandle && targetingCandle.holdTimer > 0) {
      const pct = targetingCandle.holdTimer / 0.7;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct));
      ctx.stroke();
    }

    ctx.fillStyle = targetingCandle ? '#4ade80' : '#ef4444';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = targetingCandle ? '#4ade80' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy); ctx.lineTo(cx - 7, cy);
    ctx.moveTo(cx + 7, cy);  ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx, cy + 7);  ctx.lineTo(cx, cy + 18);
    ctx.stroke();

    if (targetingCandle) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SEGURA [ ESPAÇO ]!', cx, cy - 22);
    }
  };

  L.drawPerson = function(ctx, g, x, y, isTomas) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = g.outfit;
    roundRect(ctx, -9, 0, 18, 12, 3);
    ctx.fill();

    let faceEmoji = g.emoji;
    if (isTomas && L.state === 'cake_blow') faceEmoji = '😮‍💨';

    ctx.fillStyle = '#ffffff';
    ctx.font = emojiFont(isTomas ? 22 : (g.isBaby ? 16 : 19));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(faceEmoji, 0, -10);

    if (isTomas) {
      ctx.font = emojiFont(14);
      ctx.fillText('👑', 0, -25);
    } else if (g.hat) {
      ctx.fillStyle = g.hat;
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(0, -29);
      ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, -30, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = isTomas ? '#facc15' : '#cbd5e1';
    ctx.font = isTomas ? 'bold 10px sans-serif' : '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(g.name, 0, 24);

    ctx.restore();
  };

  L.drawCakeOnTable = function(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Prato
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 13, 54, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.ellipse(0, 10, 52, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Camada inferior (rosa) com goteira de cobertura
    ctx.fillStyle = '#e11d48';
    roundRect(ctx, -50, -10, 100, 20, 5); ctx.fill();
    ctx.fillStyle = '#fb7185';
    roundRect(ctx, -50, -10, 100, 7, 5); ctx.fill();
    ctx.fillStyle = '#fda4af';
    for (let i = -46; i <= 46; i += 11) {
      ctx.beginPath(); ctx.arc(i, -3, 6, 0, Math.PI); ctx.fill();
    }

    // Camada superior (amarela)
    ctx.fillStyle = '#eab308';
    roundRect(ctx, -38, -34, 76, 26, 6); ctx.fill();
    ctx.fillStyle = '#fef08a';
    roundRect(ctx, -38, -34, 76, 9, 6); ctx.fill();
    ctx.fillStyle = '#fde68a';
    for (let i = -34; i <= 34; i += 10) {
      ctx.beginPath(); ctx.arc(i, -27, 4.5, 0, Math.PI); ctx.fill();
    }

    // Granulado colorido
    const sprinkleColors = ['#f43f5e', '#38bdf8', '#4ade80', '#a855f7', '#facc15'];
    for (let i = 0; i < 16; i++) {
      const sx = -46 + (i * 37) % 92;
      const sy = (i % 2 === 0) ? -4 + (i % 3) : -28 + (i % 3);
      ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
      ctx.fillRect(sx, sy, 2.5, 2.5);
    }

    this.candles.forEach((c, idx) => {
      let relX = c.baseX - x;
      let relY = c.baseY - y;

      ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#a855f7';
      ctx.fillRect(relX - 2, relY, 4, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(relX - 2, relY, 1.3, 15);

      if (!c.blown) {
        const flickX = Math.sin(this.timer * c.wanderSpeed + c.wanderPhase) * c.wanderAmp;
        const flickY = Math.cos(this.timer * (c.wanderSpeed * 1.3) + c.wanderPhase) * (c.wanderAmp * 0.55);

        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        ctx.beginPath(); ctx.arc(relX + flickX, relY - 4 + flickY, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(relX + flickX, relY - 5 + flickY, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(relX + flickX, relY - 4 + flickY, 1.8, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.beginPath(); ctx.arc(relX, relY - 4, 2, 0, Math.PI * 2); ctx.arc(relX + 1, relY - 9, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    });

    ctx.restore();
  };

  function tryRegister() {
    const g = (typeof Game !== 'undefined') ? Game : window.Game;
    if (g && typeof g.addLevel === 'function') {
      g.addLevel(12, L);
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', tryRegister);
    window.addEventListener('load', tryRegister);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryRegister() || attempts > 50) clearInterval(interval);
    }, 100);
  }
})();