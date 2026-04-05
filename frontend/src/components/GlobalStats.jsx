import { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";

export default function GlobalStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stats`);
        if (!response.ok) return;

        const data = await response.json();
        console.log("API RESPONSE:", data);
        if (!isMounted) return;

        setStats({
          totalUsers: Number(data?.totalUsers) || 0,
          totalGames: Number(data?.totalGames) || 0,
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    }

    fetchStats();
    const intervalId = setInterval(fetchStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-[#1e1f22] px-5 py-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span className="font-semibold text-white">{stats.totalUsers}</span>
        <span>Users</span>
        <span className="text-gray-600">•</span>
        <span className="font-semibold text-white">{stats.totalGames}</span>
        <span>Games Played</span>
      </div>
    </div>
  );
}
