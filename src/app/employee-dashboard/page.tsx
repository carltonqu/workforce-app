import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Redirect to new employee dashboard location
export default async function EmployeeDashboardRedirectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  redirect("/dashboard/employee");
}
