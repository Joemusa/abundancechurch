import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = Boolean(adminEmail && user?.email === adminEmail);

  return (
    <DashboardShell
      churchName="Church Executive Dashboard"
      email={user?.email ?? ""}
      isAdmin={isAdmin}
    />
  );
}
