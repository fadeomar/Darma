"use client";

import { useState } from "react";

export default function Custom500() {
  const [isMending, setIsMending] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleMend = () => {
    setIsMending(true);
    setClickCount((prev) => prev + 1);
    setTimeout(() => setIsMending(false), 1500); // Reset after 1.5s
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 to-black flex items-center justify-center p-4 overflow-hidden">
      {/* Container */}
      <div className="text-center space-y-6 relative">
        {/* Glitchy Title with Heartbeat */}
        <h1 className="text-6xl md:text-8xl font-bold text-red-500 animate-heartbeat">
          <span className="inline-block" aria-hidden="true">
            5
          </span>
          <span className="inline-block" aria-hidden="true">
            0
          </span>
          <span className="inline-block" aria-hidden="true">
            0
          </span>
        </h1>
        <p className="text-xl md:text-3xl text-red-200 font-mono">
          Server Heartbreak: Connection Lost
        </p>

        {/* Broken Heart Animation */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto">
          {/* Heart Base */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ${
              isMending
                ? "scale-100 opacity-100"
                : "scale-75 opacity-50 animate-pulse-slow"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-red-600 fill-current"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Shattered Heart Pieces */}
          <div
            className={`absolute w-16 h-16 text-red-700 transition-all duration-1000 ${
              isMending
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-0 opacity-100"
                : "top-3/4 left-1/4 translate-y-20 -rotate-45 opacity-30"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 8.5 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09" />
            </svg>
          </div>
          <div
            className={`absolute w-12 h-12 text-red-600 transition-all duration-1000 ${
              isMending
                ? "top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 rotate-0 opacity-100"
                : "top-2/3 left-3/4 translate-y-24 rotate-12 opacity-20"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
              <path d="M12 5.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54" />
            </svg>
          </div>

          {/* Falling Teardrops */}
          <div className="absolute w-4 h-6 bg-blue-400 rounded-full top-0 left-1/4 animate-teardrop1"></div>
          <div className="absolute w-3 h-5 bg-blue-300 rounded-full top-0 left-3/4 animate-teardrop2"></div>
          <div className="absolute w-5 h-7 bg-blue-500 rounded-full top-0 left-1/2 animate-teardrop3"></div>
        </div>

        {/* Message */}
        <p className="text-lg text-gray-300 max-w-md mx-auto">
          Our server’s heart is broken. We’re crying over the lost connection.
        </p>

        {/* Interactive Mend Button */}
        <button
          onClick={handleMend}
          className="mt-6 px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-red-950"
        >
          {isMending ? "Mending..." : "Mend the Heart"}
        </button>

        {/* Easter Egg: Cheer Up Message */}
        {clickCount >= 5 && (
          <p className="mt-4 text-sm text-yellow-300 animate-bounce">
            &quot;Keep trying! Maybe a hug will fix it? ❤️&quot;
          </p>
        )}
      </div>

      {/* Custom CSS for Animations */}
      <style jsx>{`
        @keyframes heartbeat {
          0% {
            transform: scale(1);
          }
          10% {
            transform: scale(1.1);
          }
          20% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.05);
          }
          40% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-heartbeat {
          animation: heartbeat 2s infinite;
        }

        @keyframes pulse-slow {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }

        @keyframes teardrop1 {
          0% {
            transform: translateY(-20px);
            opacity: 1;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }
        .animate-teardrop1 {
          animation: teardrop1 2s infinite;
        }

        @keyframes teardrop2 {
          0% {
            transform: translateY(-20px);
            opacity: 1;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }
        .animate-teardrop2 {
          animation: teardrop2 1.5s infinite;
        }

        @keyframes teardrop3 {
          0% {
            transform: translateY(-20px);
            opacity: 1;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }
        .animate-teardrop3 {
          animation: teardrop3 1.8s infinite;
        }
      `}</style>
    </div>
  );
}

export const dynamic = "force-static";
