"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  Users,
  FileText,
  CheckSquare,
  BookOpen,
  Award,
  ClipboardList,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/app/AuthProvider";

interface AssociateDeanStats {
  totalFaculty: number;
  appraisalDone: number;
  reviewPending: number;
  reviewCompleted: number;
}

const quickLinks = [
  {
    href: "/associate-dean/review",
    icon: ClipboardList,
    label: "Review Submissions",
    description: "Review faculty appraisal submissions",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/associate-dean/appraisal",
    icon: BookOpen,
    label: "My Appraisal",
    description: "Fill and submit your personal faculty appraisal",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/associate-dean/appraisal?tab=A",
    icon: FileText,
    label: "Academic Involvement",
    description: "Part A – Academic Involvement",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/associate-dean/appraisal?tab=B",
    icon: Award,
    label: "Research (Part B)",
    description: "Research activities and publications",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/associate-dean/appraisal?tab=D",
    icon: Users,
    label: "Portfolio (Part D)",
    description: "Manage your portfolio submission",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/associate-dean/appraisal?tab=F",
    icon: CheckSquare,
    label: "Review & Submit",
    description: "Review your appraisal before final submission",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
];

export default function AssociateDeanDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AssociateDeanStats>({
    totalFaculty: 0,
    appraisalDone: 0,
    reviewPending: 0,
    reviewCompleted: 0,
  });

  useEffect(() => {
    // TODO: GET /api/associate-dean/stats
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
        <StatCard title="Total Faculty"      value={stats.totalFaculty}      icon={Users}         color="primary" />
        <StatCard title="Appraisals Done"    value={stats.appraisalDone}     icon={CheckSquare}   color="primary" />
        <StatCard title="Review Pending"     value={stats.reviewPending}     icon={ClipboardList} color="primary" />
        <StatCard title="Reviews Completed"  value={stats.reviewCompleted}   icon={Award}         color="primary" />
      </motion.div>

      {/* User info strip */}
      {user && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 px-6 py-4"
        >
          <p className="text-sm text-muted-foreground">
            Logged in as{" "}
            <span className="font-semibold text-foreground">{user.name}</span>
            {user.department && (
              <>
                {" · "}
                <span className="font-semibold text-foreground">{user.department}</span>
                {" Department"}
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* Quick access grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
