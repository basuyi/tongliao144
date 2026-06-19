const WebSocket = require('ws');
const GL = require('../shared/game-logic');

const SERVER = process.env.SERVER_URL || 'ws://39.96.47.193/ws';

class WSClient {
  constructor() { this.queue = []; this.waiters = []; this.allMsgs = []; }
  async connect() {
    this.ws = await new Promise((res, rej) => {
      const w = new WebSocket(SERVER);
      w.on('open', () => res(w));
      w.on('error', rej);
    });
    this.ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      this.allMsgs.push(msg);
      const wi = this.waiters.findIndex(w => w.type === msg.type);
      if (wi >= 0) {
        const w = this.waiters.splice(wi, 1)[0];
        clearTimeout(w.timer);
        w.resolve(msg.data);
      } else { this.queue.push(msg); }
    });
  }
  next(type, timeout = 8000) {
    const qi = this.queue.findIndex(m => m.type === type);
    if (qi >= 0) return Promise.resolve(this.queue.splice(qi, 1)[0].data);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout: ${type}`)), timeout);
      this.waiters.push({ type, resolve, timer });
    });
  }
  drain(type) {
    let count = 0;
    while (true) {
      const i = this.queue.findIndex(m => m.type === type);
      if (i < 0) break;
      this.queue.splice(i, 1);
      count++;
    }
    return count;
  }
  send(type, data = {}) { this.ws.send(JSON.stringify({ type, data })); }
  close() { this.ws.close(); }
}

async function run() {
  const results = [];
  let passed = 0, failed = 0;

  function assert(name, cond, detail) {
    if (cond) { passed++; results.push({ name, pass: true, detail }); }
    else { failed++; results.push({ name, pass: false, detail }); }
  }

  const TIMEOUT = 60000;
  let c1, c2, roomCode, playerId;

  try {
    // Test 1: Create room
    c1 = new WSClient(); await c1.connect();
    c1.send('create_room', { nickname: 'Host' });
    const cr = await c1.next('room_created');
    assert('room_created有code', typeof cr.code === 'string' && cr.code.length === 4);
    assert('playerId已分配', !!cr.playerId);
    roomCode = cr.code;
    playerId = cr.playerId;
    const upd = await c1.next('room_update');
    assert('room_update 1人', upd.players.length === 1);

    // Test 2: Join room
    c2 = new WSClient(); await c2.connect();
    c2.send('join_room', { code: roomCode, nickname: 'P2' });
    const jr = await c2.next('room_joined');
    assert('join成功', !!jr.playerId);
    assert('seat=1', jr.seat === 1);
    await c1.next('room_update');
    c2.drain('room_update');

    // Test 3: Fill AI
    c1.send('fill_ai', {});
    const upd2 = await c1.next('room_update');
    assert('补AI后4人', upd2.players.length === 4);
    assert('2个AI', upd2.players.filter(p => p.isAI).length === 2);
    c2.drain('room_update');

    // Test 4: Start game
    c1.send('start_game', {});
    const gs1 = await c1.next('game_start');
    const gs2 = await c2.next('game_start');
    assert('host seat=0', gs1.yourSeat === 0);
    assert('p2 seat=1', gs2.yourSeat === 1);
    assert('seatNames[4]', gs1.seatNames.length === 4);

    // Test 5: State sync
    const s1 = await c1.next('state_sync');
    const s2 = await c2.next('state_sync');
    assert('hand是数组', Array.isArray(s1.yourHand));
    assert('hand有牌', s1.yourHand.length >= 13);
    assert('turn是数字', typeof s1.turn === 'number');
    assert('lv[4]', s1.lv.length === 4);
    assert('hui已设', typeof s1.hui === 'number');
    assert('ph=play', s1.ph === 'play');
    assert('rnd=1', s1.rnd === 1);
    assert('p2不同seat', s2.yourSeat === 1);

    // Test 6: Game flow - event-driven
    let totalActions = 0;
    let latestState1 = s1, latestState2 = s2;

    const gameResult = await new Promise((resolve) => {
      let pendingTurn1 = null, pendingTurn2 = null;

      function doPlay(client, which, turnData) {
        const state = which === 1 ? latestState1 : latestState2;
        const hand = state.yourHand;
        const lp = state.lastPlay;
        const lpp = state.lastPlayPlayer;
        const seat = which - 1;
        if (!hand || hand.length === 0) return;
        if (state.dn && state.dn[seat]) return;
        const free = !lp || lpp === seat;
        const plays = GL.allPlays(hand, free ? null : lp, state.hui);
        if (plays.length > 0) {
          client.send('play', { cards: plays[0].cards.map(c => c.id) });
        } else if (turnData.canPass) {
          client.send('pass', {});
        }
        totalActions++;
      }

      function playForClient(client, which) {
        return function handleMsg(raw) {
          const msg = JSON.parse(raw);
          if (msg.type === 'state_sync') {
            if (which === 1) latestState1 = msg.data;
            else latestState2 = msg.data;
            const pending = which === 1 ? pendingTurn1 : pendingTurn2;
            if (pending) {
              if (which === 1) pendingTurn1 = null; else pendingTurn2 = null;
              doPlay(client, which, pending);
            }
          }
          if (msg.type === 'interrupt_req') {
            const resp = msg.data.interruptType === 'cha' ? 'cha_no' : 'dian_no';
            client.send(resp, {});
          }
          if (msg.type === 'tribute_req') {
            const hand = (which === 1 ? latestState1 : latestState2).yourHand;
            if (hand && hand.length > 0) {
              const msgType = msg.data.direction === 'tribute' ? 'tribute_pick' : 'return_pick';
              client.send(msgType, { card: hand[0].id });
            }
          }
          if (msg.type === 'round_end') {
            resolve({ ended: true, actions: totalActions });
          }
          if (msg.type === 'your_turn') {
            if (which === 1) pendingTurn1 = msg.data;
            else pendingTurn2 = msg.data;
            setTimeout(() => {
              const p = which === 1 ? pendingTurn1 : pendingTurn2;
              if (p) {
                if (which === 1) pendingTurn1 = null; else pendingTurn2 = null;
                doPlay(client, which, p);
              }
            }, 100);
          }
        };
      }

      const h1 = playForClient(c1, 1);
      const h2 = playForClient(c2, 2);
      c1.ws.on('message', h1);
      c2.ws.on('message', h2);

      for (const [client, which, handler] of [[c1, 1, h1], [c2, 2, h2]]) {
        const queued = client.queue.splice(0);
        for (const m of queued) handler(JSON.stringify(m));
      }

      setTimeout(() => {
        c1.ws.removeListener('message', h1);
        c2.ws.removeListener('message', h2);
        resolve({ ended: false, actions: totalActions });
      }, TIMEOUT);
    });

    assert('人类出牌>0', gameResult.actions > 0, `actions=${gameResult.actions}`);
    assert('本局结束', gameResult.ended);

    // Test 7: Error handling
    const c3 = new WSClient(); await c3.connect();
    c3.send('join_room', { code: '0000', nickname: 'X' });
    const err = await c3.next('error');
    assert('错误消息', err.message.length > 0);

    // Test 8: Reconnect
    const c4 = new WSClient(); await c4.connect();
    c4.send('reconnect', { code: roomCode, playerId });
    const rj = await c4.next('room_joined');
    assert('重连seat=0', rj.seat === 0);

    c1.close(); c2.close(); c3.close(); c4.close();

  } catch (e) {
    failed++;
    results.push({ name: '服务器测试异常', pass: false, detail: e.message });
    if (c1) c1.close();
    if (c2) c2.close();
  }

  return { passed, failed, total: passed + failed, results };
}

module.exports = { name: '06-服务端WebSocket', run };
