import { useEffect, useState } from "react";

function MultiPlayer() {
  const [glitch, setGlitch] = useState(false);
  const [activeTile, setActiveTile] = useState(0);

  // The full 6-letter sequence
  const wordleLetters = ["W", "O", "R", "D", "L", "E"];
  
  const tileColors = [
    "bg-[#6aaa64] border-[#6aaa64]", // W - Green
    "bg-[#c9b458] border-[#c9b458]", // O - Yellow
    "bg-[#787c7e] border-[#787c7e]", // R - Gray
    "bg-[#6aaa64] border-[#6aaa64]", // D - Green
    "bg-[#c9b458] border-[#c9b458]", // L - Yellow
    "bg-[#6aaa64] border-[#6aaa64]", // E - Green
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Precise loop control: 0, 1, 2, 3, 4, 5
  useEffect(() => {
    const tileInterval = setInterval(() => {
      setActiveTile((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 900); // Slightly slower so you can actually see the E
    return () => clearInterval(tileInterval);
  }, []);

  return (
    // Background lightened to a "Wordle Dark Mode" gray rather than pure black
    <div className="relative h-screen flex items-center justify-center bg-[#1a1a1b] text-white overflow-hidden font-sans">
      
      {/* Softer, brighter ambient glow */}
      <div className="absolute w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 w-[95%] max-w-md">
        
        {/* TOP STATUS TAG */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-red-600 text-white text-[10px] font-black px-5 py-1.5 rounded-md shadow-xl uppercase tracking-[0.2em] whitespace-nowrap border border-red-400">
            Phase: Alpha Testing
          </div>
        </div>

        {/* Glass Card - More visible border and background */}
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/20 rounded-[2rem] p-10 text-center shadow-2xl overflow-hidden">
          
          <div className="mb-10">
            <h1 className="text-xs font-bold tracking-[0.6em] text-zinc-400 uppercase">
              Wordle <span className="text-red-500">Versus</span>
            </h1>
          </div>

          {/* THE CHARACTER CYCLE GRID */}
          <div className="flex justify-center gap-2 mb-12">
            {wordleLetters.map((letter, i) => (
              <div 
                key={i}
                className={`w-12 h-12 border-2 flex items-center justify-center font-bold text-2xl transition-all duration-300 rounded-sm
                  ${activeTile === i 
                    ? `${tileColors[i]} scale-110 shadow-lg text-white border-transparent rotate-0` 
                    : 'border-zinc-700 bg-zinc-800/50 text-transparent -rotate-2'}
                `}
              >
                {activeTile === i ? letter : ""}
              </div>
            ))}
          </div>

          {/* COMING SOON SECTION */}
          <div className="relative py-10 border-y border-white/10 my-8">
            <div className={`transition-all duration-75 ${glitch ? 'skew-x-6 opacity-60 text-red-500' : 'skew-x-0'}`}>
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none text-white">
                Coming
              </h2>
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mt-1 text-red-600">
                Soon
              </h2>
            </div>
            
            {/* Red Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_#ef4444] animate-[scan_3.5s_linear_infinite]" />
          </div>

          {/* FOOTER INFO */}
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                 Competitive Patch v0.1
               </span>
               <span className="text-xs font-bold text-zinc-300 bg-black/20 px-4 py-1.5 rounded-full border border-white/10 italic">
                 Live in Q2 2026
               </span>
            </div>
            
            <button
              disabled
              className="w-full py-4 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-600 font-black uppercase tracking-widest text-[10px]"
            >
              Multiplayer Encrypted
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MultiPlayer;