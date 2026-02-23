"use client";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DeanLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Appraisal and interaction-evaluation have their own full-page chrome
  const skipHeader =
    pathname === "/dean/appraisal" ||
    pathname.startsWith("/dean/interaction-evaluation");

  const header = useMemo(() => {
    switch (true) {
      case pathname === "/dean/dashboard":
        return { title: "Dean Dashboard", description: "Overview of your faculty appraisal and evaluation responsibilities" };
      case pathname === "/dean/associate-deans":
        return { title: "Associate Deans List", description: "View and manage portfolio evaluations for associate deans" };
      case pathname === "/dean/evaluation-form":
        return { title: "Portfolio Evaluation", description: "Submit portfolio marks for associate dean faculty" };
      case pathname === "/dean/interaction-marks":
        return { title: "Interaction Marks", description: "Faculty assigned to you for interaction assessment" };
      default:
        return { title: "Dean Dashboard", description: "Overview of your faculty appraisal and evaluation responsibilities" };
    }
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
