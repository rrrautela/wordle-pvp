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
import { userInfo } from "os";
import MultiPlayer from "./../frontend/src/pages/MultiPlayer";

// -------------------- Validation Regex --------------------

// Basic email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username: 3–20 chars, letters/numbers/underscore only
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

// -------------------- App Initialization --------------------

const app = express();

// Allow frontend origin and enable cookies
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
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
      "SELECT username, email, coins FROM users WHERE id = $1",
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
        secure: false, // allow HTTP (use true in production HTTPS)
        sameSite: "lax", // basic CSRF protection
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
      sameSite: "lax",
      secure: false,
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
    origin: "http://localhost:5173", // Allow frontend origin
    credentials: true, // Allow cookies during handshake
  },
});

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

  const code = userGameMap.get(socket.userId); // Check if this user already belongs to a game

  if (code) {
    const game = games.get(code); // Fetch the game object using the stored game code
    if (!game) return; // Exit if the game no longer exists

    const player = getThePlayer(game, socket.userId); // Identify whether this user is host or opponent
    if (!player) return; // Exit if user is not found inside the game

    // Socket connection changed, so update the stored socket ID
    player.socketId = socket.id;

    // Mark player as reconnected
    player.isConnected = true;

    // Rejoin the game room because the old socket left it on disconnect
    socket.join(code);

    // Cancel the disconnect timer since the player came back
    if (player.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = null;
    }
  } else {
    console.log("user not in a game rn"); // User is not reconnecting to an existing game
  }

  // Event handler for initiating a new game session
  socket.on("create-game", () => {
    const result = createGame(socket.userId, socket.id);

    if (result.success) {
      // Successfully created game; join the specific room code
      socket.join(result.code); //join room
    } else {
      // Notify client of failure to create game (e.g., already in a game)
      socket.emit("error", result.error);
    }
  });

  socket.on("join-game", (code) => {
    const result = joinGame(code, socket.userId, socket.id);

    if (result.success) {
      socket.join(code);

      io.to(code).emit("game-started");
    }
  });

  socket.on("guess", (word) => {
    const response = handleGuess(socket.userId, word);
    if (!response) return; //neecsary, in case handlegess returns null

    const { result, code, guess } = response;

    if (result) {
      io.to(code).emit("guess-result", {
        playerId: socket.userId,
        guess,
        result,
      });
    }
  });

  // Detect when this specific client disconnects and handle game state
  socket.on("disconnect", () => {
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

// Start listening on port 5000
server.listen(5000, () => {
  console.log("Server running on port 5000");
});

// 1.  Letting the other player continue after someone wins
// 2, prevent multiple winnners

// 3. wdykm by One more backend improvement you should add soon
// Right now guesses are unlimited if someone keeps guessing after game., ??? mhy main engine always checks that already i think?
