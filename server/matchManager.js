const GameManager = require('./gameManager');
const config = require('./config');

class MatchManager {
  constructor() {
    this.matches = new Map();
    this.playerToMatch = new Map();
    this.quickMatchQueue = [];
  }

  createMatch(matchCode, isPrivate = false, maxPlayers = config.MAX_PLAYERS_PER_MATCH) {
    const match = {
      id: matchCode,
      code: matchCode,
      isPrivate,
      status: 'waiting',
      players: new Map(),
      maxPlayers: maxPlayers,
      gameManager: null,
      createdAt: Date.now(),
    };

    this.matches.set(matchCode, match);
    return match;
  }

  joinMatch(matchCode, socketId, playerData) {
    const match = this.matches.get(matchCode);

    if (!match) return { success: false, error: 'Match not found' };
    if (match.status !== 'waiting') return { success: false, error: 'Match already started' };
    if (match.players.has(socketId)) return { success: false, error: 'Player already in match' };
    if (match.players.size >= match.maxPlayers) return { success: false, error: 'Match is full' };

    match.players.set(socketId, {
      socketId,
      playerId: playerData.playerId,
      username: playerData.username,
      isReady: true,
    });

    this.playerToMatch.set(socketId, matchCode);


    return {
      success: true,
      match: {
        code: match.code,
        players: Array.from(match.players.values()),
        maxPlayers: match.maxPlayers,
        status: match.status,
      },
    };
}

  startGame(match) {
    if (!match) return false;
    // allow either match object or matchCode string
    if (typeof match === 'string') return this.startMatch(match);
    if (match.status !== 'waiting') return false;
    return this.startMatch(match.code);
  }


  leaveMatch(socketId) {
    const matchCode = this.playerToMatch.get(socketId);
    if (!matchCode) return;

    const match = this.matches.get(matchCode);
    if (!match) return;

    match.players.delete(socketId);
    this.playerToMatch.delete(socketId);

    if (match.gameManager) {
      match.gameManager.removePlayer(socketId);
    }

    if (match.players.size === 0) {
      this.matches.delete(matchCode);
    }

    return match;
  }

  startMatch(matchCode) {
    const match = this.matches.get(matchCode);
    if (!match || match.status !== 'waiting') return false;

    match.status = 'active';
    match.gameManager = new GameManager(matchCode);

    for (const [socketId, player] of match.players) {
      match.gameManager.addPlayer(socketId, player);
    }
 match.gameManager.started = true;
  match.gameManager.totalPlayers = match.players.size;
    match.gameManager.start();

    return true;
  }

  getMatch(matchCode) {
    return this.matches.get(matchCode);
  }

  getPlayerMatch(socketId) {
    const matchCode = this.playerToMatch.get(socketId);
    return matchCode ? this.matches.get(matchCode) : null;
  }

  findQuickMatch(socketId, playerData, desiredMaxPlayers = config.MAX_PLAYERS_PER_MATCH) {
    for (const [matchCode, match] of this.matches) {
      if (
        !match.isPrivate &&
        match.status === 'waiting' &&
        match.players.size < match.maxPlayers &&
        match.maxPlayers === desiredMaxPlayers
      ) {
        return this.joinMatch(matchCode, socketId, playerData);
      }
    }

    const matchCode = this.generateMatchCode();
    this.createMatch(matchCode, false, desiredMaxPlayers);
    return this.joinMatch(matchCode, socketId, playerData);
  }

  generateMatchCode() {
    return `MATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createPrivateMatch(socketId, playerData, maxPlayers = 2) {
    const matchCode = this.generateMatchCode();
    this.createMatch(matchCode, true, maxPlayers);
    const result = this.joinMatch(matchCode, socketId, playerData);
    return Object.assign({ code: matchCode }, result);
  }

  endMatch(matchCode, winnerId) {
    const match = this.matches.get(matchCode);
    if (!match) return null;

    match.status = 'finished';

    const results = {
      matchCode,
      winnerId,
      players: [],
    };

    if (match.gameManager) {
      for (const [socketId, player] of match.gameManager.players) {
        results.players.push({
          socketId,
          playerId: player.playerId,
          username: player.username,
          kills: player.kills,
          damage: player.damage,
          isAlive: player.isAlive,
        });
      }
    }

    setTimeout(() => {
      for (const socketId of match.players.keys()) {
        this.playerToMatch.delete(socketId);
      }
      this.matches.delete(matchCode);
    }, 30000);

    return results;
  }

  getActiveMatches() {
    const activeMatches = [];
    for (const [matchCode, match] of this.matches) {
      if (match.status === 'waiting' && !match.isPrivate) {
        activeMatches.push({
          code: matchCode,
          players: match.players.size,
          maxPlayers: match.maxPlayers,
        });
      }
    }
    return activeMatches;
  }
}

module.exports = MatchManager;
