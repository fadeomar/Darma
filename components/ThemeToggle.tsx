"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Get initial mode from HTML attribute
    const initialMode =
      (document.documentElement.getAttribute("data-mode") as
        | "light"
        | "dark") || "light";
    setMode(initialMode);
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "dark" ? "light" : "dark";

    // Update cookie, HTML attribute, and state
    Cookies.set("theme", newMode, { expires: 365, sameSite: "strict" });
    document.documentElement.setAttribute("data-mode", newMode);
    setMode(newMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg soft-shadow hover:soft-shadow-pressed transition-all"
    >
      {mode === "dark" ? "🌞 Light" : "🌙 Dark"}
    </button>
  );
}
