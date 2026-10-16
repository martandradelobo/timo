/* ============================================================================
 * TOMÁS: THE QUEST — LEVEL 11: O LABIRINTO DA SALA DE CINEMA
 * ==========================================================================*/
(function() {
  const L = { id: 11 };
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
      Toast.show('🎬 LEVEL 11 — CINE TIME', 3.5);
    }

    // Pequeno atraso para evitar que a tecla ESPAÇO vinda do Nível 10 feche o diálogo imediatamente
    setTimeout(() => {
      // Se entretanto saíste deste nível (ex: ESC -> selecionaste outro), não mostres este diálogo
      const g = (typeof Game !== 'undefined') ? Game : window.Game;
      if (g && g.current !== L) return;
      if (typeof Dialogue !== 'undefined' && Dialogue.say) {
        Dialogue.say('📜 QUEST', 'O cinema está super escuro e um gelo! Precisas de apanhar Pipocas 🍿, uma Bebida 🥤 e um Casaco 🧥 para a Kiu antes de ires para o teu lugar! Usa [ESPAÇO] para apanhares os objetos.');
      }
    }, 150);
  };

  L.exit = function() {};

  L.resetLevel = function(game) {
    this.timer = 0;
    this.completeTimer = 0;
    this.phase = 'get_snacks'; // 'get_snacks' | 'get_ticket' | 'find_seat' | 'complete'
    
    // Inventário
    this.hasPopcorn = false;
    this.hasDrink = false;
    this.hasJacket = false;
    this.hasSeatNumber = false;
    this.assignedSeatStr = 'Cadeira L-18';
    this.cooldownInteract = 0;

    // Histórico de posições para os objetos seguirem o Tomás
    this.posHistory = [];

    // Configuração do Mapa Expandido (20 Colunas x 13 Linhas)
    this.cols = 20;
    this.rows = 13;
    this.tileW = 32;
    this.tileH = 30;
    this.offsetX = 0;
    this.offsetY = 40;

    // Posição inicial no corredor inferior
    this.player = {
      x: this.offsetX + (1.5 * this.tileW), // Coluna 1
      y: this.offsetY + (11.5 * this.tileH), // Linha 11
      w: 16,
      h: 20,
      speed: 135,
      dir: 'up',
      step: 0
    };

    /* =========================================================================
     * LEGENDA DO MAPA:
     * 0 = Corredor Livre
     * 1 = Poltronas de Cinema (Sólidas)
     * 2 = Fila Suja / Pipocas entornadas (Sólida)
     * 3 = Espectador Agressivo / A Dormir (Sólido)
     * 4 = Zona Escura (Ativa Lanterna)
     * 5 = Stand de Pipocas 🍿
     * 6 = Stand de Bebidas 🥤
     * 7 = Painel de Bilhetes 🎟️
     * 8 = Cabide / Casaco 🧥
     * =========================================================================*/
    this.map = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0
      [1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1], // Row 1 (Kiu na col 16, Tomás na col 15)
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1], // Row 2
      [1, 1, 0, 1, 3, 3, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 3
      [6, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], // Row 4 (6 = Bebidas)
      [1, 1, 4, 4, 4, 4, 1, 0, 1, 4, 4, 4, 4, 1, 0, 0, 0, 1, 0, 1], // Row 5
      [1, 1, 2, 2, 1, 4, 1, 0, 1, 4, 1, 1, 4, 1, 0, 1, 0, 1, 0, 1], // Row 6
      [1, 1, 1, 1, 1, 4, 0, 0, 0, 4, 1, 1, 4, 0, 0, 1, 0, 0, 0, 1], // Row 7
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 4, 1], // Row 8
      [0, 1, 1, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 1, 0, 0, 0, 1, 4, 1], // Row 9
      [0, 1, 1, 1, 1, 1, 0, 4, 1, 1, 4, 1, 0, 1, 1, 1, 0, 1, 5, 1], // Row 10 (5 = Pipocas)
      [0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // Row 11
      [0, 0, 1, 1, 8, 0, 0, 0, 1, 7, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0]  // Row 12 (8 = Casaco, 7 = Bilhetes)
    ];

    this.ticketStand = { col: 9, row: 12 };
    this.popcornStand = { col: 18, row: 10 };
    this.drinkStand = { col: 0, row: 4 };
    this.jacketStand = { col: 4, row: 12 };
    this.kiuSeat = { col: 16, row: 1 };
    this.targetSeat = { col: 15, row: 1 };
  };

  L.getTileAt = function(x, y) {
    let col = Math.floor((x - this.offsetX) / this.tileW);
    let row = Math.floor((y - this.offsetY) / this.tileH);
    return { col, row };
  };

  L.isSolidTile = function(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
    let val = this.map[row][col];
    
    // Poltronas, Fila suja e Espectador são sempre sólidos
    if (val === 1 || val === 2 || val === 3) return true;

    // Stands só são sólidos se o objeto ainda NÃO tiver sido recolhido
    if (val === 5 && !this.hasPopcorn) return true;
    if (val === 6 && !this.hasDrink) return true;
    if (val === 7 && !this.hasSeatNumber) return true;
    if (val === 8 && !this.hasJacket) return true;

    return false;
  };

  L.update = function(dt) {
    const inp = (typeof Input !== 'undefined') ? Input : { down: () => false, once: () => false };

    // TRANSIÇÃO PARA O NÍVEL 12
    if (this.phase === 'complete') {
      this.completeTimer += dt;
      if (this.completeTimer > 1.2 && (inp.once(' ') || inp.once('Enter'))) {
        const g = this.gameRef || (typeof Game !== 'undefined' ? Game : window.Game);
        if (g && typeof g.nextLevel === 'function') {
          g.nextLevel();
        } else if (g && typeof g.startLevel === 'function') {
          g.startLevel(12);
        }
      }
      return;
    }

    this.timer += dt;
    if (this.cooldownInteract > 0) this.cooldownInteract -= dt;

    // Registar histórico do rasto de movimento
    if (!this.posHistory) this.posHistory = [];
    this.posHistory.unshift({ x: this.player.x, y: this.player.y });
    if (this.posHistory.length > 100) this.posHistory.pop();

    let dx = 0, dy = 0;
    if (inp.down('ArrowLeft') || inp.down('a') || inp.down('A')) { dx -= 1; this.player.dir = 'left'; }
    if (inp.down('ArrowRight') || inp.down('d') || inp.down('D')) { dx += 1; this.player.dir = 'right'; }
    if (inp.down('ArrowUp') || inp.down('w') || inp.down('W')) { dy -= 1; this.player.dir = 'up'; }
    if (inp.down('ArrowDown') || inp.down('s') || inp.down('S')) { dy += 1; this.player.dir = 'down'; }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      this.player.step += dt * 8;
    } else {
      this.player.step = 0;
    }

    let moveDist = this.player.speed * dt;
    let r = 6;

    if (dx !== 0) {
      let nextX = this.player.x + dx * moveDist;
      let t1 = this.getTileAt(nextX + (dx > 0 ? r : -r), this.player.y - r);
      let t2 = this.getTileAt(nextX + (dx > 0 ? r : -r), this.player.y + r);

      if (!this.isSolidTile(t1.col, t1.row) && !this.isSolidTile(t2.col, t2.row)) {
        this.player.x = nextX;
      }
    }

    if (dy !== 0) {
      let nextY = this.player.y + dy * moveDist;
      let t1 = this.getTileAt(this.player.x - r, nextY + (dy > 0 ? r : -r));
      let t2 = this.getTileAt(this.player.x + r, nextY + (dy > 0 ? r : -r));

      if (!this.isSolidTile(t1.col, t1.row) && !this.isSolidTile(t2.col, t2.row)) {
        this.player.y = nextY;
      }
    }

    // Interações
    if (inp.once(' ') || inp.once('Enter') || inp.once('e') || inp.once('E')) {
      this.checkInteractions();
    }

    // Chegada à Cadeira L-18
    let currentTile = this.getTileAt(this.player.x, this.player.y);
    if (this.hasSeatNumber && currentTile.col === this.targetSeat.col && currentTile.row === this.targetSeat.row) {
      this.phase = 'complete';
      this.completeTimer = 0;
      if (typeof Dialogue !== 'undefined' && Dialogue.say) {
        Dialogue.say('❤️ KIU', 'Obrigada amorzinho!!! Mas eu nem sequer tenho frio nem queria pipocas juro-te 🍿🥤🧥🎟️✨');
      }
    }
  };

  L.checkInteractions = function() {
    if (this.cooldownInteract > 0) return;
    this.cooldownInteract = 0.4;

    let pTile = this.getTileAt(this.player.x, this.player.y);

    // 1. Stand de Pipocas
    if (Math.abs(pTile.col - this.popcornStand.col) <= 1 && Math.abs(pTile.row - this.popcornStand.row) <= 1) {
      if (!this.hasPopcorn) {
        this.hasPopcorn = true;
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('Pipocas! 🍿', 'Já sabes que provavelmente vais ter de comer 3/4...');
        }
      }
      this.checkSnacksStatus();
      return;
    }

    // 2. Stand de Bebidas
    if (Math.abs(pTile.col - this.drinkStand.col) <= 1 && Math.abs(pTile.row - this.drinkStand.row) <= 1) {
      if (!this.hasDrink) {
        this.hasDrink = true;
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('Coca-cola! 🥤', 'É bom que tenhas confirmado que era Zero...');
        }
      }
      this.checkSnacksStatus();
      return;
    }

    // 3. Cabide do Casaco
    if (Math.abs(pTile.col - this.jacketStand.col) <= 1 && Math.abs(pTile.row - this.jacketStand.row) <= 1) {
      if (!this.hasJacket) {
        this.hasJacket = true;
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('Casaquinho! 🧥', 'Assim a Kiu já não tem frio!');
        }
      }
      this.checkSnacksStatus();
      return;
    }

    // 4. Painel do Bilhete
    if (Math.abs(pTile.col - this.ticketStand.col) <= 1 && Math.abs(pTile.row - this.ticketStand.row) <= 1) {
      if (!this.hasPopcorn || !this.hasDrink || !this.hasJacket) {
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('🎟️', 'É melhor ires buscar as Pipocas 🍿, a Bebida 🥤 e o Casaco 🧥 primeiro!');
        }
      } else if (!this.hasSeatNumber) {
        this.hasSeatNumber = true;
        this.phase = 'find_seat';
        if (typeof Dialogue !== 'undefined' && Dialogue.say) {
          Dialogue.say('🎟️', `Bilhete encontrado! O teu lugar é o ${this.assignedSeatStr}.\nA Kiu já está sentada ao teu lado!`);
        }
      }
      return;
    }

    // Obstáculos
    let frontX = this.player.x + (this.player.dir === 'right' ? 20 : this.player.dir === 'left' ? -20 : 0);
    let frontY = this.player.y + (this.player.dir === 'down' ? 20 : this.player.dir === 'up' ? -20 : 0);
    let fTile = this.getTileAt(frontX, frontY);
    let val = (this.map[fTile.row] && this.map[fTile.row][fTile.col]) || 0;

    if (val === 2 && typeof Dialogue !== 'undefined' && Dialogue.say) {
      Dialogue.say('🧹 FILA BLOQUEADA', 'Chão super pegajoso com refrigerante entornado. É melhor dar a volta!');
    } else if (val === 3 && typeof Dialogue !== 'undefined' && Dialogue.say) {
      Dialogue.say('🧔 ESPECTADOR A DORMIR', 'Um homem enorme a ressonar a ocupar o corredor inteiro!');
    }
  };

  L.checkSnacksStatus = function() {
    if (this.hasPopcorn && this.hasDrink && this.hasJacket && this.phase === 'get_snacks') {
      this.phase = 'get_ticket';
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show('✅ ITEMS OBTIDOS! SÓ FALTA O BILHETE 🎟️', 3.5);
      }
    }
  };

  L.draw = function(ctx) {
    if (!ctx) return;
    const W = ctx.canvas ? ctx.canvas.width : 640;
    const H = ctx.canvas ? ctx.canvas.height : 480;

    ctx.save();

    // 1. Fundo do Cinema
    const bgGrad = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, H * 0.9);
    bgGrad.addColorStop(0, '#0b0f24');
    bgGrad.addColorStop(1, '#030409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Luzes de teto (apliques quentes ao longo do corredor superior)
    for (let lx = 24; lx < W; lx += 58) {
      const flicker = 0.5 + Math.sin(this.timer * 2 + lx * 0.3) * 0.15;
      const lg = ctx.createRadialGradient(lx, this.offsetY - 6, 1, lx, this.offsetY - 6, 26);
      lg.addColorStop(0, `rgba(255, 214, 140, ${flicker})`);
      lg.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, this.offsetY - 6, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 224, 170, ${flicker + 0.2})`;
      ctx.beginPath(); ctx.arc(lx, this.offsetY - 6, 2.4, 0, Math.PI * 2); ctx.fill();
    }

    // Ecrã de Projeção na Parte Inferior (Em Baixo)
    let screenY = H - 32;
    let screenGlow = Math.sin(this.timer * 3) * 0.15 + 0.85;

    // Feixe Luminoso de Projeção (de baixo para cima)
    let projGrad = ctx.createLinearGradient(W / 2, screenY, W / 2, 20);
    projGrad.addColorStop(0, 'rgba(254, 240, 138, 0.14)');
    projGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
    ctx.fillStyle = projGrad;
    ctx.beginPath();
    ctx.moveTo(40, screenY);
    ctx.lineTo(W - 40, screenY);
    ctx.lineTo(W / 2 + 40, 20);
    ctx.lineTo(W / 2 - 40, 20);
    ctx.closePath();
    ctx.fill();

    // Cortinas de veludo a enquadrar o ecrã
    const curtainCols = ['#4c0519', '#7f1d3a', '#4c0519'];
    [0, 1].forEach((side) => {
      const baseX = side === 0 ? 0 : W;
      const dir = side === 0 ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const cx = baseX + dir * (i * 11);
        const cw = 34 - i * 4;
        ctx.fillStyle = curtainCols[i % curtainCols.length];
        ctx.beginPath();
        ctx.moveTo(cx, screenY + 24);
        ctx.quadraticCurveTo(cx + dir * cw * 0.6, screenY - 60, cx + dir * cw, 12);
        ctx.lineTo(cx + dir * (cw + 10), 12);
        ctx.quadraticCurveTo(cx + dir * (cw * 0.6 + 10), screenY - 54, cx + dir * 10, screenY + 26);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Moldura do Ecrã no Fundo
    ctx.fillStyle = `rgba(254, 240, 138, ${screenGlow * 0.9})`;
    roundRect(ctx, 40, screenY, W - 80, 26, 6); ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#1e1b4b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎬 ESTREIA EXCLUSIVA', W / 2, screenY + 13);

    // 2. Renderização do Labirinto
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let x = this.offsetX + c * this.tileW;
        let y = this.offsetY + r * this.tileH;
        let val = this.map[r][c];

        if (val === 1) { // Poltronas de cinema (encosto + apoios de braço)
          const seatCx = x + this.tileW / 2;
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          roundRect(ctx, x + 3, y + this.tileH - 7, this.tileW - 6, 5, 2); ctx.fill();

          ctx.fillStyle = '#6b0f26';
          roundRect(ctx, x + 2, y + 6, this.tileW - 4, this.tileH - 8, 3); ctx.fill();
          ctx.fillStyle = '#9f1239';
          roundRect(ctx, x + 4, y + 7, this.tileW - 8, this.tileH - 12, 2); ctx.fill();
          // Encosto de cabeça
          ctx.fillStyle = '#7f1d3a';
          roundRect(ctx, seatCx - 7, y + 1, 14, 9, 3); ctx.fill();
          // Apoios de braço
          ctx.fillStyle = '#450a19';
          ctx.fillRect(x + 1, y + 10, 3, this.tileH - 14);
          ctx.fillRect(x + this.tileW - 4, y + 10, 3, this.tileH - 14);
          // Brilho superior
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(x + 5, y + 7, this.tileW - 10, 2);
        } else if (val === 2) { // Pipocas entornadas / chão pegajoso
          ctx.fillStyle = '#3a2410';
          roundRect(ctx, x + 2, y + 2, this.tileW - 4, this.tileH - 4, 3); ctx.fill();
          ctx.fillStyle = 'rgba(255, 220, 130, 0.12)';
          ctx.beginPath(); ctx.ellipse(x + this.tileW / 2, y + this.tileH / 2 + 2, this.tileW / 2 - 4, this.tileH / 2 - 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🍿', x + this.tileW / 2 - 6, y + this.tileH / 2 - 2);
          ctx.fillText('🍿', x + this.tileW / 2 + 7, y + this.tileH / 2 + 4);
        } else if (val === 3) { // Espectador a dormir (bloqueia o corredor, ressona)
          ctx.fillStyle = '#1e293b';
          roundRect(ctx, x + 2, y + 2, this.tileW - 4, this.tileH - 4, 4); ctx.fill();
          ctx.fillStyle = '#334155';
          roundRect(ctx, x + 4, y + 4, this.tileW - 8, this.tileH - 10, 3); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('😴', x + this.tileW / 2, y + this.tileH / 2 + 1);
          const zBob = Math.sin(this.timer * 2 + x) * 2;
          ctx.font = 'bold 8px sans-serif'; ctx.fillStyle = 'rgba(148, 197, 255, 0.8)';
          ctx.fillText('Z z', x + this.tileW / 2 + 9, y + 3 + zBob);
        } else if (val === 0 || val === 4 || val === 5 || val === 6 || val === 7 || val === 8) { // Corredores & Objetos
          // Carpete de cinema (padrão em losango subtil)
          ctx.fillStyle = '#121233';
          ctx.fillRect(x, y, this.tileW, this.tileH);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.10)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + this.tileW / 2, y); ctx.lineTo(x + this.tileW, y + this.tileH / 2);
          ctx.lineTo(x + this.tileW / 2, y + this.tileH); ctx.lineTo(x, y + this.tileH / 2);
          ctx.closePath(); ctx.stroke();
          ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
          ctx.fillRect(x + 1, y + this.tileH - 2, 2, 2);

          const isStand = (val === 5 || val === 6 || val === 7 || val === 8);
          const stillNeeded =
            (val === 5 && !this.hasPopcorn) || (val === 6 && !this.hasDrink) ||
            (val === 7 && !this.hasSeatNumber) || (val === 8 && !this.hasJacket);

          if (isStand && stillNeeded) {
            const bob = Math.sin(this.timer * 3 + x * 0.2) * 2;
            const cx = x + this.tileW / 2, cy = y + this.tileH / 2;

            // Sombra simples por baixo do objeto (sem plataforma nem brilho)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(cx, y + this.tileH - 5, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const icon = val === 5 ? '🍿' : val === 6 ? '🥤' : val === 7 ? '🎟️' : '🧥';
            ctx.fillText(icon, cx, cy - 2 + bob);
          }
        }
      }
    }

    // Destacar Cadeira L-18 após obter o bilhete (holofote vindo do teto)
    if (this.hasSeatNumber) {
      let targetX = this.offsetX + this.targetSeat.col * this.tileW;
      let targetY = this.offsetY + this.targetSeat.row * this.tileH;
      let cx = targetX + this.tileW / 2, cy = targetY + this.tileH / 2;
      let pulse = Math.sin(this.timer * 8) * 0.25 + 0.75;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(cx - 3, 0); ctx.lineTo(cx + 3, 0);
      ctx.lineTo(cx + 16, cy); ctx.lineTo(cx - 16, cy);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`; ctx.lineWidth = 2;
      roundRect(ctx, targetX + 1, targetY + 1, this.tileW - 2, this.tileH - 2, 4); ctx.stroke();
    }

    // Desenhar a Kiu
    let kiuX = this.offsetX + this.kiuSeat.col * this.tileW + this.tileW / 2;
    let kiuY = this.offsetY + this.kiuSeat.row * this.tileH + this.tileH / 2;
    this.drawKiu(ctx, kiuX, kiuY);

    // Desenhar Tomás
    if (typeof drawPlayer === 'function') {
      drawPlayer(ctx, this.player);
    }

    // 3. Desenhar Objetos Recolhidos a Seguir o Tomás
    let followers = [];
    if (this.hasPopcorn) followers.push('🍿');
    if (this.hasDrink) followers.push('🥤');
    if (this.hasJacket) followers.push('🧥');
    if (this.hasSeatNumber) followers.push('🎟️');

    for (let i = 0; i < followers.length; i++) {
      let delayIndex = (i + 1) * 12;
      let pos = (this.posHistory && this.posHistory[Math.min(delayIndex, this.posHistory.length - 1)]) || { x: this.player.x, y: this.player.y };
      let floatY = Math.sin(this.timer * 6 + i * 1.5) * 3;

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = emojiFont(16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(followers[i], pos.x, pos.y - 12 + floatY);
    }

    // 4. Efeito de Lanterna em Zonas Escuras (Tile 4)
    let pTile = this.getTileAt(this.player.x, this.player.y);
    let inDarkZone = (this.map[pTile.row] && this.map[pTile.row][pTile.col] === 4);

    if (inDarkZone) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
      ctx.fillRect(0, 0, W, H);

      let lightGrad = ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, 105);
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 1.0)');
      lightGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.3)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(this.player.x, this.player.y, 105, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.beginPath(); ctx.arc(this.player.x, this.player.y, 105, 0, Math.PI * 2);
      ctx.fillStyle = lightGrad; ctx.fill();
    }

    // 5. HUD Superior em estilo "bilhete de cinema"
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    roundRect(ctx, 10, 5, W - 20, 30, 6); ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
    roundRect(ctx, 10, 5, W - 20, 30, 6); ctx.stroke();

    const chips = [
      { icon: '🍿', on: this.hasPopcorn },
      { icon: '🥤', on: this.hasDrink },
      { icon: '🧥', on: this.hasJacket },
      { icon: '🎟️', on: this.hasSeatNumber, label: this.hasSeatNumber ? 'L-18' : null }
    ];
    let chipX = 18;
    ctx.textBaseline = 'middle';
    for (const chip of chips) {
      const chipW = chip.label ? 46 : 28;
      ctx.fillStyle = chip.on ? 'rgba(74, 222, 128, 0.22)' : 'rgba(248, 113, 113, 0.16)';
      roundRect(ctx, chipX, 11, chipW, 18, 5); ctx.fill();
      ctx.strokeStyle = chip.on ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, chipX, 11, chipW, 18, 5); ctx.stroke();

      ctx.globalAlpha = chip.on ? 1 : 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.font = emojiFont(14); ctx.textAlign = 'left';
      ctx.fillText(chip.icon, chipX + 4, 20);
      ctx.globalAlpha = 1;

      if (chip.label) {
        ctx.fillStyle = '#86efac'; ctx.font = 'bold 8px monospace';
        ctx.fillText(chip.label, chipX + 20, 20);
      } else if (chip.on) {
        ctx.fillStyle = '#86efac'; ctx.font = 'bold 9px monospace';
        ctx.fillText('✓', chipX + 18, 20);
      }
      chipX += chipW + 6;
    }

    // Linha de perfuração estilo canhoto de bilhete
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)'; ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(chipX + 2, 9); ctx.lineTo(chipX + 2, 31); ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px monospace';
    ctx.fillText(inDarkZone ? '🔦 LANTERNA' : '🎬 SALA XVISION', W - 18, 24);

    // --- CENA 3: COMPLETO / OVERLAY RETRO LEVEL COMPLETE ---
    if (this.phase === 'complete') {
      const progress = Math.min(1, this.completeTimer * 1.5);

      // Overlay de Fundo
      ctx.fillStyle = `rgba(16, 14, 26, ${0.9 * progress})`;
      ctx.fillRect(0, 0, W, H);

      // Holofotes a varrer por trás do painel
      const sweep = Math.sin(this.completeTimer * 0.8) * 0.4;
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.globalAlpha = 0.12 * progress;
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.moveTo(W / 2 + side * 20, H);
        ctx.lineTo(W / 2 + side * 20 + (sweep + side * 0.5) * 260, 0);
        ctx.lineTo(W / 2 + side * 20 + (sweep + side * 0.5) * 260 + 60, 0);
        ctx.lineTo(W / 2 + side * 80, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

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
      ctx.fillText('🏆 NÍVEL 11 CONCLUÍDO', W / 2, boxY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ' + TEXT_FONT_STACK;
      ctx.fillText('SESSÃO DE CINEMA!', W / 2, boxY + 54);

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

      // Destaque do Coração
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
      ctx.fillText('✓ ENCONTRO NO CINEMA CONCLUÍDO', W / 2, cardY + 76);

      // Texto de Continuação
      if (this.completeTimer > 0.6) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px ' + TEXT_FONT_STACK;
        ctx.fillText('O teu plano preferido foi bem-sucedido!', W / 2, boxY + 195);
        
        ctx.fillStyle = '#ffe27a';
        ctx.font = 'italic 11px ' + TEXT_FONT_STACK;
        ctx.fillText('Haverá mais por descobrir?', W / 2, boxY + 213);
      }

      // Botão Continuar
      if (this.completeTimer > 1.2) {
        const pulse = Math.sin(this.completeTimer * 6) * 0.2 + 0.8;
        
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
    ctx.restore();
  };

  // Renderizador da Kiu
  L.drawKiu = function(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    let bob = Math.sin(this.timer * 4) * 1.2;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 16 + bob, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sapatilhas
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, -8, 12 + bob, 6, 4, 1); ctx.fill();
    roundRect(ctx, 2, 12 + bob, 6, 4, 1); ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-7, 14 + bob, 4, 1);
    ctx.fillRect(3, 14 + bob, 4, 1);

    // Calças
    ctx.fillStyle = '#6366f1';
    roundRect(ctx, -6, 4 + bob, 5, 9, 1); ctx.fill();
    roundRect(ctx, 1, 4 + bob, 5, 9, 1); ctx.fill();

    // Hoodie Rosa
    ctx.fillStyle = '#f43f5e';
    roundRect(ctx, -8, -5 + bob, 16, 10, 2); ctx.fill();
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(-4, -3 + bob, 8, 8);

    // Braços
    ctx.fillStyle = '#f43f5e';
    roundRect(ctx, -10, -3 + bob, 3, 7, 1); ctx.fill();
    roundRect(ctx, 7, -3 + bob, 3, 5, 1); ctx.fill();
    ctx.fillStyle = '#fed7aa';
    roundRect(ctx, -10, 3 + bob, 3, 3, 1); ctx.fill();
    roundRect(ctx, 6, 1 + bob, 3, 3, 1); ctx.fill();

    // Cabeça com emoji 👱🏼‍♀️
    ctx.font = emojiFont(22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👱🏼‍♀️', 0, -14 + bob);

    ctx.restore();
  };

  // Registo do Nível
  function tryRegister() {
    const g = (typeof Game !== 'undefined') ? Game : window.Game;
    if (g && typeof g.addLevel === 'function') {
      g.addLevel(11, L);
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
