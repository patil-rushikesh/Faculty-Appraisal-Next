"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Save, Check, Briefcase } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface EvaluationState {
  knowledge: string;
  skills: string;
  attributes: string;
  outcomesInitiatives: string;
  selfBranching: string;
  teamPerformance: string;
  comments: string;
}

const EMPTY_EVAL: EvaluationState = {
  knowledge: "", skills: "", attributes: "", outcomesInitiatives: "", selfBranching: "", teamPerformance: "", comments: "",
};

const MAX: Record<string, number> = { knowledge: 20, skills: 20, attributes: 10, outcomesInitiatives: 20, selfBranching: 10, teamPerformance: 20 };

const CRITERIA = [
  { key: "knowledge", label: "Knowledge", max: 20, color: "border-l-amber-400", description: "Subject knowledge, research background, and academic credentials." },
  { key: "skills", label: "Skills", max: 20, color: "border-l-blue-400", description: "Teaching skills, communication, methodology, and pedagogical approach." },
  { key: "attributes", label: "Attributes", max: 10, color: "border-l-red-400", description: "Professional behavior, punctuality, and interpersonal skills." },
  { key: "outcomesInitiatives", label: "Outcomes and Initiatives", max: 20, color: "border-l-yellow-400", description: "Research output, innovative teaching methods, and initiatives." },
  { key: "selfBranching", label: "Self Branching", max: 10, color: "border-l-purple-400", description: "Professional development and continuous learning efforts." },
  { key: "teamPerformance", label: "Team Performance", max: 20, color: "border-l-green-400", description: "Collaboration with colleagues and contribution to team goals." },
];

function CollegeExternalEvaluateContent({ facultyId }: { facultyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const department = searchParams.get("department") ?? "";
  const { toast } = useToast();

  const [evaluation, setEvaluation] = useState<EvaluationState>({ ...EMPTY_EVAL });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name in MAX) {
      const clamped = value === "" ? "" : String(Math.min(MAX[name], Math.max(0, parseInt(value) || 0)));
      setEvaluation((prev) => ({ ...prev, [name]: clamped }));
    } else {
      setEvaluation((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calcTotal = () =>
    (Object.keys(MAX) as (keyof EvaluationState)[]).reduce((sum, k) => sum + (parseInt(evaluation[k]) || 0), 0);

  const handleSave = async (isSubmit: boolean) => {
    if (isSubmit) {
      const missing = Object.keys(MAX).filter((f) => evaluation[f as keyof EvaluationState] === "");
      if (missing.length > 0) {
        toast({ title: "Incomplete", description: "Please fill in all criteria.", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      if (isSubmit) {
        // TODO: POST /api/${department}/college_external_interaction_marks/${facultyId}
        await new Promise((r) => setTimeout(r, 700));
        toast({ title: "Evaluation submitted" });
        router.push("/college-external/dashboard");
      } else {
        await new Promise((r) => setTimeout(r, 300));
        toast({ title: "Progress saved" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="bg-violet-700 px-6 py-4 text-white">
        <h1 className="text-xl font-bold">College External Interaction Evaluation</h1>
        <p className="text-violet-200 text-sm mt-0.5">
          Evaluating <span className="font-mono font-semibold">{facultyId}</span>
          {department && <> · {department}</>}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-800 -ml-2" onClick={() => router.push("/college-external/dashboard")}>
          <ArrowLeft size={15} className="mr-1" /> Back to Dashboard
        </Button>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <Card className="border bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 shrink-0">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Faculty ID: {facultyId}</h2>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Briefcase size={14} className="text-violet-600" />
                      {department || "Department information loaded from API"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {CRITERIA.map((c) => (
            <motion.div key={c.key} variants={itemVariants} className="mt-4">
              <Card className={`border-l-4 ${c.color} border border-border bg-muted/30`}>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {c.label} <span className="text-sm font-normal text-muted-foreground">(Max {c.max} marks)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" name={c.key} value={evaluation[c.key as keyof EvaluationState]} onChange={handleChange} min={0} max={c.max} placeholder={`0–${c.max}`} className="w-24" />
                    <span className="text-sm text-muted-foreground">/ {c.max}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <motion.div variants={itemVariants} className="mt-4">
            <Card className="border-l-4 border-l-amber-400 border border-border bg-muted/30">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-1">Additional Comments</h3>
                <Textarea name="comments" value={evaluation.comments} onChange={handleChange} placeholder="Additional feedback..." className="h-32 mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4">
            <Card className="border bg-violet-50 dark:bg-violet-950/20 border-violet-200">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-violet-800 dark:text-violet-300 mb-2">Total Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-violet-700 dark:text-violet-400">{calcTotal()}</span>
                  <span className="text-lg text-violet-500">/ 100</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 flex justify-between border-t pt-4">
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              <Save size={15} className="mr-2" /> Save Progress
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setConfirmOpen(true)} disabled={saving}>
              <Check size={15} className="mr-2" /> Submit Evaluation
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>Submit this college external evaluation? This cannot be changed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSave(true)} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? "Submitting…" : "Confirm Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CollegeExternalEvaluatePage({ params }: { params: { facultyId: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <CollegeExternalEvaluateContent facultyId={params.facultyId} />
    </Suspense>
  );
}
