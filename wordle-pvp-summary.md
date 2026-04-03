# Wordle PvP: 3-Minute Interview Summary

Wordle PvP is a full-stack real-time word game application that I built with a React and Vite frontend, an Express and Socket.IO backend, and a shared game engine for Wordle logic. The project supports both single-player and multiplayer modes, and the main technical goal was to build a system where multiplayer feels live and consistent while still keeping the game logic correct and secure.

At a high level, the architecture is split into three layers. The frontend handles routing, authentication-aware UI, lobby flow, and gameplay rendering. The backend handles authentication, room management, multiplayer synchronization, and session lifecycle. Then there is a shared pure game engine that contains the actual Wordle rules, like word validation, duplicate-letter handling, guess counting, and win or loss detection. I use that same engine in single-player on the frontend, but in multiplayer I run it on the backend so the server stays authoritative.

The multiplayer design is event-driven. A logged-in user creates or joins a room through Socket.IO. On the backend, each room is stored in memory with a room code, player records, and one engine per player, but both engines share the same secret word for fairness. When a player submits a guess, the server validates it, updates that player’s state, and broadcasts a normalized `guess-result` event to both clients. The local player sees the normal Wordle board with letters, while the opponent board only shows animations and color feedback, not letters. That keeps the match competitive without leaking hidden information.

One of the most important design decisions was separating player identity from socket connection. I bind each socket to `socket.userId` using JWT cookie authentication. That allowed me to solve reconnect and multi-tab problems properly. For example, if the same user opens the room in another tab, the backend now treats that as the same player reconnecting, not as a second opponent. That was a real bug I had to debug and fix. I added shared `room_state` synchronization so the frontend only enters the actual game when the backend says the room is active. If the room is still waiting, every tab for that same user stays on the waiting screen.

Another important part was production hardening. The frontend is deployed on Vercel and the backend on Render, so I had to fix cross-site authentication properly. I centralized the backend URL in config, added a safe Vite env fallback, updated all fetch and socket calls to use the deployed backend, and fixed cookies to use `httpOnly`, `secure: true`, and `sameSite: "none"`. Without that, login might appear to work, but the browser would reject the cookie and multiplayer auth would fail.

I also added reconnect handling, leave-game flow, opponent-left notifications, and UI guards for partial socket data so the app doesn’t crash on undefined values. So overall, I’d describe the project as a compact but strong example of real-time full-stack engineering. It demonstrates event-driven architecture, backend-authoritative multiplayer state, deployment debugging, reconnect-safe session handling, and practical trade-offs between simplicity and scalability.

## Quick Talking Points

- Frontend: React, Vite, React Router, Tailwind
- Backend: Node.js, Express, Socket.IO, PostgreSQL
- Auth: JWT in secure cross-site cookies
- Multiplayer: backend-authoritative room state and guess validation
- Core principle: player identity is based on `userId`, not socket connection
- Main strengths: real-time sync, reconnect handling, duplicate-tab prevention, production deployment fixes
- Main trade-off: active multiplayer rooms are in memory, so scaling would eventually need Redis or another shared state layer
