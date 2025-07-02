import {useState} from "react";
import "./App.css"; // Imports TailwindCSS styles
import GameWindow from "./components/GameWindow";
import IntroductionWindow from "./components/IntroductionWindow";



function App() {
  //new game starts whenever this state changes
  const [count, setCount] = useState(0); //first game is Game1, and so on the count stores the number of the current game you are playing
  const [showIntro, setShowIntro] = useState(true);


  // win or lose, doesn't matter
  const gameReset = () => {
    // write some logic here that rests the game only if user wants it
   setCount(prev => prev + 1); // Trigger re-render/reset of game UI
  };

  const closeIntro = () => setShowIntro(false);

    return (
    <>
      {/* className="flex flex-col items-center justify-center h-screen bg-zinc-800" */}
      <GameWindow key={count} gameReset={gameReset} />
      {showIntro && <IntroductionWindow onClose={closeIntro} />}
    </>
  );
}

export default App;
