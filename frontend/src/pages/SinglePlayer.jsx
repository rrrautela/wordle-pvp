import { useState } from "react";
import GameWindow from "../components/GameWindow";
import IntroductionWindow from "../components/IntroductionWindow";
import "../App.css";
import { createGameEngine } from './../../../shared/gameEngine';
import data from "../../../shared/data/all5letterwords.json";
import { BACKEND_URL } from "../config";



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
  const handleGameOver = async (status, guessCount, correctWord) => {
    try {
      if (!BACKEND_URL) {
        console.error("BACKEND_URL is undefined!");
      }

      const recordApiUrl = `${BACKEND_URL}/api/singleplayer-complete`;
      console.log("API CALL:", recordApiUrl);
      await fetch(recordApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correctWord,
          attempts: guessCount,
        }),
        credentials: "include",
      });
    } catch (err) {
      console.error("Singleplayer record failed:", err);
    }

    // Only sync coins if the user is authenticated and not a guest
    if (status === "correct" && user && !user.guest) {
      console.log(`Mission Success: ${user.username}. Syncing result for ${guessCount} attempts...`);

      try {
        const apiUrl = `${BACKEND_URL}/api/update-coins`;
        console.log("API CALL:", apiUrl);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ guessCount }),
          credentials: "include", 
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {
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

  const engine = createGameEngine(data);
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
