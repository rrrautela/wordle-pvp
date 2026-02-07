import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SinglePlayer from "./pages/SinglePlayer";
import MultiPlayer from "./pages/MultiPlayer";
import { useEffect } from "react";

function App() {
  // useEffect runs ONCE when App component first mounts (page load)
  useEffect(() => {
    async function getBackendMessage() {
      // Send HTTP request
      const res = await fetch("http://localhost:5000");

      // Convert response body to text
      const data = await res.text();

      // Log backend response
      console.log("backend says", data);
    }

    getBackendMessage();
  }, []);

  return (
    <Routes>
      {/* Home page */}
      <Route path="/" element={<Home />} />

      {/* Single player Wordle */}
      <Route path="/single" element={<SinglePlayer />} />

      {/* Multiplayer Wordle */}
      <Route path="/multi" element={<MultiPlayer />} />
    </Routes>
  );
}

export default App;
