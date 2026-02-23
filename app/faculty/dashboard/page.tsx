import Dashboard from "@/components/dashboard";
import { User, BookOpen, FileText, Building2, GraduationCap, CheckSquare } from "lucide-react";

export default function FacultyDashboardPage() {
  return (
    <Dashboard
      userName="Faculty"
      quickLinks={[
        {
          href: "/faculty/profile",
          icon: <User className="w-6 h-6 text-indigo-600" />,
          label: "Profile",
          description: "View and update your profile",
        },
        {
          href: "/faculty/teaching",
          icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
          label: "Teaching Performance",
          description: "Manage your teaching activities",
        },
        {
          href: "/faculty/research",
          icon: <FileText className="w-6 h-6 text-indigo-600" />,
          label: "Research",
          description: "Track your research work",
        },
        {
          href: "/faculty/self-development",
          icon: <Building2 className="w-6 h-6 text-indigo-600" />,
          label: "Self Development",
          description: "Monitor your personal growth",
        },
        {
          href: "/faculty/portfolio",
          icon: <GraduationCap className="w-6 h-6 text-indigo-600" />,
          label: "Portfolio",
          description: "View your activities",
        },
        {
          href: "/faculty/review",
          icon: <CheckSquare className="w-6 h-6 text-indigo-600" />,
          label: "Review",
          description: "Complete your evaluation",
        },
      ]}
      showWelcomeInfo={true}
    />
  );
}
