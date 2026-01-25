"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function NotFound() {
  const [typedText, setTypedText] = useState("");
  const fullText = "404 - Page Not Found";

  // Typing effect
  useEffect(() => {
    let index = 0;
    const type = () => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
        setTimeout(type, 100);
      } else {
        setTimeout(() => {
          index = 0;
          setTypedText("");
          type();
        }, 2000); // Pause before restarting
      }
    };
    type();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-red-900 animate-gradient"></div>

      {/* Starfield */}
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Container */}
      <div className="text-center space-y-8 relative z-10">
        {/* Typing Text */}
        <h1 className="text-5xl md:text-7xl font-bold text-white font-mono">
          {typedText}
          <span className="animate-blink">|</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-300">
          You’ve drifted off course. This page is lost in the void.
        </p>

        {/* Lost Spaceship */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto">
          {/* Spaceship */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-spaceship">
            <svg
              viewBox="0 0 64 64"
              className="w-24 h-24 text-white fill-current"
            >
              <path d="M32 2L4 32l28 30 28-30L32 2zm0 10l18 20-18 20-18-20 18-20z" />
            </svg>
          </div>

          {/* Floating Asteroids */}
          <div
            className="absolute w-12 h-12 bg-gray-600 rounded-full top-1/4 left-1/4 animate-float1"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute w-8 h-8 bg-gray-500 rounded-full top-3/4 left-3/4 animate-float2"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute w-10 h-10 bg-gray-700 rounded-full top-1/2 left-1/3 animate-float3"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Distress Signal */}
        <p className="text-sm text-red-400 animate-pulse">
          Distress Signal: SOS... SOS...
        </p>

        {/* Home Button */}
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          Return to Home
        </Link>
      </div>

      {/* Custom CSS for Animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        @keyframes twinkle {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }

        @keyframes blink {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-blink {
          animation: blink 0.5s infinite;
        }

        @keyframes float1 {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(-20px, 30px) rotate(180deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }
        .animate-float1 {
          animation: float1 6s infinite;
        }

        @keyframes float2 {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(25px, -15px) rotate(90deg);
          }
          100% {
            transform: translate(0, 0) rotate(180deg);
          }
        }
        .animate-float2 {
          animation: float2 5s infinite;
        }

        @keyframes float3 {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(-15px, 20px) rotate(270deg);
          }
          100% {
            transform: translate(0, 0) rotate(540deg);
          }
        }
        .animate-float3 {
          animation: float3 7s infinite;
        }

        @keyframes float-spaceship {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          25% {
            transform: translate(-50%, -60%) rotate(10deg);
          }
          50% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          75% {
            transform: translate(-50%, -40%) rotate(-10deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }
        .animate-float-spaceship {
          animation: float-spaceship 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
