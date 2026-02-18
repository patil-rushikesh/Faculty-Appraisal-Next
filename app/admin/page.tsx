"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Trophy, FileText, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { api } from "@/lib/api-client"
import type { DashboardStats } from "@/lib/types"


export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeEvents: 0,
    totalSubmissions: 0,
    platformGrowth: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await api.admin.getStats()
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("Failed to load dashboard statistics")
        // Use default/demo data on error
        setStats({
          totalUsers: 1234,
          activeEvents: 8,
          totalSubmissions: 456,
          platformGrowth: 23,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  } as const

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
          {error} (showing demo data)
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Users"
            value={isLoading ? "..." : stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            color="primary"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Active Events"
            value={isLoading ? "..." : stats.activeEvents}
            icon={Trophy}
            trend={{ value: 2, isPositive: true }}
            color="secondary"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Submissions"
            value={isLoading ? "..." : stats.totalSubmissions.toLocaleString()}
            icon={FileText}
            trend={{ value: 5, isPositive: true }}
            color="accent"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Platform Growth"
            value={isLoading ? "..." : `${stats.platformGrowth}%`}
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            color="primary"
          />
        </motion.div>
      </motion.div>
    </>
  )
}
