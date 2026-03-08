"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import {
  ArrowLeft,
  User,
  Briefcase,
  Save,
  CheckCircle2,
  BookOpen,
  Users,
  Lightbulb,
  GitBranch,
  Calculator,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/AuthProvider";
import { containerVariants, itemVariants } from "@/lib/animations";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

//  Types 

interface EvaluationState {
  knowledge: number | "";
  skills: number | "";
  attributes: number | "";
  outcomesInitiatives: number | "";
  selfBranching: number | "";
  teamPerformance: number | "";
  comments: string;
}

//  Criteria Configuration 

const CRITERIA = [
  {
    key: "knowledge" as const,
    label: "Knowledge",
    max: 20,
    description: "Assess the faculty member's subject knowledge, research background, and academic credentials.",
    icon: BookOpen,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
  {
    key: "skills" as const,
    label: "Skills",
    max: 20,
    description: "Assess teaching skills, communication, methodology, and pedagogical approach.",
    icon: Users,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
  {
    key: "attributes" as const,
    label: "Attributes",
    max: 10,
    description: "Assess professional behavior, punctuality, and interpersonal skills.",
    icon: User,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
  {
    key: "outcomesInitiatives" as const,
    label: "Outcomes & Initiatives",
    max: 20,
    description: "Assess research output, innovative teaching methods, and initiatives taken.",
    icon: Lightbulb,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
  {
    key: "selfBranching" as const,
    label: "Self Branching",
    max: 10,
    description: "Assess professional development, continuous learning, and self-improvement efforts.",
    icon: GitBranch,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
  {
    key: "teamPerformance" as const,
    label: "Team Performance",
    max: 20,
    description: "Assess ability to work within a team, collaborate with colleagues, and contribute to team goals.",
    icon: Users,
    color: "border-l-indigo-500 bg-indigo-50/40",
    labelColor: "text-indigo-700",
  },
] as const;

type CriteriaKey = typeof CRITERIA[number]["key"];
const MAX_PER_CRITERION: Record<CriteriaKey, number> = {
  knowledge: 20,
  skills: 20,
  attributes: 10,
  outcomesInitiatives: 20,
  selfBranching: 10,
  teamPerformance: 20,
};
const TOTAL_MAX = 100;

//  Inner Component 

function ExternalEvaluateContent({ facultyId }: { facultyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const dept = searchParams.get("department") || user?.department || "";
  const externalId = searchParams.get("externalId") || user?.id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [facultyName, setFacultyName] = useState<string>("");
  const [facultyDesignation, setFacultyDesignation] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<EvaluationState>({
    knowledge: "",
    skills: "",
    attributes: "",
    outcomesInitiatives: "",
    selfBranching: "",
    teamPerformance: "",
    comments: "",
  });

  const fetchData = useCallback(async () => {
    if (!dept || !token || !externalId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const [evalRes, extRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/interaction/${dept}/evaluation/${externalId}/${facultyId}`, authHeader),
        axios.get(`${API_BASE}/interaction/${dept}/get-externals`, authHeader),
      ]);

      if (evalRes.status === "fulfilled" && evalRes.value.data.success) {
        const ext = evalRes.value.data.data?.externalEvaluation;
        if (ext && ext.evaluatorId) {
          setEvaluation({
            knowledge: ext.knowledge ?? "",
            skills: ext.skills ?? "",
            attributes: ext.attributes ?? "",
            outcomesInitiatives: ext.outcomesInitiatives ?? "",
            selfBranching: ext.selfBranching ?? "",
            teamPerformance: ext.teamPerformance ?? "",
            comments: ext.comments ?? "",
          });
          setIsSubmitted(true);
        }
      }

      if (extRes.status === "fulfilled" && extRes.value.data.success) {
        const externals: any[] = extRes.value.data.data || [];
        const myself = externals.find((e: any) => e.userId === externalId) || externals[0];
        const assigned: any[] = myself?.assignedFaculties || [];
        const match = assigned.find((f: any) => f._id === facultyId);
        if (match) {
          setFacultyName(match.name);
          setFacultyDesignation(match.desg || "");
        }
      }
    } catch (err: any) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message ?? axErr.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [dept, token, externalId, facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalScore =
    (Number(evaluation.knowledge) || 0) +
    (Number(evaluation.skills) || 0) +
    (Number(evaluation.attributes) || 0) +
    (Number(evaluation.outcomesInitiatives) || 0) +
    (Number(evaluation.selfBranching) || 0) +
    (Number(evaluation.teamPerformance) || 0);

  const completedCriteria = CRITERIA.filter(
    (c) => evaluation[c.key] !== "" && evaluation[c.key] !== null && evaluation[c.key] !== undefined
  ).length;

  const handleScoreChange = (key: CriteriaKey, rawValue: string) => {
    if (rawValue === "") {
      setEvaluation((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const num = Math.min(MAX_PER_CRITERION[key], Math.max(0, parseInt(rawValue) || 0));
    setEvaluation((prev) => ({ ...prev, [key]: num }));
  };

  const handleSaveDraft = () => {
    if (!dept) return;
    localStorage.setItem(`ext_eval_${dept}_${facultyId}`, JSON.stringify(evaluation));
    toast({ title: "Draft Saved", description: "Your evaluation progress has been saved locally." });
  };

  const handleSubmitClick = () => {
    const missing = CRITERIA.filter(
      (c) => evaluation[c.key] === "" || evaluation[c.key] === null || evaluation[c.key] === undefined
    );
    if (missing.length > 0) {
      toast({
        title: "Incomplete Evaluation",
        description: `Please complete all ${missing.length} remaining criteria before submitting.`,
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!dept || !token || !externalId) return;
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE}/interaction/${dept}/evaluate/external/${externalId}/${facultyId}`,
        {
          knowledge: Number(evaluation.knowledge) || 0,
          skills: Number(evaluation.skills) || 0,
          attributes: Number(evaluation.attributes) || 0,
          outcomesInitiatives: Number(evaluation.outcomesInitiatives) || 0,
          selfBranching: Number(evaluation.selfBranching) || 0,
          teamPerformance: Number(evaluation.teamPerformance) || 0,
          comments: evaluation.comments || "",
          evaluatorId: user?.id,
          evaluatorName: user?.name,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem(`ext_eval_${dept}_${facultyId}`);
      setIsSubmitted(true);
      setShowConfirmDialog(false);
      toast({ title: "Evaluation Submitted", description: `Marks submitted successfully for ${facultyName}.` });
      router.push("/external/interaction-marks");
    } catch (err: any) {
      const axErr = err as AxiosError<{ message?: string }>;
      toast({
        title: "Submission Failed",
        description: axErr.response?.data?.message ?? axErr.message ?? "Failed to submit evaluation.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader variant="page" message="Loading evaluation data..." />;

  if (error && !facultyName) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <Card className="max-w-xl mx-auto border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.push("/external/interaction-marks")} className="gap-2">
              <ArrowLeft size={14} /> Back to Faculty List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back nav */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/external/interaction-marks")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to Faculty List
          </Button>
        </motion.div>

        {/* Faculty Profile Card */}
        <motion.div variants={itemVariants}>
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white pb-5">
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                External Interaction Evaluation
              </CardTitle>
              <p className="text-indigo-100 text-sm mt-1">
                Please evaluate this faculty member based on your expert interaction. Your assessment forms part of their overall performance appraisal.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="h-20 w-20 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center shrink-0">
                  <User size={36} className="text-indigo-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{facultyName || facultyId}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-indigo-600 text-white border-transparent px-3">Faculty</Badge>
                      {facultyDesignation && (
                        <span className="text-xs text-muted-foreground">{facultyDesignation}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase size={14} className="text-indigo-500 shrink-0" />
                    <span><span className="font-semibold text-foreground">Department:</span> {dept || ""}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submitted banner */}
        {isSubmitted && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Evaluation Already Submitted</p>
                <p className="text-xs text-green-600">This evaluation has been submitted and can no longer be edited.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress indicator */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Criteria completed: <span className="font-bold text-foreground">{completedCriteria} / {CRITERIA.length}</span></span>
            <span>Total Score: <span className="font-black text-indigo-700 text-base">{totalScore}</span><span className="text-muted-foreground"> / {TOTAL_MAX}</span></span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedCriteria / CRITERIA.length) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Evaluation Criteria Cards */}
        <motion.div variants={containerVariants} className="space-y-4">
          {CRITERIA.map((criterion) => {
            const Icon = criterion.icon;
            const currentValue = evaluation[criterion.key];
            const isFilled = currentValue !== "" && currentValue !== null;

            return (
              <motion.div key={criterion.key} variants={itemVariants}>
                <div
                  className={`border-l-4 rounded-xl p-5 transition-all duration-200 ${criterion.color} ${isFilled ? "border border-border/50" : "border border-transparent"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5 p-2 rounded-lg bg-white border border-border/50 shrink-0">
                        <Icon size={16} className={criterion.labelColor} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-black text-sm uppercase tracking-widest ${criterion.labelColor}`}>
                            {criterion.label}
                          </h3>
                          {isFilled && (
                            <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{criterion.description}</p>
                      </div>
                    </div>

                    {/* Score input */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={criterion.max}
                        placeholder="0"
                        value={currentValue}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => handleScoreChange(criterion.key, e.target.value)}
                        disabled={isSubmitted}
                        aria-label={`${criterion.label} score`}
                        className={`w-20 rounded-lg border-2 border-border px-3 py-1.5 text-center text-lg font-black tabular-nums text-foreground transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isSubmitted ? "bg-muted/50 cursor-not-allowed opacity-70" : "bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"}`}
                      />
                      <span className="text-sm text-muted-foreground font-semibold">/ {criterion.max}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Comments */}
        <motion.div variants={itemVariants}>
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-600" />
                Additional Comments
                <Badge variant="secondary" className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 border-indigo-200">Optional</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Provide any additional feedback or comments about this faculty member's performance during your interaction..."
                value={evaluation.comments}
                onChange={(e) => setEvaluation((prev) => ({ ...prev, comments: e.target.value }))}
                disabled={isSubmitted}
                rows={4}
                className={`resize-none text-sm ${isSubmitted ? "bg-muted/50 cursor-not-allowed" : "focus-visible:ring-indigo-300 focus-visible:border-indigo-500"}`}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Summary + Action Buttons */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-indigo-100 bg-indigo-50/30 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Calculator size={18} className="text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total Score</p>
                    <p className="text-3xl font-black text-indigo-900 leading-none">
                      {totalScore}
                      <span className="text-base font-bold text-indigo-400 ml-1">/ {TOTAL_MAX}</span>
                    </p>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 border border-green-200">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">Evaluation Submitted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="gap-2">
                      <Save size={14} />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmitClick}
                      disabled={saving || completedCriteria < CRITERIA.length}
                      className="gap-2 bg-indigo-700 hover:bg-indigo-800 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:transform-none"
                    >
                      <CheckCircle2 size={16} />
                      Submit Evaluation
                    </Button>
                  </div>
                )}
              </div>

              {!isSubmitted && completedCriteria < CRITERIA.length && (
                <p className="text-[11px] text-muted-foreground mt-3 font-medium">
                  Complete all {CRITERIA.length} criteria to enable submission. ({CRITERIA.length - completedCriteria} remaining)
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-base uppercase tracking-widest">
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              Once submitted, this evaluation cannot be changed. Please review the summary below.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
              <p><span className="font-semibold">Faculty:</span> {facultyName || facultyId}</p>
            </div>
            <div className="space-y-1.5">
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-bold tabular-nums">
                    {evaluation[c.key] !== "" ? evaluation[c.key] : 0} / {c.max}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border font-black">
                <span>Total</span>
                <span className="text-indigo-700">{totalScore} / {TOTAL_MAX}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={saving} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={saving}
              className="gap-2 px-6 bg-indigo-700 hover:bg-indigo-800 text-white"
            >
              {saving ? <Loader variant="inline" /> : <CheckCircle2 size={15} />}
              {saving ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

//  Page Wrapper 

export default function ExternalEvaluatePage({ params }: { params: Promise<{ facultyId: string }> }) {
  const { facultyId } = React.use(params);
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <ExternalEvaluateContent facultyId={facultyId} />
    </Suspense>
  );
}