"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssignedFaculty {
  _id: string;
  name: string;
  email?: string;
  externalId: string;
  department: string;
  isReviewed: boolean;
  total_marks?: number;
}

type EvalStatus = "Submitted" | "In Progress" | "Not Started";

// ── Eval status badge ─────────────────────────────────────────────────────────

function EvalBadge({ status }: { status: EvalStatus }) {
  if (status === "Submitted")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 gap-1">
        <CheckCircle size={13} /> Evaluated
      </Badge>
    );
  if (status === "In Progress")
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 gap-1">
        <AlertCircle size={13} /> In Progress
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Info size={13} /> Not Started
    </Badge>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InteractionMarksPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [assignedFaculty, setAssignedFaculty] = useState<AssignedFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: GET /api/:department/dean-assignments/:deanId for each interaction department
    setLoading(false);
    setAssignedFaculty([]);
  }, []);

  const getStatus = (f: AssignedFaculty): EvalStatus => {
    if (f.isReviewed) return "Submitted";
    return "Not Started";
  };

  // Group by department → externalId
  const grouped = assignedFaculty.reduce<Record<string, Record<string, AssignedFaculty[]>>>(
    (acc, f) => {
      if (!acc[f.department]) acc[f.department] = {};
      if (!acc[f.department][f.externalId]) acc[f.department][f.externalId] = [];
      acc[f.department][f.externalId].push(f);
      return acc;
    },
    {}
  );

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
          <div className="text-center py-16 text-muted-foreground text-sm">Loading assignments…</div>
        ) : error ? (
          <div className="text-center py-16 text-destructive text-sm">{error}</div>
        ) : assignedFaculty.length === 0 ? (
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

            {Object.entries(grouped).map(([department, externalGroups]) => (
              <div key={department}>
                {/* Department header */}
                <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg px-4 py-3 mb-4">
                  <Briefcase size={18} className="text-indigo-700 dark:text-indigo-400" />
                  <h3 className="font-semibold text-indigo-800 dark:text-indigo-300">
                    {department} Department
                  </h3>
                </div>

                {Object.entries(externalGroups).map(([externalId, facultyList]) => (
                  <div key={`${department}-${externalId}`} className="mb-6">
                    {/* External ID sub-header */}
                    <div className="bg-muted/60 rounded-lg px-4 py-2.5 mb-3">
                      <p className="text-sm font-medium text-foreground">
                        External Evaluator ID:{" "}
                        <span className="font-mono text-indigo-700 dark:text-indigo-400">{externalId}</span>
                      </p>
                    </div>

                    {/* Faculty cards */}
                    <div className="space-y-3">
                      {facultyList.map((faculty) => {
                        const status = getStatus(faculty);
                        const cardBg =
                          status === "Submitted"
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                            : status === "In Progress"
                            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200"
                            : "bg-card border-border";

                        return (
                          <Card key={faculty._id} className={`border ${cardBg} transition-shadow hover:shadow-md`}>
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              {/* Faculty info */}
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 shrink-0">
                                  <User size={22} />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{faculty.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{faculty._id}</p>
                                  {faculty.email && (
                                    <p className="text-xs text-muted-foreground">{faculty.email}</p>
                                  )}
                                </div>
                              </div>

                              {/* Status + Action */}
                              <div className="flex items-center gap-3 shrink-0">
                                <EvalBadge status={status} />
                                {faculty.isReviewed ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm font-medium">
                                    <CheckCircle size={14} />
                                    Score: {faculty.total_marks ?? "—"}/100
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300"
                                    onClick={() =>
                                      router.push(`/dean/interaction-evaluation/${faculty._id}`, {
                                        // pass state via query param since App Router doesn't support router.push state
                                      })
                                    }
                                  >
                                    <FileText size={14} className="mr-1" />
                                    Evaluate
                                    <ArrowRight size={14} className="ml-1" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
