"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  Users,
  FileText,
  UserPlus,
  UserCheck,
  BarChart2,
  CheckSquare,
  BookOpen,
  ClipboardList,
  Building,
  Award,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/app/AuthProvider";

interface DirectorStats {
  totalFaculty: number;
  verificationPending: number;
  interactionPending: number;
  completedAppraisals: number;
}

const quickLinks = [
  {
    href: "/director/hod-forms",
    icon: Building,
    label: "HOD Appraisals",
    description: "View and manage HOD appraisal submissions",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/dean-forms",
    icon: Users,
    label: "Dean Appraisals",
    description: "View and manage Dean appraisal submissions",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/faculty-forms",
    icon: FileText,
    label: "Faculty Appraisals",
    description: "Faculty appraisals sent for director review",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/add-external",
    icon: UserPlus,
    label: "Add External",
    description: "Register external reviewers",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/assign-external",
    icon: UserCheck,
    label: "Assign External",
    description: "Assign externals to faculty for evaluation",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/director-verify",
    icon: CheckSquare,
    label: "Director Verify",
    description: "Verify and confirm portfolio evaluations",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/appraisal",
    icon: BookOpen,
    label: "My Appraisal",
    description: "Fill and submit your personal appraisal",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/director/appraisal?tab=F",
    icon: Award,
    label: "Review & Submit",
    description: "Review your appraisal before final submission",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
];

export default function DirectorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DirectorStats>({
    totalFaculty: 0,
    verificationPending: 0,
    interactionPending: 0,
    completedAppraisals: 0,
  });

  useEffect(() => {
    // TODO: GET /api/director/stats
  }, []);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Faculty"          value={stats.totalFaculty}          icon={Users}        color="primary" />
        <StatCard title="Verification Pending"   value={stats.verificationPending}   icon={ClipboardList} color="primary" />
        <StatCard title="Interaction Pending"    value={stats.interactionPending}    icon={BarChart2}    color="primary" />
        <StatCard title="Completed Appraisals"   value={stats.completedAppraisals}   icon={CheckSquare}  color="primary" />
      </motion.div>

      {/* User info */}
      {user && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 px-6 py-4"
        >
          <p className="text-sm text-muted-foreground">
            Logged in as{" "}
            <span className="font-semibold text-foreground">{user.name}</span>
            {user.department && (
              <> · <span className="font-semibold text-foreground">{user.department}</span></>
            )}
            {" · Director"}
          </p>
        </motion.div>
      )}

      {/* Quick access */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-4 rounded-xl border bg-card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${link.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {link.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
