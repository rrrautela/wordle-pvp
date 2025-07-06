import { useState } from "react";
import GameWindow from "../components/GameWindow";
import IntroductionWindow from "../components/IntroductionWindow";
import '../App.css';


function SinglePlayer() {
  // New game starts whenever this state changes
  const [count, setCount] = useState(0); // First game is Game1, and so on — 'count' stores the number of the current game you are playing
  const [showIntro, setShowIntro] = useState(true);

  // Win or lose, doesn't matter — triggers new game if user wants it
  const gameReset = () => {
    // Write some logic here that resets the game only if user wants it
    setCount(prev => prev + 1); // Trigger re-render/reset of game UI
  };

  const closeIntro = () => setShowIntro(false);

  return (
    <>
      {/* Main game UI */}
      <GameWindow key={count} gameReset={gameReset} />

      {/* Intro popup shown only at start */}
      {showIntro && <IntroductionWindow onClose={closeIntro} />}
    </>
  );
}

export default SinglePlayer;
