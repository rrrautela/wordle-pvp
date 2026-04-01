import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import GameWindow from "../components/GameWindow";

export default function MultiPlayer({ user }) {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  const [mode, setMode] = useState(null);
  const [gameCode, setGameCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState("");
  const [syncState, setSyncState] = useState(null);
  const isGuest = user?.guest || user?.isGuest || user?.username?.startsWith("Guest");

  const displayError =
    error === "No cookies found" ||
    error === "No token found" ||
    error === "Unauthorized"
      ? "You need to log in to play multiplayer"
      : error;

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("SOCKET CONNECTED:", socket.id);
      setError("");
    });

    socket.on("connect_error", (err) => {
      console.log("CONNECT ERROR:", err.message);
      setError(err.message);
    });

    socket.on("sync-state", (data) => {
      console.log("SYNC STATE:", data);
      setSyncState(data);
      setGameCode(data?.gameCode || "");
      setMode("rejoin");
      setError("");
      setGameStarted(true);
    });

    socket.on("game-created", (code) => {
      setGameCode(code);
    });

    socket.on("game-started", () => {
      console.log("GAME STARTED");
      setError("");
      setGameStarted(true);
    });

    socket.on("error", (message) => {
      console.log("SOCKET ERROR:", message);
      if (message === "already in  a game") {
        setError("Rejoining active game...");
        return;
      }
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const socketController = {
    get socket() {
      return socketRef.current;
    },
    submitGuess(word) {
      socketRef.current.emit("guess", word);
    },
  };

  function createGame() {
    if (isGuest) return;
    setMode("create");
    setError("");
    socketRef.current.emit("create-game");
  }

  function joinGame() {
    if (isGuest) return;
    const typedCode = (inputRef.current?.value || inputCode || "")
      .trim()
      .toUpperCase();

    console.log("JOIN CLICKED:", typedCode);
    console.log("SOCKET:", socketRef.current);

    if (!typedCode) {
      console.log("NO CODE");
      return;
    }

    if (!socketRef.current?.connected) {
      console.log("SOCKET NOT CONNECTED");
      return;
    }

    console.log("EMITTING JOIN");

    setInputCode(typedCode);
    setError("");
    socketRef.current.emit("join-game", typedCode);
    setMode("join");
  }

  function copyCode() {
    navigator.clipboard.writeText(gameCode);
  }

  if (gameStarted) {
    return (
      <GameWindow
        mode="multi"
        gameController={socketController}
        gameReset={() => window.location.reload()}
        onGameOver={() => {}}
        user={user}
        initialSyncState={syncState}
        gameCode={gameCode}
      />
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#121213] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/8 bg-[#1e1f22] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.3)] sm:p-8">
          <div className="text-center">
            <p className="text-sm font-medium text-[#3b82f6]">
              Multiplayer lobby
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Multiplayer
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Create or join a room.
            </p>
          </div>

          {isGuest ? (
            <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-[#17181a]/80 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
                🔒
              </div>
              <h2 className="text-xl font-semibold text-white">
                Multiplayer Locked
              </h2>
              <p className="mx-auto mt-3 max-w-md text-gray-400">
                Create an account to play against others and earn rewards.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 rounded-lg bg-green-500 px-6 py-3 font-medium text-black transition hover:bg-green-400"
              >
                Login to Play
              </button>
            </div>
          ) : (
            <>
          {displayError && (
            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              {displayError}
            </div>
          )}

          {!mode && (
            <div className="mt-8 flex flex-col gap-8">
              <div className="rounded-[1.5rem] border border-white/8 bg-[#17181a] p-6 text-center">
                <h2 className="text-xl font-semibold">Start a new room</h2>
                <p className="mt-2 text-sm text-gray-400">Create a room code.</p>
                <button
                  onClick={createGame}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#4CAF50] px-6 py-4 text-base font-semibold text-black transition-all duration-200 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] sm:w-auto sm:min-w-[220px]"
                >
                  Create Game
                </button>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-[#17181a] p-6">
                <label
                  htmlFor="game-code"
                  className="mb-3 block text-sm font-medium text-white"
                >
                  Enter Game Code
                </label>
                <input
                  id="game-code"
                  ref={inputRef}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full rounded-2xl border border-white/14 bg-[#f4f4f5] px-4 py-3.5 text-center text-lg font-semibold tracking-[0.35em] text-black placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/25"
                />
                <button
                  onClick={joinGame}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#3b82f6] px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99]"
                >
                  Join Game
                </button>
              </div>
            </div>
          )}

          {mode === "create" && !gameStarted && (
            <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-[#17181a] px-6 py-10 text-center">
              <p className="text-sm text-gray-400">
                Share this code
              </p>

              <div className="mx-auto mt-5 inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[#facc15]/12 px-6 py-4 text-4xl font-bold tracking-[0.45em] text-[#facc15] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)]">
                {gameCode || "LOADING"}
              </div>

              <button
                onClick={copyCode}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#facc15] px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
              >
                Copy code
              </button>

              <p className="mt-4 text-sm text-gray-400">
                Waiting for opponent<span className="loading-dots" />
              </p>
            </div>
          )}

          {mode === "join" && !gameStarted && (
            <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-[#17181a] px-6 py-10 text-center">
              <p className="text-lg font-semibold text-white">Joining game</p>
              <p className="mt-2 text-sm text-gray-400">
                Connecting you to the room<span className="loading-dots" />
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
