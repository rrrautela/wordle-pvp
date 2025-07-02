import { useRef, useEffect } from "react";
import GameBoard from "./GameBoard";
import KeyBoard from "./KeyBoard";
import arrayOfWords from "../data/all5letterwords.json"; // Adjust path if needed



function GameWindow({gameReset}){

  // refs used so that we keep values across re-renders
  const gameBoardBoxesRefs = useRef([]); //  all board boxes
  const keyboardKeysRefs = useRef([]); // to all keyboard keys
  const lettersInCurrentRowRef = useRef(0); // Number of letters typed in current row
  const wordInputSoFarRef = useRef(""); // Current word being typed by the user
  const guessesCountRef = useRef(0); // Number of guesses made
  const currentRowRef = useRef(0); // Current row index (0 to 5)
  const currentPositionRef = useRef(0); // Mirror of currentPosition for mutation
  const skipEffectJustThisOnceRef = useRef(false); // Control flag to skip an effect once if needed

  // Keyboard layout (includes ENTER and Backspace icon)
  const keyboard_keys = ["Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","ENTER","Z","X","C","V","B","N","M","⌫"];
  // Pick a random correct word from the list
  const correctWord = arrayOfWords[Math.floor(Math.random() * arrayOfWords.length)];
  console.log(correctWord); // Print the correct word to console (for debugging/testing)

  // Function triggered when user presses ENTER after typing 5 letters
  function checkGuess() {
    const word = wordInputSoFarRef.current;

    // If the guessed word is not in dictionary
    if (!arrayOfWords.includes(word)) {
      // Add shake animation to all 5 boxes in the current row
      for (let i = currentRowRef.current * 5; i < (currentRowRef.current + 1) * 5; i++) {
        const box = gameBoardBoxesRefs.current[i];
        box.classList.add("vibrate-horizontal");
        setTimeout(() => {
          box.classList.remove("vibrate-horizontal");
        }, 500);
      }
      return; // Exit early on invalid word
    }

    // Helper function to decide box color
    const delay = 300;
    const getColor = (l, i) =>
      l === correctWord[i]
        ? "bg-green-800" // Correct letter and position
        : correctWord.includes(l)
        ? "bg-yellow-600" // Correct letter, wrong position
        : "bg-zinc-700"; // Letter not in word

    // Animate box flip for all 5 letters
    for (let i = 0; i < 5; i++) {
      const globalIdx = currentRowRef.current * 5 + i;
      const box = gameBoardBoxesRefs.current[globalIdx];
      const color = getColor(word[i], i);

      

      // Flip animation (half flip first)
      setTimeout(() => {
        box.style.transition = "transform 0.6s";
        box.style.transform = "rotateX(90deg)";
      }, delay * i);

      // Apply color mid-flip and complete rotation
      setTimeout(() => {
        box.classList.remove("border-2", "border-neutral-700");
        box.classList.add(color);
        box.style.transform = "rotateX(0deg)";
      }, delay * i + 300);

      // Cleanup inline styles after animation
      setTimeout(() => {
        box.style.transition = "";
        box.style.transform = "";
      }, delay * i + 600);
    }

    // Update keyboard key colors
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        const letter = word[i];
        const idx = keyboard_keys.indexOf(letter);
        const key = keyboardKeysRefs
    .current[idx];
        if (!key) continue;

        // Remove old bg-* classes (unless already green)
        key.classList.forEach(c => {
          if (c.startsWith("bg-green")) return; // Don’t downgrade correct key
          if (c.startsWith("bg-")) key.classList.remove(c);
        });

        // Add new color based on guess
        if (!key.classList.contains("bg-green-800")) {
          key.classList.add(getColor(letter, i));
        }
      }
      // If guessed correctly
      if (word === correctWord){
        alert("YOU WIN");
        gameReset();
      } else {
        // Prepare for next row
        currentRowRef.current++;
        lettersInCurrentRowRef
    .current = 0;
        wordInputSoFarRef.current = "";
        currentPositionRef.current = (currentRowRef.current * 5);
      }
    }, delay * 5 + 300); // Delay to finish animation before updating
    
    //another guess is made, right or wrong doesnt matter
    guessesCountRef.current++;

    //if all 6 chances for guessing are used, and word has not been guesseed right yet then you lose
    if(guessesCountRef.current === 6){
      alert("YOU LOSE");
      gameReset();
    }
  
  
  }

  // Handle backspace/delete key press
  function backSpacePressed() {
    const pos = currentPositionRef.current;
    const rowStart = currentRowRef.current * 5;

    // Prevent deleting outside the current row
    if (pos <= rowStart) return;

    const idx = pos - 1;
    const box = gameBoardBoxesRefs.current[idx];

    // Clear the box UI
    if (box) {
      box.textContent = "";
      box.classList.remove("border-zinc-500");
    }

    // Update refs accordingly
    lettersInCurrentRowRef
.current = Math.max(0, lettersInCurrentRowRef
  .current - 1);
    wordInputSoFarRef.current = wordInputSoFarRef.current.slice(0, -1);
    const newPos = idx;
    currentPositionRef.current = newPos;
  }

  // Handle regular key presses (letter, enter, backspace)
  function keyPressed(key) {
    if (key === "ENTER") {
      if (lettersInCurrentRowRef
    .current === 5) checkGuess();
      return;
    }

    if (key === "⌫") {
      backSpacePressed();
      return;
    }

    // If already 5 letters typed, ignore input
    if (lettersInCurrentRowRef
  .current >= 5) return;

    // Figure out which box to fill
    const rowStart = currentRowRef.current * 5;
    const idx = rowStart + lettersInCurrentRowRef
.current;

    const box = gameBoardBoxesRefs.current[idx];
    if (box) {
      // Fill box with letter and style it
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
      setTimeout(() => box.classList.remove("scale-110"), 100); // Remove animation
    }

    // Update internal state
    wordInputSoFarRef.current += key;
    lettersInCurrentRowRef
.current += 1;
    const newPos = idx + 1;
    currentPositionRef.current = newPos;
  }

  // Set up keyboard input handler (once on mount)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Accept only A-Z characters
      if (/^[a-zA-Z]$/.test(e.key)) {
        keyPressed(e.key.toUpperCase()); // Convert lowercase to uppercase
      } else if (e.key === "Backspace") {
        backSpacePressed();
      } else if (e.key === "Enter") {
        e.preventDefault(); // Prevent default behavior of ENTER
        if (lettersInCurrentRowRef
      .current === 5) checkGuess();
        else alert("You haven't typed 5 letters yet!");
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown); // Cleanup
  }, []);

  // Main render
  return (
    <div className="w-screen h-screen bg-[#121213] flex justify-center">
      <div className="w-130 flex flex-col items-center">
        {/* GameBoard renders the boxes and accepts refs/state */}
        <GameBoard
          checkGuess={checkGuess}
          gameBoardBoxesRefs={gameBoardBoxesRefs}
          currentPositionRef={currentPositionRef}
          lettersInCurrentRowRef={lettersInCurrentRowRef}
          skipEffectJustThisOnceRef={skipEffectJustThisOnceRef}
          wordInputSoFarRef={wordInputSoFarRef}
        />

        {/* KeyBoard renders clickable keys and calls keyPressed */}
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