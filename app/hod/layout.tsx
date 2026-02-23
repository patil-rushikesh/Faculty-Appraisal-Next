"use client";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export default function HodLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The appraisal page has its own full-page chrome — skip the shared header
  const isAppraisalPage = pathname === "/hod/appraisal";

  const header = useMemo(() => {
    switch (pathname) {
      case "/hod/dashboard":
        return { title: "HOD Dashboard", description: "Overview of your department's appraisal progress" };
      case "/hod/faculty":
        return { title: "Department Faculty Forms", description: "View and manage appraisal form status for your department" };
      case "/hod/final-marks":
        return { title: "Final Marks", description: "Consolidated marks for department faculty — send to Director when ready" };
      case "/hod/add-external-faculty":
        return { title: "Add External Faculty", description: "Register external evaluators for your department" };
      case "/hod/assign-faculty-external":
        return { title: "Assign External Faculty", description: "Assign department faculty members to external evaluators" };
      case "/hod/final-review":
        return { title: "Final Review", description: "Review overall appraisal status and certify before forwarding to Director" };
      default:
        return { title: "HOD Dashboard", description: "Overview of your department's appraisal progress" };
    }
  }, [pathname]);

  if (isAppraisalPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <DashboardHeader title={header.title} description={header.description} />
      {children}
    </div>
  );
}
