"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/Button";

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initialMode =
      (document.documentElement.getAttribute("data-mode") as "light" | "dark") || "light";
    setMode(initialMode);
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    Cookies.set("theme", newMode, { expires: 365, sameSite: "strict" });
    document.documentElement.setAttribute("data-mode", newMode);
    setMode(newMode);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      aria-pressed={mode === "dark"}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mode === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
