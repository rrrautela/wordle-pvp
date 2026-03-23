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

  // --- THE GATEKEEPER ---
  // If no user/guest is selected, this component stays completely out of the DOM.
  if (!user) return null; 

  return (
    <div className="fixed top-6 right-6 flex items-center gap-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-1000">
      
      {/* Coin Display: Hidden for Guests, Visible for Elite */}
      {!user.guest && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1b] border border-white/5 rounded-full shadow-2xl">
          <span className="text-yellow-500 text-sm">🪙</span>
          <span className="text-xs font-mono font-black text-yellow-500 tabular-nums tracking-tighter">
            {user.coins || 0}
          </span>
        </div>
      )}

      {/* Profile Toggle */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center hover:scale-105 transition-all shadow-xl"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center text-[10px] font-black text-white">
            {user.username ? user.username[0].toUpperCase() : "G"}
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-40 bg-[#121213] border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-3 py-2 border-b border-white/5 mb-1">
               <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                {user.guest ? "Guest Session" : "Elite Session"}
               </p>
               <p className="text-xs text-zinc-200 font-bold truncate">{user.username}</p>
            </div>
            <button
              onClick={() => { onLogout(); setIsMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-lg uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}