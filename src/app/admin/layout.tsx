import { requireAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/admin/LogoutButton";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // server-side guard (DB + role)

  return <AdminShell logoutButton={<LogoutButton />}>{children}</AdminShell>;
}
