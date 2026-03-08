"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import axios from "axios";
import Loader from "@/components/loader";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

interface AssignedFaculty {
  _id: string;
  name: string;
  desg: string;
}

export default function ExternalInteractionMarksPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const dept = user?.department;

  const [faculties, setFaculties] = useState<AssignedFaculty[]>([]);
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
        // Backend already filters to only this external's record
        const externals: any[] = res.data.data || [];
        const myExternal = externals[0];
        setFaculties(myExternal?.assignedFaculties || []);
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
      <motion.div variants={itemVariants}>
        {loading ? (
          <Loader variant="page" message="Loading assigned faculty…" />
        ) : error ? (
          <div className="text-center py-16 text-destructive text-sm">{error}</div>
        ) : faculties.length === 0 ? (
          <Card className="border">
            <CardContent className="text-center py-16 text-muted-foreground text-sm">
              No faculty members have been assigned to you for evaluation yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-foreground">Faculty Assigned for Interaction Evaluation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluate each faculty member based on your interactions
              </p>
            </div>

            {faculties.map((faculty) => (
              <Card key={faculty._id} className="border bg-card border-border transition-shadow hover:shadow-md">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 shrink-0">
                      <User size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{faculty.name}</p>
                      {faculty.desg && (
                        <p className="text-xs text-muted-foreground">{faculty.desg}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      onClick={() => router.push(`/external/evaluate/${faculty._id}?department=${dept ?? ""}&externalId=${user?.id ?? ""}`)}  
                    >
                      <FileText size={14} />
                      Evaluate
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
