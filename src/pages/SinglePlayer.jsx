import { useState } from "react";
import GameWindow from "../components/GameWindow";
import IntroductionWindow from "../components/IntroductionWindow";
import "../App.css";

function SinglePlayer() {
  // New game starts whenever this state changes
  const [count, setCount] = useState(0); // First game is Game1, and so on — 'count' stores the number of the current game you are playing
  const [showIntro, setShowIntro] = useState(true);

  // Win or lose, doesn't matter — triggers new game if user wants it
  const gameReset = () => {
    // Write some logic here that resets the game only if user wants it
    setCount((prev) => prev + 1); // Trigger re-render/reset of game UI
  };

  const closeIntro = () => setShowIntro(false);

  return (
    <>
      {/* Main game UI.
      `key={count}` forces React to fully remount GameWindow
      whenever `count` changes (used here to hard-reset game state). */}
      <GameWindow key={count} gameReset={gameReset} />

      {/* Intro popup.
      Rendered ONLY when `showIntro` is true.
      Acts as an overlay shown at app startup.
      `onClose` updates state to hide this window. */}
      {showIntro && <IntroductionWindow onClose={closeIntro} />}
    </> 
  );
}

export default SinglePlayer;
