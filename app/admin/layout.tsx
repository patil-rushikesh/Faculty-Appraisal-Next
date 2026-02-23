"use client";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
      case "/admin/view-faculty":
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
      case "/admin/assign-dean-to-department":
        return {
          title: "Assign Interaction Deans to Department",
          description: "Assign deans to departments for interaction evaluation",
        };
      default:
        return {
          title: "Super Admin Dashboard",
          description: "Manage your hackathon platform and monitor activities",
        };
    }
  }, [pathname]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <DashboardHeader title={header.title} description={header.description} />
      {children}
    </div>
  );
}