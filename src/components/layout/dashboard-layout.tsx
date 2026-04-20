import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export async function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar — hidden on mobile, rendered in topbar Sheet for mobile */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} user={{ name: user.name, email: user.email }} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
