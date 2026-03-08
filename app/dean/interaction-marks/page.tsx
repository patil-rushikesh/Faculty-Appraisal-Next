"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/AuthProvider";
import Loader from "@/components/loader";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssignedFaculty {
  _id: string;
  name: string;
  desg: string;
}

interface ExternalInfo {
  userId: string;
  full_name: string;
  organization?: string;
  assignedFaculties: AssignedFaculty[];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InteractionMarksPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const dept = user?.department;

  const [externals, setExternals] = useState<ExternalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dept || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/interaction/${dept}/get-externals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setExternals(res.data.data || []);
      } else {
        setError("Failed to load assignments.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, [dept, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome banner */}
      <motion.div variants={itemVariants}>
        <Card className="border bg-gradient-to-r from-indigo-700 to-indigo-800 text-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">Dean Interaction Assessment</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {user?.name ? `Welcome, ${user.name}` : "Faculty Evaluation Portal"}
            </p>
            {user?.department && (
              <p className="text-indigo-300 text-xs mt-0.5">
                Department: {user.department}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <Loader variant="page" message="Loading assignments…" />
        ) : error ? (
          <div className="text-center py-16 text-destructive text-sm">{error}</div>
        ) : externals.length === 0 || externals.every((e) => e.assignedFaculties.length === 0) ? (
          <Card className="border">
            <CardContent className="text-center py-16 text-muted-foreground text-sm">
              No faculty members have been assigned to you for interaction assessment yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-foreground">Faculty Assigned for Interaction Assessment</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Please evaluate each faculty member based on your interactions
              </p>
            </div>

            {externals
              .filter((ext) => ext.assignedFaculties.length > 0)
              .map((ext) => (
                <div key={ext.userId}>
                  {/* External reviewer sub-header */}
                  <div className="bg-muted/60 rounded-lg px-4 py-2.5 mb-3">
                    <p className="text-sm font-medium text-foreground">
                      External Reviewer:{" "}
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400">{ext.full_name}</span>
                      {ext.organization && (
                        <span className="text-muted-foreground text-xs ml-2">({ext.organization})</span>
                      )}
                    </p>
                  </div>

                  {/* Faculty cards */}
                  <div className="space-y-3">
                    {ext.assignedFaculties.map((faculty) => (
                      <Card key={faculty._id} className="border bg-card border-border transition-shadow hover:shadow-md">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Faculty info */}
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 shrink-0">
                              <User size={22} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{faculty.name}</p>
                              {faculty.desg && (
                                <p className="text-xs text-muted-foreground">{faculty.desg}</p>
                              )}
                            </div>
                          </div>

                          {/* Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300"
                              onClick={() =>
                                router.push(
                                  `/dean/interaction-evaluation/${faculty._id}?externalId=${ext.userId}`
                                )
                              }
                            >
                              <FileText size={14} className="mr-1" />
                              Evaluate
                              <ArrowRight size={14} className="ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
