import { requireAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // server-side guard (DB + role)

  return (
    <div>
      <LogoutButton />
      {children}
    </div>
  );
}
