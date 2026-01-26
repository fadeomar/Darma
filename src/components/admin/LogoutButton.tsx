"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fff",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        zIndex: 50,
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
