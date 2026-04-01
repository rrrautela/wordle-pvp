const ENV_BACKEND = import.meta.env.VITE_BACKEND_URL;

export const BACKEND_URL =
  ENV_BACKEND || "https://wordle-pvp-backend.onrender.com";

console.log("BACKEND_URL:", BACKEND_URL);
