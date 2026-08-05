import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/admin/LogoutButton";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  title: "Darma administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // server-side guard (DB + role)

  return <AdminShell logoutButton={<LogoutButton />}>{children}</AdminShell>;
}
