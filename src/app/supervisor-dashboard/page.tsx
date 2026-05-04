import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Redirect to new supervisor dashboard location
export default async function SupervisorDashboardRedirectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  redirect("/dashboard/supervisor");
}
