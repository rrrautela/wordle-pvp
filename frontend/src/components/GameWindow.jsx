import { useRef, useEffect, useState } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";

export default function GameWindow({ gameReset, onGameOver, gameController }) {
  // --- ENGINE INSTANCE ---
  const controllerRef = useRef(null);
  if (!controllerRef.current) {
    controllerRef.current = gameController;
  }

  // --- REFS: UI and Input State ---
  const gameBoardBoxesRefs = useRef([]);
  const keyboardKeysRefs = useRef([]);
  const currentRowRef = useRef(0);
  const currentColRef = useRef(0);
  const wordInputSoFarRef = useRef("");
  const currentGlobalPositionRef = useRef(0);
  const ischeckOngoingRightNowRef = useRef(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // --- STATE: UI Overlays ---
  const [correctWordToShow, setCorrectWordToShow] = useState(null);
  const [messages, setMessages] = useState([]);
  const [winMsg, setWinMsg] = useState(false);

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

  // --- Animation: Celebration Bounce ---
  function bounceAllBoxes() {
    for (let i = 0; i < 30; i++) {
      const box = gameBoardBoxesRefs.current[i];
      if (!box) continue;
      const randomDelay = Math.random() * 600;
      setTimeout(function () {
        box.classList.add("animate-bounce-vertical");
        setTimeout(() => box.classList.remove("animate-bounce-vertical"), 400);
      }, randomDelay);
    }
  }

  // --- UI: Alert Messages ---
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

  // --- CORE GAME LOGIC ---
  function checkGuess() {
    if (ischeckOngoingRightNowRef.current) return;
    ischeckOngoingRightNowRef.current = true;

    const typedWord = wordInputSoFarRef.current;
    const result = controllerRef.current.submitGuess(typedWord);

    // CASE: INVALID WORD
    if (result.status === "invalid") {
      const start = currentRowRef.current * 5;
      for (let i = start; i < start + 5; i++) {
        const box = gameBoardBoxesRefs.current[i];
        box.classList.add("vibrate-horizontal");
        setTimeout(() => box.classList.remove("vibrate-horizontal"), 500);
      }
      pushTempMessage(result.message);
      ischeckOngoingRightNowRef.current = false;
      return;
    }

    // CASE: VALID WORD (Animate Flips)
    const animationDelay = 300;
    for (let i = 0; i < 5; i++) {
      const globalIdx = currentRowRef.current * 5 + i;
      const box = gameBoardBoxesRefs.current[globalIdx];
      const resultColor = result.letterResults[i];

      setTimeout(() => {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, animationDelay * i);

      setTimeout(
        () => {
          box.classList.remove("border-2", "border-neutral-700");
          box.classList.add(resultColor);
          box.style.transform = "rotateX(0deg)";
        },
        animationDelay * i + 300,
      );

      setTimeout(
        () => {
          box.style.transition = "";
          box.style.transform = "";
        },
        animationDelay * i + 600,
      );
    }

    // Process result after animations finish
    setTimeout(
      () => {
        // Update Keyboard Colors
        for (let i = 0; i < 5; i++) {
          const letter = typedWord[i];
          const keyIndex = keyboard_keys.indexOf(letter);
          const keyElement = keyboardKeysRefs.current[keyIndex];
          if (!keyElement) continue;

          if (!keyElement.classList.contains("bg-green-800")) {
            keyElement.classList.forEach(
              (cls) =>
                cls.startsWith("bg-") && keyElement.classList.remove(cls),
            );
            keyElement.classList.add(result.letterResults[i]);
          }
        }

        // HANDLE WIN
        // Inside GameWindow.jsx -> checkGuess() -> HANDLE WIN
        if (result.status === "correct") {
          // Calculate reward locally for the UI message
          const rewards = [100, 80, 60, 40, 20, 10]; // Tiered rewards
          const wonAmount = rewards[result.guessNumber - 1] || 0;

          setEarnedCoins(wonAmount); // Store for the UI
          setWinMsg(true);
          bounceAllBoxes();

          if (onGameOver) {
            onGameOver("correct", result.guessNumber);
          }

          setTimeout(() => {
            setWinMsg(false);
            setEarnedCoins(0); // Reset for next game
            ischeckOngoingRightNowRef.current = false;
            gameReset();
          }, 2500);
          return;
        }
        // ADVANCE ROW
        currentRowRef.current++;
        currentColRef.current = 0;
        wordInputSoFarRef.current = "";
        currentGlobalPositionRef.current = currentRowRef.current * 5;
        ischeckOngoingRightNowRef.current = false;

        // HANDLE LOSS
        if (result.status === "lost") {
          setCorrectWordToShow(result.correctWord);

          // Notify Parent (0 coins)
          if (onGameOver) {
            onGameOver("lost", 6);
          }

          setTimeout(() => {
            ischeckOngoingRightNowRef.current = false;
            gameReset();
          }, 2500);
        }
      },
      animationDelay * 5 + 300,
    );
  }

  // --- INPUT HELPERS ---
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
    <div className="w-screen h-screen bg-[#121213] flex justify-center relative overflow-hidden">
      {/* Added 'pt-24' only for mobile to prevent HUD collision. 
          'sm:pt-0' ensures the big screen layout remains exactly as you had it. 
      */}
      <div className="w-full sm:w-[490px] flex flex-col items-center pt-15 sm:pt-0">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            style={{ top: `${1 + i * 3}rem` }}
            className="absolute left-1/2 transform -translate-x-1/2 z-[110] text-black bg-white text-sm font-semibold px-3 py-1.5 rounded shadow"
          >
            {msg.label}
          </div>
        ))}

        {winMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[110] flex flex-col items-center gap-2">
            <div className="text-black bg-white text-lg font-bold px-6 py-2 rounded shadow-2xl animate-bounce">
              YOU WIN
            </div>
            {earnedCoins > 0 && (
              <div className="bg-[#1a1a1b] border border-yellow-500/50 px-4 py-1 rounded-full flex items-center gap-2 animate-in fade-in zoom-in duration-500">
                <span className="text-yellow-500 text-sm">🪙</span>
                <span className="text-yellow-500 font-mono font-bold text-xs uppercase tracking-widest">
                  +{earnedCoins} coins
                </span>
              </div>
            )}
          </div>
        )}

        {correctWordToShow && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[110] text-black bg-white text-lg font-bold px-4 py-1.5 rounded shadow">
            TARGET IDENTIFIED: {correctWordToShow}
          </div>
        )}

        <GameBoard gameBoardBoxesRefs={gameBoardBoxesRefs} />
        <KeyBoard
          keyPressed={keyPressed}
          keyboard_keys={keyboard_keys}
          keyboardKeysRefs={keyboardKeysRefs}
        />
      </div>
    </div>
  );
}
