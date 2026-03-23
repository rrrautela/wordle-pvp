import { Link } from "react-router-dom";

function GameCard({ to, theme, label, title, desc, cta, isNew }) {
  const themes = {
    green: {
      text: "text-[#6aaa64]",
      border: "hover:border-[#6aaa64]/40",
      badge: "bg-[#6aaa64]/20 border-[#6aaa64]/50 text-[#6aaa64]",
      hoverText: "group-hover:text-[#6aaa64]"
    },
    red: {
      text: "text-red-500",
      border: "hover:border-red-500/40",
      badge: "bg-red-500/20 border-red-500/50 text-red-500",
      hoverText: "group-hover:text-red-500"
    }
  };

  const style = themes[theme];

  return (
    <Link
      to={to}
      className={`group relative flex-1 overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${style.border}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {isNew && (
        <div className={`absolute top-6 right-6 ${style.badge} text-[8px] px-2 py-1 rounded-full font-black tracking-widest animate-pulse`}>
          NEW MODE
        </div>
      )}

      <div className="relative z-10 text-left">
        <span className={`text-[10px] ${style.text} font-black uppercase tracking-widest`}>
          {label}
        </span>
        <h2 className={`text-3xl font-bold mt-2 ${style.hoverText} transition-colors uppercase italic`}>
          {title}
        </h2>
        <p className="text-zinc-400 text-sm mt-4 leading-relaxed">{desc}</p>
        <div className="mt-10 flex items-center text-xs font-bold text-white/40 group-hover:text-white transition-colors">
          {cta}
          <span className="ml-2 group-hover:translate-x-3 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home({ user }) {
  const isGuest = user?.guest;

  return (
    <div className="min-h-screen bg-[#1a1a1b] text-white flex flex-col justify-center p-8 lg:p-24 font-sans overflow-hidden relative">
      
      {/* Background Ambient Glows */}
      <div className="absolute w-[600px] h-[600px] bg-[#6aaa64]/5 rounded-full blur-[130px] -top-20 -left-20" />
      <div className="absolute w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[130px] -bottom-20 -right-20" />

      {/* Hero Welcome Section */}
      <div className="relative z-10 max-w-5xl mx-auto w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
         <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Welcome, {user?.username?.split('_')[0] || "Operator"}
         </h1>
         <p className="text-zinc-500 font-mono text-[10px] mt-2 tracking-[0.3em] uppercase">
            Select_Operational_Module // Status: Online
         </p>
      </div>

      {/* Cards Layout */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-8 max-w-5xl mx-auto w-full">
         <GameCard 
           to="/single" 
           theme="green" 
           label="Solo_Training" 
           title="Singleplayer" 
           desc={isGuest ? "Classic offline grid access. Local decryption only." : "Earn 50+ coins per victory. Data syncs to Elite servers."}
           cta="INITIALIZE" 
         />
         <GameCard 
           to="/multi" 
           theme="red" 
           label="PvP_Protocol" 
           title="Multiplayer" 
           desc="Real-time tactical engagement. Compete for high-stakes rewards." 
           cta="ENCRYPTED" 
           isNew 
         />
      </div>

      {/* Bottom Status Branding */}
      <div className="mt-20 text-center text-zinc-800 font-mono text-[8px] uppercase tracking-[1.5em] opacity-50">
        System_Load_Optimal // Auth: {isGuest ? "Guest_Tier" : "Elite_Tier"}
      </div>
    </div>
  );
}