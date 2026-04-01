import { Link } from "react-router-dom";

function GameCard({ to, theme, label, title, desc, cta, isNew }) {
  const themes = {
    green: {
      text: "text-[#4CAF50]",
      border: "hover:border-[#4CAF50]/50",
      badge: "bg-[#4CAF50]/15 border-[#4CAF50]/35 text-[#4CAF50]",
      hoverText: "group-hover:text-[#4CAF50]",
      iconBg: "bg-[#4CAF50]/15",
      icon: "S",
    },
    blue: {
      text: "text-[#3b82f6]",
      border: "hover:border-[#3b82f6]/50",
      badge: "bg-[#3b82f6]/15 border-[#3b82f6]/35 text-[#3b82f6]",
      hoverText: "group-hover:text-[#3b82f6]",
      iconBg: "bg-[#3b82f6]/15",
      icon: "M",
    },
  };

  const style = themes[theme];

  return (
    <Link
      to={to}
      className={`group relative flex-1 overflow-hidden rounded-[2rem] border border-white/8 bg-[#1e1f22] p-8 shadow-[0_16px_36px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_42px_rgba(0,0,0,0.34)] ${style.border}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {isNew && (
        <div
          className={`absolute right-6 top-6 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
        >
          New
        </div>
      )}

      <div className="relative z-10 text-left">
        <div
          className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${style.iconBg} ${style.text}`}
        >
          {style.icon}
        </div>
        <span className={`text-sm font-medium ${style.text}`}>{label}</span>
        <h2
          className={`mt-2 text-3xl font-bold ${style.hoverText} transition-colors`}
        >
          {title}
        </h2>
        <p className="mt-4 text-sm leading-6 text-gray-400">{desc}</p>
        <div className="mt-8 flex items-center text-sm font-semibold text-white/75 transition-colors group-hover:text-white">
          {cta}
          <span className="ml-2 transition-transform group-hover:translate-x-1.5">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Home({ user }) {
  const isGuest = user?.guest;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#121213] px-6 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,175,80,0.07),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.07),transparent_24%)]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-sm font-medium text-gray-400">
            Welcome back, {user?.username?.split("_")[0] || "Player"}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Choose a mode
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">Singleplayer or multiplayer.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <GameCard
            to="/single"
            theme="green"
            label="Solo practice"
            title="Singleplayer"
            desc={
              isGuest
                ? "Classic offline play."
                : "Play at your own pace."
            }
            cta="Play now"
          />
          <GameCard
            to="/multi"
            theme="blue"
            label="Play with a friend"
            title="Multiplayer"
            desc="Create a room and play live."
            cta="Open lobby"
            isNew
          />
        </div>

        <div className="mt-10 rounded-3xl border border-white/8 bg-[#1e1f22] px-6 py-5 text-sm text-gray-400 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
          {isGuest
            ? "Log in for multiplayer."
            : "Ready to play."}
        </div>
      </div>
    </div>
  );
}
