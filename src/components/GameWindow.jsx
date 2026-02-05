import { useRef, useEffect, useState } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";
import arrayOfWords from "../data/all5letterwords.json";

function GameWindow({ gameReset }) {
  // --- REFS: Storing data that shouldn't trigger a re-render ---
  const gameBoardBoxesRefs = useRef([]); // References to the physical grid boxes
  const keyboardKeysRefs = useRef([]); // References to the physical keyboard buttons
  const lettersInCurrentRowRef = useRef(0); // How many letters typed in the current row (0-5)
  const wordInputSoFarRef = useRef(""); // The actual string the user is typing
  const guessesCountRef = useRef(0); // Number of attempts made (max 6)
  const currentRowRef = useRef(0); // The index of the active row (0-5)
  const currentPositionRef = useRef(0); // The global index in the 30-box grid
  const alreadyShakenRef = useRef(false); // Prevents the "error shake" from repeating too fast
  const isCheckingRef = useRef(false);

  // --- STATE: UI elements that need to update the screen immediately ---
  const [losingWord, setLosingWord] = useState(null);
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

  // --- Initialize the Secret Word ---
  const correctWordRef = useRef(null);
  if (!correctWordRef.current) {
    // Pick a random word from the JSON list once per game session
    const randomIndex = Math.floor(Math.random() * arrayOfWords.length);
    correctWordRef.current = arrayOfWords[randomIndex];
    console.log("Secret Word:", correctWordRef.current);
  }
  const correctWord = correctWordRef.current;

  // --- Animation: Celebration Bounce ---
  function bounceAllBoxes() {
    for (let i = 0; i < 30; i++) {
      const box = gameBoardBoxesRefs.current[i];
      if (!box) continue;

      const randomDelay = Math.random() * 600;
      setTimeout(function () {
        box.classList.add("animate-bounce-vertical");
        setTimeout(function () {
          box.classList.remove("animate-bounce-vertical");
        }, 400);
      }, randomDelay);
    }
  }

  // --- UI: Alert Messages ---
  const pushTempMessage = function (label) {
    setMessages(function (prevMessages) {
      const newMessage = { id: Date.now(), label: label };
      return [...prevMessages, newMessage];
    });
  };

  // Automatically clear old messages every 250ms
  useEffect(
    function () {
      let intervalId;
      if (messages.length > 0) {
        intervalId = setInterval(function () {
          setMessages(function (prev) {
            if (prev.length === 0) {
              clearInterval(intervalId);
              return [];
            }
            // Remove the first (oldest) message in the array
            return prev.slice(1);
          });
        }, 250);
      }
      return () => clearInterval(intervalId);
    },
    [messages.length],
  );

  // --- Core Logic: Determine letter color ---
  function getLetterColor(letter, index) {
    if (letter === correctWord[index]) {
      return "bg-green-800"; // Correct letter, correct spot
    }

    if (correctWord.includes(letter)) {
      return "bg-yellow-600"; // Letter exists but in wrong spot
    }

    return "bg-zinc-700"; // Not in word
  }

  // --- Core Logic: Validate and reveal the guess ---
  function checkGuess() {
    // If already checking, ignore everything
    if (isCheckingRef.current) return;
    // Lock input
    isCheckingRef.current = true;

    const typedWord = wordInputSoFarRef.current;

    // 1. Check if word is valid
    if (arrayOfWords.includes(typedWord) === false) {
      if (alreadyShakenRef.current === false) {
        // Shake the current row to show error
        const start = currentRowRef.current * 5;
        const end = start + 5;
        for (let i = start; i < end; i++) {
          const box = gameBoardBoxesRefs.current[i];
          box.classList.add("vibrate-horizontal");
          setTimeout(() => box.classList.remove("vibrate-horizontal"), 500);
        }
        alreadyShakenRef.current = true;
      }
      pushTempMessage("Not in word list");
      isCheckingRef.current = false; // unlock input
      return;
    }

    alreadyShakenRef.current = false;
    const animationDelay = 300;

    // 2. Animate the board boxes flipping
    for (let i = 0; i < 5; i++) {
      const globalIdx = currentRowRef.current * 5 + i;
      const box = gameBoardBoxesRefs.current[globalIdx];
      const resultColor = getLetterColor(typedWord[i], i);

      // Start flip (rotate to 90 degrees to hide)
      setTimeout(function () {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, animationDelay * i);

      // Change color and finish flip (rotate back to 0)
      setTimeout(
        function () {
          box.classList.remove("border-2", "border-neutral-700");
          box.classList.add(resultColor);
          box.style.transform = "rotateX(0deg)";
        },
        animationDelay * i + 300,
      );

      // Reset styles for clean state
      setTimeout(
        function () {
          box.style.transition = "";
          box.style.transform = "";
        },
        animationDelay * i + 600,
      );
    }

    // 3. Update the UI Keyboard and check for Win/Loss
    setTimeout(
      function () {
        for (let i = 0; i < 5; i++) {
          const letter = typedWord[i];
          const keyIndex = keyboard_keys.indexOf(letter);
          const keyElement = keyboardKeysRefs.current[keyIndex];

          if (!keyElement) continue;

          // Important: If a key is already green, don't change it to yellow/zinc
          const isAlreadyGreen = keyElement.classList.contains("bg-green-800");
          if (isAlreadyGreen === false) {
            // Remove any existing background colors
            keyElement.classList.forEach(function (className) {
              if (className.startsWith("bg-")) {
                keyElement.classList.remove(className);
              }
            });
            keyElement.classList.add(getLetterColor(letter, i));
          }
        }

        // Check Win
        if (typedWord === correctWord) {
          setWinMsg(true);
          bounceAllBoxes();
          setTimeout(() => {
            setWinMsg(false);
            isCheckingRef.current = false; // unlock
            gameReset();
          }, 2000);

          return;
        }

        // Move to next row
        currentRowRef.current = currentRowRef.current + 1;
        lettersInCurrentRowRef.current = 0;
        wordInputSoFarRef.current = "";
        currentPositionRef.current = currentRowRef.current * 5;
        // unlock input after animation is finished
        isCheckingRef.current = false;

        // Check Loss (if it was the 6th guess)
        guessesCountRef.current = guessesCountRef.current + 1;
        if (guessesCountRef.current === 6) {
          setLosingWord(correctWord);
          setTimeout(() => {
            isCheckingRef.current = false;
            gameReset();
          }, 2000);
        }
      },
      animationDelay * 5 + 300,
    );
  }

  // --- Input Logic: Delete letter ---
  function backSpacePressed() {
    const currentPos = currentPositionRef.current;
    const rowStartBoundary = currentRowRef.current * 5;

    // Don't allow deleting if we are at the start of the row
    if (currentPos <= rowStartBoundary) {
      return;
    }

    const lastBoxIdx = currentPos - 1;
    const box = gameBoardBoxesRefs.current[lastBoxIdx];

    if (box) {
      box.textContent = "";
      box.classList.remove("border-zinc-500");
    }

    lettersInCurrentRowRef.current = lettersInCurrentRowRef.current - 1;
    wordInputSoFarRef.current = wordInputSoFarRef.current.slice(0, -1);
    currentPositionRef.current = lastBoxIdx;
  }

  // --- Input Logic: Typing a letter ---
  function keyPressed(key) {
    if (isCheckingRef.current) return; // ← THIS LINE

    if (key === "ENTER") {
      if (lettersInCurrentRowRef.current === 5) {
        checkGuess();
      } else {
        pushTempMessage("Not enough letters");
      }
      return;
    }

    if (key === "⌫") {
      backSpacePressed();
      return;
    }

    // Row is full
    if (lettersInCurrentRowRef.current >= 5) {
      return;
    }

    const boxIdx = currentRowRef.current * 5 + lettersInCurrentRowRef.current;
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
      // Remove pop animation scale after 100ms
      setTimeout(() => box.classList.remove("scale-110"), 100);
    }

    wordInputSoFarRef.current = wordInputSoFarRef.current + key;
    lettersInCurrentRowRef.current = lettersInCurrentRowRef.current + 1;
    currentPositionRef.current = boxIdx + 1;
  }

  // --- Setup: Listen for physical keyboard events ---
  useEffect(function () {
    function handleKeyDown(event) {
      const key = event.key;

      if (/^[a-zA-Z]$/.test(key)) {
        keyPressed(key.toUpperCase());
      } else if (key === "Backspace") {
        backSpacePressed();
      } else if (key === "Enter") {
        event.preventDefault();
        if (lettersInCurrentRowRef.current === 5) {
          checkGuess();
        } else {
          pushTempMessage("Not enough letters");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup: Remove listener when component is destroyed
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#121213] flex justify-center relative">
      <div className="w-full sm:w-[490px] flex flex-col items-center">

        {/* Floating Error Messages */}
        {messages.map(function (msg, i) {
          return (
            <div
              key={msg.id}
              className={`absolute top-${4 + i * 5} left-1/2 transform -translate-x-1/2 z-[50] text-black bg-white text-sm font-semibold px-3 py-1.5 rounded shadow`}
            >
              {msg.label}
            </div>
          );
        })}

        {/* Win Banner */}
        {winMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-black bg-white text-lg font-bold px-4 py-1.5 rounded shadow">
            Yayy!!
          </div>
        )}

        {/* Loss Banner */}
        {losingWord && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-black bg-white text-lg font-bold px-4 py-1.5 rounded shadow">
            The word was: {losingWord}
          </div>
        )}

        {/* Main Grid */}
        <GameBoard gameBoardBoxesRefs={gameBoardBoxesRefs} />

        {/* Virtual Keyboard */}
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
