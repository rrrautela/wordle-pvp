import { useRef, useEffect, useState } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";
import OpponentBoard from "./OpponentBoard";

export default function GameWindow({
  gameReset,
  onGameOver,
  gameController,
  mode = "single",
  user,
  initialSyncState = null,
  gameCode = "",
  onLeaveGame = null,
}) {
  const controllerRef = useRef(null);
  if (!controllerRef.current) {
    controllerRef.current = gameController;
  }

  const gameBoardBoxesRefs = useRef([]);
  const opponentBoardBoxesRefs = useRef([]);
  const keyboardKeysRefs = useRef([]);
  const currentRowRef = useRef(0);
  const currentColRef = useRef(0);
  const wordInputSoFarRef = useRef("");
  const currentGlobalPositionRef = useRef(0);
  const ischeckOngoingRightNowRef = useRef(false);
  const hasHydratedSyncStateRef = useRef(false);
  const reconnectIntervalRef = useRef(null);
  const keyboardPanelRef = useRef(null);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const [correctWordToShow, setCorrectWordToShow] = useState(null);
  const [messages, setMessages] = useState([]);
  const [winMsg, setWinMsg] = useState(false);
  const [opponentPulse, setOpponentPulse] = useState(false);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [reconnectTimer, setReconnectTimer] = useState(60);
  const [reconnectNotice, setReconnectNotice] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [letterStates, setLetterStates] = useState({});

  const [opponentRows, setOpponentRows] = useState(
    Array(6)
      .fill(null)
      .map(() => Array(5).fill("")),
  );

  const keyboard_keys = [
    "Q",
    "W",
    "E",
    "R",
    "T",
    "Y",
    "U",
    "I",
    "O",
    "P",
    "A",
    "S",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "⌫",
    "Z",
    "X",
    "C",
    "V",
    "B",
    "N",
    "M",
    "ENTER",
  ];

  const sharedPlayers = initialSyncState?.players || {};
  const hostPlayer = sharedPlayers?.host || null;
  const opponentPlayer = sharedPlayers?.opponent || null;
  const resolvedRoomCode =
    gameCode || initialSyncState?.gameCode || initialSyncState?.roomCode || "";
  const currentTurnPlayerId = initialSyncState?.currentTurnPlayerId ?? null;

  const myProgressCount = currentRowRef.current;
  const opponentProgressCount = opponentRows.filter((row) =>
    row.some(Boolean),
  ).length;
  const myDisplayName = user?.username || "You";
  const opponentDisplayName =
    hostPlayer?.userId === user?.id
      ? opponentPlayer?.username ||
        opponentPlayer?.name ||
        "Opponent"
      : hostPlayer?.username ||
        hostPlayer?.name ||
        "Opponent";
  const isMyTurn =
    currentTurnPlayerId == null || currentTurnPlayerId === user?.id;

  const statusLabel =
    mode !== "multi"
      ? ""
      : isOpponentDisconnected
        ? "Opponent disconnected"
        : ischeckOngoingRightNowRef.current
          ? "Waiting for opponent move..."
          : opponentPulse
            ? "Opponent is guessing..."
            : isMyTurn
              ? "Your turn"
              : "Opponent's turn";

  function resetOpponentReconnectState(showNotice = false) {
    setIsOpponentDisconnected(false);
    setReconnectTimer(null);
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    if (showNotice) {
      setReconnectNotice("Opponent reconnected");
    }
  }

  function mapColorToLetterState(colorClass) {
    if (colorClass === "bg-green-800") return "correct";
    if (colorClass === "bg-yellow-600") return "present";
    if (colorClass === "bg-zinc-700") return "absent";
    return null;
  }

  function promoteLetterState(letter, nextState) {
    if (!letter || !nextState) return;

    const priority = { absent: 1, present: 2, correct: 3 };

    setLetterStates((prev) => {
      const current = prev[letter];
      if ((priority[current] || 0) >= priority[nextState]) {
        return prev;
      }

      return {
        ...prev,
        [letter]: nextState,
      };
    });
  }

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setShowKeyboard(true);
    }

    function handleResize() {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
      if (nextIsMobile) {
        setShowKeyboard(true);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function updateKeyboardHeight() {
      setKeyboardHeight(keyboardPanelRef.current?.offsetHeight || 0);
    }

    updateKeyboardHeight();

    const panelElement = keyboardPanelRef.current;
    if (!panelElement || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateKeyboardHeight);
      return () => window.removeEventListener("resize", updateKeyboardHeight);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateKeyboardHeight();
    });

    resizeObserver.observe(panelElement);
    window.addEventListener("resize", updateKeyboardHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateKeyboardHeight);
    };
  }, [showKeyboard, isMobile]);

  useEffect(() => {
    if (!isOpponentDisconnected) return;

    setReconnectTimer(60);
    reconnectIntervalRef.current = setInterval(() => {
      setReconnectTimer((prev) => {
        if (prev <= 1) {
          if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
            reconnectIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [isOpponentDisconnected]);

  useEffect(() => {
    if (!reconnectNotice) return;
    const timeoutId = setTimeout(() => setReconnectNotice(""), 2200);
    return () => clearTimeout(timeoutId);
  }, [reconnectNotice]);

  useEffect(() => {
    if (mode !== "multi") return;

    const socket = controllerRef.current?.socket;
    if (!socket) return;

    socket.on("guess-result", (result) => {
      processResult(result);
    });

    socket.on("opponent_disconnected", () => {
      console.log("Opponent disconnected");
      setIsOpponentDisconnected(true);
      setReconnectNotice("");
    });

    socket.on("sync-state", () => {
      console.log("Opponent reconnected");
      resetOpponentReconnectState(true);
    });

    socket.on("game-started", () => {
      resetOpponentReconnectState(false);
    });

    return () => {
      socket.off("guess-result");
      socket.off("opponent_disconnected");
      socket.off("sync-state");
      socket.off("game-started");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    resetOpponentReconnectState(false);
    setLetterStates({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode]);

  useEffect(() => {
    if (
      mode !== "multi" ||
      !initialSyncState ||
      hasHydratedSyncStateRef.current ||
      !user?.id
    ) {
      return;
    }

    const myPlayer =
      hostPlayer?.userId === user.id
        ? hostPlayer
        : opponentPlayer?.userId === user.id
          ? opponentPlayer
          : null;

    const otherPlayer =
      hostPlayer?.userId === user.id ? opponentPlayer : hostPlayer;

    if (!myPlayer) return;

    const nextOpponentRows = Array(6)
      .fill(null)
      .map(() => Array(5).fill(""));

    myPlayer.guesses?.forEach((entry, rowIndex) => {
      const guess = entry.guess || "";
      const result = entry?.result;
      const letterResults = Array.isArray(result?.letterResults)
        ? result.letterResults
        : [];

      for (let i = 0; i < 5; i++) {
        const globalIdx = rowIndex * 5 + i;
        const box = gameBoardBoxesRefs.current[globalIdx];
        if (!box) continue;

        box.textContent = guess[i] || "";
        box.classList.add(
          "flex",
          "items-center",
          "justify-center",
          "text-white",
          "font-bold",
        );

        if (letterResults[i]) {
          box.classList.remove("border-2", "border-neutral-700");
          box.classList.add(letterResults[i]);
        } else {
          box.classList.add("border-zinc-500");
        }
      }
    });

    otherPlayer?.guesses?.forEach((entry, rowIndex) => {
      nextOpponentRows[rowIndex] =
        Array.isArray(entry?.result?.letterResults)
          ? entry.result.letterResults
          : Array(5).fill("");
    });

    setOpponentRows(nextOpponentRows);

    setTimeout(() => {
      otherPlayer?.guesses?.forEach((entry, rowIndex) => {
        for (let i = 0; i < 5; i++) {
          const globalIdx = rowIndex * 5 + i;
          const box = opponentBoardBoxesRefs.current[globalIdx];
          const resultColor = entry?.result?.letterResults?.[i];
          if (!box || !resultColor) continue;
          box.classList.remove("border-2", "border-neutral-700");
          box.classList.add(resultColor);
        }
      });
    }, 0);

    myPlayer.guesses?.forEach((entry) => {
      const guess = entry.guess || "";
      const result = entry?.result;
      const letterResults = Array.isArray(result?.letterResults)
        ? result.letterResults
        : [];
      for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        const nextState = mapColorToLetterState(letterResults[i]);
        promoteLetterState(letter, nextState);
      }
    });

    currentRowRef.current = myPlayer.guesses?.length || 0;
    currentColRef.current = 0;
    wordInputSoFarRef.current = "";
    currentGlobalPositionRef.current = currentRowRef.current * 5;
    ischeckOngoingRightNowRef.current = false;

    if (initialSyncState.status === "finished") {
      if (initialSyncState.winner === user.id) {
        setWinMsg(true);
      }
    }

    hasHydratedSyncStateRef.current = true;
  }, [initialSyncState, mode, user?.id]);

  function bounceAllBoxes() {
    for (let i = 0; i < 30; i++) {
      const box = gameBoardBoxesRefs.current[i];
      if (!box) continue;
      const randomDelay = Math.random() * 600;
      setTimeout(() => {
        box.classList.add("animate-bounce-vertical");
        setTimeout(() => box.classList.remove("animate-bounce-vertical"), 400);
      }, randomDelay);
    }
  }

  function pushTempMessage(label) {
    setMessages((prevMessages) => [...prevMessages, { id: Date.now(), label }]);
  }

  useEffect(() => {
    let intervalId;
    if (messages.length > 0) {
      const speed = 300 - messages.length * 20;
      intervalId = setInterval(() => {
        setMessages((prev) =>
          prev.length === 0 ? (clearInterval(intervalId), []) : prev.slice(1),
        );
      }, speed);
    }
    return () => clearInterval(intervalId);
  }, [messages.length]);

  function processResult(result) {
    if (!result) return;

    const isMine = mode === "single" || result.playerId === user.id;
    const letterResults = Array.isArray(result?.letterResults)
      ? result.letterResults
      : [];
    const guessWord = result?.guess || "";
    const guessNumber = Number.isFinite(result?.guessNumber)
      ? result.guessNumber
      : 1;

    if (mode === "multi" && !isMine) {
      const animationDelay = 300;
      const rowIndex = Math.max(0, guessNumber - 1);

      if (isOpponentDisconnected) {
        console.log("Opponent reconnected");
        resetOpponentReconnectState(true);
      }

      for (let i = 0; i < 5; i++) {
        const globalIdx = rowIndex * 5 + i;
        const box = opponentBoardBoxesRefs.current[globalIdx];
        const resultColor = letterResults[i];

        if (!box) continue;

        setTimeout(() => {
          box.style.transition = "transform 0.6s";
          box.style.transform = "rotateX(90deg)";
        }, animationDelay * i);

        setTimeout(() => {
          box.classList.remove("border-2", "border-neutral-700");
          box.classList.add(resultColor);
          box.style.transform = "rotateX(0deg)";
        }, animationDelay * i + 300);

        setTimeout(() => {
          box.style.transition = "";
          box.style.transform = "";
        }, animationDelay * i + 600);
      }

      setTimeout(() => {
        setOpponentRows((prev) => {
          const newRows = [...prev];
          newRows[rowIndex] =
            letterResults.length > 0 ? letterResults : Array(5).fill("");
          return newRows;
        });
      }, animationDelay * 5 + 300);

      setOpponentPulse(true);
      setTimeout(() => setOpponentPulse(false), 900);
      return;
    }

    if (result.status === "invalid") {
      const start = currentRowRef.current * 5;
      for (let i = start; i < start + 5; i++) {
        const box = gameBoardBoxesRefs.current[i];
        if (!box) continue;
        box.classList.add("vibrate-horizontal");
        setTimeout(() => box.classList.remove("vibrate-horizontal"), 500);
      }
      pushTempMessage(result.message);
      ischeckOngoingRightNowRef.current = false;
      return;
    }

    const animationDelay = 300;
    for (let i = 0; i < 5; i++) {
      const globalIdx = currentRowRef.current * 5 + i;
      const box = gameBoardBoxesRefs.current[globalIdx];
      const resultColor = letterResults[i];
      if (!box) continue;

      setTimeout(() => {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, animationDelay * i);

      setTimeout(() => {
        box.classList.remove("border-2", "border-neutral-700");
        box.classList.add(resultColor);
        box.style.transform = "rotateX(0deg)";
      }, animationDelay * i + 300);

      setTimeout(() => {
        box.style.transition = "";
        box.style.transform = "";
      }, animationDelay * i + 600);
    }

    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        const letter = guessWord[i];
        const nextState = mapColorToLetterState(letterResults[i]);
        promoteLetterState(letter, nextState);
      }

      if (result.status === "correct") {
        const rewards = [100, 80, 60, 40, 20, 10];
        const wonAmount = rewards[guessNumber - 1] || 0;

        setEarnedCoins(wonAmount);
        setWinMsg(true);
        bounceAllBoxes();

        if (onGameOver) {
          onGameOver("correct", guessNumber);
        }

        setTimeout(() => {
          setWinMsg(false);
          setEarnedCoins(0);
          ischeckOngoingRightNowRef.current = false;
          gameReset();
        }, 2500);
        return;
      }

      currentRowRef.current++;
      currentColRef.current = 0;
      wordInputSoFarRef.current = "";
      currentGlobalPositionRef.current = currentRowRef.current * 5;
      ischeckOngoingRightNowRef.current = false;

      if (result.status === "lost") {
        setCorrectWordToShow(result.correctWord);

        if (onGameOver) {
          onGameOver("lost", 6);
        }

        setTimeout(() => {
          ischeckOngoingRightNowRef.current = false;
          gameReset();
        }, 2500);
      }
    }, animationDelay * 5 + 300);
  }

  function checkGuess() {
    if (ischeckOngoingRightNowRef.current) return;
    ischeckOngoingRightNowRef.current = true;

    const typedWord = wordInputSoFarRef.current;
    if (mode === "single") {
      const result = controllerRef.current.submitGuess(typedWord);
      processResult(result);
    } else {
      controllerRef.current.submitGuess(typedWord);
    }
  }

  function backSpacePressed() {
    const currentPos = currentGlobalPositionRef.current;
    const rowStartBoundary = currentRowRef.current * 5;
    if (currentPos <= rowStartBoundary) return;
    const lastBoxIdx = currentPos - 1;
    const box = gameBoardBoxesRefs.current[lastBoxIdx];
    if (box) {
      box.textContent = "";
      box.classList.remove("border-zinc-500");
    }
    currentColRef.current--;
    wordInputSoFarRef.current = wordInputSoFarRef.current.slice(0, -1);
    currentGlobalPositionRef.current = lastBoxIdx;
  }

  function enterKeyPressed() {
    if (currentColRef.current === 5) checkGuess();
    else pushTempMessage("Not enough letters");
  }

  function keyPressed(key) {
    if (ischeckOngoingRightNowRef.current) return;
    if (key === "ENTER") {
      enterKeyPressed();
      return;
    }
    if (key === "⌫") {
      backSpacePressed();
      return;
    }
    if (currentColRef.current >= 5) return;

    const boxIdx = currentRowRef.current * 5 + currentColRef.current;
    const box = gameBoardBoxesRefs.current[boxIdx];
    if (box) {
      box.textContent = key;
      box.classList.add(
        "border-zinc-500",
        "scale-110",
        "transition-transform",
        "duration-100",
        "flex",
        "items-center",
        "justify-center",
        "text-white",
        "font-bold",
      );
      setTimeout(() => box.classList.remove("scale-110"), 100);
    }
    wordInputSoFarRef.current += key;
    currentColRef.current++;
    currentGlobalPositionRef.current = boxIdx + 1;
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key;
      if (/^[a-zA-Z]$/.test(key)) keyPressed(key.toUpperCase());
      else if (key === "Backspace") backSpacePressed();
      else if (key === "Enter") {
        event.preventDefault();
        enterKeyPressed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0b0f17] text-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            showKeyboard ? "pb-[140px]" : "pb-[48px]"
          }`}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col items-center justify-start px-4 pt-15 sm:px-6 sm:pt-8">
            {mode === "multi" && onLeaveGame && (
              <div className="mb-4 flex w-full justify-end">
                <button
                  onClick={onLeaveGame}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
                >
                  Leave Game
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={msg.id}
                style={{ top: `${1 + i * 3}rem` }}
                className="absolute left-1/2 z-[110] -translate-x-1/2 rounded bg-white px-3 py-1.5 text-sm font-semibold text-black shadow"
              >
                {msg.label}
              </div>
            ))}

            {winMsg && (
              <div className="absolute left-1/2 top-4 z-[110] flex -translate-x-1/2 transform flex-col items-center gap-2">
                <div className="animate-bounce rounded bg-white px-6 py-2 text-lg font-bold text-black shadow-2xl">
                  YOU WIN
                </div>
                {earnedCoins > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-yellow-500/50 bg-[#1a1a1b] px-4 py-1 animate-in fade-in zoom-in duration-500">
                    <span className="text-sm text-yellow-500">+</span>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-yellow-500">
                      {earnedCoins} coins
                    </span>
                  </div>
                )}
              </div>
            )}

            {correctWordToShow && (
              <div className="absolute left-1/2 top-4 z-[110] -translate-x-1/2 transform rounded bg-white px-4 py-1.5 text-lg font-bold text-black shadow">
                TARGET IDENTIFIED: {correctWordToShow}
              </div>
            )}

            {mode === "multi" ? (
              <>
                <div className="mb-6 mt-2 flex flex-col items-center gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    {statusLabel}
                  </div>
                  {resolvedRoomCode && (
                    <div className="text-xs font-medium tracking-[0.24em] text-gray-500">
                      ROOM {resolvedRoomCode}
                    </div>
                  )}
                  {reconnectNotice && (
                    <div className="rounded-full border border-[#4CAF50]/25 bg-[#4CAF50]/10 px-4 py-1.5 text-sm font-medium text-[#d6f5d7]">
                      {reconnectNotice}
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-10">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-center">
                      <p className="text-sm font-medium uppercase tracking-[0.28em] text-gray-400">
                        You
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {myDisplayName}
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <span
                            key={`my-progress-${idx}`}
                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                              idx < myProgressCount
                                ? "bg-[#4CAF50]"
                                : "bg-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-[#4CAF50]/25 bg-[#17181a] px-5 pb-5 pt-1 shadow-[0_0_0_1px_rgba(76,175,80,0.05),0_20px_45px_rgba(0,0,0,0.28)]">
                      <div className="origin-center scale-[1.02]">
                        <GameBoard gameBoardBoxesRefs={gameBoardBoxesRefs} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-1 md:pt-24">
                    <div className="hidden h-16 w-px bg-white/10 md:block" />
                    <div className="my-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-bold tracking-[0.2em] text-white">
                      VS
                    </div>
                    <div className="hidden h-16 w-px bg-white/10 md:block" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-center">
                      <p className="text-sm font-medium uppercase tracking-[0.28em] text-gray-400">
                        Opponent
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white">
                        {opponentDisplayName}
                      </h2>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <span
                            key={`opponent-progress-${idx}`}
                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                              idx < opponentProgressCount
                                ? "bg-[#3b82f6]"
                                : "bg-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {isOpponentDisconnected && (
                      <div className="mb-4 w-full max-w-[360px] animate-pulse rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-100">
                        <div>Opponent disconnected</div>
                        <div className="mt-1">
                          Reconnecting in {reconnectTimer}s
                        </div>
                      </div>
                    )}

                    <div
                      className={`rounded-[2rem] border border-white/10 bg-[#17181a] px-5 pb-5 pt-1 shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-all duration-300 ${
                        isOpponentDisconnected
                          ? "opacity-60 grayscale-[0.35]"
                          : "opacity-90"
                      } ${
                        opponentPulse
                          ? "ring-2 ring-[#3b82f6]/35 shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_18px_40px_rgba(0,0,0,0.24)]"
                          : ""
                      }`}
                    >
                      <div
                        className={`transition-transform duration-300 ${
                          opponentPulse ? "scale-[1.02]" : "scale-100"
                        }`}
                      >
                        <OpponentBoard
                          opponentRows={opponentRows}
                          opponentBoardBoxesRefs={opponentBoardBoxesRefs}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <GameBoard gameBoardBoxesRefs={gameBoardBoxesRefs} />
              </div>
            )}
          </div>
        </div>

        <div
          className="fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-in-out"
          style={{ bottom: showKeyboard ? `${keyboardHeight + 10}px` : "10px" }}
        >
          <button
            onClick={() => setShowKeyboard((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-white shadow-lg transition-all duration-300 ease-in-out"
          >
            {showKeyboard ? "▼" : "▲"}
          </button>
        </div>

        <div
          className={`fixed bottom-0 left-0 z-40 w-full transition-all duration-300 ease-in-out ${
            showKeyboard ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div
            ref={keyboardPanelRef}
            className="mx-auto w-full max-w-[600px] border-t border-gray-800 bg-[#0b0f17]/95 px-2 py-2 backdrop-blur"
          >
            <KeyBoard
              keyPressed={keyPressed}
              keyboard_keys={keyboard_keys}
              keyboardKeysRefs={keyboardKeysRefs}
              letterStates={letterStates}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
