import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";

export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    identifier: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const apiUrl = isLogin
      ? `${BACKEND_URL}/api/login`
      : `${BACKEND_URL}/api/register`;
    const payload = isLogin
      ? { identifier: formData.identifier, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    try {
      if (!BACKEND_URL) {
        console.error("BACKEND_URL is undefined!");
      }
      console.log("API CALL:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
        localStorage.setItem("wordle_auth_changed", String(Date.now()));
        setUser(data.user);
        navigate("/dashboard");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Unable to reach the server right now. Make sure the backend is running.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#121213] px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,175,80,0.08),transparent_26%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl gap-8 rounded-[2rem] border border-white/8 bg-[#1e1f22] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.28)] md:grid-cols-[1.05fr_0.95fr] md:p-5">
          <div className="hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 md:flex md:flex-col md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[#4CAF50]/30 bg-[#4CAF50]/10 px-3 py-1 text-sm font-medium text-[#4CAF50]">
                Wordle PvP
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-4 max-w-sm text-base leading-7 text-gray-400">
                {isLogin
                  ? "Sign in to create multiplayer rooms, join games by code, and keep your progress together."
                  : "Set up your account to unlock multiplayer matches and persistent progress."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/15 p-5 text-sm leading-6 text-gray-400">
              Clean, dark, and focused on play. No clutter, just fast access to your next game.
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#17181a] p-7 sm:p-9">
            <div className="mb-8">
              <p className="text-sm font-medium text-[#4CAF50]">
                {isLogin ? "Login" : "Register"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {isLogin ? "Sign in to play" : "Create an account"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                {isLogin
                  ? "Use your username or email to continue."
                  : "Fill in a few details and you’ll be ready to play."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full rounded-xl border border-white/10 bg-[#222327] px-4 py-3.5 text-white placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              )}

              <input
                type={isLogin ? "text" : "email"}
                placeholder={isLogin ? "Username or email" : "Email address"}
                className="w-full rounded-xl border border-white/10 bg-[#222327] px-4 py-3.5 text-white placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                onChange={(e) =>
                  setFormData(
                    isLogin
                      ? { ...formData, identifier: e.target.value }
                      : { ...formData, email: e.target.value },
                  )
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-[#222327] px-4 py-3.5 text-white placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-[#4CAF50] px-4 py-3.5 text-base font-semibold text-black transition-all duration-200 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99]"
              >
                {isLogin ? "Continue" : "Create account"}
              </button>
            </form>

            <div className="mt-7 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {isLogin
                  ? "Need an account? Register"
                  : "Already have an account? Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
