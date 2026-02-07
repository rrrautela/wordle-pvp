import { useRef, useEffect, useState } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";
import arrayOfWords from "../data/all5letterwords.json";

function GameWindow({ gameReset }) {
  // --- REFS: Storing data that shouldn't trigger a re-render ---
  const gameBoardBoxesRefs = useRef([]); // References to the physical grid boxes
  const keyboardKeysRefs = useRef([]); // References to the physical keyboard buttons
  const currentRowRef = useRef(0); // The 0 based index of the active row (0,1,2,3,4), which character of the row we are at
  const currentColRef = useRef(0); // How many letters typed in the current row (0,1,2,3,4,5)
  const wordInputSoFarRef = useRef(""); // The actual string the user is typing
  const guessCountRef = useRef(0); // Number of attempts made (1,2,3,4,5,6)
  const currentGlobalPositionRef = useRef(0); // The global index in the 30-box grid (0 to 29)
  const ischeckOngoingRightNowRef = useRef(false); //flag to stop more input while it's checking the user's guess
  // const alreadyShakenRef = useRef(false); // Prevents the "error shake" from repeating too fast

  // --- STATE: UI elements that need to update the screen immediately ---
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

  // --- Initialize the Secret Word ---
  const correctWordRef = useRef(null);
  if (!correctWordRef.current) {
    // Pick a random word from the JSON list once per game session
    const randomIndex = Math.floor(Math.random() * arrayOfWords.length);
    correctWordRef.current = arrayOfWords[randomIndex];
    console.log("Secret Word:", correctWordRef.current);
  }

  //now the ref has the correct word for current game
  const correctWord = correctWordRef.current;

  // --- Animation: Celebration Bounce ---
  function bounceAllBoxes() {
    // Loop through all 30 boxes
    for (let i = 0; i < 30; i++) {
      // Get box DOM element from ref
      const box = gameBoardBoxesRefs.current[i];

      // Skip if box doesn't exist
      if (!box) continue;

      // Random delay for staggered animation
      const randomDelay = Math.random() * 600;

      // Start animation after random delay
      setTimeout(function () {
        // Add bounce class
        box.classList.add("animate-bounce-vertical");

        // Remove bounce after 400ms
        setTimeout(function () {
          box.classList.remove("animate-bounce-vertical");
        }, 400);
      }, randomDelay);
    }
  }

  // --- UI: Alert Messages ---
  function pushTempMessage(label) {
    // Update messages using previous state
    setMessages(function (prevMessages) {
      // Create new message with unique id + label
      const newMessage = { id: Date.now(), label: label };

      // Return old messages + new one appended
      return [...prevMessages, newMessage];
    });
  }

  // Auto-dismiss floating alert messages (one every 250ms)
  useEffect(
    function () {
      let intervalId;
      // Start auto-clear only when at least one message exists
      if (messages.length > 0) {
        // More messages = faster removal (minimum cap)
        // Start speeding up AFTER 4 messages
        const speed = 300 - messages.length * 20;
        intervalId = setInterval(function () {
          // Remove messages using latest state (safe async update)
          setMessages(function (prev) {
            // If all messages are gone, stop the timer
            if (prev.length === 0) {
              clearInterval(intervalId);
              return [];
            }

            // Drop the oldest message (index 0)
            return prev.slice(1);
          });
        }, speed);
      }
      // Cleanup: prevent duplicate timers + memory leaks
      return () => clearInterval(intervalId);
    },
    [messages.length],
  ); // Re-run whenever message count changes

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

  // --- CORE GAME LOGIC ---
  // --- Validate and reveal the guess ---
  function checkGuess() {
    // Prevent multiple guesses while animation is running
    if (ischeckOngoingRightNowRef.current) return;

    // Lock input so checkGuess can't be called again
    ischeckOngoingRightNowRef.current = true;
    // Get the typed word from ref
    const typedWord = wordInputSoFarRef.current;

    // CASE 1: INVALID WORD
    if (arrayOfWords.includes(typedWord) === false) {
      // Shake current row to indicate invalid word
      const start = currentRowRef.current * 5;
      const end = start + 5;

      for (let i = start; i < end; i++) {
        const box = gameBoardBoxesRefs.current[i];
        box.classList.add("vibrate-horizontal");
        setTimeout(() => box.classList.remove("vibrate-horizontal"), 500);
      }
      // Show error message
      pushTempMessage("Not in word list");

      // Unlock input and exit
      ischeckOngoingRightNowRef.current = false;
      return;
    }

    // Reset shake flag for next guess
    // alreadyShakenRef.current = false; NOT NEEDED I THINK?

    // If execution reaches here, the typed word is valid
    // (it may still be wrong, but it exists in the dictionary)
    // CASE 2: VALID WORD
    // Animate the flip of each box in the current row, one letter at a time
    const animationDelay = 300;
    for (let i = 0; i < 5; i++) {
      // Base delay for flip animations

      // Convert (row, column) into a single index for the flat boxes array
      const globalIdx = currentRowRef.current * 5 + i;
      //like if row is 3 then index are (row * 5) + i => 15 + i => 15,16,17,18,19 when i is 0 to 4

      // Reference to the current box DOM element
      const box = gameBoardBoxesRefs.current[globalIdx]; //coz boxes refs array is 0 to 29 indexed one single array

      // Determine the color based on Wordle rules (green/yellow/gray)
      const resultColor = getLetterColor(typedWord[i], i); //i = 0 to 4 so validate each input letter one by one

      // STEP 1:
      // Start flip animation — rotate halfway (90deg) to "hide" the letter
      // Each box is delayed so they flip sequentially
      setTimeout(function () {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, animationDelay * i);

      // STEP 2:
      // While the box is hidden, update its color and flip it back to visible
      setTimeout(
        function () {
          // Remove default border styles
          box.classList.remove("border-2", "border-neutral-700");

          // Apply result color class (correct / present / absent)
          box.classList.add(resultColor);

          // Complete the flip animation
          box.style.transform = "rotateX(0deg)";
        },
        animationDelay * i + 300,
      );

      // STEP 3:
      // Cleanup inline styles so future animations start from a clean state
      setTimeout(
        function () {
          box.style.transition = "";
          box.style.transform = "";
        },
        animationDelay * i + 600,
      );
    }

    // Run this AFTER all tile flip animations are done
    // (animationDelay * 5 covers the 5 tiles, +300 gives buffer for final flip)
    setTimeout(
      function () {
        // --------------------------------------------------
        // STEP 1: Update on-screen keyboard colors
        // --------------------------------------------------
        // For each letter in the submitted word:
        // - Find its corresponding keyboard key
        // - Apply correct color (green / yellow / gray)
        for (let i = 0; i < 5; i++) {
          const letter = typedWord[i];

          // Find index of this letter in keyboard layout
          const keyIndex = keyboard_keys.indexOf(letter);

          // Get DOM reference of that keyboard key
          const keyElement = keyboardKeysRefs.current[keyIndex];

          // Safety check: skip if key not found
          if (!keyElement) continue;

          // Important rule:
          // If a key is already green, NEVER downgrade it
          // (green = confirmed correct position)
          const isAlreadyGreen = keyElement.classList.contains("bg-green-800");

          //if the color is not green so its either wrong or at thhe wrong pos
          if (isAlreadyGreen === false) {
            // Remove any previous background color (yellow / gray etc.)
            // before applying the new one
            keyElement.classList.forEach(function (className) {
              if (className.startsWith("bg-")) {
                keyElement.classList.remove(className);
              }
            });

            // Apply new color based on current guess
            keyElement.classList.add(getLetterColor(letter, i));
            //no clash for yellow to gray change as yellow means char is in the word so
            // it woudl always show yellow at wrong position andgreen at riht, never grey
          }
        }

        // --------------------------------------------------
        // STEP 2: Win check
        // --------------------------------------------------
        if (typedWord === correctWord) {
          // Show winning message
          setWinMsg(true);

          // Play bounce animation on all boxes
          bounceAllBoxes();

          // After short delay, reset game
          setTimeout(() => {
            setWinMsg(false);
            ischeckOngoingRightNowRef.current = false; // unlock input
            gameReset();
          }, 2000);
          return; // stop further execution, so current row stays at the end row only, so guesses are in bounds,
          // which will keep correctWordToShow as null, so this scenario will only print win msg on scren andn nt the lose msg
        }

        // --------------------------------------------------
        // STEP 3: Move to next row (game continues)
        // --------------------------------------------------

        // Advance to next row
        currentRowRef.current++;

        // Reset counters for new row
        currentColRef.current = 0;
        wordInputSoFarRef.current = "";

        // Update cursor position to start of new row
        currentGlobalPositionRef.current = currentRowRef.current * 5; ///WTS TEH SIGNIFCANCE OF THIS REF?

        // Unlock input now that animations are complete
        ischeckOngoingRightNowRef.current = false;

        // --------------------------------------------------
        // STEP 4: Loss check (after 6 guesses)
        // --------------------------------------------------
        guessCountRef.current++;

        if (guessCountRef.current === 6) {
          // Reveal correct word
          setCorrectWordToShow(correctWord);

          // Reset game after short delay
          setTimeout(() => {
            ischeckOngoingRightNowRef.current = false;
            gameReset();
          }, 2000);
        }
      },

      // Delay execution until ALL tile flips finish,
      // EVEN THE LAST TILE WILL TAKE ANIMATION DELAY * 4 + 300, SO THIS WILL DEFINITELY RUN AFTER ALLL 5 TILES FLIP
      animationDelay * 5 + 300,
      // THATS WHY THIS IS A TIMEOUT THAT WAIT SFOR PREV STEP TO BE DOEN FIRST WHICH IS ALL THE FLIPPING
    );
  }

  // --- Input Logic: Delete letter ---
  function backSpacePressed() {
    // Current cursor position in the flat 30-cell board
    const currentPos = currentGlobalPositionRef.current;

    // Index where the current row starts (row * 5 columns)
    const rowStartBoundary = currentRowRef.current * 5;

    // --------------------------------------------------
    // Prevent deleting past the start of the current row
    // (don’t allow backspace into previous rows)
    // --------------------------------------------------
    if (currentPos <= rowStartBoundary) {
      return;
    }

    // Index of the last typed box (one position left of cursor coz cursor is always at the latest empty box)
    const lastBoxIdx = currentPos - 1;

    // Get DOM reference to that box
    const box = gameBoardBoxesRefs.current[lastBoxIdx];

    // --------------------------------------------------
    // Clear the letter visually from the board
    // --------------------------------------------------
    if (box) {
      // Remove displayed character
      box.textContent = "";

      // Remove active border style (back to empty state)
      box.classList.remove("border-zinc-500");
    }

    // --------------------------------------------------
    // Update internal game state
    // --------------------------------------------------

    // Decrease letter count for current row
    currentColRef.current--;

    // Remove last character from typed word string
    wordInputSoFarRef.current = wordInputSoFarRef.current.slice(0, -1);

    // Move cursor back by one position
    currentGlobalPositionRef.current = lastBoxIdx;
  }

  // --- Input Logic: try to submit the word ---
  function enterKeyPressed() {
    // Only allow submit when exactly 5 letters are typed
    if (currentColRef.current === 5) {
      checkGuess(); // Validate current word
    } else {
      pushTempMessage("Not enough letters"); // User tried to submit early
    }
  }

  // --- Input Logic: Handles every on-screen / keyboard key press ---
  // one fucntion call = one key is pressed, so compute that
  function keyPressed(key) {
    // Prevent any input while guess checking / animations are running
    // This avoids double submissions or corrupted board state
    if (ischeckOngoingRightNowRef.current) return;

    // ---------------- ENTER KEY ----------------
    if (key === "ENTER") {
      enterKeyPressed();
      return; // Stop further execution after ENTER becoz this only handles one key press at a time
    }

    // ---------------- BACKSPACE KEY ----------------
    if (key === "⌫") {
      backSpacePressed(); // Remove last typed letter from UI + refs
      return; //stop coz one key computation is done
    }

    //if it's not enter or backspace then it is a character

    // ---------------- ROW FULL CHECK ----------------
    // Prevent typing more than 5 letters in a row
    if (currentColRef.current >= 5) {
      return; //no chars accepted after 5 chars done
    }

    // Calculate which box index to fill next
    // currentRow * 5 gives row start
    // + lettersInCurrentRow gives column offset
    const boxIdx = currentRowRef.current * 5 + currentColRef.current;

    // Grab the actual DOM element from refs
    const box = gameBoardBoxesRefs.current[boxIdx];

    if (box) {
      // Insert the typed character visually
      box.textContent = key;

      // Apply styling + pop animation
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

      // Remove scale after animation completes
      setTimeout(() => box.classList.remove("scale-110"), 100);
    }

    // Append typed letter to current word buffer
    wordInputSoFarRef.current += key;

    // Increment letter count in current row
    currentColRef.current++;

    // Move cursor to next position globally
    currentGlobalPositionRef.current = boxIdx + 1;
  }

  // --- Setup: Listen for PHYSICAL keyboard input (not on-screen keyboard) ---
  useEffect(function () {
    // Handles every key press from the real keyboard
    function handleKeyDown(event) {
      const key = event.key; // Raw key pressed (example: "a", "Enter", "Backspace")

      // ---------------- LETTER KEYS ----------------
      // Only allow A–Z characters
      if (/^[a-zA-Z]$/.test(key)) {
        // Convert to uppercase to match Wordle format
        keyPressed(key.toUpperCase());
      }

      // ---------------- BACKSPACE ----------------
      else if (key === "Backspace") {
        // Remove last typed character from board + refs
        backSpacePressed();
      }

      // ---------------- ENTER ----------------
      else if (key === "Enter") {
        // Prevent browser default (like form submission / page refresh)
        event.preventDefault();
        enterKeyPressed();
      }
    }

    // Attach keyboard listener once when component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: remove listener when component unmounts
    // Prevents memory leaks and duplicate listeners
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty dependency array = runs only once on mount

  return (
    <div className="w-screen h-screen bg-[#121213] flex justify-center relative">
      <div className="w-full sm:w-[490px] flex flex-col items-center">
        
        
        {/* -------------------------------------------------- */}
        {/* Floating Error Messages */}
        {/* Renders each message in the `messages` array */}
        {/* Messages stack vertically and auto-dismiss */}
        {/* -------------------------------------------------- */}
        {messages.map((msg, i) => {
          // msg = single message object (ex: { id, label })
          // i   = index of message in array (0, 1, 2, ...)

          return (
            <div
              key={msg.id} // Unique React key for React list reconciliation
              // Dynamically stack messages vertically
              // First message: 1rem from top
              // Each next message moves down by 3rem
              style={{ top: `${1 + i * 3}rem` }}
              className="absolute left-1/2 transform -translate-x-1/2 z-[50] text-black bg-white text-sm font-semibold px-3 py-1.5 rounded shadow"
            >
              {/* Display the message text */}
              {msg.label}
            </div>
          );
        })}

        {/* -------------------------------------------------- */}
        {/* Win Banner: Displays when player successfully guesses the word */}
        {/* Rendered ONLY when winMsg is true (conditional rendering with &&) */}
        {/* -------------------------------------------------- */}
        {winMsg && (
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50
                       text-black bg-white text-lg font-bold
                       px-4 py-1.5 rounded shadow
                    "
          >
            {/* Simple victory message shown at top center */}
            Yayy!!
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* Loss Banner: Reveals the correct word after player loses */}
        {/* This only renders when correctWordToShow is NOT null */}
        {/* (React short-circuit rendering using &&) */}
        {/* -------------------------------------------------- */}
        {correctWordToShow && (
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50
                      text-black bg-white text-lg font-bold
                      px-4 py-1.5 rounded shadow"
          >
            {/* Display the revealed correct word */}
            The word was: {correctWordToShow}
          </div>
        )}

        {/* Main Boxes Grid */}
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
