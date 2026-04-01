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
    guesses: Array.isArray(player.guesses) ? player.guesses : [],
    hasWon: !!player.hasWon,
  };
}

function serializeGameState(game) {
  if (!game) return null;

  return {
    gameCode: game.code,
    roomCode: game.code,
    status: game.status,
    winner: game.winner || null,
    currentTurnPlayerId: null,
    players: {
      host: serializePlayer(game.players?.host),
      opponent: serializePlayer(game.players?.opponent),
    },
  };
}

function attachSocketToExistingPlayer(game, socket) {
  if (!game) return null;

  const player = getThePlayer(game, socket.userId);
  if (!player) return null;

  player.socketId = socket.id;
  player.isConnected = true;

  if (player.reconnectTimer) {
    clearTimeout(player.reconnectTimer);
    player.reconnectTimer = null;
  }

  socket.join(game.code);
  return player;
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

  const code = userGameMap.get(socket.userId); // Check if this user already belongs to a game

  if (code) {
    //user belongs to a game, so treat this connection as a reconnection attempt

    const game = games.get(code); // Fetch the game object using the stored game code
    if (!game) return; // Exit if the game no longer exists

    const player = getThePlayer(game, socket.userId); // Identify whether this user is host or opponent
    if (!player) return; // Exit if user is not found inside the game

    attachSocketToExistingPlayer(game, socket);

    // send full game state to ONLY this reconnected player
    socket.emit("sync-state", serializeGameState(game));
  } else {
    console.log("user not in a game rn"); // User is not reconnecting to an existing game
  }

  //as user is not recojnecting then it means its a new connection,
  // so we wait for them to create or join a game,
  // and we handle that in the respective event handlers below

  // Event handler for initiating a new game session
  socket.on("create-game", () => {
    const existingCode = userGameMap.get(socket.userId);
    const existingGame = existingCode ? games.get(existingCode) : null;

    if (existingGame && getThePlayer(existingGame, socket.userId)) {
      attachSocketToExistingPlayer(existingGame, socket);
      socket.emit("room_state", serializeGameState(existingGame));
      return;
    }

    const result = createGame(socket.userId, socket.id);

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

  
  socket.on("join-game", (code) => {
    console.log("JOIN ATTEMPT:", code, "USER:", socket.userId);

    const existingCode = userGameMap.get(socket.userId);
    const existingGame = existingCode ? games.get(existingCode) : null;

    if (existingGame && getThePlayer(existingGame, socket.userId)) {
      attachSocketToExistingPlayer(existingGame, socket);
      socket.emit("room_state", serializeGameState(existingGame));
      return;
    }

    const targetGame = games.get(code);
    if (targetGame && getThePlayer(targetGame, socket.userId)) {
      attachSocketToExistingPlayer(targetGame, socket);
      socket.emit("room_state", serializeGameState(targetGame));
      return;
    }

    const result = joinGame(code, socket.userId, socket.id);

    console.log("JOIN RESULT:", result);

    if (result.success) {
      socket.join(code);
      io.to(code).emit("game-started", serializeGameState(result.game));
    } else {
      socket.emit("error", result.error);
    }
  });

  socket.on("guess", (word) => {
    const response = handleGuess(socket.userId, word);
    if (!response) return; //neecsary, in case handlegess returns null

    const { code, result } = response;

    if (result) {
      io.to(code).emit("guess-result", result);

      // if game finished → notify both players
      const game = games.get(code);

      if (game?.status === "finished") {
        io.to(code).emit("game-ended", {
          winner: game.winner,
        });
      }
    }
  });

  socket.on("leave_game", () => {
    const code = userGameMap.get(socket.userId);
    if (!code) return;

    const game = games.get(code);
    if (!game) return;

    socket.isLeavingGame = true;

    const player = getThePlayer(game, socket.userId);
    const opponent = getTheOpponent(game, socket.userId);

    if (player?.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = null;
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

    player.isConnected = false;
    player.disconnectTime = Date.now();

    // If an opponent is still there, alert them of the disconnection
    if (otherPlayer?.isConnected) {
      io.to(otherPlayer.socketId).emit("opponent_disconnected");
    }

    player.reconnectTimer = setTimeout(() => {
      const game = games.get(code); // fetch latest game state
      if (!game) return;

      const player = getThePlayer(game, socket.userId); // identify same player again
      if (!player) return;

      // if player still not connected after 60 seconds → end game
      if (!player.isConnected) {
        const opponent = getTheOpponent(game, socket.userId);

        if (opponent?.isConnected) {
          //opp wins as user went out
          game.winner = opponent.userId;
          io.to(code).emit("game-forfeit", game.winner);
        } else {
          game.winner = null;
          io.to(code).emit("game-abandoned");
        }
        game.status = "finished";
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
