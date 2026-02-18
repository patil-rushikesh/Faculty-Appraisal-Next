"use client";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Users, Trophy, FileText, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export default function DashboardPage() {


  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Users"
          value="1,234"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="primary"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Active Events"
          value="8"
          icon={Trophy}
          trend={{ value: 2, isPositive: true }}
          color="secondary"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Submissions"
          value="456"
          icon={FileText}
          trend={{ value: 5, isPositive: true }}
          color="accent"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Platform Growth"
          value="23%"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
          color="primary"
        />
      </motion.div>
    </motion.div>
  );
}