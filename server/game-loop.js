const GL = require('../shared/game-logic');

class GameLoop {
  constructor(room, roomManager) {
    this.room = room;
    this.rm = roomManager;
    this.G = GL.createInitialState();
    this.G.lv = [3, 3, 3, 3];
    this.G.stg = [true, false, true, false];
    this.pendingAction = null;
    this.pendingInterrupt = null;
    this.pendingTribute = null;
    this.running = false;
  }

  start() {
    this.running = true;
    this.newRound();
  }

  newRound() {
    this.G.rnd++;
    this.G.ph = 'deal';
    this.G.lp = null;
    this.G.lpp = -1;
    this.G.ps = 0;
    this.G.sel = [];
    this.G.played = [[], [], [], []];
    this.G.dn = [false, false, false, false];
    this.G.ord = [];

    const h3 = GL.deal(this.G);
    if (this.G.rnd === 1) {
      const t = h3 % 2;
      this.G.stg = [t === 0, t === 1, t === 0, t === 1];
    }
    this.G.hui = this.G.lv[this.G.stg.indexOf(true)];

    if (this.G.rnd > 1 && !this.G.noTr) {
      this.initTributePhase();
      return;
    }

    this.G.noTr = false;
    this.G.ph = 'play';
    this.G.turn = this.G.rnd === 1 ? h3 : (this.G.win >= 0 ? this.G.win : 0);
    this.broadcastStates();
    this.advanceTurn();
  }

  advanceTurn() {
    if (!this.running || this.G.ph !== 'play') return;

    if (this.G.dn[this.G.turn]) {
      this.G.turn = (this.G.turn + 1) % 4;
      this.skipDone();
      return;
    }

    const player = this.room.players.find(p => p.seat === this.G.turn);
    if (!player) return;

    if (player.isAI) {
      setTimeout(() => this.doAITurn(), 300 + Math.random() * 200);
    } else {
      this.rm.sendTo(this.room, this.G.turn, {
        type: 'your_turn',
        data: { canPass: !!(this.G.lp && this.G.lpp !== this.G.turn) },
      });
      this.broadcastStates();
    }
  }

  skipDone() {
    let s = 0;
    while (this.G.dn[this.G.turn] && s < 4) {
      this.G.turn = (this.G.turn + 1) % 4;
      s++;
    }
    if (s >= 4) {
      this.doEndRound();
      return;
    }
    this.advanceTurn();
  }

  doAITurn() {
    if (!this.running || this.G.ph !== 'play') return;
    const pi = this.G.turn;
    const play = GL.aiPick(this.G, pi);

    if (play) {
      const isCha = this.G.lp && this.G.lp.type === 'single' &&
        play.type === 'pair' && play.cards.every(c => c.r === this.G.lp.cards[0].r);
      const isDian = this.G.lp && this.G.lp.type === 'pair' && this.G._fromCha &&
        play.type === 'single' && play.cards[0].r === this.G.lp.cards[0].r;

      GL.execPlay(this.G, pi, play);
      if (isCha) this.G._fromCha = true;
      this.rm.broadcast(this.room, {
        type: 'action_result',
        data: { seat: pi, action: 'play', cards: play.cards, playType: play.type, isCha, isDian },
      });

      if (isDian) {
        this.G.lp = null;
        this.G.lpp = pi;
        this.G.ps = 0;
      }

      this.afterPlay(pi, isCha, isDian);
    } else {
      GL.execPass(this.G, pi);
      this.rm.broadcast(this.room, {
        type: 'action_result',
        data: { seat: pi, action: 'pass' },
      });
      this.afterPass();
    }
  }

  handlePlayerAction(seat, msg) {
    if (this.G.turn !== seat || this.G.ph !== 'play') return;

    if (msg.type === 'play') {
      const hand = this.G.hd[seat];
      const cards = msg.data.cards.map(id => hand.find(c => c.id === id)).filter(Boolean);
      if (!cards.length) return;

      const play = GL.detect(cards, this.G.hui);
      if (!play) {
        this.rm.sendTo(this.room, seat, { type: 'error', data: { message: '无效牌型' } });
        this.rm.sendTo(this.room, seat, {
          type: 'your_turn',
          data: { canPass: !!(this.G.lp && this.G.lpp !== seat) },
        });
        return;
      }

      const free = !this.G.lp || this.G.lpp === seat;
      let isCha = false, isDian = false;

      if (!free && !GL.beats(play, this.G.lp)) {
        if (this.G.lp.type === 'single' &&
          play.type === 'pair' && play.cards.every(c => c.r === this.G.lp.cards[0].r)) {
          isCha = true;
        } else if (this.G.lp.type === 'pair' && this.G._fromCha &&
          play.type === 'single' && play.cards[0].r === this.G.lp.cards[0].r) {
          isDian = true;
        } else {
          this.rm.sendTo(this.room, seat, { type: 'error', data: { message: '打不过' } });
          this.rm.sendTo(this.room, seat, {
            type: 'your_turn',
            data: { canPass: !!(this.G.lp && this.G.lpp !== seat) },
          });
          return;
        }
      }

      GL.execPlay(this.G, seat, play);
      if (isCha) this.G._fromCha = true;
      this.rm.broadcast(this.room, {
        type: 'action_result',
        data: { seat, action: 'play', cards: play.cards, playType: play.type, isCha, isDian },
      });

      if (isDian) {
        this.G.lp = null;
        this.G.lpp = seat;
        this.G.ps = 0;
      }

      this.afterPlay(seat, isCha, isDian);

    } else if (msg.type === 'pass') {
      if (!this.G.lp || this.G.lpp === seat) {
        this.rm.sendTo(this.room, seat, { type: 'error', data: { message: '必须出牌' } });
        return;
      }
      GL.execPass(this.G, seat);
      this.rm.broadcast(this.room, {
        type: 'action_result',
        data: { seat, action: 'pass' },
      });
      this.afterPass();
    }
  }

  afterPlay(seat, isCha, isDian) {
    if (this.G.hd[seat].length === 0 && !this.G.dn[seat]) {
      this.G.dn[seat] = true;
      this.G.ord.push(seat);
      this.rm.broadcast(this.room, {
        type: 'player_done',
        data: { seat, order: this.G.ord.length },
      });
      if (GL.shouldEndRound(this.G)) {
        this.doEndRound();
        return;
      }
    }

    if (isCha) {
      this.checkDianChain(seat, () => {
        this.G.turn = this.G.lpp;
        this.broadcastStates();
        this.advanceTurn();
      });
      return;
    }

    if (isDian) {
      this.G.turn = this.G.lpp;
      this.broadcastStates();
      this.advanceTurn();
      return;
    }

    this.checkChaChain(seat, () => {
      if (!this.G.lp) {
        this.G.turn = this.G.lpp;
        this.broadcastStates();
        this.advanceTurn();
        return;
      }
      this.G.turn = (this.G.turn + 1) % 4;
      this.skipDone();
    });
  }

  afterPass() {
    if (!this.G.lp) {
      this.G.turn = this.G.lpp;
      this.broadcastStates();
      this.advanceTurn();
      return;
    }
    this.G.turn = (this.G.turn + 1) % 4;
    this.skipDone();
  }

  checkChaChain(srcPlayer, callback) {
    const play = this.G.lp;
    if (!play || play.type !== 'single') {
      callback();
      return;
    }
    const chaRank = play.cards[0].r;

    const chaCandidates = [];
    for (let i = 1; i <= 3; i++) {
      const p = (srcPlayer + i) % 4;
      if (this.G.dn[p]) continue;
      if (this.G.hd[p].filter(c => c.r === chaRank).length >= 2) chaCandidates.push(p);
    }

    if (chaCandidates.length === 0) { callback(); return; }

    this.processChaCandidates(chaCandidates, 0, srcPlayer, callback);
  }

  processChaCandidates(candidates, idx, srcPlayer, callback) {
    if (idx >= candidates.length) { callback(); return; }

    const p = candidates[idx];
    const player = this.room.players.find(pl => pl.seat === p);

    if (player.isAI) {
      if (Math.random() > 0.3) {
        const chaRank = this.G.lp.cards[0].r;
        const matches = this.G.hd[p].filter(c => c.r === chaRank);
        const chaPlay = { type: 'pair', rk: GL.ef(matches[0], this.G.hui), cards: matches.slice(0, 2) };
        GL.execPlay(this.G, p, chaPlay);
        this.G._fromCha = true;
        this.rm.broadcast(this.room, {
          type: 'action_result',
          data: { seat: p, action: 'cha', cards: chaPlay.cards, playType: 'pair' },
        });
        this.checkDianChain(p, () => {
          this.G.turn = this.G.lpp;
          this.broadcastStates();
          this.advanceTurn();
        });
      } else {
        this.processChaCandidates(candidates, idx + 1, srcPlayer, callback);
      }
    } else {
      const chaRank = this.G.lp.cards[0].r;
      const matches = this.G.hd[p].filter(c => c.r === chaRank);
      this.rm.sendTo(this.room, p, {
        type: 'interrupt_req',
        data: {
          interruptType: 'cha',
          srcPlayer,
          srcCard: this.G.lp.cards[0],
          yourFours: matches.slice(0, 2),
        },
      });
      this.pendingInterrupt = {
        type: 'cha',
        seat: p,
        candidates,
        idx,
        srcPlayer,
        callback,
        timeout: setTimeout(() => {
          this.pendingInterrupt = null;
          this.processChaCandidates(candidates, idx + 1, srcPlayer, callback);
        }, 10000),
      };
    }
  }

  checkDianChain(chaPlayer, callback) {
    const chaRank = this.G.lp && this.G.lp.cards[0].r;
    if (!chaRank) {
      this.G.lp = null;
      this.G.lpp = chaPlayer;
      this.G.ps = 0;
      callback();
      return;
    }
    const dianCandidates = [];
    for (let i = 1; i <= 3; i++) {
      const p = (chaPlayer + i) % 4;
      if (this.G.dn[p] || p === chaPlayer) continue;
      if (this.G.hd[p].some(c => c.r === chaRank)) dianCandidates.push(p);
    }

    if (dianCandidates.length === 0) {
      this.G.lp = null;
      this.G.lpp = chaPlayer;
      this.G.ps = 0;
      callback();
      return;
    }

    this.processDianCandidates(dianCandidates, 0, chaPlayer, callback);
  }

  processDianCandidates(candidates, idx, chaPlayer, callback) {
    if (idx >= candidates.length) {
      this.G.lp = null;
      this.G.lpp = chaPlayer;
      this.G.ps = 0;
      callback();
      return;
    }

    const p = candidates[idx];
    const player = this.room.players.find(pl => pl.seat === p);

    if (player.isAI) {
      if (Math.random() > 0.5) {
        const chaRank = this.G.lp.cards[0].r;
        const f = this.G.hd[p].find(c => c.r === chaRank);
        const dp = { type: 'single', rk: GL.ef(f, this.G.hui), cards: [f] };
        GL.execPlay(this.G, p, dp);
        this.rm.broadcast(this.room, {
          type: 'action_result',
          data: { seat: p, action: 'dian', cards: dp.cards, playType: 'single' },
        });
        this.G.lp = null;
        this.G.lpp = p;
        this.G.ps = 0;
        callback();
      } else {
        this.processDianCandidates(candidates, idx + 1, chaPlayer, callback);
      }
    } else {
      const chaRank = this.G.lp.cards[0].r;
      const f = this.G.hd[p].find(c => c.r === chaRank);
      this.rm.sendTo(this.room, p, {
        type: 'interrupt_req',
        data: { interruptType: 'dian', chaPlayer, yourCard: f },
      });
      this.pendingInterrupt = {
        type: 'dian',
        seat: p,
        candidates,
        idx,
        chaPlayer,
        callback,
        timeout: setTimeout(() => {
          this.pendingInterrupt = null;
          this.processDianCandidates(candidates, idx + 1, chaPlayer, callback);
        }, 10000),
      };
    }
  }

  handleInterrupt(seat, msg) {
    if (!this.pendingInterrupt || this.pendingInterrupt.seat !== seat) return;

    const pi = this.pendingInterrupt;
    clearTimeout(pi.timeout);
    this.pendingInterrupt = null;

    if (pi.type === 'cha') {
      if (msg.type === 'cha_yes') {
        const chaRank = this.G.lp.cards[0].r;
        const matches = this.G.hd[seat].filter(c => c.r === chaRank);
        const chaPlay = { type: 'pair', rk: GL.ef(matches[0], this.G.hui), cards: matches.slice(0, 2) };
        GL.execPlay(this.G, seat, chaPlay);
        this.G._fromCha = true;
        this.rm.broadcast(this.room, {
          type: 'action_result',
          data: { seat, action: 'cha', cards: chaPlay.cards, playType: 'pair' },
        });
        this.checkDianChain(seat, () => {
          this.G.turn = this.G.lpp;
          this.broadcastStates();
          this.advanceTurn();
        });
      } else {
        this.processChaCandidates(pi.candidates, pi.idx + 1, pi.srcPlayer, pi.callback);
      }
    } else if (pi.type === 'dian') {
      if (msg.type === 'dian_yes') {
        const chaRank = this.G.lp.cards[0].r;
        const f = this.G.hd[seat].find(c => c.r === chaRank);
        const dp = { type: 'single', rk: GL.ef(f, this.G.hui), cards: [f] };
        GL.execPlay(this.G, seat, dp);
        this.rm.broadcast(this.room, {
          type: 'action_result',
          data: { seat, action: 'dian', cards: dp.cards, playType: 'single' },
        });
        this.G.lp = null;
        this.G.lpp = seat;
        this.G.ps = 0;
        pi.callback();
      } else {
        this.processDianCandidates(pi.candidates, pi.idx + 1, pi.chaPlayer, pi.callback);
      }
    }
  }

  initTributePhase() {
    this.G.ph = 'tribute';
    const ft = this.G.ord[0] % 2;
    const isDbl = this.G.ord.length >= 2 && this.G.ord[0] % 2 === this.G.ord[1] % 2;
    const emperor = this.G.ord[0];

    let losers = [], winners = [];
    if (isDbl) {
      for (let p = 0; p < 4; p++) {
        if (p % 2 !== ft) losers.push(p);
        else winners.push(p);
      }
    } else {
      let lastLoser = -1;
      for (let i = this.G.ord.length - 1; i >= 0; i--) {
        if (this.G.ord[i] % 2 !== ft) { lastLoser = this.G.ord[i]; break; }
      }
      if (lastLoser < 0) {
        this.G.noTr = false;
        this.G.ph = 'play';
        this.G.turn = this.G.win >= 0 ? this.G.win : 0;
        this.broadcastStates();
        this.advanceTurn();
        return;
      }
      losers = [lastLoser];
      winners = [emperor];
    }

    const steps = [];
    for (let i = 0; i < losers.length; i++) {
      const lo = losers[i], wi = winners[i % winners.length];
      steps.push({ direction: 'tribute', from: lo, to: wi });
      steps.push({ direction: 'return', from: wi, to: lo });
    }

    this.tributeData = { steps, stepIdx: 0, log: [] };
    this.broadcastStates();
    this.processTributeStep();
  }

  processTributeStep() {
    if (!this.running) return;
    const td = this.tributeData;
    if (td.stepIdx >= td.steps.length) {
      this.rm.broadcast(this.room, { type: 'tribute_done', data: { log: td.log } });
      this.startPlayAfterTribute();
      return;
    }

    const step = td.steps[td.stepIdx];
    const player = this.room.players.find(p => p.seat === step.from);
    const hand = this.G.hd[step.from];

    if (player.isAI) {
      const sorted = GL.srt(hand, this.G.hui);
      const card = step.direction === 'tribute' ? sorted[sorted.length - 1] : sorted[0];
      setTimeout(() => this.resolveTributeCard(card), 500);
      return;
    }

    const names = this.room.players.map(p => p.nickname);
    this.rm.sendTo(this.room, step.from, {
      type: 'tribute_req',
      data: {
        direction: step.direction,
        toSeat: step.to,
        title: step.direction === 'tribute' ? '选择上供牌' : '选择回牌',
        desc: step.direction === 'tribute'
          ? '选一张牌上供给' + names[step.to]
          : '选一张牌回给' + names[step.to],
      },
    });

    this.pendingTribute = {
      step,
      timeout: setTimeout(() => {
        this.pendingTribute = null;
        const sorted = GL.srt(hand, this.G.hui);
        const card = step.direction === 'tribute' ? sorted[sorted.length - 1] : sorted[0];
        this.resolveTributeCard(card);
      }, 30000),
    };
  }

  handleTributePick(seat, msg) {
    if (!this.pendingTribute) return;
    const step = this.pendingTribute.step;
    if (step.from !== seat) return;

    clearTimeout(this.pendingTribute.timeout);
    this.pendingTribute = null;

    const cardId = msg.data && msg.data.card;
    const hand = this.G.hd[seat];
    const card = hand.find(c => c.id === cardId);
    if (!card) {
      const sorted = GL.srt(hand, this.G.hui);
      this.resolveTributeCard(step.direction === 'tribute' ? sorted[sorted.length - 1] : sorted[0]);
      return;
    }
    this.resolveTributeCard(card);
  }

  resolveTributeCard(card) {
    const step = this.tributeData.steps[this.tributeData.stepIdx];
    this.G.hd[step.from] = this.G.hd[step.from].filter(c => c.id !== card.id);
    this.G.hd[step.to].push(card);

    const names = this.room.players.map(p => p.nickname);
    this.tributeData.log.push({
      from: step.from, to: step.to, card, direction: step.direction,
    });

    this.rm.broadcast(this.room, {
      type: 'tribute_result',
      data: {
        from: step.from, to: step.to, card, direction: step.direction,
        fromName: names[step.from], toName: names[step.to],
      },
    });

    this.broadcastStates();
    this.tributeData.stepIdx++;
    setTimeout(() => this.processTributeStep(), 800);
  }

  startPlayAfterTribute() {
    for (let p = 0; p < 4; p++) {
      this.G.hd[p] = GL.srt(this.G.hd[p], this.G.hui);
    }
    this.G.noTr = false;
    this.G.ph = 'play';
    this.G.turn = this.G.win >= 0 ? this.G.win : 0;
    this.broadcastStates();
    this.advanceTurn();
  }

  doEndRound() {
    this.G.ph = 'end';
    const res = GL.endRound(this.G);

    this.rm.broadcast(this.room, {
      type: 'round_end',
      data: {
        result: res,
        ord: this.G.ord,
        lv: this.G.lv,
        stg: this.G.stg,
      },
    });

    if (res.go) {
      this.running = false;
      this.rm.broadcast(this.room, {
        type: 'game_over',
        data: { winner: this.G.lv[0] >= 15 ? 'A' : 'B', lv: this.G.lv },
      });
      return;
    }

    setTimeout(() => {
      if (this.running) this.newRound();
    }, 3000);
  }

  buildClientState(seatIndex) {
    return {
      yourHand: this.G.hd[seatIndex],
      yourSeat: seatIndex,
      turn: this.G.turn,
      lastPlay: this.G.lp,
      lastPlayPlayer: this.G.lpp,
      passCount: this.G.ps,
      playedCards: this.G.played,
      lv: this.G.lv,
      stg: this.G.stg,
      hui: this.G.hui,
      dn: this.G.dn,
      ord: this.G.ord,
      rnd: this.G.rnd,
      ph: this.G.ph,
      noTr: this.G.noTr,
      win: this.G.win,
      seatNames: this.room.players.map(p => p.nickname),
    };
  }

  broadcastStates() {
    for (const player of this.room.players) {
      if (player.isAI || !player.ws || player.ws.readyState !== 1) continue;
      const state = this.buildClientState(player.seat);
      player.ws.send(JSON.stringify({ type: 'state_sync', data: state }));
    }
  }
}

module.exports = GameLoop;
