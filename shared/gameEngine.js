/**
 * src/game/engine.js
 * PURE LOGIC ENGINE (The "Brain")
 * Handles word selection, validation, scoring, and state management.
 */

// this game ngine is a factory func as at every call it returns a  new object which have all thes eproerties
// import data from "./data/all5letterwords.json";
// const dictionary = data.dictionary;

export const createGameEngine = (dictionary, forcedWord = null) => {
  // --- PRIVATE STATE ---
  const randomIndex = Math.floor(Math.random() * dictionary.length);
  // Ensure word is uppercase for consistent comparison
  const secretWord = 
  forcedWord ?? 
  dictionary[randomIndex].toUpperCase();

  let guessCount = 0;
  let isGameOver = false;

  console.log("Correct Word:", secretWord);

  /**
   * Core Logic: Determine letter color based on official Wordle rules.
   * Handles duplicate letters correctly.
   */
  const getLetterResults = (typedWord) => {
    const guess = typedWord.toUpperCase().split("");
    const secret = secretWord.split("");
    const results = new Array(5).fill("bg-zinc-700"); // Default: Gray
    const secretLog = {};

    // Step 1: Count frequencies of letters in secret word
    for (const char of secret) {
      secretLog[char] = (secretLog[char] || 0) + 1;
    }

    // Step 2: Identify Greens (Correct spot)
    // Greens take priority over yellows
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secret[i]) {
        results[i] = "bg-green-800";
        secretLog[guess[i]]--;
      }
    }

    // Step 3: Identify Yellows (Wrong spot)
    for (let i = 0; i < 5; i++) {
      if (results[i] !== "bg-green-800" && secretLog[guess[i]] > 0) {
        if (secret.includes(guess[i])) {
          results[i] = "bg-yellow-600";
          secretLog[guess[i]]--;
        }
      }
    }

    return results;
  };

  return {
    // Public method to submit a guess and receive feedback
    submitGuess(word) {
      if (isGameOver) return { status: "ended" };

      const typedWord = word.toUpperCase();

      // 1. Dictionary Validation
      if (!dictionary.includes(typedWord)) {
        return {
          status: "invalid",
          message: "Not in word list",
        };
      }

      guessCount++;
      const letterResults = getLetterResults(typedWord);

      // 2. Win Check
      if (typedWord === secretWord) {
        isGameOver = true;
        return {
          status: "correct",
          letterResults,
          guessNumber: guessCount,
        };
      }

      // 3. Loss Check (Max 6 tries)
      if (guessCount === 6) {
        isGameOver = true;
        return {
          status: "lost",
          letterResults,
          guessNumber: guessCount,
          correctWord: secretWord,
        };
      }

      // 4. Continue
      return {
        status: "wrong",
        letterResults,
        guessNumber: guessCount,
      };
    },

    // For testing and game management purposes
    getCorrectWord: () => secretWord,


    // Expose internal state for game management
    getState: () => ({
      guessCount,
      isGameOver,
    }),
  };
};
