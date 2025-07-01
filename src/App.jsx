import {useState} from "react";
import "./App.css"; // Imports TailwindCSS styles
import GameWindow from "./components/GameWindow";
import IntroductionWindow from "./components/IntroductionWindow";



function App() {
  //will re render app component whenever this state changes, which will trigger a new game window
  const [resetKey, setResetKey] = useState(0);


  const handleGameOver = () => {
    setResetKey(prev => prev + 1); // Trigger re-render/reset of game UI
  };
    return (
    <>
      {/* className="flex flex-col items-center justify-center h-screen bg-zinc-800" */}
      <GameWindow key={resetKey} handleGameOver = {handleGameOver} />
      <IntroductionWindow />
    </>
  );
}

export default App;
