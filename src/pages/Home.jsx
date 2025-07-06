import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100 text-gray-900">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-center">
        Wordle PvP
      </h1>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md">
        <Link
          to="/single"
          className="flex-1 bg-white border border-gray-300 hover:bg-green-100 hover:border-green-400 text-green-700 font-semibold py-3 px-6 rounded-lg shadow transition"
        >
          Single Player
        </Link>

        <Link
          to="/multi"
          className="flex-1 bg-white border border-gray-300 hover:bg-blue-100 hover:border-blue-400 text-blue-700 font-semibold py-3 px-6 rounded-lg shadow transition"
        >
          Multiplayer
        </Link>
      </div>
    </div>
  );
}

export default Home;
