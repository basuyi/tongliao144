const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const RoomManager = require('./room-manager');
const GameLoop = require('./game-loop');

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const rm = new RoomManager();

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, rooms: rm.rooms.size, uptime: process.uptime() });
});

wss.on('connection', (ws) => {
  ws._playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    handleMessage(ws, msg);
  });

  ws.on('close', () => {
    if (ws._playerId) {
      rm.removePlayer(ws._playerId);
    }
  });
});

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'create_room': handleCreateRoom(ws, msg); break;
    case 'join_room': handleJoinRoom(ws, msg); break;
    case 'fill_ai': handleFillAI(ws, msg); break;
    case 'start_game': handleStartGame(ws, msg); break;
    case 'reconnect': handleReconnect(ws, msg); break;
    case 'play':
    case 'pass': handleGameAction(ws, msg); break;
    case 'cha_yes':
    case 'cha_no':
    case 'dian_yes':
    case 'dian_no': handleInterrupt(ws, msg); break;
    case 'tribute_pick':
    case 'return_pick': handleTribute(ws, msg); break;
    case 'rtc_offer':
    case 'rtc_answer':
    case 'rtc_ice': handleRTC(ws, msg); break;
    case 'voice_toggle': handleVoiceToggle(ws, msg); break;
  }
}

function handleCreateRoom(ws, msg) {
  const nickname = (msg.data && msg.data.nickname) || '玩家';
  const { room, playerId } = rm.createRoom(ws, nickname);
  ws._playerId = playerId;
  ws.send(JSON.stringify({
    type: 'room_created',
    data: { code: room.code, playerId },
  }));
  rm.broadcast(room, { type: 'room_update', data: rm.getRoomInfo(room) });
}

function handleJoinRoom(ws, msg) {
  const code = (msg.data && msg.data.code || '').toUpperCase();
  const nickname = (msg.data && msg.data.nickname) || '玩家';
  try {
    const { room, playerId, seat } = rm.joinRoom(ws, code, nickname);
    ws._playerId = playerId;
    ws.send(JSON.stringify({
      type: 'room_joined',
      data: { code, playerId, seat },
    }));
    rm.broadcast(room, { type: 'room_update', data: rm.getRoomInfo(room) });
  } catch (e) {
    ws.send(JSON.stringify({ type: 'error', data: { message: e.message } }));
  }
}

function handleFillAI(ws, msg) {
  const code = rm.playerRooms.get(ws._playerId);
  if (!code) return;
  const room = rm.rooms.get(code);
  if (!room || room.state) return;
  const host = room.players.find(p => p.seat === 0);
  if (!host || host.ws !== ws) return;

  rm.fillAI(room);
  rm.broadcast(room, { type: 'room_update', data: rm.getRoomInfo(room) });
}

function handleStartGame(ws, msg) {
  const code = rm.playerRooms.get(ws._playerId);
  if (!code) return;
  const room = rm.rooms.get(code);
  if (!room || room.state) return;
  const host = room.players.find(p => p.seat === 0);
  if (!host || host.ws !== ws) return;
  if (room.players.length < 4) {
    rm.fillAI(room);
  }

  room.state = 'playing';
  const loop = new GameLoop(room, rm);
  room.gameLoop = loop;

  for (const player of room.players) {
    if (!player.isAI && player.ws && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify({
        type: 'game_start',
        data: {
          yourSeat: player.seat,
          seatNames: room.players.map(p => p.nickname),
        },
      }));
    }
  }

  loop.start();
}

function handleReconnect(ws, msg) {
  const code = msg.data && msg.data.code;
  const playerId = msg.data && msg.data.playerId;
  if (!code || !playerId) return;
  const room = rm.reconnect(code, playerId, ws);
  if (!room) {
    ws.send(JSON.stringify({ type: 'error', data: { message: '重连失败' } }));
    return;
  }
  ws._playerId = playerId;
  const player = room.players.find(p => p.id === playerId);
  ws.send(JSON.stringify({
    type: 'room_joined',
    data: { code, playerId, seat: player.seat },
  }));
  if (room.gameLoop) {
    room.gameLoop.broadcastStates();
  }
}

function handleGameAction(ws, msg) {
  if (!ws._playerId) return;
  const room = rm.getPlayerRoom(ws._playerId);
  if (!room || !room.gameLoop) return;
  const player = room.players.find(p => p.id === ws._playerId);
  if (!player) return;
  room.gameLoop.handlePlayerAction(player.seat, msg);
}

function handleInterrupt(ws, msg) {
  if (!ws._playerId) return;
  const room = rm.getPlayerRoom(ws._playerId);
  if (!room || !room.gameLoop) return;
  const player = room.players.find(p => p.id === ws._playerId);
  if (!player) return;
  room.gameLoop.handleInterrupt(player.seat, msg);
}

function handleTribute(ws, msg) {
  if (!ws._playerId) return;
  const room = rm.getPlayerRoom(ws._playerId);
  if (!room || !room.gameLoop) return;
  const player = room.players.find(p => p.id === ws._playerId);
  if (!player) return;
  room.gameLoop.handleTributePick(player.seat, msg);
}

function handleRTC(ws, msg) {
  if (!ws._playerId) return;
  const room = rm.getPlayerRoom(ws._playerId);
  if (!room) return;
  const player = room.players.find(p => p.id === ws._playerId);
  if (!player) return;
  const toSeat = msg.data && msg.data.toSeat;
  const target = room.players.find(p => p.seat === toSeat && !p.isAI);
  if (target && target.ws && target.ws.readyState === 1) {
    target.ws.send(JSON.stringify({
      type: msg.type,
      data: { ...msg.data, fromSeat: player.seat },
    }));
  }
}

function handleVoiceToggle(ws, msg) {
  if (!ws._playerId) return;
  const room = rm.getPlayerRoom(ws._playerId);
  if (!room) return;
  const player = room.players.find(p => p.id === ws._playerId);
  if (!player) return;
  rm.broadcast(room, {
    type: 'voice_state',
    data: { seat: player.seat, muted: msg.data && msg.data.muted },
  }, player.seat);
}

server.listen(PORT, () => {
  console.log(`Tongliao144 server running on port ${PORT}`);
});
