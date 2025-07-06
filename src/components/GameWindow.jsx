import { useRef, useEffect, useState } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";
import arrayOfWords from "../data/all5letterwords.json";

function GameWindow({ gameReset }) {
  const gameBoardBoxesRefs = useRef([]);
  const keyboardKeysRefs = useRef([]);
  const lettersInCurrentRowRef = useRef(0);
  const wordInputSoFarRef = useRef("");
  const guessesCountRef = useRef(0);
  const currentRowRef = useRef(0);
  const currentPositionRef = useRef(0);
  const skipEffectJustThisOnceRef = useRef(false);
  const alreadyShakenRef = useRef(false);

  const [losingWord, setLosingWord] = useState(null);
  const [messages, setMessages] = useState([]); // Unified state for all temporary messages
  const [winMsg, setWinMsg] = useState(false);

  const keyboard_keys = [
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
    "A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER",
    "Z", "X", "C", "V", "B", "N", "M", "⌫"
  ];

  const correctWordRef = useRef(null);
  if (!correctWordRef.current) {
    correctWordRef.current = arrayOfWords[Math.floor(Math.random() * arrayOfWords.length)];
    console.log(correctWordRef.current); // Log only once when game starts
  }
  const correctWord = correctWordRef.current;

  // Adds vertical bounce to all boxes on win
  function bounceAllBoxes() {
    for (let i = 0; i < 30; i++) {
      const box = gameBoardBoxesRefs.current[i];
      if (!box) continue;
      const delay = Math.random() * 600;
      setTimeout(() => {
        box.classList.add("animate-bounce-vertical");
        setTimeout(() => {
          box.classList.remove("animate-bounce-vertical");
        }, 400);
      }, delay);
    }
  }

  // Pushes a new message to the message array
  const pushTempMessage = (label) => {
    setMessages(prev => {
      const id = Date.now();
      return [...prev, { id, label }];
    });
  };

  // Effect to clear messages periodically
  useEffect(() => {
    let intervalId;
    if (messages.length > 0) {
      intervalId = setInterval(() => {
        setMessages(prev => {
          if (prev.length === 0) {
            clearInterval(intervalId);
            return [];
          }
          return prev.slice(1); // Remove the oldest message
        });
      }, 250); // Clear 4 messages per second (1000ms / 4 = 250ms)
    }
    return () => clearInterval(intervalId);
  }, [messages.length]); // Re-run effect when message count changes

  function checkGuess() {
    const word = wordInputSoFarRef.current;

    if (!arrayOfWords.includes(word)) {
      if (!alreadyShakenRef.current) {
        for (let i = currentRowRef.current * 5; i < (currentRowRef.current + 1) * 5; i++) {
          const box = gameBoardBoxesRefs.current[i];
          box.classList.add("vibrate-horizontal");
          setTimeout(() => box.classList.remove("vibrate-horizontal"), 500);
        }
        alreadyShakenRef.current = true;
      }
      pushTempMessage("Not in word list");
      return;
    }

    alreadyShakenRef.current = false;

    const delay = 300;
    const getColor = (l, i) =>
      l === correctWord[i] ? "bg-green-800" : correctWord.includes(l) ? "bg-yellow-600" : "bg-zinc-700";

    for (let i = 0; i < 5; i++) {
      const globalIdx = currentRowRef.current * 5 + i;
      const box = gameBoardBoxesRefs.current[globalIdx];
      const color = getColor(word[i], i);

      setTimeout(() => {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, delay * i);

      setTimeout(() => {
        box.classList.remove("border-2", "border-neutral-700");
        box.classList.add(color);
        box.style.transform = "rotateX(0deg)";
      }, delay * i + 300);

      setTimeout(() => {
        box.style.transition = "";
        box.style.transform = "";
      }, delay * i + 600);
    }

    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        const letter = word[i];
        const idx = keyboard_keys.indexOf(letter);
        const key = keyboardKeysRefs.current[idx];
        if (!key) continue;

        key.classList.forEach(c => {
          if (c.startsWith("bg-green")) return;
          if (c.startsWith("bg-")) key.classList.remove(c);
        });

        if (!key.classList.contains("bg-green-800")) {
          key.classList.add(getColor(letter, i));
        }
      }

      if (word === correctWord) {
        setWinMsg(true);
        bounceAllBoxes();
        setTimeout(() => {
          setWinMsg(false);
          gameReset();
        }, 2000);
        return;
      }

      currentRowRef.current++;
      lettersInCurrentRowRef.current = 0;
      wordInputSoFarRef.current = "";
      currentPositionRef.current = currentRowRef.current * 5;
    }, delay * 5 + 300);

    guessesCountRef.current++;
    if (guessesCountRef.current === 6) {
      setLosingWord(correctWord);
      setTimeout(() => gameReset(), 2000);
    }
  }

  function backSpacePressed() {
    const pos = currentPositionRef.current;
    const rowStart = currentRowRef.current * 5;
    if (pos <= rowStart) return;

    const idx = pos - 1;
    const box = gameBoardBoxesRefs.current[idx];
    if (box) {
      box.textContent = "";
      box.classList.remove("border-zinc-500");
    }

    lettersInCurrentRowRef.current = Math.max(0, lettersInCurrentRowRef.current - 1);
    wordInputSoFarRef.current = wordInputSoFarRef.current.slice(0, -1);
    currentPositionRef.current = idx;
  }

  function keyPressed(key) {
    if (key === "ENTER") {
      if (lettersInCurrentRowRef.current === 5) checkGuess();
      else pushTempMessage("Not enough letters");
      return;
    }

    if (key === "⌫") {
      backSpacePressed();
      return;
    }

    if (lettersInCurrentRowRef.current >= 5) return;

    const rowStart = currentRowRef.current * 5;
    const idx = rowStart + lettersInCurrentRowRef.current;
    const box = gameBoardBoxesRefs.current[idx];

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
        "font-bold"
      );
      setTimeout(() => box.classList.remove("scale-110"), 100);
    }

    wordInputSoFarRef.current += key;
    lettersInCurrentRowRef.current += 1;
    currentPositionRef.current = idx + 1;
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        keyPressed(e.key.toUpperCase());
      } else if (e.key === "Backspace") {
        backSpacePressed();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (lettersInCurrentRowRef.current === 5) checkGuess();
        else pushTempMessage("Not enough letters");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#121213] flex justify-center relative">
      <div className="w-130 flex flex-col items-center">

        {messages.map((msg, i) => (
          <div
            key={msg.id}
            // Adjusted top value for stacking, using a more descriptive class name for clarity
            className={`absolute top-${4 + (i * 5)} left-1/2 transform -translate-x-1/2 z-[50] text-black bg-white text-sm font-semibold px-3 py-1.5 rounded shadow`}
          >
            {msg.label}
          </div>
        ))}

        {winMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-black bg-white text-lg font-bold px-4 py-1.5 rounded shadow">
            Yayy!!
          </div>
        )}

        {losingWord && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-black bg-white text-lg font-bold px-4 py-1.5 rounded shadow">
            The word was: {losingWord}
          </div>
        )}

        <GameBoard
          checkGuess={checkGuess}
          gameBoardBoxesRefs={gameBoardBoxesRefs}
          currentPositionRef={currentPositionRef}
          lettersInCurrentRowRef={lettersInCurrentRowRef}
          skipEffectJustThisOnceRef={skipEffectJustThisOnceRef}
          wordInputSoFarRef={wordInputSoFarRef}
        />

        <KeyBoard 
          keyPressed={keyPressed}
          keyboard_keys={keyboard_keys}
          keyboardKeysRefs={keyboardKeysRefs}
        />
      </div>
    </div>
  );
}

export default GameWindow;
