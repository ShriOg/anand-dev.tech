'use strict';

/* ============================================================
   Domain Battle — Frontend Client
   Clean separation: SocketManager (network) ↔ UI (DOM)
   ============================================================ */

// ── DOM References ──────────────────────────────────
const DOM = {
  // Screens
  authGate:      document.getElementById('auth-gate'),
  lobby:         document.getElementById('lobby'),
  battle:        document.getElementById('battle'),

  // Lobby
  btnCreate:     document.getElementById('btn-create'),
  btnJoin:       document.getElementById('btn-join'),
  inputRoom:     document.getElementById('input-room'),
  roomInfo:      document.getElementById('room-info'),
  roomId:        document.getElementById('room-id'),
  waitingMsg:    document.getElementById('waiting-msg'),
  btnStart:      document.getElementById('btn-start'),
  lobbyError:    document.getElementById('lobby-error'),

  // Battle
  phaseLabel:    document.getElementById('phase-label'),
  p1Name:        document.getElementById('p1-name'),
  p2Name:        document.getElementById('p2-name'),
  p1Energy:      document.getElementById('p1-energy'),
  p2Energy:      document.getElementById('p2-energy'),
  p1EnergyVal:   document.getElementById('p1-energy-val'),
  p2EnergyVal:   document.getElementById('p2-energy-val'),
  dominanceFill: document.getElementById('dominance-fill'),
  domP1:         document.getElementById('dom-p1'),
  domP2:         document.getElementById('dom-p2'),
  actions:       document.getElementById('actions'),

  // Result
  resultOverlay: document.getElementById('result-overlay'),
  resultTitle:   document.getElementById('result-title'),
  resultReason:  document.getElementById('result-reason'),
  btnBackLobby:  document.getElementById('btn-back-lobby'),
};

// ── UI Controller ───────────────────────────────────
const UI = {
  show(screen) {
    [DOM.authGate, DOM.lobby, DOM.battle].forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
  },

  showLobby()  { this.show(DOM.lobby); },
  showBattle() { this.show(DOM.battle); },
  showAuth()   { this.show(DOM.authGate); },

  showRoomInfo(roomId) {
    DOM.roomInfo.classList.remove('hidden');
    DOM.roomId.textContent = roomId;
    DOM.waitingMsg.classList.remove('hidden');
    DOM.btnStart.classList.add('hidden');
  },

  enableStart() {
    DOM.waitingMsg.classList.add('hidden');
    DOM.btnStart.classList.remove('hidden');
  },

  showError(msg) {
    DOM.lobbyError.textContent = msg;
    DOM.lobbyError.classList.remove('hidden');
    setTimeout(() => DOM.lobbyError.classList.add('hidden'), 4000);
  },

  setPhase(phase) {
    DOM.phaseLabel.textContent = phase.toUpperCase();
    DOM.phaseLabel.className = '';
    if (phase === 'countdown') DOM.phaseLabel.classList.add('phase--countdown');
    if (phase === 'active')    DOM.phaseLabel.classList.add('phase--active');
    if (phase === 'finished')  DOM.phaseLabel.classList.add('phase--finished');
  },

  updateEnergy(p1, p2, p1Max = 100, p2Max = 100) {
    const p1Pct = Math.max(0, Math.min(100, (p1 / p1Max) * 100));
    const p2Pct = Math.max(0, Math.min(100, (p2 / p2Max) * 100));
    DOM.p1Energy.style.width = p1Pct + '%';
    DOM.p2Energy.style.width = p2Pct + '%';
    DOM.p1EnergyVal.textContent = Math.round(p1);
    DOM.p2EnergyVal.textContent = Math.round(p2);
  },

  updateDominance(p1Dom, p2Dom) {
    const total = (p1Dom + p2Dom) || 1;
    const p1Pct = (p1Dom / total) * 100;
    DOM.dominanceFill.style.height = p1Pct + '%';
    DOM.domP1.textContent = Math.round(p1Dom);
    DOM.domP2.textContent = Math.round(p2Dom);
  },

  updatePlayers(p1Name, p2Name) {
    DOM.p1Name.textContent = p1Name || 'Player 1';
    DOM.p2Name.textContent = p2Name || 'Player 2';
  },

  setActionsEnabled(enabled) {
    DOM.actions.querySelectorAll('.btn').forEach(btn => {
      btn.disabled = !enabled;
    });
  },

  showResult(winner, reason) {
    DOM.resultTitle.textContent = winner ? `${winner} wins!` : 'Battle Over';

    const reasons = {
      energy:      'Opponent ran out of energy.',
      dominance:   'Total dominance achieved.',
      player_left: 'Opponent disconnected.',
    };
    DOM.resultReason.textContent = reasons[reason] || reason || '';
    DOM.resultOverlay.classList.remove('hidden');
    this.setActionsEnabled(false);
  },

  hideResult() {
    DOM.resultOverlay.classList.add('hidden');
  },

  resetBattle() {
    this.setPhase('lobby');
    this.updateEnergy(100, 100);
    this.updateDominance(50, 50);
    this.updatePlayers('Player 1', 'Player 2');
    this.setActionsEnabled(false);
    this.hideResult();
  },

  resetLobby() {
    DOM.roomInfo.classList.add('hidden');
    DOM.lobbyError.classList.add('hidden');
    DOM.inputRoom.value = '';
    DOM.btnCreate.disabled = false;
    DOM.btnJoin.disabled = false;
  },
};


// ── Socket Manager ──────────────────────────────────
const SocketManager = {
  socket: null,
  currentRoom: null,

  connect() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      UI.showAuth();
      return false;
    }

    this.socket = io('https://anand-os-backend.onrender.com', {
      auth: { token },
    });

    this._bindEvents();
    return true;
  },

  _bindEvents() {
    const s = this.socket;

    s.on('connect', () => {
      console.log('[Battle] Connected:', s.id);
    });

    s.on('disconnect', (reason) => {
      console.warn('[Battle] Disconnected:', reason);
    });

    // ── Room events
    s.on('roomCreated', (data) => {
      this.currentRoom = data.roomId;
      UI.showRoomInfo(data.roomId);
    });

    s.on('joinedRoom', (data) => {
      this.currentRoom = data.roomId;
      UI.showRoomInfo(data.roomId);
      UI.enableStart();
    });

    s.on('opponentJoined', () => {
      UI.enableStart();
    });

    // ── Battle events
    s.on('battleUpdate', (state) => {
      UI.showBattle();
      UI.setPhase(state.phase || 'active');

      if (state.players) {
        const keys = Object.keys(state.players);
        const p1 = state.players[keys[0]] || {};
        const p2 = state.players[keys[1]] || {};

        UI.updatePlayers(p1.name || keys[0], p2.name || keys[1]);
        UI.updateEnergy(
          p1.energy ?? 100,
          p2.energy ?? 100,
          p1.maxEnergy ?? 100,
          p2.maxEnergy ?? 100
        );
        UI.updateDominance(p1.dominance ?? 50, p2.dominance ?? 50);
      }

      const isActive = state.phase === 'active';
      UI.setActionsEnabled(isActive);
    });

    s.on('battleEnd', (data) => {
      UI.setPhase('finished');
      UI.showResult(data.winner, data.reason);
    });

    s.on('error', (data) => {
      const msg = typeof data === 'string' ? data : data.message || 'Unknown error';
      UI.showError(msg);
      console.error('[Battle] Server error:', msg);
    });

    s.on('connect_error', (err) => {
      UI.showError('Connection failed: ' + err.message);
      console.error('[Battle] Connect error:', err);
    });
  },

  createRoom() {
    if (!this.socket) return;
    this.socket.emit('createRoom');
  },

  joinRoom(roomId) {
    if (!this.socket || !roomId) return;
    this.socket.emit('joinRoom', { roomId: roomId.trim() });
  },

  startBattle() {
    if (!this.socket || !this.currentRoom) return;
    this.socket.emit('startBattle', { roomId: this.currentRoom });
  },

  sendAction(type) {
    if (!this.socket) return;
    this.socket.emit('skillAction', { type });
  },
};


// ── Event Bindings ──────────────────────────────────
function bindEvents() {
  // Lobby buttons
  DOM.btnCreate.addEventListener('click', () => {
    DOM.btnCreate.disabled = true;
    SocketManager.createRoom();
  });

  DOM.btnJoin.addEventListener('click', () => {
    const roomId = DOM.inputRoom.value.trim();
    if (!roomId) {
      UI.showError('Enter a room ID');
      return;
    }
    DOM.btnJoin.disabled = true;
    SocketManager.joinRoom(roomId);
  });

  DOM.btnStart.addEventListener('click', () => {
    DOM.btnStart.disabled = true;
    SocketManager.startBattle();
  });

  // Action buttons
  DOM.actions.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;
    SocketManager.sendAction(btn.dataset.action);
  });

  // Back to lobby
  DOM.btnBackLobby.addEventListener('click', () => {
    UI.resetBattle();
    UI.resetLobby();
    UI.showLobby();
  });

  // Join on Enter key
  DOM.inputRoom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') DOM.btnJoin.click();
  });
}


// ── Init ────────────────────────────────────────────
(function init() {
  const connected = SocketManager.connect();
  if (connected) {
    UI.showLobby();
    bindEvents();
  }
})();
