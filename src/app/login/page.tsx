"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Field, Input, InlineError } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = useMemo(() => {
    const n = searchParams.get("next");
    if (!n || !n.startsWith("/")) return "/admin";
    return n;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Login failed");
        return;
      }

      router.replace(nextUrl);
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-16 text-[var(--color-text-primary)]">
      <Card className="mx-auto max-w-md" padding="lg">
        <div className="mb-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Darma Admin
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Access the content management and moderation workspace.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error ? <InlineError>{error}</InlineError> : null}

          <Button type="submit" loading={pending} fullWidth>
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
