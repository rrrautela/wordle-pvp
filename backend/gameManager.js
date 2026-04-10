
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createGameEngine } from "../shared/gameEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../shared/data/all5letterwords.json"), "utf-8")
);

// use it:


const games = new Map();
// In-memory store for all active games
// gameCode -> full game object pairs
// Lost if server restarts

const userGameMap = new Map();
// userId -> gameCode pairs
// Used for O(1) reconnect + one-game enforcement

function generateGameCode() {
  let code;

  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  do {
    code = ""; // reset each attempt

    // build 6-char random code
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * charSet.length);
      code += charSet[randomIndex];
    }
  } while (games.has(code)); // avoid collisions

  return code;
}

function getThePlayer(game, userId) {
  const { host, opponent } = game.players;

  if (host?.userId === userId) return host;
  if (opponent?.userId === userId) return opponent;

  return null;
}

function getTheOpponent(game, userId) {
  const { host, opponent } = game.players;

  if (host?.userId === userId) return opponent;
  if (opponent?.userId === userId) return host;

  return null;
}

function createFreshEngines() {
  const hostEngine = createGameEngine(dictionary);
  const correctWord = hostEngine.getCorrectWord();

  return {
    correctWord,
    hostEngine,
    opponentEngine: createGameEngine(dictionary, correctWord),
  };
}

function createGame(userId, socketId, username = null) {
  const existingCode = userGameMap.get(userId);

  if (existingCode) {
    const existingGame = games.get(existingCode);

    if (existingGame) {
      return { success: false, error: "already in  a game" };
    } else {
      //stale mapping cleanup
      userGameMap.delete(userId);
    }
  }

  const code = generateGameCode();

  const { hostEngine, opponentEngine, correctWord } = createFreshEngines();

  // initialize game state
  games.set(code, {
    code,
    correctWord,
    matchVersion: 1,
    engines: {
      host: hostEngine,
      opponent: opponentEngine, // opponent gets same word for fairness
    },
    players: {
      host: {
        userId,
        username,
        socketId,
        activeSocketId: socketId,
        hasWon: false,
        isProcessing: false,
        guesses: [],
        isConnected: true,
        disconnectedTime: null,
        reconnectTimer: null,
        engine: hostEngine,
      },
      opponent: null, // empty slot until someone joins
    },

    status: "waiting", // waiting -> active -> finished (later)
    winner: null
  });

  // map user to this game
  userGameMap.set(userId, code);

  return { success: true, code };
}

function joinGame(code, userId, socketId, username = null) {
  // prevent joining multiple games
  const existingCode = userGameMap.get(userId);

  if (existingCode) {
    const existingGame = games.get(existingCode);

    if (existingGame) {
      return { success: false, error: "already in  a game" };
    } else {
      //stale mapping cleanup
      userGameMap.delete(userId);
    }
  }

  const game = games.get(code);

  // game must exist
  if (!game) return { error: "game not found" };

  // game must not already have opponent
  if (game.players.opponent) return { error: "game full" };

  // assign opponent
  game.players.opponent = {
    userId,
    username,
    socketId,
    activeSocketId: socketId,
    hasWon: false,
    isProcessing: false,
    guesses: [],
    isConnected: true,
    reconnectTimer: null,
    engine: game.engines.opponent,
  };

  game.status = "active"; // both players present

  userGameMap.set(userId, code);

  return { success: true, game };
}

function resetGameSession(code) {
  const game = games.get(code);
  if (!game || !game.players.host || !game.players.opponent) return null;

  const { hostEngine, opponentEngine, correctWord } = createFreshEngines();

  game.correctWord = correctWord;
  game.engines.host = hostEngine;
  game.engines.opponent = opponentEngine;
  game.status = "active";
  game.winner = null;
  game.matchVersion = (game.matchVersion || 1) + 1;
  game.rematchRequesterId = null;

  game.players.host = {
    ...game.players.host,
    hasWon: false,
    isProcessing: false,
    guesses: [],
    engine: hostEngine,
  };

  game.players.opponent = {
    ...game.players.opponent,
    hasWon: false,
    isProcessing: false,
    guesses: [],
    engine: opponentEngine,
  };

  return game;
}

function handleGuess(userId, guess) {
  const code = userGameMap.get(userId); // find the game code this user is associated with
  if (!code) return;

  const game = games.get(code); //find the game this user is in
  if (!game) return;

  try {
    if (game.status == "waiting") return;
    if (!guess || guess.length !== 5) return;

    const player = getThePlayer(game, userId);

    if (!player) return;
    if (player.isProcessing) return; // guard only this player's in-flight guess
    player.isProcessing = true;

    if(player.engine.getState().isGameOver) return; // prevent guessing after game over

    const engineResult = player.engine.submitGuess(guess);

    if (engineResult.status === "invalid") {
  return {
    code,
    result: {
          playerId: player.userId,
          guess,
          ...engineResult,
        },
      };
    }

    player.guesses.push({
      guess,
      result: engineResult,
    });

    if (engineResult.status === "correct") {
      player.hasWon = true;

      if (!game.winner) {
        game.winner = player.userId;
        game.status = "finished";
      }
    }
    return {
      code,
      result: {
        playerId: player.userId,
        guess,
        ...engineResult,
      },
    };

  } finally {
    const player = getThePlayer(game, userId);
    if (player) {
      player.isProcessing = false;
    }
  }
}

function endGame(code) {
  const game = games.get(code);
  if (!game) return;

  const { host, opponent } = game.players;

  for (const player of [host, opponent]) {
    if (player?.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = null;
    }
    if (player) {
      player.reconnectExpiresAt = null;
    }
  }

  // remove players from user -> game index
  if (host?.userId) {
    userGameMap.delete(host.userId);
  }

  if (opponent?.userId) {
    userGameMap.delete(opponent.userId);
  }

  // remove game from memory
  games.delete(code);
}

// export state + lifecycle functions
export {
  games,
  userGameMap,
  getThePlayer,
  getTheOpponent,
  createGame,
  joinGame,
  resetGameSession,
  handleGuess,
  endGame,
};



// ookay lets do this 


// No handling for "game-ended"

// Backend emits:

// io.to(code).emit("game-ended", { winner })

// But frontend never listens.

// 👉 So:

// opponent wins → YOU won’t know cleanly
// UI depends only on local state

// Not fatal, but incomplete.

// these too
// vc

// Giev code to be added in front end for allthese :), i think frotnend needs lot of more sytuff


// also lets resolve this tooo: 6. ⚠️ Minor: socket cleanup is okay but minimal

// You only remove:

// socket.off("guess-result")

// If later you add more listeners → memory leaks.


// One by one
