import { createGameEngine } from "../shared/gameEngine";

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

function createGame(userId, socketId) {
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

  const hostEngine = createGameEngine();
  const correctWord = hostEngine.getCorrectWord();

  // initialize game state
  games.set(code, {
    code,
    correctWord,
    engine: hostEngine,
    players: {
      host: {
        userId,
        socketId,
        hasWon: false,
        guesses: [],
        isConnected: true,
        disconnectedTime: null,
        reconnectTimer: null,
      },
      opponent: null, // empty slot until someone joins
    },

    status: "waiting", // waiting -> active -> finished (later)
  });

  // map user to this game
  userGameMap.set(userId, code);

  return { success: true, code };
}

function joinGame(code, userId, socketId) {
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
    socketId,
    hasWon: false,
    guesses: [],
    isConnected: true,
    reconnectTimer: null,
  };

  game.status = "active"; // both players present

  userGameMap.set(userId, code);

  return { success: true, game };
}

function handleGuess(userId, guess) {
  const code = userGameMap.get(userId);
  if (!code) return;

  const game = games.get(code);
  if (!game) return;

  if (game.status !== "active") return;
  if (!guess || guess.length !== 5) return;

  const player = getThePlayer(game, userId);

  if (!player) return;

  const result = game.engine.submitGuess(guess);

  player.guesses.push({
    guess,
    result,
  });

  return {
    playerId,
    guess,
    ...result,
  };
}

function endGame(code) {
  const game = games.get(code);
  if (!game) return;

  const { host, opponent } = game.players;

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
  handleGuess,
  endGame,
};

// One last backend improvement I'd strongly recommend

// Right now your server allows multiple guesses at the same time.

// Rarely, two socket events may arrive in the same event loop tick.

// This can cause guess order bugs.

// There is a simple fix using a "game lock" flag that takes only 4 lines and eliminates that race condition.

// If you want, I can show it.
