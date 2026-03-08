"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Users, CheckSquare, Clock, ClipboardList, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

export default function ExternalDashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const dept = user?.department;

  const [facultyCount, setFacultyCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!dept || !token) return;
    try {
      const res = await axios.get(`${API_BASE}/interaction/${dept}/get-externals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const externals: any[] = res.data.data || [];
        // Backend already filters to only this external's record
        const myExternal = externals[0];
        setFacultyCount(myExternal?.assignedFaculties?.length || 0);
      }
    } catch {
      // silently ignore on dashboard
    }
  }, [dept, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <Card className="border bg-gradient-to-r from-emerald-700 to-emerald-800 text-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">Welcome, {user?.name || "External Reviewer"}</h2>
            <p className="text-emerald-200 text-sm mt-1">
              You are logged in as an external reviewer for the {dept || ""} department.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Assigned Faculty" value={facultyCount} icon={Users} color="primary" />
        <StatCard title="Total Criteria" value={6} icon={CheckSquare} color="accent" />
        <StatCard title="Max Marks" value={100} icon={Clock} color="secondary" />
      </motion.div>

      {/* Quick action */}
      <motion.div variants={itemVariants}>
        <Card className="border transition-shadow hover:shadow-md">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <ClipboardList size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Give Interaction Marks</p>
                <p className="text-xs text-muted-foreground">
                  {facultyCount > 0
                    ? `${facultyCount} faculty member${facultyCount > 1 ? "s" : ""} assigned to you`
                    : "No faculty assigned yet"}
                </p>
              </div>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => router.push("/external/interaction-marks")}
            >
              Go to Interaction Marks
              <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
