"use client";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export default function ExternalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const skipHeader = pathname.startsWith("/external/evaluate");

  const header = useMemo(() => {
    if (pathname === "/external/dashboard") {
      return { title: "External Reviewer Dashboard", description: "Overview of your evaluation assignments" };
    }
    if (pathname === "/external/interaction-marks") {
      return { title: "Give Interaction Marks", description: "Evaluate faculty members assigned to you" };
    }
    return { title: "External Reviewer", description: "Interaction evaluation portal" };
  }, [pathname]);

  if (skipHeader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <DashboardHeader title={header.title} description={header.description} />
      {children}
    </div>
  );
}
