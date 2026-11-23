import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <DashboardShell userEmail={user.email}>{children}</DashboardShell>;
}
