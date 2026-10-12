/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 9: SILENTIDE GUITAR HERO EDITION
 * ==========================================================================*/
(function() {
  const L = { id: 9 };

  L.bgMusic = new Audio('Chaos & Order.mp3');

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

  // --------------------------------------------------------------------------
  // AUDIO SYNTH
  // --------------------------------------------------------------------------
  function playGuitarHeroSound(laneIndex, isError = false) {
    try {
      if (typeof Sound !== 'undefined') {
        if (isError && Sound.playError) { Sound.playError(); return; }
        if (!isError && Sound.playInstrument) { Sound.playInstrument(laneIndex); return; }
        if (!isError && Sound.playBeat) { Sound.playBeat(); return; }
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!L.audioCtx) L.audioCtx = new AudioCtx();
      if (L.audioCtx.state === 'suspended') L.audioCtx.resume();

      const ctx = L.audioCtx;
      const now = ctx.currentTime;

      if (isError) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.15);
        return;
      }

      const freqs = [261.63, 329.63, 392.00, 523.25];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (laneIndex === 0) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[laneIndex] || 440, now);
      }

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // DESENHO DE PERSONAGENS
  // --------------------------------------------------------------------------
  function drawEngineCharacter(ctx, x, y, options) {
    ctx.save();
    ctx.translate(x, y);

    const bob = Math.sin((options.timer || 0) * 8) * 2;
    const isTomas = options.isTomas;
    const hoodieColor = options.hoodieColor || '#2e3d52';
    const shirtColor = options.shirtColor || '#38bdf8';
    const pantsColor = options.pantsColor || '#334155';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f8fafc';
    roundRectLocal(ctx, -8, 12, 6, 4, 1); ctx.fill();
    roundRectLocal(ctx, 2, 12, 6, 4, 1); ctx.fill();

    ctx.fillStyle = pantsColor;
    roundRectLocal(ctx, -6, 4, 5, 9, 1); ctx.fill();
    roundRectLocal(ctx, 1, 4, 5, 9, 1); ctx.fill();

    ctx.fillStyle = hoodieColor;
    roundRectLocal(ctx, -8, -5 + bob, 16, 10, 2); ctx.fill();
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-4, -3 + bob, 8, 8);

    if (isTomas) {
      ctx.font = '20px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧑🏽', 0, -14 + bob);
    } else if (options.emoji) {
      ctx.font = '18px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(options.emoji, 0, -14 + bob);
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // LEVEL CYCLE
  // --------------------------------------------------------------------------
  L.enter = function(game) {
    this.difficulty = this.difficulty || 'medium';
    this.resetLevel(game);

    if (L.bgMusic) {
      L.bgMusic.pause();
      L.bgMusic.currentTime = 90; // 1 min 30 seg
    }

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🎸 LEVEL 9 — SILENTIDE EMERGENCY', 3.2);
    }
  };

  L.applyDifficultySettings = function() {
    if (this.difficulty === 'easy') {
      this.spawnInterval = 0.75;
      this.noteSpeed = 140;
      this.hitWindow = 45;
      this.doubleNoteChance = 0.10;
    } else if (this.difficulty === 'hard') {
      this.spawnInterval = 0.40;
      this.noteSpeed = 220;
      this.hitWindow = 28;
      this.doubleNoteChance = 0.35;
    } else { // medium
      this.spawnInterval = 0.55;
      this.noteSpeed = 180;
      this.hitWindow = 35;
      this.doubleNoteChance = 0.22;
    }
  };

  L.resetLevel = function(game) {
    this.state = 'intro_dialog'; // 'intro_dialog', 'playing', 'paused', 'complete', 'gameover'
    this.introStep = 1; // 1: Contexto | 2: Instruções & Dificuldade
    this.timer = 0;
    this.stateTimer = 0;

    this.score = 0;
    this.multiplier = 1;
    this.streak = 0;
    this.rockMeter = 75;
    this.showProgress = 0;

    this.lanes = [
      { id: 0, key: '1', keyAlt: 'a', keyNav: 'ArrowLeft', color: '#ef4444', label: '1/A/←', name: 'Tomás' },
      { id: 1, key: '2', keyAlt: 's', keyNav: 'ArrowUp', color: '#38bdf8', label: '2/S/↑', name: 'Hugo' },
      { id: 2, key: '3', keyAlt: 'd', keyNav: 'ArrowDown', color: '#f59e0b', label: '3/D/↓', name: 'Freitas' },
      { id: 3, key: '4', keyAlt: 'f', keyNav: 'ArrowRight', color: '#a855f7', label: '4/F/→', name: 'Digga' }
    ];

    this.notes = [];
    this.spawnTimer = 0;
    this.applyDifficultySettings();

    this.feedbackText = '';
    this.feedbackTimer = 0;
    this.feedbackColor = '#fff';

    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundClick) window.removeEventListener('click', this.boundClick);

    this.boundKeyDown = (e) => this.handleKeyPress(e.key, game);
    window.addEventListener('keydown', this.boundKeyDown);

    this.boundClick = (e) => this.handleClick(e, game);
    window.addEventListener('click', this.boundClick);
  };

  L.handleClick = function(e, game) {
    const canvas = game.canvas || document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (game.W || 640) / rect.width;
    const scaleY = (game.H || 480) / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Clique no Botão de Pausa
    if (this.state === 'playing') {
      if (mx >= 15 && mx <= 95 && my >= 10 && my <= 38) {
        this.state = 'paused';
        this.stateTimer = 0;
        return;
      }
    }

    // Clique na Seleção de Dificuldade (Apenas no Passo 2 da Intro)
    if (this.state === 'intro_dialog' && this.introStep === 2) {
      const boxH = 132;
      const x = 16;
      const y = (game.H || 480) - boxH - 16;
      const pad = 18;

      if (my >= y + boxH - 24 && my <= y + boxH - 8) {
        if (mx >= x + pad + 91 && mx <= x + pad + 139) this.difficulty = 'easy';
        if (mx >= x + pad + 151 && mx <= x + pad + 199) this.difficulty = 'medium';
        if (mx >= x + pad + 211 && mx <= x + pad + 259) this.difficulty = 'hard';
        this.applyDifficultySettings();
      }
    }
  };

  L.handleKeyPress = function(key, game) {
    const k = key.toLowerCase();

    // Pausa (Toggle)
    if ((k === 'p' || key === 'Escape') && (this.state === 'playing' || this.state === 'paused')) {
      this.state = (this.state === 'playing') ? 'paused' : 'playing';
      this.stateTimer = 0;

      if (L.bgMusic) {
        if (this.state === 'paused') {
          L.bgMusic.pause();
        } else {
          L.bgMusic.play();
        }
      }
      return;
    }

    if (this.state === 'paused') {
      if (k === 'r') {
        this.resetLevel(game);
      } else if ((key === ' ' || k === 'space' || key === 'Enter') && this.stateTimer > 0.2) {
        this.state = 'playing';
        this.stateTimer = 0;
        if (L.bgMusic) L.bgMusic.play();
      }
      return;
    }

    if (this.state === 'complete' || this.state === 'gameover') {
      if (this.stateTimer > 0.4 && (key === ' ' || k === 'space' || key === 'Enter')) {
        if (this.state === 'complete') {
          if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
          if (this.boundClick) window.removeEventListener('click', this.boundClick);
          this.boundKeyDown = null;
          this.boundClick = null;
          if (typeof Game !== 'undefined' && Game.startLevel) {
            Game.levels[10] ? Game.startLevel(10) : Game.startLevel(1);
          }
        } else {
          this.resetLevel(game);
        }
      }
      return;
    }

    // NAVEGAÇÃO NOS CARTÕES DA INTRO
    if (this.state === 'intro_dialog') {
      if (this.introStep === 1) {
        if ((key === ' ' || k === 'space' || key === 'Enter') && this.stateTimer > 0.25) {
          this.introStep = 2;
          this.stateTimer = 0;
        }
        return;
      }

      if (this.introStep === 2) {
        // Mudar dificuldade com setas Esquerda / Direita ou A / D
        if (key === 'ArrowLeft' || k === 'a') {
          if (this.difficulty === 'hard') this.difficulty = 'medium';
          else if (this.difficulty === 'medium') this.difficulty = 'easy';
          this.applyDifficultySettings();
          return;
        }
        if (key === 'ArrowRight' || k === 'd') {
          if (this.difficulty === 'easy') this.difficulty = 'medium';
          else if (this.difficulty === 'medium') this.difficulty = 'hard';
          this.applyDifficultySettings();
          return;
        }

        if ((key === ' ' || k === 'space' || key === 'Enter') && this.stateTimer > 0.25) {
          this.state = 'playing';
          this.stateTimer = 0;

          if (L.bgMusic) {
            L.bgMusic.currentTime = 90;
            L.bgMusic.play();
          }
        }
        return;
      }
    }

    if (this.state === 'playing') {
      const lane = this.lanes.find(l => l.key === k || l.keyAlt === k || l.keyNav === key);
      if (!lane) return;

      const H = game.H || 480;
      const targetY = H - 70;

      let hitIdx = -1;
      let minDist = Infinity;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.lane === lane.id && !n.hit) {
          const dist = Math.abs(n.y - targetY);
          if (dist < this.hitWindow && dist < minDist) {
            minDist = dist;
            hitIdx = i;
          }
        }
      }

      if (hitIdx !== -1) {
        const note = this.notes[hitIdx];
        note.hit = true;

        this.streak++;
        if (this.streak >= 20) this.multiplier = 4;
        else if (this.streak >= 10) this.multiplier = 3;
        else if (this.streak >= 5) this.multiplier = 2;

        this.score += 100 * this.multiplier;
        this.rockMeter = Math.min(100, this.rockMeter + 4);

        if (minDist < 12) {
          this.feedbackText = 'PERFEITO!'; this.feedbackColor = '#4ade80';
        } else {
          this.feedbackText = 'BOA!'; this.feedbackColor = '#facc15';
        }
        this.feedbackTimer = 0.5;

        playGuitarHeroSound(lane.id, false);
      } else {
        this.streak = 0;
        this.multiplier = 1;
        this.rockMeter = Math.max(0, this.rockMeter - 5);
        this.feedbackText = 'UI..PÉSSIMO!'; this.feedbackColor = '#ef4444';
        this.feedbackTimer = 0.4;

        playGuitarHeroSound(lane.id, true);
      }
    }
  };

  L.update = function(dt, game) {
    this.timer += dt;
    this.stateTimer += dt;
    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;

    if (this.state === 'paused' || this.state === 'gameover' || this.state === 'complete' || this.state === 'intro_dialog') {
      if (this.state !== 'intro_dialog' && L.bgMusic && !L.bgMusic.paused) {
        L.bgMusic.pause();
      }
      return;
    }

    const H = game.H || 480;
    const targetY = H - 70;

    // Progresso (Vitória)
    this.showProgress += dt * 3.5;
    if (this.showProgress >= 100) {
      this.showProgress = 100;
      this.state = 'complete';
      this.stateTimer = 0;

      if (L.bgMusic) L.bgMusic.pause();
      return;
    }

    // Gerar Notas
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      const lane1 = Math.floor(Math.random() * 4);
      this.notes.push({ lane: lane1, y: 30, hit: false, missed: false });

      if (Math.random() < this.doubleNoteChance) {
        const lane2 = (lane1 + 1 + Math.floor(Math.random() * 3)) % 4;
        this.notes.push({ lane: lane2, y: 30, hit: false, missed: false });
      }
    }

    // Mover Notas
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      n.y += this.noteSpeed * dt;

      if (!n.hit && !n.missed && n.y > targetY + 40) {
        n.missed = true;
        this.streak = 0;
        this.multiplier = 1;
        this.rockMeter = Math.max(0, this.rockMeter - 7);
        this.feedbackText = 'PERDEU!'; this.feedbackColor = '#ef4444';
        this.feedbackTimer = 0.4;
      }

      if (n.y > H + 20) {
        this.notes.splice(i, 1);
      }
    }

    if (this.rockMeter <= 0) {
      this.state = 'gameover';
      this.stateTimer = 0;
      playGuitarHeroSound(0, true);
      if (L.bgMusic) L.bgMusic.pause();
    }
  };

  L.draw = function(ctx, game) {
    const W = game.W || 640;
    const H = game.H || 480;

    ctx.save();

    // 1. Fundo do Palco
    ctx.fillStyle = '#080914';
    ctx.fillRect(0, 0, W, H);

    // 2. Highway
    const highwayW = 280;
    const highwayX = (W - highwayW) / 2;
    const laneW = highwayW / 4;
    const targetY = H - 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(highwayX, 0, highwayW, H);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.strokeRect(highwayX, 0, highwayW, H);

    for (let i = 1; i < 4; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(highwayX + i * laneW, 0);
      ctx.lineTo(highwayX + i * laneW, H);
      ctx.stroke();
    }

    // Hit Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(highwayX, targetY - 18, highwayW, 36);
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(highwayX, targetY);
    ctx.lineTo(highwayX + highwayW, targetY);
    ctx.stroke();

    // Receptores
    this.lanes.forEach((lane, i) => {
      const lx = highwayX + i * laneW + laneW / 2;
      ctx.fillStyle = lane.color;
      ctx.beginPath();
      ctx.arc(lx, targetY, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(lx, targetY, 10, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText(lane.label, lx, H - 20);
    });

    // 3. Notas
    this.notes.forEach(n => {
      if (n.hit) return;
      const lane = this.lanes[n.lane];
      const lx = highwayX + n.lane * laneW + laneW / 2;

      ctx.save();
      ctx.fillStyle = n.missed ? '#475569' : lane.color;
      ctx.beginPath();
      ctx.arc(lx, n.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx - 4, n.y - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // 4. Personagens nas Laterais
    drawEngineCharacter(ctx, highwayX - 70, 110, { isTomas: true, timer: this.timer });
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('TOMÁS (BATERIA)', highwayX - 70, 150);

    drawEngineCharacter(ctx, highwayX - 70, 270, { emoji: '🧑🏻', hoodieColor: '#831843', shirtColor: '#ec4899', timer: this.timer });
    ctx.fillStyle = '#ec4899'; ctx.font = 'bold 10px monospace';
    ctx.fillText('HUGO (TECLAS)', highwayX - 70, 310);

    drawEngineCharacter(ctx, highwayX + highwayW + 70, 110, { emoji: '👨🏽', hoodieColor: '#0369a1', shirtColor: '#0284c7', timer: this.timer });
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 10px monospace';
    ctx.fillText('FREITAS (VOZ)', highwayX + highwayW + 70, 150);

    drawEngineCharacter(ctx, highwayX + highwayW + 70, 270, { emoji: '🧑🏽‍🦱', hoodieColor: '#581c87', shirtColor: '#a855f7', timer: this.timer });
    ctx.fillStyle = '#a855f7'; ctx.font = 'bold 10px monospace';
    ctx.fillText('DIGGA (GUITARRA)', highwayX + highwayW + 70, 310);

    // 5. HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    roundRectLocal(ctx, 15, H / 2 - 80, 24, 160, 6); ctx.fill();
    const fillH = (this.rockMeter / 100) * 152;
    ctx.fillStyle = this.rockMeter > 50 ? '#22c55e' : (this.rockMeter > 25 ? '#eab308' : '#ef4444');
    ctx.fillRect(19, H / 2 + 76 - fillH, 16, fillH);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ROCK', 27, H / 2 - 90);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    roundRectLocal(ctx, 15, 10, 80, 28, 6); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
    roundRectLocal(ctx, 15, 10, 80, 28, 6); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSA (P)', 55, 27);

    ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`${this.score} PTS`, W - 20, 35);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`MULT: x${this.multiplier}`, W - 20, 55);
    ctx.fillStyle = '#cbd5e1'; ctx.font = '11px monospace';
    ctx.fillText(`STREAK: ${this.streak}`, W - 20, 72);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`SHOW: ${Math.round(this.showProgress)}%`, W / 2, 22);

    if (this.feedbackTimer > 0) {
      ctx.fillStyle = this.feedbackColor;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.feedbackText, W / 2, targetY - 40);
    }

    // 6. TELAS DE PAUSA, INTRO (CARTÕES 1 E 2), FIM DE JOGO E VITÓRIA
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(6, 7, 19, 0.85)';
      ctx.fillRect(0, 0, W, H);

      const pBoxW = 320, pBoxH = 160;
      const pBoxX = (W - pBoxW) / 2, pBoxY = (H - pBoxH) / 2;

      ctx.fillStyle = '#0f172a'; roundRectLocal(ctx, pBoxX, pBoxY, pBoxW, pBoxH, 12); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; roundRectLocal(ctx, pBoxX, pBoxY, pBoxW, pBoxH, 12); ctx.stroke();

      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
      ctx.fillText('⏸ JOGO PAUSADO', W / 2, pBoxY + 35);

      ctx.fillStyle = '#f8fafc'; ctx.font = '12px monospace';
      ctx.fillText('[ ESPAÇO / P ] Continuar', W / 2, pBoxY + 75);
      ctx.fillText('[ R ] Recomeçar Nível', W / 2, pBoxY + 105);
    }

    // 7. Diálogos Iniciais Divididos em 2 Cartões
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
        ctx.font = typeof textFont === 'function' ? textFont(14, true) : 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('QUEST', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(13) : '13px monospace';
        
        const contentY = y + pad + 22;
        ctx.fillText('O Freitas precisa de ajuda...', x + pad, contentY);
        ctx.fillText('Os músicos dos Silentide apanharam salmonela no Paredes e não podem tocar!', x + pad, contentY + 18);
        ctx.fillText('Tu, o Digga e o Hugo vão ter de subir ao palco para salvar o concerto...', x + pad, contentY + 36);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para continuar ➔', x + w - pad, y + boxH - 14);
      }

      // CARTÃO 2: Instruções & Dificuldade
      else if (this.introStep === 2) {
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(14, true) : 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('INSTRUÇÕES', x + pad, y + pad + 2);

        ctx.fillStyle = '#fff'; 
        ctx.font = typeof textFont === 'function' ? textFont(13) : '13px monospace';
        
        const contentY = y + pad + 18;
        ctx.fillText('Carrega nas teclas no momento em que as notas passarem na linha amarela:', x + pad, contentY);

        ctx.font = typeof textFont === 'function' ? textFont(13, true) : 'bold 13px monospace';
        ctx.fillText('1/A/←: Tomás (Bateria)  |  2/S/↑: Hugo (Teclas)', x + pad, contentY + 16);
        ctx.fillText('3/D/↓: Freitas (Voz)    |  4/F/→: Digga (Guitarra)', x + pad, contentY + 30);

        // Seletor de Dificuldade
        ctx.fillStyle = '#ffffff'; 
        ctx.font = typeof textFont === 'function' ? textFont(13) : '13px monospace';
        ctx.fillText('DIFICULDADE:', x + pad, y + boxH - 14);

        const diffs = [
          { id: 'easy', label: 'FÁCIL', x: x + pad + 115 },
          { id: 'medium', label: 'MÉDIO', x: x + pad + 175 },
          { id: 'hard', label: 'DIFÍCIL', x: x + pad + 235 }
        ];

        ctx.textAlign = 'center';
        diffs.forEach(d => {
          const selected = this.difficulty === d.id;
          ctx.fillStyle = selected ? '#ffe27a' : 'rgba(255,255,255,0.15)';
          roundRectLocal(ctx, d.x - 24, y + boxH - 24, 48, 16, 4); ctx.fill();
          ctx.fillStyle = selected ? '#0f172a' : '#94a3b8';
          ctx.font = typeof textFont === 'function' ? textFont(9, true) : 'bold 9px monospace';
          ctx.fillText(d.label, d.x, y + boxH - 12);
        });

        // Prompt para começar
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe27a'; 
        ctx.font = typeof textFont === 'function' ? textFont(11, true) : 'bold 11px monospace';
        ctx.fillText('Pressiona [ ESPAÇO ] para começar!', x + w - pad, y + boxH - 14);
      }
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(6, 7, 19, 0.92)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
      ctx.fillText('💥 MUITO FRACO', W / 2, H / 2 - 10);
      ctx.fillText('A CARREIRA DO FREITAS ESTÁ EM RISCO!', W / 2, H / 2 + 10);
      ctx.fillStyle = '#ffffff'; ctx.font = '12px monospace';
      ctx.fillText('Pressiona [ ESPAÇO ] para tentar novamente', W / 2, H / 2 + 35);
    }

    if (this.state === 'complete') {
     const progress = Math.min(1, this.timer * 1.5);

      // Overlay de Fundo
      ctx.fillStyle = `rgba(16, 14, 26, ${0.9 * progress})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = progress;

      // Dimensões do Painel Retro
      const boxW = Math.min(W - 32, 340);
      const boxH = 290;
      const boxX = (W - boxW) / 2;
      const boxY = (H - boxH) / 2;

      // Fundo do Painel
      ctx.fillStyle = '#100e1a';
      roundRect(ctx, boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      // Moldura Dupla Dourada / Retro Arcade
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
      ctx.fillText('🏆 NÍVEL 9 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('CA GANDA CONCERTO!', W / 2, boxY + 54);

      // Cartão Central de Conquista Amorosa
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
      ctx.fillText('🎸', W / 2, cardY + 34);
      ctx.restore();
      
      ctx.fillStyle = '#ff6b8b';
      ctx.font = 'bold 14px ' + TEXT_FONT_STACK;
      ctx.fillText(`PONTUAÇÃO FINAL: ${this.score} PTS`, W / 2, cardY + 108);

      ctx.fillStyle = '#7fd97f';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ MELHOR CONCERTO DO FREITAS ATÉ HOJE', W / 2, cardY + 76);

      // Texto de Continuação
      if (this.timer > 0.6) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('Este palco nunca teve tanta classe...', W / 2, boxY + 195);
        
        ctx.fillStyle = '#ffe27a';
        ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Descobre o que ainda há por fazer!', W / 2, boxY + 213);
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
      }    }

    ctx.restore();
  };

  if (typeof Game !== 'undefined' && Game.addLevel) {
    Game.addLevel(9, L);
  }
})();