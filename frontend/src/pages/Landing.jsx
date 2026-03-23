import { useNavigate } from "react-router-dom";

export default function Landing({ setUser }) {
  const navigate = useNavigate();

  const playAsGuest = () => {
    const guestUser = { 
      guest: true, 
      username: "Guest_Infiltrator", 
      coins: 0 
    };
    setUser(guestUser);
    localStorage.setItem("wordle_guest", JSON.stringify(guestUser));
    navigate("/dashboard");
  };

  return (
    <div className="relative h-screen w-full bg-[#1a1a1b] flex flex-col items-center justify-center text-white font-sans overflow-hidden">
      
      {/* Background Aesthetic */}
      <div className="absolute w-[600px] h-[600px] bg-[#6aaa64]/5 rounded-full blur-[120px] -top-20 -left-20" />
      <div className="absolute w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] -bottom-20 -right-20" />

      <div className="relative z-10 text-center mb-16 animate-in fade-in zoom-in duration-1000">
        <h1 className="text-7xl font-black italic tracking-tighter uppercase bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Protocol_Wordle
        </h1>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.5em] mt-4">
          Select_Access_Level // System_Version_2.0
        </p>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-8 w-full max-w-4xl px-6">
        {/* Guest Access Card */}
        <button 
          onClick={playAsGuest}
          className="group relative flex-1 p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-2"
        >
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Level 01</span>
            <h2 className="text-3xl font-bold mt-2 text-white italic uppercase">Guest_Access</h2>
            <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
              Anonymous entry. Local practice only. No coin synthesis or profile persistence.
            </p>
            <div className="mt-10 text-xs font-bold text-white/40 group-hover:text-white transition-colors">
              INITIALIZE_BOOT →
            </div>
          </div>
        </button>

        {/* Elite Terminal Card */}
        <button 
          onClick={() => navigate("/login")}
          className="group relative flex-1 p-10 bg-[#6aaa64]/5 border border-[#6aaa64]/10 rounded-[2.5rem] transition-all duration-500 hover:border-[#6aaa64]/40 hover:bg-[#6aaa64]/10 hover:-translate-y-2"
        >
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-[#6aaa64] font-black uppercase tracking-widest">Level 02</span>
            <h2 className="text-3xl font-bold mt-2 text-[#6aaa64] italic uppercase">Elite_Terminal</h2>
            <p className="text-zinc-300 text-sm mt-4 leading-relaxed">
              Identity sync. Earn up to 100 coins per win. Full access to the competitive network.
            </p>
            <div className="mt-10 text-xs font-bold text-[#6aaa64]/60 group-hover:text-[#6aaa64] transition-colors">
              ESTABLISH_LINK →
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}