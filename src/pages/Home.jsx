import { Link } from "react-router-dom";

const LOGO = ["P", "V", "P"];

const CARD_BASE =
  "group relative flex-1 overflow-hidden backdrop-blur-xl bg-white/[0.04] border border-white/10 p-10 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";

function GameCard({ to, theme, label, title, desc, cta, isNew }) {
  // Mapping themes to full Tailwind classes to ensure they render correctly
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
      className={`${CARD_BASE} ${style.border}`}
    >
      {/* Surface Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Visual Badge (Now just informative, doesn't block clicks) */}
      {isNew && (
        <div className={`absolute top-6 right-6 ${style.badge} text-[8px] px-2 py-1 rounded-full font-black tracking-widest animate-pulse`}>
          PREVIEW
        </div>
      )}

      <div className="relative z-10 text-left">
        <span className={`text-[10px] ${style.text} font-black uppercase tracking-widest`}>
          {label}
        </span>

        <h2 className={`text-3xl font-bold mt-2 ${style.hoverText} transition-colors`}>
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

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 bg-[#1a1a1b] text-white overflow-hidden font-sans">
      
      {/* Background Blobs */}
      <div className="absolute w-[600px] h-[600px] bg-[#6aaa64]/10 rounded-full blur-[130px] -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[130px] -bottom-20 -right-20 animate-pulse" />

      {/* Title */}
      <div className="relative z-10 mb-16 text-center">
        <div className="flex gap-2 justify-center mb-6">
          {LOGO.map((l, i) => (
            <div key={i} className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black rounded-lg shadow-xl">
              {l}
            </div>
          ))}
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Wordle Game
        </h1>
      </div>

      {/* Cards Layout */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-8 w-full max-w-4xl px-4">
        <GameCard
          to="/single"
          theme="green"
          label="Solo Run"
          title="Singleplayer"
          desc="Master the grid. Keep your streak alive in the classic daily challenge."
          cta="LAUNCH MISSION"
        />

        <GameCard
          to="/multi"
          theme="red"
          label="Versus"
          title="Multiplayer"
          desc="Compete in real-time. Face off against players globally in speed trials."
          cta="VIEW STATUS"
          isNew // Changed from 'locked' to 'isNew' for the visual badge
        />
      </div>

      <div className="mt-16 text-zinc-600 font-mono text-[10px] uppercase tracking-[0.8em] animate-pulse">
        System_Ready
      </div>
    </div>
  );
}