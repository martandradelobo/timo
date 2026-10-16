/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 10: CORRIDA DA AGENDA
 * Agora em estilo plataformas (side-scroller, tipo Mario):
 * o cenário desloca-se com o jogador, há plataformas para saltar por cima,
 * saliências para passar por baixo, inimigos para pisar ou fugir, e
 * agendas para apanhar como se fossem moedas.
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

  const EF = (px) => (typeof emojiFont === 'function' ? emojiFont(px) : px + 'px sans-serif');
  const TF = (px, bold) => (typeof textFont === 'function' ? textFont(px, bold) : (bold ? 'bold ' : '') + px + 'px monospace');

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

  // ---------------------------------------------------------------- LEVEL DATA
  function buildLevelData(H) {
    const groundY = Math.round(H * 0.80);

    // Segmentos de chão sólido (há buracos/precipícios entre eles)
    const ground = [
      { x1: 0,    x2: 760  },
      { x1: 840,  x2: 1500 },
      { x1: 1600, x2: 2300 },
      { x1: 2420, x2: 3600 }
    ];

    // Plataformas flutuantes "one-way": pode-se saltar para cima delas
    // e também passar livremente por baixo (sem colisão lateral).
    const platforms = [
      { x1: 300,  x2: 460,  y: groundY - 112 },
      { x1: 950,  x2: 1150, y: groundY - 132 },
      { x1: 1750, x2: 1950, y: groundY - 104 },
      { x1: 2330, x2: 2392, y: groundY - 70  }, // "pedra de passagem" sobre o 3º buraco
      { x1: 2900, x2: 3100, y: groundY - 140 }
    ];

    // Obstáculos estáticos no chão — só se evitam saltando por cima
    const hazards = [
      { kind: 'spike', x: 1050, w: 26, baseY: groundY, emoji: '🚧' },
      { kind: 'spike', x: 1980, w: 26, baseY: groundY, emoji: '🚧' },
      { kind: 'spike', x: 2650, w: 26, baseY: groundY, emoji: '🚧' }
    ];

    // Saliências suspensas — NÃO se deve saltar para dentro delas,
    // passa-se por baixo a correr (altura de salto normal bate-lhes).
    const overhangs = [
      { x: 520,  w: 54, y: groundY - 150, emoji: '📱', bob: 0 },
      { x: 2560, w: 54, y: groundY - 150, emoji: '🗯️', bob: Math.PI }
    ];

    // Inimigos "pisáveis" (tipo Goomba) — saltar em cima derrota-os,
    // tocar de lado tira uma vida.
    const walkers = [
      { x: 1250, w: 26, minX: 1250, maxX: 1400, y: groundY, speed: 70, dir: 1, alive: true, kind: 'ground' },
      { x: 1780, w: 26, minX: 1750, maxX: 1930, y: groundY - 104, speed: 60, dir: 1, alive: true, kind: 'platform' }
    ];

    // Moedas-agenda espalhadas (chão, plataformas e arcos sobre buracos)
    const coinDefs = [];
    const coinTypes = ['agenda', 'calendar', 'postit'];
    let ti = 0;
    function addCoin(x, y) { coinDefs.push({ x, y, type: coinTypes[(ti++) % coinTypes.length], collected: false }); }

    addCoin(150, groundY - 40);
    [340, 380, 420].forEach(x => addCoin(x, groundY - 150));
    [770, 793, 816, 839].forEach((x, i) => addCoin(x, groundY - 40 - Math.sin(i / 3 * Math.PI) * 70));
    [1000, 1100].forEach(x => addCoin(x, groundY - 170));
    addCoin(1450, groundY - 40);
    [1520, 1550, 1580].forEach((x, i) => addCoin(x, groundY - 60 - Math.sin(i / 2 * Math.PI) * 90));
    [1800, 1900].forEach(x => addCoin(x, groundY - 140));
    addCoin(2361, groundY - 110);
    addCoin(2500, groundY - 40);
    [2950, 3050].forEach(x => addCoin(x, groundY - 180));

    // Cafés — power-up de velocidade/salto
    const coffees = [
      { x: 1050, y: groundY - 170, collected: false },
      { x: 2760, y: groundY - 40, collected: false }
    ];

    const levelWidth = 3600;
    const goalX = 3550;

    return { groundY, ground, platforms, hazards, overhangs, walkers, coinDefs, coffees, levelWidth, goalX };
  }

  L.resetLevel = function(game) {
    this.removeListeners();

    this.state = 'intro_dialog'; // 'intro_dialog' | 'playing' | 'complete' | 'gameover'
    this.introStep = 1; // 1: Contexto | 2: Instruções
    this.timer = 0;
    this.stateTimer = 0;
    this.lives = 3;
    this.score = 0;
    this.checkpointsCollected = 0;
    this.targetCheckpoints = 12;
    this.gameOverReason = ''; // 'traffic' | 'missed_schedule'

    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;
    this.W = W; this.H = H;

    const data = buildLevelData(H);
    this.groundY = data.groundY;
    this.ground = data.ground;
    this.platforms = data.platforms;
    this.hazards = data.hazards;
    this.overhangs = data.overhangs;
    this.walkers = data.walkers;
    this.coins = data.coinDefs;
    this.coffees = data.coffees;
    this.levelWidth = data.levelWidth;
    this.goalX = data.goalX;
    this.goalUnlocked = false;

    // Física
    this.GRAVITY = 1100;
    this.JUMP_V = -660;
    this.MOVE_SPEED = 220;

    this.timeLeft = 80; // segundos de "tempo até ao cinema"
    this.totalTime = 80;

    this.cameraX = 0;

    this.player = {
      x: 70, y: this.groundY, vx: 0, vy: 0,
      w: 28, h: 40,
      onGround: true,
      facing: 1,
      boostTimer: 0,
      invTimer: 0,
      lastSafeX: 70,
      animT: 0
    };

    // Perseguidor (multidão) — gerado periodicamente durante o jogo
    this.chaser = null;
    this.chaserCooldown = 6.0;

    // Nuvens e silhuetas de fundo (parallax), geradas uma vez
    this.clouds = [];
    for (let i = 0; i < 14; i++) {
      this.clouds.push({ x: Math.random() * (this.levelWidth + 600) - 300, y: 20 + Math.random() * (H * 0.22), s: 0.6 + Math.random() * 0.8 });
    }
    this.buildings = [];
    for (let bx = -100; bx < this.levelWidth + 200; bx += 90) {
      this.buildings.push({ x: bx, h: 70 + ((bx * 37) % 110), lit: (bx % 180) < 90 });
    }
    this.lampposts = [];
    for (let bx = 40; bx < this.levelWidth; bx += 260) {
      if (this.groundTopAt(bx) === null) continue; // não colocar lampiões sobre buracos
      this.lampposts.push({ x: bx, flicker: Math.random() * 10 });
    }

    // Pontuação, popups flutuantes e efeitos de chegada à meta
    this.popups = [];
    this.confetti = [];
    this.completeFlash = 0;

    this.spawnTimer = 0;
    this.feedbackMsg = 'Usa [SETAS ESQ/DIR] para andar e [ESPAÇO] para saltar!';
    this.feedbackTimer = 4.0;
    this.feedbackIsError = false;
    this.goalFeedbackCooldown = 0;

    // Gestão de Teclas
    this.keys = {};
    this.jumpQueued = false;
    this.boundKeyDown = (e) => {
      const k = e.key;
      const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (blockedKeys.includes(k)) {
        e.preventDefault();
      }
      this.keys[k] = true;
      if (this.state === 'playing' && !e.repeat && (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ' || k === 'Spacebar')) {
        this.jumpQueued = true;
      }
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
        this.jumpQueued = true;
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
  };

  // -------------------------------------------------------------- COLISÕES
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  L.groundTopAt = function(x) {
    for (const seg of this.ground) {
      if (x >= seg.x1 && x <= seg.x2) return seg.y !== undefined ? seg.y : this.groundY;
    }
    return null;
  };

  L.triggerPenalty = function(msg) {
    if (this.player.invTimer > 0) return;
    this.lives--;
    this.feedbackMsg = `${msg} Restam ${Math.max(0, this.lives)} Vidas!`;
    this.feedbackTimer = 2.4;
    this.feedbackIsError = true;
    this.player.invTimer = 1.4;
    this.player.vx *= -0.3;

    if (this.lives <= 0) {
      this.state = 'gameover';
      this.stateTimer = 0;
      this.gameOverReason = 'traffic';
    }
  };

  L.respawnAtSafeX = function() {
    const p = this.player;
    p.x = p.lastSafeX;
    p.y = this.groundTopAt(p.x) !== null ? this.groundTopAt(p.x) : this.groundY;
    p.vx = 0; p.vy = 0; p.onGround = true;
  };

  L.update = function(dt, game) {
    const g = game || this.gameRef || window.Game;
    const W = (g && g.W) ? g.W : this.W || 640;
    const H = (g && g.H) ? g.H : this.H || 480;

    this.timer += dt;
    this.stateTimer += dt;

    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;
    if (this.goalFeedbackCooldown > 0) this.goalFeedbackCooldown -= dt;

    // Popups de pontuação, confetti e flash animam mesmo fora do estado 'playing'
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pu = this.popups[i];
      pu.life -= dt; pu.y += pu.vy * dt; pu.vy += 90 * dt;
      if (pu.life <= 0) this.popups.splice(i, 1);
    }
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const cf = this.confetti[i];
      cf.vy += 420 * dt;
      cf.x += cf.vx * dt; cf.y += cf.vy * dt; cf.rot += cf.rotV * dt;
      cf.life -= dt;
      if (cf.life <= 0) this.confetti.splice(i, 1);
    }
    if (this.completeFlash > 0) this.completeFlash = Math.max(0, this.completeFlash - dt * 2.2);

    if (this.state !== 'playing') return;

    const p = this.player;
    if (p.invTimer > 0) p.invTimer -= dt;
    if (p.boostTimer > 0) p.boostTimer -= dt;
    p.animT += dt;

    // Cronómetro da "hora do cinema"
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'gameover';
      this.stateTimer = 0;
      this.gameOverReason = 'missed_schedule';
      return;
    }

    // --- Input horizontal ---
    const pressingLeft = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'];
    const pressingRight = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'];
    const speedMul = p.boostTimer > 0 ? 1.45 : 1;

    p.vx = 0;
    if (pressingLeft) { p.vx = -this.MOVE_SPEED * speedMul; p.facing = -1; }
    if (pressingRight) { p.vx = this.MOVE_SPEED * speedMul; p.facing = 1; }

    // --- Salto ---
    if (this.jumpQueued) {
      if (p.onGround) {
        p.vy = this.JUMP_V * (p.boostTimer > 0 ? 1.08 : 1);
        p.onGround = false;
      }
      this.jumpQueued = false;
    }

    // --- Física vertical ---
    p.vy += this.GRAVITY * dt;
    let newX = p.x + p.vx * dt;
    let newY = p.y + p.vy * dt;

    const maxX = this.goalUnlocked ? this.levelWidth - 20 : (this.goalX - p.w / 2);
    if (newX < 20) newX = 20;
    if (newX > maxX) newX = maxX;

    // Aterragem em plataformas flutuantes (one-way, só por cima)
    let landed = false;
    if (p.vy >= 0) {
      for (const pl of this.platforms) {
        if (newX >= pl.x1 && newX <= pl.x2) {
          if (p.y <= pl.y + 1 && newY >= pl.y) {
            newY = pl.y; p.vy = 0; landed = true;
            break;
          }
        }
      }
    }

    // Aterragem no chão sólido
    if (!landed) {
      const gY = this.groundTopAt(newX);
      if (gY !== null && newY >= gY) {
        newY = gY; p.vy = 0; landed = true;
      }
    }

    p.onGround = landed;
    p.x = newX; p.y = newY;
    if (landed) p.lastSafeX = p.x;

    // Caiu num precipício
    if (p.y > H + 60) {
      this.triggerPenaltyOrFall();
    }

    // --- Obstáculos estáticos (saltar por cima) ---
    for (const hz of this.hazards) {
      if (p.invTimer <= 0 && rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, hz.x - hz.w / 2, hz.baseY - 26, hz.w, 26)) {
        this.triggerPenalty(`🚧 Tropeçaste nas obras!`);
      }
    }

    // --- Saliências suspensas (passar por baixo) ---
    for (const oh of this.overhangs) {
      const oy = oh.y + Math.sin(this.timer * 2 + oh.bob) * 6;
      if (p.invTimer <= 0 && rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, oh.x - oh.w / 2, oy - 20, oh.w, 26)) {
        this.triggerPenalty(`${oh.emoji} Distraído, bateste de cabeça!`);
      }
    }

    // --- Inimigos pisáveis ---
    for (const w of this.walkers) {
      if (!w.alive) continue;
      w.x += w.speed * w.dir * dt;
      if (w.x < w.minX) { w.x = w.minX; w.dir = 1; }
      if (w.x > w.maxX) { w.x = w.maxX; w.dir = -1; }

      const wTop = w.y - 22;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, w.x - w.w / 2, wTop, w.w, 22)) {
        const playerBottom = p.y;
        if (p.vy > 20 && (playerBottom - (wTop)) < 18) {
          // Pisou de cima!
          w.alive = false;
          p.vy = this.JUMP_V * 0.55;
          this.score += 100;
          this.popups.push({ x: w.x, y: wTop, text: '+100', color: '#ffe27a', big: true, life: 1.0, vy: -55 });
          this.feedbackMsg = '🎤 Conversa Encerrada! (+100 pontos)';
          this.feedbackTimer = 1.8;
          this.feedbackIsError = false;
        } else if (p.invTimer <= 0) {
          this.triggerPenalty('🗣️ Preso numa conversa de corredor!');
        }
      }
    }

    // --- Perseguidor (multidão) ---
    if (this.chaser) {
      this.chaser.x += this.chaser.speed * dt;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, this.chaser.x - 16, this.chaser.y - 36, 32, 36)) {
        if (p.invTimer <= 0) this.triggerPenalty('🚶🏽‍♂️‍➡️ Apanhado pela multidão!');
        this.chaser = null;
        this.chaserCooldown = 7.5;
      } else if (this.chaser.x < this.cameraX - 120) {
        this.chaser = null;
        this.chaserCooldown = 5.0;
      }
    } else {
      this.chaserCooldown -= dt;
      if (this.chaserCooldown <= 0 && p.x > 260) {
        this.chaser = { x: this.cameraX - 60, y: this.groundY, speed: this.MOVE_SPEED * 1.2 };
      }
    }

    // --- Moedas (agendas/calendários/post-its) ---
    for (const c of this.coins) {
      if (c.collected) continue;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, c.x - 12, c.y - 12, 24, 24)) {
        c.collected = true;
        this.checkpointsCollected++;
        this.score += 15;
        this.popups.push({ x: c.x, y: c.y, text: '+15', color: '#7fd97f', big: false, life: 0.7, vy: -40 });
        let name = 'Agenda';
        if (c.type === 'calendar') name = 'Calendário';
        if (c.type === 'postit') name = 'Post-it';
        this.feedbackMsg = `📝 ${name} Organizado! (${this.checkpointsCollected}/${this.targetCheckpoints})`;
        this.feedbackIsError = false;
        this.feedbackTimer = 1.6;
      }
    }

    // --- Cafés (power-up) ---
    for (const cf of this.coffees) {
      if (cf.collected) continue;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h, p.w, p.h, cf.x - 14, cf.y - 14, 28, 28)) {
        cf.collected = true;
        p.boostTimer = 4.0;
        this.score += 25;
        this.popups.push({ x: cf.x, y: cf.y, text: '+25', color: '#38bdf8', big: false, life: 0.7, vy: -40 });
        this.feedbackMsg = '☕️ Cafezinho! Sprint de Pontualidade!';
        this.feedbackIsError = false;
        this.feedbackTimer = 2.0;
      }
    }

    // --- Meta (marquise do cinema) ---
    if (!this.goalUnlocked && this.checkpointsCollected >= this.targetCheckpoints) {
      this.goalUnlocked = true;
    }
    if (p.x >= this.goalX - p.w / 2 - 2) {
      if (this.goalUnlocked) {
        this.state = 'complete';
        this.stateTimer = 0;
        this.completeFlash = 1.0;
        const burstX = this.goalX - this.cameraX, burstY = this.groundY - 150;
        const palette = ['#facc15', '#38bdf8', '#ff6b8b', '#7fd97f', '#ffffff'];
        for (let i = 0; i < 46; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 90 + Math.random() * 220;
          this.confetti.push({
            x: burstX, y: burstY,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 160,
            rot: Math.random() * Math.PI, rotV: (Math.random() - 0.5) * 10,
            size: 4 + Math.random() * 5,
            color: palette[i % palette.length],
            life: 1.2 + Math.random() * 0.8
          });
        }
      } else if (this.goalFeedbackCooldown <= 0) {
        this.feedbackMsg = `🎬 Faltam agendas antes do cinema! (${this.checkpointsCollected}/${this.targetCheckpoints})`;
        this.feedbackIsError = true;
        this.feedbackTimer = 2.0;
        this.goalFeedbackCooldown = 2.0;
      }
    }

    // --- Câmara segue o jogador (side-scroll) ---
    const targetCam = p.x - W * 0.38;
    this.cameraX = Math.max(0, Math.min(targetCam, this.levelWidth - W));
  };

  L.triggerPenaltyOrFall = function() {
    this.lives--;
    this.feedbackMsg = `😵 Caíste a meio da distração! Restam ${Math.max(0, this.lives)} Vidas!`;
    this.feedbackTimer = 2.4;
    this.feedbackIsError = true;
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.stateTimer = 0;
      this.gameOverReason = 'traffic';
    } else {
      this.respawnAtSafeX();
      this.player.invTimer = 1.4;
    }
  };

  // ------------------------------------------------------------------ DRAW
  L.draw = function(ctx, game) {
    if (!ctx) return;
    const g = game || this.gameRef || window.Game;
    const W = (g && g.W) ? g.W : (ctx.canvas ? ctx.canvas.width : 640);
    const H = (g && g.H) ? g.H : (ctx.canvas ? ctx.canvas.height : 480);
    const camX = this.cameraX || 0;

    ctx.save();

    // 1. CÉU (gradiente de entardecer)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#13213f');
    sky.addColorStop(0.55, '#1c2b4a');
    sky.addColorStop(1, '#0f172a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sol/lua poente
    ctx.fillStyle = 'rgba(255, 196, 120, 0.9)';
    ctx.beginPath(); ctx.arc(W * 0.78 - camX * 0.05, H * 0.22, 26, 0, Math.PI * 2); ctx.fill();

    // 2. Nuvens (parallax lento)
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (const c of this.clouds) {
      const sx = c.x - camX * 0.2;
      if (sx < -80 || sx > W + 80) continue;
      ctx.beginPath();
      ctx.ellipse(sx, c.y, 26 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + 18 * c.s, c.y + 4, 18 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Edifícios (parallax médio)
    for (const b of this.buildings) {
      const sx = b.x - camX * 0.5;
      if (sx < -100 || sx > W + 100) continue;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx, this.groundY - b.h, 70, b.h);
      if (b.lit) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(sx + 10, this.groundY - b.h + 14, 10, 14);
        ctx.fillRect(sx + 28, this.groundY - b.h + 38, 10, 14);
        ctx.fillRect(sx + 46, this.groundY - b.h + 14, 10, 14);
      }
    }

    // 4. Chão (com buracos reais)
    ctx.fillStyle = '#334155';
    for (const seg of this.ground) {
      const sx1 = seg.x1 - camX, sx2 = seg.x2 - camX;
      if (sx2 < 0 || sx1 > W) continue;
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx1, this.groundY, sx2 - sx1, H - this.groundY);
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx1, this.groundY - 4, sx2 - sx1, 6);

      // Juntas do passeio (textura de mosaico a deslocar-se com a câmara)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1;
      const seamStart = Math.floor(seg.x1 / 40) * 40;
      for (let sxw = seamStart; sxw < seg.x2; sxw += 40) {
        const lx = sxw - camX;
        if (lx < sx1 || lx > sx2) continue;
        ctx.beginPath(); ctx.moveTo(lx, this.groundY + 6); ctx.lineTo(lx, H); ctx.stroke();
      }
    }

    // 4b. Lampiões ao longo do passeio (ambiente de entardecer)
    for (const lp of this.lampposts) {
      const sx = lp.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      const glow = 0.55 + Math.sin(this.timer * 2 + lp.flicker) * 0.12;
      const grd = ctx.createRadialGradient(sx, this.groundY - 64, 2, sx, this.groundY - 64, 46);
      grd.addColorStop(0, `rgba(255, 214, 140, ${glow})`);
      grd.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(sx, this.groundY - 64, 46, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, this.groundY); ctx.lineTo(sx, this.groundY - 60); ctx.stroke();
      ctx.fillStyle = '#1f2937';
      roundRectLocal(ctx, sx - 7, this.groundY - 74, 14, 14, 3); ctx.fill();
      ctx.fillStyle = `rgba(255, 224, 170, ${glow + 0.3})`;
      ctx.beginPath(); ctx.arc(sx, this.groundY - 67, 4, 0, Math.PI * 2); ctx.fill();
    }

    // 5. Plataformas flutuantes
    for (const pl of this.platforms) {
      const sx1 = pl.x1 - camX, sx2 = pl.x2 - camX;
      if (sx2 < 0 || sx1 > W) continue;
      ctx.fillStyle = '#334155';
      roundRectLocal(ctx, sx1, pl.y, sx2 - sx1, 16, 4); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sx1, pl.y, sx2 - sx1, 3);
    }

    // 6. Saliências suspensas (perigo de "bater com a cabeça")
    for (const oh of this.overhangs) {
      const sx = oh.x - camX;
      if (sx < -60 || sx > W + 60) continue;
      const oy = oh.y + Math.sin(this.timer * 2 + oh.bob) * 6;
      ctx.font = EF(30); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(oh.emoji, sx, oy);
    }

    // 7. Obstáculos estáticos
    for (const hz of this.hazards) {
      const sx = hz.x - camX;
      if (sx < -40 || sx > W + 40) continue;
      ctx.font = EF(26); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(hz.emoji, sx, hz.baseY);
    }

    // 8. Moedas
    for (const c of this.coins) {
      if (c.collected) continue;
      const sx = c.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      const bob = Math.sin(this.timer * 4 + c.x) * 4;
      ctx.font = EF(22); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      const icon = c.type === 'calendar' ? '📆' : c.type === 'postit' ? '📝' : '📅';
      ctx.fillText(icon, sx, c.y + bob);
    }

    // 9. Cafés
    for (const cf of this.coffees) {
      if (cf.collected) continue;
      const sx = cf.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      const bob = Math.sin(this.timer * 5) * 3;
      ctx.font = EF(24); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('☕️', sx, cf.y + bob);
    }

    // 10. Inimigos pisáveis
    for (const w of this.walkers) {
      if (!w.alive) continue;
      const sx = w.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(sx, w.y + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = EF(26); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('🗣️', sx, w.y - 4);
    }

    // 11. Perseguidor (multidão)
    if (this.chaser) {
      const sx = this.chaser.x - camX;
      ctx.font = EF(28); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('🚶🏽‍♂️‍➡️🚶🏼‍♀️‍➡️', sx, this.chaser.y - 4);
    }

    // 11b. Popups de pontuação (flutuam e desvanecem)
    for (const pu of this.popups) {
      const sx = pu.x - camX;
      if (sx < -60 || sx > W + 60) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, pu.life / (pu.big ? 1.0 : 0.7)));
      ctx.fillStyle = pu.color || '#fff';
      ctx.font = TF(pu.big ? 16 : 12, true);
      ctx.textAlign = 'center';
      ctx.fillText(pu.text, sx, pu.y);
      ctx.globalAlpha = 1;
    }

    // 12. Meta — marquise do cinema, tapete vermelho e holofotes
    {
      const sx = this.goalX - camX;
      const unlocked = this.goalUnlocked;
      if (sx > -260 && sx < W + 120) {
        // Holofotes a varrer o céu (só quando desbloqueado)
        if (unlocked) {
          const sweep = Math.sin(this.timer * 0.6) * 0.5;
          [-1, 1].forEach((side) => {
            ctx.save();
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.moveTo(sx + side * 40, this.groundY - 178);
            ctx.lineTo(sx + side * 40 + (sweep + side * 0.6) * 240, 10);
            ctx.lineTo(sx + side * 40 + (sweep + side * 0.6) * 240 + 50, 10);
            ctx.lineTo(sx + side * 40 + 46, this.groundY - 178);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          });
        }

        // Tapete vermelho a conduzir à entrada
        const carpetX1 = sx - 180, carpetX2 = sx - 6;
        ctx.fillStyle = unlocked ? '#9f1d3a' : '#3f2430';
        ctx.fillRect(Math.max(carpetX1, -20), this.groundY, carpetX2 - carpetX1, 7);
        ctx.fillStyle = unlocked ? '#d4446a' : '#4f303c';
        ctx.fillRect(Math.max(carpetX1, -20), this.groundY + 1, carpetX2 - carpetX1, 2);
        if (unlocked) {
          for (let i = 0; i < 6; i++) {
            const spx = carpetX1 + 20 + i * 28 + Math.sin(this.timer * 3 + i) * 3;
            if (spx < -20 || spx > W + 20) continue;
            ctx.globalAlpha = 0.5 + Math.sin(this.timer * 4 + i) * 0.4;
            ctx.fillStyle = '#fff7cc';
            ctx.font = EF(10); ctx.textAlign = 'center';
            ctx.fillText('✨', spx, this.groundY - 2);
            ctx.globalAlpha = 1;
          }
          // Pequena fila à espera, já perto da entrada
          ctx.font = EF(20); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
          ctx.fillText('🧍‍♀️', sx - 40, this.groundY - 6);
        }

        // Poste da marquise
        ctx.fillStyle = unlocked ? '#facc15' : '#4b5563';
        ctx.fillRect(sx - 4, this.groundY - 150, 8, 150);

        // Caixa da marquise com brilho pulsante quando desbloqueada
        const signW = 112, signH = 40, signX = sx - signW / 2, signY = this.groundY - 184;
        if (unlocked) {
          const haloA = 0.25 + Math.sin(this.timer * 4) * 0.12;
          ctx.fillStyle = `rgba(250, 204, 21, ${haloA})`;
          roundRectLocal(ctx, signX - 8, signY - 8, signW + 16, signH + 16, 12); ctx.fill();
        }
        ctx.fillStyle = unlocked ? '#1a1420' : 'rgba(75, 85, 99, 0.9)';
        roundRectLocal(ctx, signX, signY, signW, signH, 7); ctx.fill();
        ctx.strokeStyle = unlocked ? '#facc15' : '#6b7280'; ctx.lineWidth = 2;
        roundRectLocal(ctx, signX, signY, signW, signH, 7); ctx.stroke();

        // Lâmpadas da marquise em "chase" à volta da caixa
        const bulbN = 14;
        for (let i = 0; i < bulbN; i++) {
          const t = i / bulbN;
          const bx = signX + t * signW;
          const topRow = i % 2 === 0;
          const by = topRow ? signY - 3 : signY + signH + 3;
          const on = unlocked && (Math.floor(this.timer * 6 + i) % bulbN < bulbN * 0.4);
          ctx.fillStyle = on ? '#fff3b0' : (unlocked ? 'rgba(250,204,21,0.35)' : 'rgba(148,163,184,0.35)');
          ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = unlocked ? '#ffe27a' : '#e5e7eb';
        ctx.font = TF(12, true); ctx.textAlign = 'center';
        ctx.fillText('🎬 CINEMA', sx, signY + 18);
        ctx.font = TF(8, true);
        ctx.fillStyle = unlocked ? 'rgba(255,226,122,0.8)' : 'rgba(229,231,235,0.6)';
        ctx.fillText(unlocked ? '✦ ESTREIA HOJE ✦' : `FALTAM ${Math.max(0, this.targetCheckpoints - this.checkpointsCollected)} 📝`, sx, signY + 31);

        if (unlocked) {
          ctx.font = EF(16); ctx.textAlign = 'center';
          ctx.fillText('🍿', sx - signW / 2 - 14, signY + signH - 4);
          ctx.fillText('🍿', sx + signW / 2 + 14, signY + signH - 4);
        }
      }
    }

    // 13. TOMÁS (jogador)
    {
      const p = this.player;
      const sx = p.x - camX;
      const blink = p.invTimer > 0 && Math.floor(this.timer * 12) % 2 === 0;
      ctx.save();
      if (!blink) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, this.groundTopAt(p.x) !== null ? this.groundTopAt(p.x) + 3 : p.y + 3, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (p.boostTimer > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.beginPath();
          ctx.ellipse(sx - p.facing * 14, p.y - p.h / 2, 18, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        const squash = p.onGround ? 1 + Math.sin(p.animT * 14) * (Math.abs(p.vx) > 10 ? 0.05 : 0) : 1;
        ctx.translate(sx, p.y - p.h / 2);
        ctx.scale(p.facing * squash, squash);
        ctx.fillStyle = '#ffffff';
        ctx.font = EF(30);
        ctx.textAlign = 'center';
        ctx.fillText(p.onGround ? '🏃🏽‍➡️' : '🤸🏽', 0, 10);
      }
      ctx.restore();
    }

    // 13b. Vinheta + flash de chegada à meta
    {
      const vig = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.completeFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.completeFlash * 0.75})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 14. HUD
    ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.stroke();

    ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(Math.max(0, this.lives || 0)), 30, 44);

    ctx.fillStyle = '#9ca3af'; ctx.font = 'bold 10px monospace';
    ctx.fillText(`🏆 ${this.score || 0} pts`, 30, 58);

    ctx.fillStyle = '#facc15'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`📝 AGENDA: ${this.checkpointsCollected}/${this.targetCheckpoints}`, 125, 44);

    // Relógio Digital
    const progressPct = Math.max(0, Math.min(1, 1 - (this.timeLeft / this.totalTime)));
    const totalMinutes = Math.floor(8 * 60 + progressPct * (12 * 60));
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');

    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`⏰ HORA: ${hours}:${mins}`, 275, 44);

    const barW = 120, barX = W - 140;
    const distPct = Math.max(0, Math.min(1, this.player.x / this.goalX));
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`CINEMA: ${Math.max(0, Math.ceil((this.goalX - this.player.x) / 8))}m`, barX - 10, 44);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRectLocal(ctx, barX, 32, barW, 12, 4); ctx.fill();
    ctx.fillStyle = '#22c55e';
    if (distPct > 0) {
      roundRectLocal(ctx, barX, 32, barW * distPct, 12, 4); ctx.fill();
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
    ctx.fillText('ANDAR: [SETAS ESQ / DIR]  |  SALTAR: [ESPAÇO / CIMA]', W / 2, H - 7);

    // 15. DIÁLOGOS E FINAL
    if (this.state === 'intro_dialog') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.65)';
      ctx.fillRect(0, 0, W, H);

      const boxH = 140, pad = 18;
      const x = 16, w = W - 32;
      const y = H - boxH - 16;

      ctx.fillStyle = 'rgba(10,12,26,0.92)';
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      roundRectLocal(ctx, x, y, w, boxH, 10); ctx.stroke();

      if (this.introStep === 1) {
        ctx.fillStyle = '#ffe27a';
        ctx.font = TF(15, true);
        ctx.textAlign = 'left';
        ctx.fillText('📜 QUEST', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff';
        ctx.font = TF(12);

        const contentY = y + pad + 22;
        ctx.fillText('O Timo precisa de chegar ao cinema a tempo!', x + pad, contentY);
        ctx.fillText('Atravessa a cidade, salta entre plataformas e passeios,', x + pad, contentY + 18);
        ctx.fillText('apanha as agendas pelo caminho e foge das distrações.', x + pad, contentY + 36);
        ctx.fillText('Cuidado por onde andas - e com os muracos!', x + pad, contentY + 54);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a';
        ctx.font = TF(11, true);
        ctx.fillText('Pressiona [ ESPAÇO ] para continuar ➔', x + w - pad, y + boxH - 14);
      } else if (this.introStep === 2) {
        ctx.fillStyle = '#ffe27a';
        ctx.font = TF(15, true);
        ctx.textAlign = 'left';
        ctx.fillText('🎮 INSTRUÇÕES', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff';
        ctx.font = TF(11);

        const contentY = y + pad + 20;
        ctx.fillText('1. [SETAS ESQ/DIR] para andar, [ESPAÇO ou CIMA] para saltar 🏃🏽‍➡️', x + pad, contentY);
        ctx.fillText('2. Salta POR CIMA das obras do metrobus 🚧 e das conversas de xaxa 🗣️ (pisa-os!)', x + pad, contentY + 16);
        ctx.fillText('3. Passa POR BAIXO das notificações 📱', x + pad, contentY + 32);
        ctx.fillText('4. Foge da multidão 🚶🏽‍♂️‍➡️ e apanha as agendas 📅 e cafés ☕️!', x + pad, contentY + 48);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a';
        ctx.font = TF(11, true);
        ctx.fillText('Pressiona [ ESPAÇO ] para arrancar!', x + w - pad, y + boxH - 14);
      }
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';

      if (this.gameOverReason === 'missed_schedule') {
        ctx.fillText('⏰ CHEGASTE TARDE!', W / 2, H / 2 - 30);
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
      ctx.fillText('🏆 NÍVEL 10 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PONTUALIDADE PERFEITA!', W / 2, boxY + 54);

      const cardW = boxW - 32, cardH = 90;
      const cardX = boxX + 16, cardY = boxY + 72;

      ctx.fillStyle = '#181528';
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8); ctx.stroke();

      ctx.font = EF(26);
      ctx.textAlign = 'center';
      ctx.fillText('📅 📆 📝 ☕️ 🎬', W / 2, cardY + 34);

      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('MESTRE DO PLANEAMENTO', W / 2, cardY + 58);

      ctx.fillStyle = '#7fd97f'; ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ TODOS OS COMPROMISSOS CUMPRIDOS', W / 2, cardY + 78);


      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`Não deixaste a Kiu à espera nem 1 segundo!`, W / 2, boxY + boxH - 74);

      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`🏆 PONTUAÇÃO FINAL: ${this.score || 0}`, W / 2, boxY + boxH - 54);

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
