# Wordle PvP: Final Technical Architecture and Implementation Report

## 1. Introduction

Wordle PvP is a full-stack word game system that combines a conventional single-player Wordle implementation with a real-time authenticated multiplayer mode. The frontend is built with React and Vite, the backend is built with Node.js, Express, and Socket.IO, and the core word-evaluation logic lives in a shared deterministic engine that is reused across modes. At the user level the product seems simple: a user signs in or plays as a guest, selects a mode, types five-letter words, and receives color-coded feedback. At the engineering level, however, the project is significantly more complex than a standard CRUD application because it has to coordinate multiple clients, preserve authoritative state, synchronize asynchronous events, recover from reconnects, and maintain correct session behavior across browser refreshes and multiple tabs.

The project is especially strong as an interview case study because it sits at the intersection of UI engineering, backend design, real-time systems, and practical product debugging. Multiplayer Wordle is not just â€œtwo users making requests to the same API.â€ It is a stateful event-driven interaction model where correctness depends on timing and identity. The server has to ensure that both users play against the same hidden word, that guesses are evaluated consistently, that the right result is broadcast to both players, that one player cannot unintentionally become two logical players by opening multiple tabs, and that temporary disconnects do not immediately destroy the session. The frontend then has to translate that shared state into a competitive head-to-head interface, maintain a responsive feel, and recover gracefully when sockets reconnect or opponents leave.

The final version of the codebase now includes several important hardening improvements beyond a basic local prototype. It supports production backend URL configuration for Vercel and Render, cross-site cookie-based authentication, Socket.IO handshake authentication using JWT cookies, reconnection-oriented room synchronization, UI-safe handling of partial socket data, explicit leave-game behavior, duplicate-tab protection, and common room-state synchronization so both participants see the same multiplayer metadata. That evolution matters because the final system is no longer just a toy implementation of a word game; it is now a compact but credible example of how to design and iterate on a real-time full-stack application under real debugging pressure.

The scope of this report is the final version of the project as it currently exists in code. This means the analysis is grounded in the implemented backend routes, the actual Socket.IO event contract, the shared game engine, the multiplayer session manager, and the current React pages and components. Where the system is intentionally simple or where a field exists but is not yet fully used, I will say so explicitly rather than implying features that are not really present. That is important in interview preparation, because strong technical explanations come from precise honesty about what the system does today and what it would need to do next to scale or generalize.

## 2. Problem Statement and Why Multiplayer Wordle Is Non-Trivial

A single-player Wordle application is conceptually straightforward. A client generates or receives a hidden word, compares user guesses against it, colors letters according to official Wordle rules, and stops after a win or six failures. All state can remain local, and if the user refreshes, nothing distributed needs to be reconciled. Multiplayer Wordle changes that problem qualitatively. The system now has to coordinate two independent user agents interacting with the same hidden challenge while preserving privacy, consistency, and fairness.

The first non-trivial requirement is authoritative state. If each browser were allowed to evaluate its own multiplayer guesses locally, then cheating and divergence would be trivial. One client could modify its logic, inspect the answer, or race ahead with inconsistent local assumptions. The backend therefore becomes authoritative for multiplayer mode. It stores the room, owns the canonical engine instances, validates guesses, and decides when a match is active or finished.

The second challenge is synchronization. When one player submits a guess, both clients need to react to the same state transition. The local player needs letter-level animation, color updates, keyboard color propagation, and row advancement. The opponent should not see the letters, but still needs to see the same flip timing and final tile colors. This is not a broadcast of raw UI instructions; it is a broadcast of domain facts that each client renders differently.

The third challenge is session identity. In real browsers, a single human can create multiple tabs, refresh the page, close and reopen the site, or temporarily lose network connectivity. If the system conflates sockets with users, then one account can accidentally occupy both player slots in a room. The final version of this project explicitly fixes that by treating `socket.userId` as player identity and a socket as only one connection owned by that player. This distinction is one of the most important architectural lessons in the project: connection is not player identity.

The fourth challenge is session lifecycle. Real-time games cannot assume that disconnection means abandonment. The project therefore includes a disconnect timer, reconnect synchronization, and resumption logic. This is small in terms of code size, but conceptually it turns the system into a distributed state machine. The room does not merely exist or not exist; it transitions through waiting, active, disconnected-but-recoverable, and finished states.

Taken together, these requirements make the system a meaningful example of event-driven system design. The game is simple enough to understand quickly, but complex enough that discussions of race conditions, reconnection windows, state isolation, and transport-aware authentication are grounded in concrete code rather than abstract theory.

## 3. High-Level System Architecture

The architecture is a hybrid client-server and event-driven system composed of four major layers: a React frontend, an Express backend, a Socket.IO real-time transport layer, and a shared pure game engine. The project uses PostgreSQL for persistent user data, while active multiplayer room state remains in backend memory.

The frontend is responsible for routing, authentication-aware page flow, multiplayer lobby interactions, visual gameplay rendering, keyboard interaction, and client-side UI state such as loading indicators, reconnect banners, waiting screens, and local animation timing. It does not authoritatively own multiplayer game state. Instead, it consumes snapshots and events from the server and renders them.

The backend is responsible for three classes of work. First, it exposes normal REST endpoints for login, registration, session validation, logout, and coin updates. Second, it authenticates socket handshakes and binds sockets to user identity via JWT cookies. Third, it manages the lifecycle of multiplayer rooms, including room creation, room joining, reconnection, guess handling, disconnect timers, duplicate-tab prevention, and leave-game cleanup.

The shared game engine encapsulates the actual Wordle rules. It exposes methods like `submitGuess`, `getCorrectWord`, and `getState`. This is a strong design decision because it cleanly separates deterministic domain logic from transport and persistence concerns. In single-player mode the frontend instantiates the engine locally. In multiplayer mode the backend instantiates one engine per player while ensuring both engines share the same hidden word.

Architecturally, the system uses HTTP where requests are transactional and event semantics are unnecessary, and WebSockets where real-time push behavior is required. This is an appropriate division. Authentication and coin updates fit HTTP naturally. Guess results, room join events, reconnect snapshots, and opponent disconnect signals fit Socket.IO.

The entire system is intentionally optimized for clarity and velocity rather than horizontal scale. Multiplayer game sessions live in memory in `Map` objects rather than in Redis or a database. That makes the project easier to build, explain, and debug, but also places clear limits on production scalability. Those trade-offs are discussed later in this report.

## 4. Backend Architecture

The backend entry point is `backend/index.js`. It initializes Express, configures CORS, parses JSON requests, parses cookies, initializes an HTTP server, then attaches a Socket.IO server to that HTTP server. This is a common and effective pattern because it allows both HTTP and real-time traffic to share the same application and authentication context.

The backend depends on two environment variables for core functionality: `DATABASE_URL` and `JWT_SECRET`. `DATABASE_URL` is consumed by the PostgreSQL pool in `backend/db/db.js`, and `JWT_SECRET` is used for both login token creation and token verification. The backend also uses `process.env.PORT || 5000`, which makes local development and Render deployment compatible without changing code. The server therefore has a proper environment-driven entry configuration.

### 4.1 Express Routes

The REST routes are intentionally small and focused:

- `/api/register` validates username and email format, hashes the password with bcrypt, inserts the user into PostgreSQL, and returns minimal user data.
- `/api/login` accepts either username or email, verifies credentials, signs a JWT, and stores that JWT in an HTTP-only cookie.
- `/api/me` is protected by JWT cookie verification and returns `id`, `username`, `email`, and `coins`.
- `/api/update-coins` is also protected and increments coins based on guess count in single-player mode.
- `/api/logout` clears the JWT cookie.

From a security and deployment perspective, the critical detail is cookie configuration. The login cookie now uses:

- `httpOnly: true`
- `secure: true`
- `sameSite: "none"`

This combination is required because the frontend is deployed on Vercel and the backend is deployed on Render, which means requests are cross-site. Browsers will reject `SameSite=None` unless `Secure` is also true, so this change was essential for production session persistence and Socket.IO auth.

### 4.2 CORS and Socket.IO Configuration

The backend explicitly allows the following origins:

- `http://localhost:5173`
- `https://wordle-pvp.vercel.app`

Both Express CORS and Socket.IO CORS use those allowed origins and set `credentials: true`. This matters because the frontend relies on cookie-based authentication not only for REST calls but also for the Socket.IO handshake.

Without this configuration, the app would fail in several subtle ways:

- login responses might succeed but cookies would be blocked
- `/api/me` would fail on refresh
- multiplayer sockets would connect without credentials or fail auth
- the frontend would appear partially functional while multiplayer silently broke

### 4.3 Socket Authentication

Socket.IO authentication is implemented by manually reading the `cookie` header during the handshake, extracting the `token` cookie, verifying it with JWT, and assigning `socket.userId = decoded.userID`. This design is simple and consistent with the HTTP auth model. It means every multiplayer socket is bound to a user identity before any game events are processed.

This binding is especially important in the final version because duplicate-tab handling depends on it. The server now distinguishes between:

- one user opening multiple sockets
- two different users joining the same room

That distinction is what prevents a second tab from being treated as a second player.

## 5. Multiplayer Session Model

The multiplayer session layer is implemented primarily in `backend/gameManager.js` and coordinated by socket handlers in `backend/index.js`.

There are two main in-memory indexes:

- `games`: a `Map` keyed by room code
- `userGameMap`: a `Map` keyed by user ID

This dual-index structure is elegant and efficient. `games` supports room-oriented operations such as join, guess routing, cleanup, and broadcast. `userGameMap` supports user-oriented operations such as one-game enforcement, reconnect lookup, duplicate-tab detection, and leave/disconnect cleanup. Without `userGameMap`, reconnection and duplicate-tab handling would require scanning every room.

Each game object contains:

- a unique room code
- the shared correct word
- a concurrency flag `isProcessing`
- two game engine instances, one for host and one for opponent
- `players.host` and `players.opponent`
- room status: `waiting`, `active`, or `finished`
- winner ID or null

The engine duplication is worth noting. Each player has their own engine instance so their guess count and game-over status remain isolated, but both engines are initialized with the same secret word. This is a good compromise between fairness and per-player state isolation.

### 5.1 Room Creation

When a user emits `create-game`, the backend first checks whether that user already belongs to a room via `userGameMap`. If they do, and that game still exists, creation is rejected. If the map entry is stale, it is cleared. Then a room code is generated, two engines are created with the same target word, the host player is initialized, the game is inserted into `games`, and the user-to-room mapping is inserted into `userGameMap`.

The final version adds an important refinement: if the same authenticated user already belongs to an existing game and opens another tab, the server does not create a new room and does not create a second logical player. Instead, it attaches the new socket to the existing player and emits `room_state`.

### 5.2 Room Joining

Joining follows similar rules. A different authenticated user can join only if:

- the room exists
- the joining user is not already in another live game
- the room does not already have an opponent

The final version adds a crucial identity guard here too. If the joining socket belongs to a user already present in the room, the server treats that as an additional connection or reconnect for the same player and emits `room_state` instead of adding an opponent. This prevents same-user multi-tab behavior from starting the match incorrectly.

### 5.3 Room State vs Game Start

The final version distinguishes between two important concepts:

- `room_state`: a synchronized room snapshot that can represent either a waiting room or an active game
- `game-started`: a signal that the room is now active and both players are present

This distinction fixes a prior bug where the frontend treated any reconnect-like event as a reason to enter the gameplay UI. Now, if the backend says the room status is `waiting`, the frontend stays on the waiting screen even if the user has reopened the room in another tab.

## 6. Shared Game Engine

The pure engine in `shared/gameEngine.js` is one of the strongest pieces of the entire codebase. It is implemented as a factory function:

`createGameEngine(dictionary, forcedWord = null)`

This function creates private state through closure:

- `secretWord`
- `guessCount`
- `isGameOver`

It then returns a small public API:

- `submitGuess`
- `getCorrectWord`
- `getState`

This is a clean, idiomatic JavaScript way to model encapsulated domain logic without introducing class complexity. The caller cannot directly mutate guess count or overwrite the secret word. All state transitions flow through `submitGuess`, which preserves invariants.

### 6.1 Duplicate-Letter Logic

The engine handles duplicate letters correctly using a two-pass algorithm:

1. It counts secret-word character frequencies.
2. It marks exact-position matches as green first and decrements available counts.
3. It processes remaining letters as yellow only if the secret still has unmatched instances left.

This is the right Wordle algorithm. Many quick implementations fail duplicate-letter cases by using only `includes` checks, but this engine handles those cases correctly.

### 6.2 Engine Outputs

`submitGuess` can return:

- `invalid`
- `correct`
- `lost`
- `wrong`
- `ended` if the engine is already over

Each valid non-ended result includes `letterResults` and `guessNumber`, and the lost result also includes `correctWord`. This normalized output makes it easy for the frontend and backend to share behavior without embedding transport concerns into the engine itself.

### 6.3 Single vs Multiplayer Usage

In single-player mode, the engine is instantiated directly in the frontend. That is acceptable because the stakes are local and cheating is irrelevant. In multiplayer mode, the engine is instantiated on the backend to preserve authoritative state. This dual-use design is efficient and demonstrates good separation of concerns: the same domain logic is reused in both contexts without duplicating rules.

## 7. Frontend Architecture

The frontend is organized around route-level screens and a central app shell.

`frontend/src/App.jsx` owns top-level auth state, performs session synchronization through `/api/me`, exposes logout behavior, and renders the route tree. The app shell also shows a persistent HUD using `HeaderHUD`.

The main route screens are:

- `Landing`
- `Login`
- `Home`
- `SinglePlayer`
- `MultiPlayer`

The most important multiplayer presentation component is `GameWindow`, which is shared across single-player and multiplayer. That component is large because it handles:

- board rendering
- keyboard input
- tile animations
- win/loss overlays
- multiplayer opponent rendering
- reconnect banners
- keyboard docking
- room metadata display

This is a trade-off. The benefit is reuse and consistent behavior between modes. The cost is increased component complexity.

## 8. Production Networking and Auth Hardening

The final version of the frontend centralizes backend URL resolution in `frontend/src/config.js` using Vite environment variables plus a production-safe fallback:

- `import.meta.env.VITE_BACKEND_URL`
- fallback to `https://wordle-pvp-backend.onrender.com`

This was added because the deployed frontend previously logged `BACKEND_URL: undefined`, which caused fetch requests like `undefined/api/me` and broke both auth and socket connection setup. The fallback ensures the backend URL is always defined even if the Vercel environment variable is missing.

The frontend now also logs:

- `BACKEND_URL`
- every API URL before fetch
- the socket target URL before Socket.IO connection

These logs were intentionally added as deployment diagnostics. They make it much easier to verify whether a bad deployment is using the right backend endpoint or not.

All frontend API calls now flow through `BACKEND_URL`:

- `/api/me`
- `/api/logout`
- `/api/login`
- `/api/register`
- `/api/update-coins`

Socket.IO also uses the same centralized backend URL with `withCredentials: true`.

This set of changes significantly improved production robustness. Instead of debugging cross-origin failures as vague auth bugs, the deployed app now makes its network target visible and consistent.

## 9. Multiplayer Frontend Flow

`frontend/src/pages/MultiPlayer.jsx` is the main coordinator for multiplayer connection and room-state transitions.

It manages:

- socket creation
- room code input
- create/join actions
- waiting room vs game screen switching
- room-state sync
- leave-game behavior
- opponent-left handling

### 9.1 Shared Room State

One of the most important changes in the final version is the `applySharedRoomState(...)` function. Instead of treating `sync-state`, `room_state`, and `game-started` as unrelated events, the frontend now normalizes shared state and decides whether to remain in a waiting room or enter the gameplay UI based on room status.

This solves an important class of bugs:

- same-user second tab should stay in waiting mode if the room is still waiting
- reconnect should not automatically imply â€œstart the game UIâ€
- the joiner and creator should see the same shared room metadata

### 9.2 Leave-Game Flow

The multiplayer page also now owns explicit leave-game logic:

- confirm with the user
- emit `leave_game`
- disconnect the socket
- clear local room state
- navigate back through React routing

This is a meaningful UX and lifecycle improvement because it replaces ad hoc refresh-based exits with a clean intentional teardown path.

## 10. GameWindow and Real-Time Rendering

`GameWindow.jsx` is where the real-time gameplay experience is assembled. It maintains refs for board boxes, keyboard keys, current row/column position, and transient typing state. This is a sensible performance choice. High-frequency input state is stored in refs so typing does not trigger a React re-render for every keystroke.

### 10.1 Local vs Remote Guess Rendering

When `guess-result` arrives:

- if the result belongs to the current user, the main board animates with letters, tile flips, color reveals, and keyboard color updates
- if the result belongs to the opponent, the opponent board animates using the same timing and color reveal, but without showing letters

This design creates a true head-to-head feel while preserving hidden information.

### 10.2 Shared Header State

A later bug fix ensured that both creator and joiner see the same room code and room header metadata. `GameWindow` now resolves room code from shared state:

- `gameCode`
- `initialSyncState.gameCode`
- `initialSyncState.roomCode`

This means the creator is no longer special in terms of metadata display. Both players are consumers of the same room-state payload.

### 10.3 Turn Status

The current implementation includes a `currentTurnPlayerId` field in shared room state, but at present it is serialized as `null`. The frontend therefore falls back to a simultaneous-play interpretation, which is appropriate for the current game design. It still computes `isMyTurn` safely, and the structure is ready for true turn-based ownership if that is ever introduced later.

### 10.4 Reconnect and Opponent Presence

`GameWindow` also manages opponent disconnect UI:

- disconnect banner
- reconnect countdown
- reconnect notice
- opponent board dimming

These are UI-only features built on top of backend disconnect and reconnect signals. They make the game feel more alive and reduce ambiguity when the opponent disappears temporarily.

## 11. Key Bugs Encountered and How They Were Fixed

The final version reflects a substantial debugging journey. Several issues were architectural rather than cosmetic.

### 11.1 Production Backend URL Was Undefined

Symptom:

- console showed `BACKEND_URL: undefined`
- API calls went to `undefined/api/...`
- auth and sockets failed

Root cause:

- Vite environment configuration was not guaranteed in deployment

Fix:

- centralize backend URL in `config.js`
- use `import.meta.env.VITE_BACKEND_URL`
- provide a hard fallback to the deployed Render URL

### 11.2 Cookie-Based Multiplayer Auth Failed in Production

Symptom:

- login appeared successful
- `/api/me` or multiplayer socket auth failed in production

Root cause:

- cross-site cookies require `sameSite: "none"` and `secure: true`

Fix:

- updated login and logout cookie config
- updated CORS and Socket.IO CORS to allow the Vercel frontend with credentials

### 11.3 Join Flow Read Empty Code

Symptom:

- join button clicked repeatedly
- frontend logs showed no code

Root cause:

- the handler relied only on React state, which could lag behind the visible input

Fix:

- added input ref fallback so the join handler reads the actual textbox value

### 11.4 Same User in Another Tab Started the Game Incorrectly

Symptom:

- the same user opened another tab
- the app behaved like a second player had joined

Root cause:

- the frontend treated synchronized room state too aggressively
- the server needed a more explicit same-user-in-room path

Fix:

- backend now reattaches sockets to existing players and emits `room_state`
- frontend stays on waiting UI if room status is still `waiting`

This is one of the most instructive fixes in the project because it formalizes the distinction between player identity and socket connection.

### 11.5 Runtime Crash: Cannot Read Properties of Undefined Reading `[0]`

Symptom:

- multiplayer could crash with an undefined property access

Root cause:

- unsafe nested access in opponent board rendering
- unsafe first-character access for the HUD avatar

Fix:

- `opponentRows?.[rowIndex]?.[colIndex] || ""`
- `user?.username?.[0] ? ... : "G"`
- additional guards around socket payload arrays and animation logic

### 11.6 Leave-Game and Opponent-Left Lifecycle

Symptom:

- no clean way to exit a game
- leaving risked awkward state or reliance on reload

Fix:

- explicit `leave_game` socket event
- backend notification with `opponent_left`
- frontend navigation-based return to menu
- disconnect handler guarded to avoid double cleanup when leave is intentional

## 12. Design Trade-Offs

This project intentionally chooses simplicity in several areas:

- in-memory multiplayer sessions instead of distributed shared state
- direct SQL instead of an ORM
- one large `GameWindow` instead of many smaller multiplayer-specific hooks
- event payloads that are practical rather than formally versioned

These are reasonable choices for an interview-focused system. The architecture is robust enough to discuss real-time state synchronization and auth, but still small enough to finish and explain end-to-end.

The biggest trade-off is scalability. Because `games` and `userGameMap` live in memory, multiplayer state is tied to a single Node.js process. This is excellent for clarity and fast iteration, but it means a restart destroys active rooms and horizontal scaling would require external shared state.

Another trade-off is protocol completeness. The app now handles creation, joining, state sync, reconnect, leave, and duplicate-tab behavior, but it still has room to mature further in areas like richer end-game events, durable match history, and explicit turn ownership if the product were to evolve toward turn-based mechanics.

## 13. Scalability and Production Considerations

If this system were scaled beyond its current scope, the first major change would be externalizing room state. Redis would be the natural next step because:

- Socket.IO supports Redis adapters
- room membership and cross-instance broadcasts would become possible
- `userGameMap` could become a distributed presence index
- reconnect windows could be implemented with durable expirations rather than process-local timers

The second major improvement would be durable match storage. Right now PostgreSQL stores users and coins, but not completed match history. Adding persistent match summaries would unlock:

- match history
- analytics
- dispute/debug support
- leaderboards

The third improvement would be observability. Real-time apps benefit heavily from structured logging and metrics around:

- active rooms
- reconnect success rate
- average match duration
- auth failures
- duplicate-tab room-state events

The current code is debug-log friendly, which was useful during development, but production systems usually need more structured telemetry than console statements alone.

## 14. Future Improvements

There are several realistic next steps from the current design.

First, the room-state protocol could be made richer and more explicit. Right now the app uses `room_state`, `sync-state`, and `game-started`, which is already much better than before, but it could eventually converge toward a more formal event model where every client-facing state transition is represented by one normalized room snapshot plus a small type field.

Second, the current `currentTurnPlayerId` field is present in serialized room state but not actively used to enforce turn order. That is fine because the game currently behaves as a simultaneous race rather than a turn-based game. If a true turn-based version were ever desired, the data shape already points in that direction.

Third, the frontend could be refactored into smaller multiplayer hooks:

- `useRoomSync`
- `useOpponentStatus`
- `useKeyboardDock`
- `useBoardHydration`

This would improve maintainability without changing behavior.

Fourth, the backend session manager could gain a more explicit presence model. Right now it uses `isConnected`, reconnect timers, and socket replacement, which is effective and understandable. A production version could evolve toward multiple simultaneous socket tracking per player if the product wanted all tabs to remain live rather than simply resyncing one logical player.

## 15. Conclusion

The final version of Wordle PvP is a compact but technically rich real-time application. It demonstrates how to combine deterministic game logic, cookie-based auth, event-driven multiplayer synchronization, reconnect recovery, deployment-aware frontend configuration, and iterative bug fixing into one coherent system.

What makes it especially valuable for interviews is not just that it works, but that it tells a strong engineering story. The project begins with a familiar product, then exposes deeper distributed-systems problems:

- how to preserve fairness in multiplayer
- how to bind sockets to authenticated users
- how to distinguish players from connections
- how to recover state after refresh
- how to support production deployment across different origins
- how to debug bugs that live at the boundary between frontend state and backend authority

The strongest final architectural principle in the project is this: the server owns multiplayer truth, and the frontend renders synchronized shared state rather than inventing it. Once that principle is respected consistently, many of the hardest bugs become solvable in a disciplined way. That is exactly what happened across the final iterations of this codebase.

If I were presenting this project in an interview, I would describe it as an event-driven client-server system with a shared deterministic game engine, backend-authoritative multiplayer state, cross-site cookie authentication, reconnect-aware room coordination, and a series of production-hardening improvements that transformed a local prototype into a deployable and explainable real-time web application.
