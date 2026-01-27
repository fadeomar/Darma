import { requireAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/admin/LogoutButton";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <AdminShell logoutButton={<LogoutButton />}>{children}</AdminShell>;
}
