"use client";
import { ReactNode, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const header = useMemo(() => {
    switch (pathname) {
      case "/admin/dashboard":
        return {
          title: "Super Admin Dashboard",
          description: "Manage your hackathon platform and monitor activities",
        };
      case "/admin/add-faculty":
        return {
          title: "Add Faculty",
          description: "Add new faculty members to the system",
        };
      case "/admin/faculty":
        return {
          title: "Faculty Management",
          description: "View and manage all faculty members",
        };
      case "/admin/verification-team":
        return {
          title: "Verification Team",
          description: "Create and manage verification committees for each department",
        };
      case "/admin/assign-faculty-to-verification-team":
        return {
          title: "Assign Faculty to Verification Team",
          description: "Assign faculty members to verification committee members",
        };
      default:
        return {
          title: "Super Admin Dashboard",
          description: "Manage your hackathon platform and monitor activities",
        };
    }
  }, [pathname]);

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        <AdminSidebar 
          isOpen={sidebarOpen}
          isExpanded={sidebarExpanded}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarExpanded ? 'lg:ml-72' : 'lg:ml-20'}`}>
          <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <DashboardHeader
              title={header.title}
              description={header.description}
              onMenuClick={() => setSidebarOpen(true)}
            />
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}