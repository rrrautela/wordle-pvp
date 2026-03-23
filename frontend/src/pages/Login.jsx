import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup
  const [formData, setFormData] = useState({ identifier: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const endpoint = isLogin ? "/api/login" : "/api/register";
    const payload = isLogin 
      ? { identifier: formData.identifier, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // Required to send/receive JWT cookies
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user); // Update global app state
        navigate("/dashboard");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Terminal connection failed. Is the backend running?");
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1b] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute w-[500px] h-[500px] bg-[#6aaa64]/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xs font-black tracking-[0.5em] text-[#6aaa64] uppercase mb-2">
            {isLogin ? "Access_Protocol" : "New_Identity_Sync"}
          </h2>
          <h1 className="text-4xl font-bold italic uppercase tracking-tighter text-white">
            {isLogin ? "Elite_Login" : "Register_Elite"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-bold p-3 rounded-lg text-center uppercase tracking-widest">
              Error: {error}
            </div>
          )}

          {!isLogin && (
            <input
              type="text"
              placeholder="USERNAME"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:border-[#6aaa64]/50 outline-none transition-all font-bold"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          )}

          <input
            type={isLogin ? "text" : "email"}
            placeholder={isLogin ? "USERNAME OR EMAIL" : "EMAIL_ADDRESS"}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:border-[#6aaa64]/50 outline-none transition-all font-bold"
            onChange={(e) => setFormData({ ...isLogin ? { ...formData, identifier: e.target.value } : { ...formData, email: e.target.value } })}
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:border-[#6aaa64]/50 outline-none transition-all font-bold"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <button
            type="submit"
            className="w-full py-4 bg-[#6aaa64] hover:bg-[#5f995a] text-black font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(106,170,100,0.3)] active:scale-95"
          >
            {isLogin ? "Initialize_Session" : "Finalize_Registration"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            {isLogin ? "Need a new account? Register_Here" : "Already have access? Login_Here"}
          </button>
        </div>
      </div>
    </div>
  );
}