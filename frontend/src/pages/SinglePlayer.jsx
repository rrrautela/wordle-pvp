import { useState } from "react";
import GameWindow from "../components/GameWindow";
import IntroductionWindow from "../components/IntroductionWindow";
import "../App.css";
import { createGameEngine } from './../../../shared/gameEngine';

/**
 * SinglePlayer Page Component
 * Controller for the Game Logic and Database Syncing.
 * Reports results to the backend to maintain a single source of truth for coins.
 */
function SinglePlayer({ user, setUser }) {
  // New game starts whenever this state changes (forces remount via 'key')
  const [count, setCount] = useState(0); 
  const [showIntro, setShowIntro] = useState(true);

  // --- Game Reset Logic ---
  const gameReset = () => {
    setCount((prev) => prev + 1); 
  };

  const closeIntro = () => setShowIntro(false);

  // --- Reward Sync Logic ---
  const handleGameOver = async (status, guessCount) => {
    // Only sync if the user is authenticated and not a guest
    if (status === "correct" && user && !user.guest) {
      console.log(`Mission Success: ${user.username}. Syncing result for ${guessCount} attempts...`);

      try {
        const response = await fetch("http://localhost:5000/api/update-coins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Send only the guess count; backend handles the tiered reward math
          body: JSON.stringify({ guessCount }),
          // Required to send/receive the JWT cookie
          credentials: "include", 
        });

        const data = await response.json();

        if (response.ok) {
          // SUCCESS: Update global state with the ACTUAL balance from the DB
          setUser(prev => ({ ...prev, coins: data.newBalance }));
          console.log("Database Synced. New Balance:", data.newBalance);
        } else {
          console.error("Sync Failed:", data.message);
        }
      } catch (err) {
        console.error("Network Error during economy sync:", err);
      }
    } 
    
    if (status === "lost") {
      console.log("Mission Failed: Target lost.");
    }
  };

  const engine = createGameEngine();
  return (
    <>
      {/* key={count}: Forces a hard reset of GameWindow and the internal engine.
        onGameOver: Reports game result back to this controller.
      */}
      <GameWindow 
        key={count} 
        gameReset={gameReset} 
        onGameOver={handleGameOver} 
        gameController = {engine}
      />

      


      {/* Intro Overlay shown only on initial load */}
      {showIntro && <IntroductionWindow onClose={closeIntro} />}
    </> 
  );
}

export default SinglePlayer;