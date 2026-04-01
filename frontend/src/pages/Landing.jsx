import { useNavigate } from "react-router-dom";

export default function Landing({ setUser }) {
  const navigate = useNavigate();

  const playAsGuest = () => {
    const guestUser = {
      guest: true,
      username: "Guest_Infiltrator",
      coins: 0,
    };
    setUser(guestUser);
    localStorage.setItem("wordle_guest", JSON.stringify(guestUser));
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#121213] px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(76,175,80,0.08),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col items-center justify-center">
        <div className="mb-12 max-w-2xl text-center animate-in fade-in zoom-in duration-700">
          <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
            Wordle PvP
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Wordle PvP
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-400 sm:text-lg">
            Solo or multiplayer.
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          <button
            onClick={() => navigate("/login")}
            className="group rounded-3xl border border-white/10 bg-[#1e1f22] p-8 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-[1.02] hover:border-[#4CAF50]/60 hover:shadow-[0_22px_44px_rgba(0,0,0,0.34)] active:scale-[0.99]"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4CAF50]/15 text-xl font-bold text-[#4CAF50]">
              P
            </div>
            <p className="text-sm font-medium text-[#4CAF50]">Recommended</p>
            <h2 className="mt-2 text-3xl font-bold">Play online</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">Play online.</p>
            <div className="mt-8 inline-flex items-center rounded-2xl bg-[#4CAF50] px-5 py-3 text-sm font-semibold text-black transition-all duration-200 group-hover:brightness-110">
              Continue to login
            </div>
          </button>

          <button
            onClick={playAsGuest}
            className="group rounded-3xl border border-white/10 bg-[#1e1f22] p-8 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_22px_44px_rgba(0,0,0,0.34)] active:scale-[0.99]"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-xl font-bold text-white">
              G
            </div>
            <p className="text-sm font-medium text-gray-300">Quick start</p>
            <h2 className="mt-2 text-3xl font-bold">Play as guest</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">Play locally.</p>
            <div className="mt-8 inline-flex items-center rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 group-hover:bg-white/10">
              Continue as guest
            </div>
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">Choose a mode.</div>
      </div>
    </div>
  );
}
