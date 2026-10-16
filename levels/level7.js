/* ============================================================================
- TOMÁS: THE QUEST — LEVEL 7: A COZINHA DO ROBALINHO
- Receita: Cesto 🧺 -> Tábua 🔪 (Rítmico) -> Fogão 🍲 -> Servir 🍽️ = 🍲
- ==========================================================================*/
(function() {
  const L = { id: 7 };

  // Função auxiliar para desenhar retângulos arredondados
  function roundRectLocal(ctx, x, y, width, height, radius) {
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
      Toast.show('🐟 LEVEL 7 — A MELHOR COISA QUE JÁ COMI', 3.2);
    }
  };

  L.resetLevel = function(game) {
    this.state = 'intro_dialog'; // 'intro_dialog' | 'playing' | 'chopping_minigame' | 'chef_dialog' | 'complete' | 'gameover'
    this.introStep = 1; // 1: Chef Mia, 2: Guia de Jogo (Quest)
    this.timer = 0;
    this.lives = 3;
    this.totalRecipeTime = 90.0;

    const W = (game && game.W) ? game.W : 640;
    const H = (game && game.H) ? game.H : 480;

    // Instância do Jogador
    this.player = new Player(W * 0.15, H * 0.60);
    this.player.speed = 170;
    this.player.carriedItem = null;

    // Sequência de ingredientes — cada um com o seu próprio desafio
    this.recipeSteps = [
      {
        id: 'potato', name: 'Batatas', icon: '🥔',
        boardType: 'rhythm', rhythmSpeed: 105, rhythmZone: 24,
        cookRate: 34, heatRate: 10
      },
      {
        id: 'carrot', name: 'Cenoura', icon: '🥕',
        boardType: 'rhythm', rhythmSpeed: 165, rhythmZone: 15,
        cookRate: 36, heatRate: 12, stirMin: 6, stirMax: 9
      },
      {
        id: 'broccoli', name: 'Brócolos', icon: '🥦',
        boardType: 'mash', mashNeeded: 12, mashTime: 2.6,
        cookRate: 38, heatRate: 13, stirMin: 4.5, stirMax: 7
      },
      {
        id: 'fish', name: 'Robalinho', icon: '🐟',
        boardType: 'rhythm', rhythmSpeed: 190, rhythmZone: 13,
        cookRate: 36, heatRate: 9, stirMin: 3.5, stirMax: 5.5, needsFlip: true
      }
    ];

    this.currentStepIdx = 0;
    this.servedCount = 0;

    // Estações
    this.stations = {
      baskets: W * 0.18,
      board: W * 0.40,
      pot: W * 0.62,
      serve: W * 0.85
    };

    this.stationState = {
      boardProgress: 0,
      potIngredient: null,
      potCookProgress: 0,
      potHeat: 0,
      isReadyToServe: false,
      cookPhase: 'sideA',     // 'sideA' | 'sideB' (só relevante p/ ingredientes com needsFlip)
      stirTimer: null,        // tempo até ao próximo "MEXE!"
      stirActive: false,
      stirWindowTimer: 0,
      flipReady: false,       // true quando é preciso virar (needsFlip)
      flipWindowTimer: 0
    };

    // Estado do Mini-Jogo Rítmico de Corte
    this.rhythmGame = {
      cursorPos: 0,
      direction: 1,
      speed: 120,
      targetStart: 40,
      targetEnd: 60
    };

    // Estado do Mini-Jogo de Lavagem (amassar/bater ritmo rápido)
    this.mashGame = {
      presses: 0,
      needed: 12,
      timeLeft: 2.6,
      totalTime: 2.6,
      lastPressAt: -1
    };

    this.boardMinigameType = 'rhythm';

    this.feedbackMsg = 'Vai ao cesto dos legumes e clica [ESPAÇO]!';
    this.feedbackTimer = 4.0;
    this.feedbackIsError = false;

    // Gestor de teclas
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
    if (this.state === 'gameover' && (key === ' ' || key === 'Enter')) {
      this.resetLevel(game);
      return;
    }

    // Diálogos Iniciais divididos em 2 passos
    if (this.state === 'intro_dialog' && (key === ' ' || key === 'Enter')) {
      if (this.introStep === 1) {
        this.introStep = 2; // Passa para a segunda caixa (Quest/Guia)
      } else if (this.introStep === 2) {
        this.state = 'playing'; // Começa o jogo a sério
      }
      return;
    }

    // Diálogo Final da Chef Mia -> Transição para Cartão de Nível Completo
    if (this.state === 'chef_dialog' && (key === ' ' || key === 'Enter')) {
      this.state = 'complete';
      this.timer = 0;
      return;
    }

    if (this.state === 'complete' && (key === ' ' || key === 'Enter')) {
      if (this.boundKeyDown) {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.boundKeyDown = null;
        this.boundKeyUp = null;
      }

      if (typeof Game !== 'undefined' && Game.startLevel) {
        if (Game.levels[8]) Game.startLevel(8);
        else Game.startLevel(1);
      }
      return;
    }

    // Lógica durante o Mini-jogo da Tábua (ritmo OU lavagem, consoante o ingrediente)
    if (this.state === 'chopping_minigame' && (key === ' ' || key === 'Enter')) {
      if (this.boardMinigameType === 'mash') {
        const now = this.timer;
        const combo = (this.mashGame.lastPressAt >= 0 && (now - this.mashGame.lastPressAt) < 0.28);
        this.mashGame.lastPressAt = now;
        this.mashGame.presses++;
        this.stationState.boardProgress += combo ? 13 : 9;
        this.feedbackMsg = combo ? '🔥 COMBO!' : '🧽 A lavar!';
        this.feedbackTimer = 0.6;
        this.feedbackIsError = false;
      } else {
        const pos = this.rhythmGame.cursorPos;
        const tStart = this.rhythmGame.targetStart;
        const tEnd = this.rhythmGame.targetEnd;

        if (pos >= tStart && pos <= tEnd) {
          const zoneSize = tEnd - tStart;
          const isPerfect = pos >= tStart + zoneSize * 0.3 && pos <= tEnd - zoneSize * 0.3;
          const addProgress = isPerfect ? 45 : 30;
          this.stationState.boardProgress += addProgress;
          this.feedbackMsg = isPerfect ? '🎯 CORTE PERFEITO!' : '👍 BOM CORTE!';
          this.feedbackTimer = 1.0;
          this.feedbackIsError = false;
        } else {
          this.stationState.boardProgress += 10;
          this.feedbackMsg = '❌ FALHASTE O RITMO!';
          this.feedbackTimer = 1.0;
          this.feedbackIsError = true;
        }

        const curStepR = this.recipeSteps[this.currentStepIdx];
        const zoneW = (curStepR && curStepR.rhythmZone) || 20;
        this.rhythmGame.targetStart = 15 + Math.random() * (80 - zoneW);
        this.rhythmGame.targetEnd = this.rhythmGame.targetStart + zoneW;
      }

      if (this.stationState.boardProgress >= 100) {
        this.stationState.boardProgress = 0;
        this.player.carriedItem.state = 'chopped';
        this.state = 'playing';
        this.feedbackMsg = 'Ingrediente pronto! Leva ao TACHO no fogão.';
        this.feedbackTimer = 2.5;
        this.feedbackIsError = false;
      }
      return;
    }

    if (this.state !== 'playing') return;

    if (key === ' ' || key === 'Enter') {
      const pX = this.player.x;
      const currentStep = this.recipeSteps[this.currentStepIdx];

      // 1. Junto ao CESTO
      if (Math.abs(pX - this.stations.baskets) < 40) {
        if (!this.player.carriedItem && !this.stationState.potIngredient) {
          this.player.carriedItem = { ...currentStep, state: 'raw' };
          this.feedbackMsg = `Apanhaste ${currentStep.name}! Leva à TÁBUA DE CORTAR.`;
          this.feedbackTimer = 2.5;
          this.feedbackIsError = false;
        } else if (this.player.carriedItem) {
          this.feedbackMsg = 'Já tens um ingrediente na mão!';
          this.feedbackTimer = 2.0;
        }
      }

      // 2. Junto à TÁBUA DE CORTAR
      else if (Math.abs(pX - this.stations.board) < 40) {
        if (this.player.carriedItem && this.player.carriedItem.state === 'raw') {
          this.boardMinigameType = currentStep.boardType || 'rhythm';
          this.state = 'chopping_minigame';

          if (this.boardMinigameType === 'mash') {
            this.mashGame.presses = 0;
            this.mashGame.needed = currentStep.mashNeeded || 12;
            this.mashGame.totalTime = currentStep.mashTime || 2.6;
            this.mashGame.timeLeft = this.mashGame.totalTime;
            this.mashGame.lastPressAt = -1;
            this.feedbackMsg = '🧽 Bate [ESPAÇO] bem depressa para lavar tudo!';
          } else {
            this.rhythmGame.cursorPos = 0;
            this.rhythmGame.direction = 1;
            this.rhythmGame.speed = currentStep.rhythmSpeed || 120;
            const zoneW = currentStep.rhythmZone || 20;
            this.rhythmGame.targetStart = 15 + Math.random() * (80 - zoneW);
            this.rhythmGame.targetEnd = this.rhythmGame.targetStart + zoneW;
            this.feedbackMsg = 'Clica [ESPAÇO] quando o marcador estiver no verde!';
          }
          this.stationState.boardProgress = 0;
          this.feedbackTimer = 2.2;
          this.feedbackIsError = false;
        } else if (!this.player.carriedItem) {
          this.feedbackMsg = 'Vai buscar um ingrediente ao cesto primeiro!';
          this.feedbackTimer = 2.0;
        }
      }

      // 3. Junto ao TACHO / FOGÃO
      else if (Math.abs(pX - this.stations.pot) < 40) {
        if (this.player.carriedItem && this.player.carriedItem.state === 'chopped') {
          this.stationState.potIngredient = this.player.carriedItem;
          this.player.carriedItem = null;
          this.stationState.cookPhase = 'sideA';
          this.stationState.flipReady = false;
          this.stationState.stirActive = false;
          const sMin = currentStep.stirMin, sMax = currentStep.stirMax;
          this.stationState.stirTimer = (sMin != null) ? (sMin + Math.random() * (sMax - sMin)) : null;
          this.feedbackMsg = currentStep.needsFlip
            ? 'A grelhar! Fica atento para VIRAR o peixe a meio!'
            : 'A cozinhar no tacho! Atento para não queimar!';
          this.feedbackTimer = 2.5;
          this.feedbackIsError = false;
        } else if (this.stationState.stirActive) {
          // Resposta ao pedido de "mexer"
          this.stationState.stirActive = false;
          this.stationState.potHeat = Math.max(0, this.stationState.potHeat - 16);
          const sMin = currentStep.stirMin, sMax = currentStep.stirMax;
          this.stationState.stirTimer = sMin + Math.random() * (sMax - sMin);
          this.feedbackMsg = '🥄 Mexido!';
          this.feedbackTimer = 1.0;
          this.feedbackIsError = false;
        } else if (this.stationState.flipReady) {
          // Resposta ao pedido de "virar"
          this.stationState.flipReady = false;
          this.stationState.cookPhase = 'sideB';
          this.stationState.potCookProgress = 0;
          this.feedbackMsg = '🐟 Virado! A cozinhar o outro lado...';
          this.feedbackTimer = 1.6;
          this.feedbackIsError = false;
        } else if (this.stationState.isReadyToServe && !this.player.carriedItem) {
          this.player.carriedItem = { ...this.stationState.potIngredient, state: 'cooked' };
          this.stationState.potIngredient = null;
          this.stationState.potCookProgress = 0;
          this.stationState.potHeat = 0;
          this.stationState.isReadyToServe = false;
          this.stationState.stirActive = false;
          this.stationState.flipReady = false;

          this.feedbackMsg = `${this.player.carriedItem.name} no ponto! Leva para o prato na MESA DE SERVIR!`;
          this.feedbackTimer = 2.5;
          this.feedbackIsError = false;
        } else if (this.player.carriedItem && this.player.carriedItem.state === 'raw') {
          this.feedbackMsg = 'Tens de cortar o ingrediente na tábua primeiro!';
          this.feedbackTimer = 2.2;
          this.feedbackIsError = true;
        }
      }

      // 4. Junto à MESA DE SERVIR
      else if (Math.abs(pX - this.stations.serve) < 40) {
        if (this.player.carriedItem && this.player.carriedItem.state === 'cooked') {
          this.servedCount++;
          this.currentStepIdx++;
          this.player.carriedItem = null;

          if (this.currentStepIdx >= this.recipeSteps.length) {
            this.state = 'chef_dialog';
          } else {
            this.feedbackMsg = `✨ Empratado! Próximo ingrediente: ${this.recipeSteps[this.currentStepIdx].name}`;
            this.feedbackTimer = 2.5;
            this.feedbackIsError = false;
          }
        } else if (this.player.carriedItem) {
          this.feedbackMsg = 'Cozinha o ingrediente no tacho antes de servir!';
          this.feedbackTimer = 2.2;
          this.feedbackIsError = true;
        }
      }
    }

    if (key === '5') {
      if (this.stationState.potIngredient && this.stationState.potHeat > 0) {
        this.stationState.potHeat = Math.max(0, this.stationState.potHeat - 40);
        this.feedbackMsg = '🧯 Fogo reduzido! Tacho arrefecido.';
        this.feedbackTimer = 1.2;
        this.feedbackIsError = false;
      }
    }
  };

  L.update = function(dt, game) {
    const W = game.W || 640;
    this.timer += dt;

    if (this.state === 'chopping_minigame') {
      if (this.boardMinigameType === 'mash') {
        this.mashGame.timeLeft -= dt;
        if (this.mashGame.timeLeft <= 0) {
          this.mashGame.timeLeft = this.mashGame.totalTime;
          this.stationState.boardProgress = Math.max(0, this.stationState.boardProgress - 18);
          this.feedbackMsg = '⏳ Mais depressa! Continua a bater!';
          this.feedbackTimer = 1.0;
          this.feedbackIsError = true;
        }
      } else {
        this.rhythmGame.cursorPos += this.rhythmGame.direction * this.rhythmGame.speed * dt;
        if (this.rhythmGame.cursorPos >= 100) {
          this.rhythmGame.cursorPos = 100;
          this.rhythmGame.direction = -1;
        } else if (this.rhythmGame.cursorPos <= 0) {
          this.rhythmGame.cursorPos = 0;
          this.rhythmGame.direction = 1;
        }
      }
    }

    if (this.state !== 'playing' && this.state !== 'chopping_minigame') return;

    this.totalRecipeTime -= dt;
    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;

    if (this.totalRecipeTime <= 0) {
      this.triggerPenalty('⏰ O tempo esgotou-se!');
      return;
    }

    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveDir -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveDir += 1;

    if (moveDir !== 0 && this.state === 'playing') {
      this.player.dir = moveDir > 0 ? 'right' : 'left';
      this.player.step += dt * 10;
      this.player.x += moveDir * this.player.speed * dt;
      this.player.x = Math.max(40, Math.min(W - 40, this.player.x));
    } else {
      this.player.step = 0;
    }

    if (this.stationState.potIngredient) {
      const curStep = this.recipeSteps[this.currentStepIdx];
      const cookRate = (curStep && curStep.cookRate) || 32;
      const heatRate = (curStep && curStep.heatRate) || 11;
      const ss = this.stationState;

      if (!ss.isReadyToServe) {
        // --- Pedido de "mexer" (só para ingredientes com stirMin definido) ---
        if (curStep && curStep.stirMin != null && !ss.flipReady) {
          if (ss.stirActive) {
            ss.stirWindowTimer -= dt;
            if (ss.stirWindowTimer <= 0) {
              ss.stirActive = false;
              ss.potHeat += 18;
              ss.stirTimer = curStep.stirMin + Math.random() * (curStep.stirMax - curStep.stirMin);
              this.feedbackMsg = '🔥 Esqueceste-te de mexer!';
              this.feedbackTimer = 1.6;
              this.feedbackIsError = true;
            }
          } else if (ss.stirTimer != null) {
            ss.stirTimer -= dt;
            if (ss.stirTimer <= 0) {
              ss.stirActive = true;
              ss.stirWindowTimer = 1.3;
            }
          }
        }

        // --- Cozedura (com viragem a meio para ingredientes com needsFlip) ---
        if (!ss.flipReady) {
          ss.potCookProgress += dt * cookRate;
          ss.potHeat += dt * heatRate;

          if (ss.potCookProgress >= 100) {
            ss.potCookProgress = 100;

            if (curStep && curStep.needsFlip && ss.cookPhase === 'sideA') {
              ss.flipReady = true;
              ss.flipWindowTimer = 2.2;
              this.feedbackMsg = '🐟 Hora de VIRAR! Vai ao tacho e prime [ESPAÇO]!';
              this.feedbackTimer = 2.2;
              this.feedbackIsError = false;
            } else {
              ss.isReadyToServe = true;
              this.feedbackMsg = '✨ Está cozinhado! Retira do tacho com [ESPAÇO]!';
              this.feedbackTimer = 3.0;
            }
          }
        } else {
          // À espera que o jogador vire o peixe
          ss.flipWindowTimer -= dt;
          if (ss.flipWindowTimer <= 0) {
            ss.flipReady = false;
            ss.cookPhase = 'sideB';
            ss.potCookProgress = 0;
            ss.potHeat += 20;
            this.feedbackMsg = '🔥 Queimou de um lado! Continua a cozinhar o outro...';
            this.feedbackTimer = 2.0;
            this.feedbackIsError = true;
          }
        }
      } else {
        ss.potHeat += dt * 28;
      }

      if (ss.potHeat >= 100) {
        this.triggerPenalty('🔥 A comida queimou no tacho!');
      }
    }
  };

  L.triggerPenalty = function(reason) {
    this.lives--;
    if (this.lives <= 0) {
      this.state = 'gameover';
    } else {
      this.player.carriedItem = null;
      this.stationState.boardProgress = 0;
      this.stationState.potIngredient = null;
      this.stationState.potCookProgress = 0;
      this.stationState.potHeat = 0;
      this.stationState.isReadyToServe = false;
      this.stationState.cookPhase = 'sideA';
      this.stationState.stirActive = false;
      this.stationState.stirTimer = null;
      this.stationState.flipReady = false;
      this.state = 'playing';
      this.feedbackMsg = `${reason} Perdeste 1 Vida! Tenta novamente.`;
      this.feedbackTimer = 3.2;
      this.feedbackIsError = true;
    }
  };

  L.draw = function(ctx, game) {
    const W = game.W || 640;
    const H = game.H || 480;

    ctx.save();

    // 1. CENÁRIO DA COZINHA
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, W, H * 0.52);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    const tileSize = 32;
    for (let x = 0; x < W; x += tileSize) {
      for (let y = 0; y < H * 0.52; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, H * 0.48, W, 6);

    const floorY = H * 0.52;
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, floorY, W, H - floorY);

    for (let x = 0; x < W; x += 40) {
      for (let y = floorY; y < H; y += 40) {
        if (((x / 40) + Math.floor(y / 40)) % 2 === 0) {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }

    const counterY = H * 0.54;
    const counterH = 110;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(15, counterY + 12, W - 30, counterH);

    ctx.fillStyle = '#451a03';
    roundRectLocal(ctx, 20, counterY, W - 40, counterH, 8);
    ctx.fill();

    ctx.fillStyle = '#d4d4d8';
    roundRectLocal(ctx, 16, counterY - 10, W - 32, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#a1a1aa';
    ctx.fillRect(16, counterY + 12, W - 32, 4);

    // 2. ESTAÇÕES DE TRABALHO
    const curStep = this.recipeSteps[this.currentStepIdx];

    // Cesto
    const stB = this.stations.baskets;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(stB, counterY - 2, 32, 8, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#b45309';
    roundRectLocal(ctx, stB - 26, counterY - 24, 52, 24, 8); ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(stB - 24, counterY - 18, 48, 3);
    ctx.fillRect(stB - 24, counterY - 10, 48, 3);

    ctx.font = emojiFont(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(curStep ? curStep.icon : '🧺', stB, counterY - 28);
    
    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 10px monospace';
    ctx.fillText('1. CESTO', stB, counterY + 32);

    // Tábua
    const stBd = this.stations.board;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(stBd, counterY - 2, 35, 8, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#d97706';
    roundRectLocal(ctx, stBd - 30, counterY - 18, 60, 20, 4); ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(stBd - 26, counterY - 16, 52, 2);

    ctx.font = emojiFont(18);
    ctx.fillText('🔪', stBd + 22, counterY - 18);

    if (this.stationState.boardProgress > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRectLocal(ctx, stBd - 25, counterY - 32, 50, 8, 3); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      roundRectLocal(ctx, stBd - 25, counterY - 32, 50 * (this.stationState.boardProgress / 100), 8, 3); ctx.fill();
    }

    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 10px monospace';
    ctx.fillText('2. TÁBUA', stBd, counterY + 32);

    // Fogão
    const stP = this.stations.pot;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(stP, counterY - 2, 35, 8, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#18181b';
    roundRectLocal(ctx, stP - 32, counterY - 14, 64, 16, 3); ctx.fill();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(stP, counterY - 6, 14, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = '#475569';
    roundRectLocal(ctx, stP - 22, counterY - 30, 44, 24, 6); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(stP - 27, counterY - 24, 5, 8);
    ctx.fillRect(stP + 22, counterY - 24, 5, 8);

    if (this.stationState.potIngredient) {
      ctx.font = emojiFont(20);
      ctx.fillText(this.stationState.potIngredient.icon, stP, counterY - 38);

      const steamY = counterY - 48 - (Math.sin(this.timer * 6) * 4);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '12px sans-serif';
      ctx.fillText('💨', stP - 6, steamY);
      ctx.fillText('💨', stP + 6, steamY - 4);

      const barW = 44;
      const barX = stP - barW / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      roundRectLocal(ctx, barX, counterY - 62, barW, 6, 2); ctx.fill();
      ctx.fillStyle = '#eab308';
      roundRectLocal(ctx, barX, counterY - 62, barW * (this.stationState.potCookProgress / 100), 6, 2); ctx.fill();

      if (this.stationState.potHeat > 10) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        roundRectLocal(ctx, barX, counterY - 54, barW, 5, 2); ctx.fill();
        ctx.fillStyle = this.stationState.potHeat > 70 ? '#ef4444' : '#f97316';
        roundRectLocal(ctx, barX, counterY - 54, barW * (this.stationState.potHeat / 100), 5, 2); ctx.fill();
      }

      const curStepPot = this.recipeSteps[this.currentStepIdx];
      if (curStepPot && curStepPot.needsFlip) {
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.stationState.cookPhase === 'sideA' ? 'LADO A' : 'LADO B', stP, counterY - 68);
      }

      // Pedido de "MEXE!"
      if (this.stationState.stirActive) {
        const pulse = 0.6 + Math.sin(this.timer * 14) * 0.4;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.95)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('🥄 MEXE! [ESPAÇO]', stP, counterY - 76);
        ctx.restore();
      }

      // Pedido de "VIRA!" (peixe)
      if (this.stationState.flipReady) {
        const pulse = 0.6 + Math.sin(this.timer * 16) * 0.4;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('🔄 VIRA! [ESPAÇO]', stP, counterY - 76);
        ctx.restore();
      }
    }

    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 10px monospace';
    ctx.fillText('3. FOGÃO', stP, counterY + 32);

    // Servir
    const stS = this.stations.serve;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(stS, counterY - 2, 38, 8, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#2563eb';
    roundRectLocal(ctx, stS - 30, counterY - 14, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(stS - 26, counterY - 12, 52, 2);

    ctx.font = emojiFont(28);
    if (this.servedCount >= 4) {
      ctx.fillText('🍲', stS, counterY - 26);
    } else {
      ctx.fillText('🍽️', stS, counterY - 24);
    }

    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 10px monospace';
    ctx.fillText('4. SERVIR', stS, counterY + 32);

    // 3. PERSONAGEM (TOMÁS)
    drawPlayer(ctx, this.player);

    if (this.player.carriedItem) {
      const item = this.player.carriedItem;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      roundRectLocal(ctx, this.player.x - 18, this.player.y - 54, 36, 24, 6); ctx.fill();
      ctx.strokeStyle = item.state === 'cooked' ? '#4ade80' : '#ffe27a'; ctx.lineWidth = 1;
      roundRectLocal(ctx, this.player.x - 18, this.player.y - 54, 36, 24, 6); ctx.stroke();

      ctx.font = emojiFont(16);
      ctx.fillText(item.icon, this.player.x - 6, this.player.y - 41);

      if (item.state === 'chopped') {
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 10px monospace';
        ctx.fillText('✓', this.player.x + 8, this.player.y - 38);
      } else if (item.state === 'cooked') {
        ctx.fillStyle = '#4ade80'; ctx.font = 'bold 10px monospace';
        ctx.fillText('🔥', this.player.x + 8, this.player.y - 38);
      }
    }

    // 4. MINI-JOGO DA TÁBUA (ritmo OU lavagem, consoante o ingrediente)
    if (this.state === 'chopping_minigame' && this.boardMinigameType !== 'mash') {
      const barW = 200;
      const barH = 20;
      const barX = (W - barW) / 2;
      const barY = H * 0.32;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      roundRectLocal(ctx, barX - 20, barY - 35, barW + 40, 85, 10); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
      roundRectLocal(ctx, barX - 20, barY - 35, barW + 40, 85, 10); ctx.stroke();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
      ctx.fillText('⚡ CORTE NO RITMO! [ESPAÇO]', W / 2, barY - 15);

      ctx.fillStyle = '#334155';
      roundRectLocal(ctx, barX, barY, barW, barH, 6); ctx.fill();

      const targetX = barX + (barW * (this.rhythmGame.targetStart / 100));
      const targetW = barW * ((this.rhythmGame.targetEnd - this.rhythmGame.targetStart) / 100);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(targetX, barY, targetW, barH);

      const cursorX = barX + (barW * (this.rhythmGame.cursorPos / 100));
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cursorX - 3, barY - 4, 6, barH + 8);
    } else if (this.state === 'chopping_minigame' && this.boardMinigameType === 'mash') {
      const barW = 200;
      const barH = 20;
      const barX = (W - barW) / 2;
      const barY = H * 0.32;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      roundRectLocal(ctx, barX - 20, barY - 35, barW + 40, 95, 10); ctx.fill();
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2;
      roundRectLocal(ctx, barX - 20, barY - 35, barW + 40, 95, 10); ctx.stroke();

      const mg = this.mashGame;
      const shake = (Math.random() - 0.5) * 2;
      ctx.save();
      ctx.translate(shake, 0);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
      ctx.fillText('🧽 BATE [ESPAÇO] DEPRESSA!', W / 2, barY - 15);
      ctx.restore();

      // Barra de progresso (igual conceito à de corte, cor verde)
      ctx.fillStyle = '#334155';
      roundRectLocal(ctx, barX, barY, barW, barH, 6); ctx.fill();
      ctx.fillStyle = '#4ade80';
      roundRectLocal(ctx, barX, barY, barW * (this.stationState.boardProgress / 100), barH, 6); ctx.fill();

      // Contador de toques
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${mg.presses} toques!`, W / 2, barY + barH + 16);

      // Barra de tempo (reinicia se esgotar, sem perder vida)
      const tPct = Math.max(0, mg.timeLeft / mg.totalTime);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRectLocal(ctx, barX, barY + 30, barW, 6, 2); ctx.fill();
      ctx.fillStyle = tPct < 0.3 ? '#ef4444' : '#38bdf8';
      roundRectLocal(ctx, barX, barY + 30, barW * tPct, 6, 2); ctx.fill();
    }

    // 5. INTERFACE / HUD SUPERIOR
    ctx.fillStyle = 'rgba(10, 12, 26, 0.9)';
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.fill();
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    roundRectLocal(ctx, 16, 12, W - 32, 54, 10); ctx.stroke();

    ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(this.lives), 30, 44);

    ctx.fillStyle = this.totalRecipeTime < 20 ? '#ef4444' : '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`⏱️ ${Math.max(0, Math.ceil(this.totalRecipeTime))}s`, 130, 44);

    ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 14px monospace';
    const stepTxt = curStep ? `OBJETIVO: ${curStep.name} (${this.currentStepIdx + 1}/4)` : 'PRATO PRONTO! 🍲';
    ctx.fillText(stepTxt, W - 280, 44);

    // 6. MENSAGENS DE FEEDBACK
    if (this.feedbackTimer > 0 && this.state !== 'chef_dialog' && this.state !== 'intro_dialog') {
      ctx.textAlign = 'center';
      const boxW = Math.min(W - 60, ctx.measureText(this.feedbackMsg).width + 40);
      ctx.fillStyle = this.feedbackIsError ? 'rgba(153, 27, 27, 0.92)' : 'rgba(20, 83, 45, 0.92)';
      roundRectLocal(ctx, (W - boxW) / 2, H * 0.78, boxW, 32, 8); ctx.fill();
      ctx.strokeStyle = this.feedbackIsError ? '#fca5a5' : '#86efac'; ctx.lineWidth = 1.5;
      roundRectLocal(ctx, (W - boxW) / 2, H * 0.78, boxW, 32, 8); ctx.stroke();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(this.feedbackMsg, W / 2, H * 0.78 + 20);
    }

    // Rodapé
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, H - 26, W, 26);
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MOVER: [SETAS] / [A][D]  |  AÇÃO: [ESPAÇO]  |  ARREFECE FOGÃO: [5]', W / 2, H - 8);

    // 7. DIÁLOGOS E QUEST (DIVIDIDOS EM 2 PASSOS)
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

      // PASSO 1: Fala da Chef Mia
      if (this.introStep === 1) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(16, true) : 'bold 16px monospace'; 
        ctx.textAlign = 'left';
        ctx.fillText('CHEF MIA 👩🏼‍🍳', x + pad, y + pad + 4);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(14) : '14px monospace'; 
        const contentY = y + pad + 28;
        ctx.fillText('Olá Tomás! Hoje tens de surpreender a Kiu com um Robalinho!', x + pad, contentY);

        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(12, true) : 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Pressiona [ ESPAÇO ] para continuar ➔', x + w - pad, y + boxH - 14);
      } 
      // PASSO 2: Guia de Jogo (📜 QUEST)
      else if (this.introStep === 2) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(16, true) : 'bold 16px monospace'; 
        ctx.textAlign = 'left';
        ctx.fillText('📜 QUEST', x + pad, y + pad + 4);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(13) : '13px monospace'; 
        const contentY = y + pad + 22;
        ctx.fillText('1. Pega nos ingredientes no Cesto 🧺', x + pad, contentY);
        ctx.fillText('2. Prepara-os na Tábua 🔪 — cada um tem o seu desafio!', x + pad, contentY + 18);
        ctx.fillText('3. Cozinha no Fogão 🍲 (mexe e vira quando pedido!) e serve 🍽️', x + pad, contentY + 36);

        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(12, true) : 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Pressiona [ ESPAÇO ] para começar!', x + w - pad, y + boxH - 14);
      }

      ctx.textAlign = 'left';
    }

    // Diálogo Final da Chef Mia (Elogio)
    if (this.state === 'chef_dialog') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.65)';
      ctx.fillRect(0, 0, W, H);

      const dlgW = W * 0.85;
      const dlgH = 120;
      const dlgX = (W - dlgW) / 2;
      const dlgY = H * 0.62;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      roundRectLocal(ctx, dlgX, dlgY, dlgW, dlgH, 12); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
      roundRectLocal(ctx, dlgX, dlgY, dlgW, dlgH, 12); ctx.stroke();

      ctx.font = emojiFont(44); ctx.textAlign = 'center';
      ctx.fillText('👩🏼‍🍳', dlgX + 45, dlgY + 55);

      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
      ctx.fillText('Chef Mia:', dlgX + 85, dlgY + 35);

      ctx.fillStyle = '#ffffff'; ctx.font = '13px monospace';
      ctx.fillText('O melhor robalo que a Kiu comerá na vida! Parabéns! 🍲✨', dlgX + 85, dlgY + 62);

      ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace';
      ctx.fillText('Pressiona [ ESPAÇO ] para continuar...', dlgX + 85, dlgY + 92);
    }

    // 8. ECRÃS DE FIM DE JOGO
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.88)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('🔥 A COMIDA QUEIMOU!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#ffffff'; ctx.font = '14px monospace';
      ctx.fillText('Pressiona [ ESPAÇO ] para tentar de novo', W / 2, H / 2 + 25);
    }

    // Overlay Retro Level Complete Card
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
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = 3;
      roundRectLocal(ctx, boxX, boxY, boxW, boxH, 10);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 226, 122, 0.3)';
      ctx.lineWidth = 1;
      roundRectLocal(ctx, boxX + 4, boxY + 4, boxW - 8, boxH - 8, 7);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('🍲 NÍVEL 7 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('O ROBALINHO FICOU DELÍCIA!', W / 2, boxY + 54);

      const cardW = boxW - 32;
      const cardH = 92;
      const cardX = boxX + 16;
      const cardY = boxY + 72;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      roundRectLocal(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = progress;
      ctx.fillStyle = '#ffffff';
      ctx.font = emojiFont(26);
      ctx.fillText('🧑🏽‍🍳 🍲 🐟', W / 2, cardY + 32);
      ctx.restore();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px ' + TEXT_FONT_STACK;
      ctx.fillText('ESTÁS PRONTO PARA SER HUSBAND MATERIAL!', W / 2, cardY + 56);

      ctx.fillStyle = '#7fd97f';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ SABES FAZER MAIS DO QUE OVOS MEXIDOS', W / 2, cardY + 76);

      if (this.timer > 0.6) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('A Chef Mia está muito orgulhosa!', W / 2, boxY + 195);
        ctx.fillStyle = '#ffe27a';
        ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Prepara-te para o próximo desafio.', W / 2, boxY + 213);
      }

      if (this.timer > 1.2) {
        const btnPulse = Math.sin(this.timer * 6) * 0.2 + 0.8;
        ctx.save();
        ctx.globalAlpha = btnPulse * progress;
        const btnW = 180, btnH = 28, btnX = W / 2 - btnW / 2, btnY = boxY + boxH - 40;
        ctx.fillStyle = '#ffe27a';
        roundRectLocal(ctx, btnX, btnY, btnW, btnH, 5);
        ctx.fill();
        ctx.fillStyle = '#100e1a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('PRESSIONA [ ESPAÇO ]', W / 2, btnY + 18);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  };

  if (typeof Game !== 'undefined' && Game.addLevel) {
    Game.addLevel(7, L);
  }
})();