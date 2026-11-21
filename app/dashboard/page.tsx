import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getRoleDashboardPath, isAuthRole } from "@/lib/auth-routing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user || !isAuthRole(user.role)) {
    redirect("/connexion");
  }

  redirect(
    getRoleDashboardPath(
      user.role,
      user.mustChangePassword === true
    )
  );
}
