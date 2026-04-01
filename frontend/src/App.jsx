import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HeaderHUD from "./components/HeaderHUD"; // Renamed from Navbar
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SinglePlayer from "./pages/SinglePlayer";
import MultiPlayer from "./pages/MultiPlayer";
import { BACKEND_URL } from "./config";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- AUTH CHECK: Sync session with Backend on Load ---
  useEffect(() => {
    // Inside App.jsx -> useEffect
    async function checkAuth() {
      try {
        if (!BACKEND_URL) {
          console.error("BACKEND_URL is undefined!");
        }
        const apiUrl = `${BACKEND_URL}/api/me`;
        console.log("API CALL:", apiUrl);
        const res = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          // Ensure userData contains { username, coins, ... }
          setUser(userData);
        } else {
          const savedGuest = localStorage.getItem("wordle_guest");
          if (savedGuest) setUser(JSON.parse(savedGuest));
        }
      } catch (err) {
        console.error("Auth_Protocol_Offline:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // --- LOGOUT: Terminate Server and Local Session ---
  const handleLogout = async () => {
    try {
      if (!BACKEND_URL) {
        console.error("BACKEND_URL is undefined!");
      }
      const apiUrl = `${BACKEND_URL}/api/logout`;
      console.log("API CALL:", apiUrl);
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout_Error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("wordle_guest");
      navigate("/");
    }
  };

  if (loading)
    return (
      <div className="h-screen w-screen bg-[#1a1a1b] flex items-center justify-center">
        <div className="text-[#6aaa64] font-mono text-[10px] animate-pulse tracking-[1em]">
          INITIALIZING_PROTOCOL...
        </div>
      </div>
    );

  return (
    <div className="bg-[#1a1a1b] min-h-screen text-white overflow-x-hidden">
      {/* FLOATING HUD: 
        Sitting at the top level so it persists during all transitions.
        Renamed from "Log out" as requested in HeaderHUD.
      */}
      <HeaderHUD user={user} onLogout={handleLogout} />

      {/* MAIN VIEWPORT: 
        Removed 'pt-24' so content starts from the very top. 
        The HeaderHUD now floats OVER the content.
      */}
      <main className="relative z-10 w-full h-full">
        <Routes>
          {/* Landing Gate */}
          <Route
            path="/"
            element={
              !user ? (
                <Landing setUser={setUser} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />

          {/* Auth Screen */}
          <Route path="/login" element={<Login setUser={setUser} />} />

          {/* Secure Dashboard */}
          <Route
            path="/dashboard"
            element={user ? <Home user={user} /> : <Navigate to="/" />}
          />

          {/* Singleplayer */}
          <Route
            path="/single"
            element={
              user ? (
                <SinglePlayer user={user} setUser={setUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Multiplayer */}
          <Route
            path="/multi"
            element={user ? <MultiPlayer user={user} /> : <Navigate to="/" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Visual Terminal Footer - Minimalist branding */}
      <div className="fixed bottom-4 left-6 text-zinc-800 font-mono text-[8px] uppercase tracking-widest pointer-events-none select-none">
        STATUS: CONNECTION_{user ? "ESTABLISHED" : "STABLE"} // ID:{" "}
        {user?.username || "GUEST_UNIT"}
      </div>

      <div className="fixed bottom-4 right-6 text-zinc-800 font-mono text-[8px] uppercase tracking-widest pointer-events-none select-none vertical-text">
        PROTOCOL_V2
      </div>
    </div>
  );
}

export default App;
