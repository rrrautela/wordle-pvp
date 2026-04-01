import { useState, useEffect, useRef } from "react";

export default function HeaderHUD({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="fixed right-5 top-5 z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 sm:right-6 sm:top-6">
      {!user.guest && (
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#1e1f22] px-3.5 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
          <span className="text-sm text-[#facc15]">●</span>
          <span className="text-sm font-semibold tabular-nums text-[#facc15]">
            {user.coins || 0}
          </span>
        </div>
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#1e1f22] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-105"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2b2d31] text-xs font-bold text-white">
            {user.username ? user.username[0].toUpperCase() : "G"}
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-44 origin-top-right animate-in zoom-in-95 rounded-2xl border border-white/8 bg-[#1e1f22] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.32)] duration-200">
            <div className="mb-1 border-b border-white/8 px-3 py-2">
              <p className="text-[11px] font-medium text-zinc-400">
                {user.guest ? "Guest Session" : "Elite Session"}
              </p>
              <p className="truncate text-sm font-semibold text-zinc-100">
                {user.username}
              </p>
            </div>
            <button
              onClick={() => {
                onLogout();
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
