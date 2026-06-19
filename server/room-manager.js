const crypto = require('crypto');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  generateCode() {
    for (let i = 0; i < 100; i++) {
      const code = String(1000 + crypto.randomInt(9000));
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('无法生成房间号');
  }

  createRoom(ws, nickname) {
    const code = this.generateCode();
    const playerId = crypto.randomUUID();
    const room = {
      code,
      players: [{ id: playerId, nickname, ws, seat: 0, isAI: false }],
      state: null,
      gameLoop: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    this.rooms.set(code, room);
    this.playerRooms.set(playerId, code);
    return { room, playerId };
  }

  joinRoom(ws, code, nickname) {
    const room = this.rooms.get(code);
    if (!room) throw new Error('房间不存在');
    if (room.state) throw new Error('游戏已开始');
    const humanPlayers = room.players.filter(p => !p.isAI);
    if (humanPlayers.length >= 4) throw new Error('房间已满');

    const playerId = crypto.randomUUID();
    const usedSeats = room.players.map(p => p.seat);
    let seat = -1;
    for (let i = 0; i < 4; i++) {
      if (!usedSeats.includes(i)) { seat = i; break; }
    }
    if (seat < 0) throw new Error('房间已满');

    room.players.push({ id: playerId, nickname, ws, seat, isAI: false });
    room.lastActive = Date.now();
    this.playerRooms.set(playerId, code);
    return { room, playerId, seat };
  }

  fillAI(room) {
    const usedSeats = room.players.map(p => p.seat);
    for (let i = 0; i < 4; i++) {
      if (!usedSeats.includes(i)) {
        room.players.push({
          id: 'ai_' + i,
          nickname: 'AI-' + ['东', '南', '西', '北'][i],
          ws: null,
          seat: i,
          isAI: true,
        });
      }
    }
    room.lastActive = Date.now();
  }

  getPlayerRoom(playerId) {
    const code = this.playerRooms.get(playerId);
    return code ? this.rooms.get(code) : null;
  }

  getPlayerInRoom(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;
    return room.players.find(p => p.id === playerId) || null;
  }

  reconnect(code, playerId, ws) {
    const room = this.rooms.get(code);
    if (!room) return null;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    player.ws = ws;
    room.lastActive = Date.now();
    return room;
  }

  removePlayer(playerId) {
    const code = this.playerRooms.get(playerId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) { this.playerRooms.delete(playerId); return; }

    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx >= 0) {
      room.players[idx].ws = null;
    }
    this.playerRooms.delete(playerId);
    room.lastActive = Date.now();

    const humans = room.players.filter(p => !p.isAI && p.ws);
    if (humans.length === 0) {
      this.rooms.delete(code);
    }
  }

  broadcast(room, msg, exceptSeat) {
    const data = JSON.stringify(msg);
    for (const p of room.players) {
      if (p.isAI || !p.ws || p.ws.readyState !== 1) continue;
      if (exceptSeat !== undefined && p.seat === exceptSeat) continue;
      p.ws.send(data);
    }
  }

  sendTo(room, seat, msg) {
    const player = room.players.find(p => p.seat === seat && !p.isAI);
    if (player && player.ws && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(msg));
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActive > 2 * 60 * 60 * 1000) {
        this.rooms.delete(code);
        for (const p of room.players) {
          this.playerRooms.delete(p.id);
        }
      }
    }
  }

  getRoomInfo(room) {
    return {
      code: room.code,
      players: room.players.map(p => ({
        nickname: p.nickname,
        seat: p.seat,
        isAI: p.isAI,
        connected: p.isAI || (p.ws && p.ws.readyState === 1),
      })),
    };
  }
}

module.exports = RoomManager;
