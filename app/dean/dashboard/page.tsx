"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  Users,
  FileText,
  CheckSquare,
  Award,
  ClipboardList,
  UserCheck,
  BookOpen,
  BarChart2,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/app/AuthProvider";

interface DeanStats {
  totalAssociateDeans: number;
  portfolioEvaluated: number;
  interactionDone: number;
  interactionPending: number;
}

const quickLinks = [
  {
    href: "/dean/associate-deans",
    icon: Users,
    label: "Associate Deans",
    description: "View associate deans and give portfolio marks",
    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  },
  {
    href: "/dean/evaluation-form",
    icon: ClipboardList,
    label: "Portfolio Evaluation",
    description: "Submit portfolio evaluation marks for faculty",
    color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  },
  {
    href: "/dean/interaction-marks",
    icon: FileText,
    label: "Interaction Assessment",
    description: "Evaluate faculty assigned to you for interaction",
    color: "bg-sky-50 dark:bg-sky-900/20 text-sky-600",
  },
  {
    href: "/dean/appraisal",
    icon: BookOpen,
    label: "My Appraisal",
    description: "Fill and submit your personal faculty appraisal",
    color: "bg-green-50 dark:bg-green-900/20 text-green-600",
  },
  {
    href: "/dean/appraisal?tab=D",
    icon: Award,
    label: "Portfolio (Part D)",
    description: "Manage your own portfolio submission",
    color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  },
  {
    href: "/dean/appraisal?tab=F",
    icon: CheckSquare,
    label: "Review & Submit",
    description: "Review your appraisal before final submission",
    color: "bg-rose-50 dark:bg-rose-900/20 text-rose-600",
  },
];

export default function DeanDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DeanStats>({
    totalAssociateDeans: 0,
    portfolioEvaluated: 0,
    interactionDone: 0,
    interactionPending: 0,
  });

  useEffect(() => {
    // TODO: GET /api/dean/stats
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
        <StatCard title="Associate Deans"      value={stats.totalAssociateDeans}   icon={Users}     color="primary" />
        <StatCard title="Portfolio Evaluated"  value={stats.portfolioEvaluated}    icon={Award}     color="accent" />
        <StatCard title="Interactions Done"    value={stats.interactionDone}       icon={UserCheck} color="accent" />
        <StatCard title="Interactions Pending" value={stats.interactionPending}    icon={BarChart2} color="secondary" />
      </motion.div>

      {/* Department info strip */}
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
