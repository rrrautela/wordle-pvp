// Core libraries
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

// Database connection pool (uses process.env.DATABASE_URL)
import { pool } from "./db/db.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import {
  games,
  userGameMap,
  createGame,
  joinGame,
  resetGameSession,
  endGame,
  handleGuess,
  getThePlayer,
  getTheOpponent,
} from "./gameManager.js";

// -------------------- Validation Regex --------------------

// Basic email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username: 3–20 chars, letters/numbers/underscore only
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

// -------------------- App Initialization --------------------

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://wordle-pvp.vercel.app",
];

// Allow frontend origin and enable cookies
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow sending cookies
  }),
);

// Parse incoming JSON request bodies
app.use(express.json());

app.use(cookieParser()); // parses cookies so req.cookies is available

// Health check endpoint
app.get("/", (req, res) => {
  res.send("backend running");
});

// Protected route (requires valid JWT)
app.get("/api/protected", verifyToken, (req, res) => {
  // If middleware passes, req.user contains decoded token
  res.json({
    message: "you accessed a protected route",
    user: req.user,
  });
});

app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, coins FROM users WHERE id = $1",
      [req.user.userID],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.log("ME ROUTE ERROR:", err); // ADD THIS
    res.status(500).json({ message: "server error" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT total_users, total_games FROM stats WHERE id = 1",
    );

    const row = result.rows[0] || { total_users: 0, total_games: 0 };
    console.log("STATS API:", row);

    res.json({
      totalUsers: Number(row.total_users) || 0,
      totalGames: Number(row.total_games) || 0,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Required field validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Email format validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Username format validation
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    // Hash password before storing (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB (parameterized query prevents SQL injection)
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashedPassword],
    );

    await pool.query(
      "UPDATE stats SET total_users = total_users + 1 WHERE id = 1",
    );

    // Return created user (never return password)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Register error:", err);

    // Handle duplicate username/email (Postgres unique_violation)
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    // Fallback internal server error
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// ========================== LOGIN ============================
// ============================================================

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Required field validation
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password required" });
    }

    // Determine if identifier is email or username
    const isEmail = emailRegex.test(identifier);

    // Reject invalid identifier format
    if (!isEmail && !usernameRegex.test(identifier)) {
      return res.status(400).json({ message: "Invalid identifier format" });
    }

    // Build dynamic query based on identifier type
    const query = isEmail
      ? "SELECT * FROM users WHERE email = $1"
      : "SELECT * FROM users WHERE username = $1";

    // get that user details
    const result = await pool.query(query, [identifier]);

    // If user not found
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare plain password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (valid for 1 hour)
    const token = jwt.sign(
      { userID: user.id }, // payload
      process.env.JWT_SECRET, // signing secret
      { expiresIn: "1h" }, // expiration time
    );

    // Set JWT as httpOnly cookie (browser stores it automatically)
    res
      .cookie("token", token, {
        httpOnly: true, // JS cannot access cookie (prevents XSS)
        secure: true, // required for HTTPS cross-site cookies
        sameSite: "none", // required when frontend and backend are on different origins
        maxAge: 3600 * 1000, // 1 hour in milliseconds
      })

      // Send back minimal user info (no token in JSON)
      .json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// ======================== ECONOMY ===========================
// ============================================================

// UPDATE COINS (Protected)
app.post("/api/update-coins", verifyToken, async (req, res) => {
  try {
    const { guessCount } = req.body; // Only trust the guess count
    const userID = req.user.userID;

    // The math stays on the Server (Secure)
    const rewards = { 1: 100, 2: 80, 3: 60, 4: 30, 5: 20, 6: 10 };
    const coinIncrement = rewards[guessCount] || 0;

    const result = await pool.query(
      "UPDATE users SET coins = coins + $1 WHERE id = $2 RETURNING coins",
      [coinIncrement, userID],
    );

    res.json({ newBalance: result.rows[0].coins });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/singleplayer-complete", async (req, res) => {
  try {
    const { correctWord, attempts } = req.body;

    if (!correctWord || !attempts) {
      return res
        .status(400)
        .json({ message: "correctWord and attempts are required" });
    }

    let userId = null;
    const token = req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userID;
      } catch {
        userId = null;
      }
    }

    await pool.query(
      `INSERT INTO singleplayer_games (user_id, correct_word, attempts)
       VALUES ($1, $2, $3)`,
      [userId, correctWord, attempts],
    );

    await pool.query(
      "UPDATE stats SET total_games = total_games + 1 WHERE id = 1",
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Singleplayer record error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json({ message: "Logged out" });
});

// -------------------- Dev DB Connection Check --------------------
// Confirms DB is reachable at server startup

pool
  .query("SELECT NOW()")
  .then((res) => console.log("DB connected at", res.rows[0].now))
  .catch((err) => console.error("DB connection error", err));

// -------------------- Start Server --------------------

// Create actual HTTP server using Express app as request handler
const server = http.createServer(app);

// Attach Socket.io to the same HTTP server
// This enables real-time WebSocket communication
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true, // Allow cookies during handshake
  },
});

function serializePlayer(player) {
  if (!player) return null;

  return {
    userId: player.userId,
    username: player.username || null,
    activeSocketId: player.activeSocketId || player.socketId || null,
    guesses: Array.isArray(player.guesses) ? player.guesses : [],
    hasWon: !!player.hasWon,
    isConnected: !!player.isConnected,
    reconnectExpiresAt: player.reconnectExpiresAt || null,
  };
}

async function recordCompletedGame(game) {
  if (!game || game.persistedResult || !game.winner) return;

  const host = game.players?.host;
  const opponent = game.players?.opponent;
  if (!host?.userId || !opponent?.userId) return;

  const winnerPlayer = game.winner === host.userId ? host : opponent;
  const loserPlayer = game.winner === host.userId ? opponent : host;

  try {
    await pool.query(
      `INSERT INTO multiplayer_games (
        game_code,
        winner_id,
        loser_id,
        correct_word,
        attempts_winner,
        attempts_loser,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        game.code,
        winnerPlayer.userId,
        loserPlayer.userId,
        game.correctWord || null,
        winnerPlayer.guesses?.length || 0,
        loserPlayer.guesses?.length || 0,
        "completed",
      ],
    );

    await pool.query(
      "UPDATE stats SET total_games = total_games + 1 WHERE id = 1",
    );

    game.persistedResult = true;
  } catch (err) {
    console.error("Record game error:", err);
  }
}

function serializeGameState(game) {
  if (!game) return null;

  return {
    gameCode: game.code,
    roomCode: game.code,
    status: game.status,
    winner: game.winner || null,
    matchVersion: game.matchVersion || 1,
    currentTurnPlayerId: null,
    players: {
      host: serializePlayer(game.players?.host),
      opponent: serializePlayer(game.players?.opponent),
    },
  };
}

function attachSocketToExistingPlayer(game, socket) {
  if (!game) return { player: null, wasDisconnected: false };

  const player = getThePlayer(game, socket.userId);
  if (!player) return { player: null, wasDisconnected: false };

  const wasDisconnected = player.isConnected === false;
  const oldSocketId = player.activeSocketId || player.socketId;

  // A player can only have one authoritative socket. Force-close the old
  // transport so stale tabs cannot keep emitting gameplay mutations.
  if (oldSocketId && oldSocketId !== socket.id) {
    io.sockets.sockets.get(oldSocketId)?.disconnect(true);
  }

  player.socketId = socket.id;
  player.activeSocketId = socket.id;
  player.isConnected = true;
  player.disconnectTime = null;
  player.reconnectExpiresAt = null;

  if (player.reconnectTimer) {
    clearTimeout(player.reconnectTimer);
    player.reconnectTimer = null;
  }

  socket.join(game.code);
  return { player, wasDisconnected };
}

function getActivePlayerForSocket(socket) {
  const code = userGameMap.get(socket.userId);
  if (!code) return { code: null, game: null, player: null };

  const game = games.get(code);
  if (!game || game.status === "finished") {
    return { code, game, player: null };
  }

  const player = getThePlayer(game, socket.userId);
  if (!player || (player.activeSocketId || player.socketId) !== socket.id) {
    return { code, game, player: null };
  }

  return { code, game, player };
}

function extractFromCookie(cookieString) {
  const cookies = cookieString.split(";");

  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");

    if (key === "token") {
      return value;
    }
  }

  return null;
}

// Middleware to verify JWT token from cookies during socket handshake
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;

    // Ensure cookies exist before proceeding
    if (!cookies) {
      return next(new Error("No cookies found"));
    }

    const token = extractFromCookie(cookies);

    // Validate that the auth token is present in the cookies
    if (!token) {
      return next(new Error("No token found"));
    }

    // Verify the JWT and attach user identity to the socket
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userID; // attach identity

    next();
  } catch (err) {
    // Reject the connection if authentication fails
    next(new Error("Unauthorized"));
  }
});

// Listen for new socket connections/reconnections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id); // Log new socket connection
  socket.isLeavingGame = false;

  function restoreExistingGame(game) {
    if (!game || game.status === "finished") {
      socket.emit("game_already_finished");
      return false;
    }

    const { player, wasDisconnected } = attachSocketToExistingPlayer(
      game,
      socket,
    );
    if (!player) return false;

    const opponent = getTheOpponent(game, socket.userId);

    io.to(game.code).emit("sync-state", serializeGameState(game));

    if (wasDisconnected && opponent?.isConnected) {
      io.to(opponent.socketId).emit("opponent_reconnected");
    }

    return true;
  }

  const code = userGameMap.get(socket.userId); // Check if this user already belongs to a game

  if (code) {
    //user belongs to a game, so treat this connection as a reconnection attempt

    const game = games.get(code); // Fetch the game object using the stored game code
    if (!game) {
      socket.emit("game_not_found");
      return;
    } // Exit if the game no longer exists

    const player = getThePlayer(game, socket.userId); // Identify whether this user is host or opponent
    if (!player) {
      socket.emit("game_not_found");
      return;
    } // Exit if user is not found inside the game

    restoreExistingGame(game);
  } else {
    console.log("user not in a game rn"); // User is not reconnecting to an existing game
  }

  //as user is not recojnecting then it means its a new connection,
  // so we wait for them to create or join a game,
  // and we handle that in the respective event handlers below

  // Event handler for initiating a new game session
  socket.on("create-game", (payload = {}) => {
    const existingCode = userGameMap.get(socket.userId);
    const existingGame = existingCode ? games.get(existingCode) : null;

    if (existingGame && getThePlayer(existingGame, socket.userId)) {
      const player = getThePlayer(existingGame, socket.userId);
      if ((player.activeSocketId || player.socketId) !== socket.id) return;
      restoreExistingGame(existingGame);
      return;
    }

    const result = createGame(socket.userId, socket.id, payload?.username || null);

    if (result.success) {
      // Successfully created game; join the specific room code
      socket.join(result.code); //join room
      socket.emit("game-created", {
        code: result.code,
        roomCode: result.code,
      }); //send code back to creator
    } else {
      // Notify client of failure to create game (e.g., already in a game)
      socket.emit("error", result.error);
    }
  });

  
  socket.on("join-game", (payload) => {
    const code = typeof payload === "string" ? payload : payload?.code;
    const username = typeof payload === "string" ? null : payload?.username || null;
    console.log("JOIN ATTEMPT:", code, "USER:", socket.userId);

    const existingCode = userGameMap.get(socket.userId);
    const existingGame = existingCode ? games.get(existingCode) : null;

    if (existingGame && getThePlayer(existingGame, socket.userId)) {
      const player = getThePlayer(existingGame, socket.userId);
      if ((player.activeSocketId || player.socketId) !== socket.id) return;
      restoreExistingGame(existingGame);
      return;
    }

    const targetGame = games.get(code);
    if (targetGame && getThePlayer(targetGame, socket.userId)) {
      const player = getThePlayer(targetGame, socket.userId);
      if ((player.activeSocketId || player.socketId) !== socket.id) return;
      restoreExistingGame(targetGame);
      return;
    }

    const result = joinGame(code, socket.userId, socket.id, username);

    console.log("JOIN RESULT:", result);

    if (result.success) {
      socket.join(code);
      io.to(code).emit("game-started", serializeGameState(result.game));
    } else {
      socket.emit("error", result.error);
    }
  });

  socket.on("guess", async (word) => {
    const { player } = getActivePlayerForSocket(socket);
    if (!player) return;

    const response = handleGuess(socket.userId, word);
    if (!response) return; //neecsary, in case handlegess returns null

    const { code, result } = response;

    if (result) {
      if (result.status === "invalid") {
        socket.emit("guess-result", result);
        return;
      }

      io.to(code).emit("guess-result", result);

      // if game finished → notify both players
      const game = games.get(code);

      if (game?.status === "finished") {
        await recordCompletedGame(game);
        io.to(code).emit("game-ended", {
          winner: game.winner,
          correctWord: game.correctWord,
        });
      }
    }
  });

  socket.on("play_again_request", () => {
    const code = userGameMap.get(socket.userId);
    const game = code ? games.get(code) : null;
    if (!game || game.status !== "finished") return;

    const player = getThePlayer(game, socket.userId);
    if (!player || (player.activeSocketId || player.socketId) !== socket.id) return;

    const opponent = getTheOpponent(game, socket.userId);
    if (!player || !opponent?.isConnected) return;

    game.rematchRequesterId = socket.userId;

    io.to(opponent.socketId).emit("play_again_request", {
      fromUserId: socket.userId,
      fromUsername: player.username || "Opponent",
    });
  });

  socket.on("play_again_accept", () => {
    const code = userGameMap.get(socket.userId);
    const game = code ? games.get(code) : null;
    if (!game || game.status !== "finished" || !game.rematchRequesterId) return;

    const player = getThePlayer(game, socket.userId);
    if (!player || (player.activeSocketId || player.socketId) !== socket.id) return;

    const resetGame = resetGameSession(code);
    if (!resetGame) return;

    io.to(code).emit("game-started", serializeGameState(resetGame));
  });

  socket.on("play_again_reject", () => {
    const code = userGameMap.get(socket.userId);
    const game = code ? games.get(code) : null;
    if (!game || !game.rematchRequesterId) return;

    const player = getThePlayer(game, socket.userId);
    if (!player || (player.activeSocketId || player.socketId) !== socket.id) return;

    const requester = getThePlayer(game, game.rematchRequesterId);
    game.rematchRequesterId = null;

    if (requester?.isConnected) {
      io.to(requester.socketId).emit("play_again_reject");
    }
  });

  socket.on("leave_game", () => {
    const code = userGameMap.get(socket.userId);
    const game = code ? games.get(code) : null;
    if (!code || !game) return;

    const player = getThePlayer(game, socket.userId);
    if (!player || (player.activeSocketId || player.socketId) !== socket.id) {
      return;
    }

    socket.isLeavingGame = true;

    const opponent = getTheOpponent(game, socket.userId);

    if (player?.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = null;
    }
    if (player) {
      player.reconnectExpiresAt = null;
    }

    socket.leave(code);

    if (opponent?.isConnected) {
      io.to(opponent.socketId).emit("opponent_left");
    }

    endGame(code);
  });

  // Detect when this specific client disconnects and handle game state
  socket.on("disconnect", () => {
    if (socket.isLeavingGame) return;

    // Retrieve game code associated with this disconnected user
    const code = userGameMap.get(socket.userId);
    if (!code) return;

    const game = games.get(code);
    if (!game) return;

    let player;
    let otherPlayer;

    player = getThePlayer(game, socket.userId);
    otherPlayer = getTheOpponent(game, socket.userId);
    if (!player) return;
    if ((player.activeSocketId || player.socketId) !== socket.id) return;

    if (player.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = null;
    }
  
    player.isConnected = false;
    player.disconnectTime = Date.now();
    player.reconnectExpiresAt = Date.now() + 60000;

    // If an opponent is still there, alert them of the disconnection
    if (otherPlayer?.isConnected) {
      io.to(otherPlayer.socketId).emit("opponent_disconnected", {
        expiresAt: player.reconnectExpiresAt,
      });
    }

    player.reconnectTimer = setTimeout(() => {
      const freshGame = games.get(code); // fetch latest game state
      if (!freshGame) return;

      const freshPlayer = getThePlayer(freshGame, socket.userId); // identify same player again
      if (!freshPlayer) return;

      freshPlayer.reconnectTimer = null;

      // if player still not connected after 60 seconds → end game
      if (freshPlayer.isConnected === false) {
        const opponent = getTheOpponent(freshGame, socket.userId);

        if (opponent?.isConnected) {
          //opp wins as user went out
          freshGame.winner = opponent.userId;
          io.to(code).emit("game-forfeit", freshGame.winner);
        } else {
          freshGame.winner = null;
          io.to(code).emit("game-abandoned");
        }
        freshGame.status = "finished";
        endGame(code);
      }
    }, 60000); // 60s reconnect window
  });
});

// Start listening on the platform-assigned port in production, or 5000 locally
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
