"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Save,
  Check,
  Briefcase,
  Mail,
} from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ── Types ─────────────────────────────────────────────────────────────────────

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
  knowledge: "",
  skills: "",
  attributes: "",
  outcomesInitiatives: "",
  selfBranching: "",
  teamPerformance: "",
  comments: "",
};

const MAX: Record<string, number> = {
  knowledge: 20,
  skills: 20,
  attributes: 10,
  outcomesInitiatives: 20,
  selfBranching: 10,
  teamPerformance: 20,
};

const CRITERIA = [
  {
    key: "knowledge",
    label: "Knowledge",
    max: 20,
    color: "border-l-amber-400",
    description:
      "Assess the faculty member's subject knowledge, research background, and academic credentials.",
  },
  {
    key: "skills",
    label: "Skills",
    max: 20,
    color: "border-l-blue-400",
    description:
      "Assess the faculty member's teaching skills, communication, methodology, and pedagogical approach.",
  },
  {
    key: "attributes",
    label: "Attributes",
    max: 10,
    color: "border-l-red-400",
    description:
      "Assess the faculty member's professional behavior, punctuality, and interpersonal skills.",
  },
  {
    key: "outcomesInitiatives",
    label: "Outcomes and Initiatives",
    max: 20,
    color: "border-l-yellow-400",
    description:
      "Assess the faculty member's research output, innovative teaching methods, and initiatives taken.",
  },
  {
    key: "selfBranching",
    label: "Self Branching",
    max: 10,
    color: "border-l-blue-400",
    description:
      "Assess the faculty member's professional development, continuous learning, and self-improvement efforts.",
  },
  {
    key: "teamPerformance",
    label: "Team Performance",
    max: 20,
    color: "border-l-red-400",
    description:
      "Assess the faculty member's ability to work within a team, collaborate with colleagues, and contribute to team goals.",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InteractionEvaluationPage({
  params,
}: {
  params: { facultyId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { facultyId } = params;

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
    (["knowledge", "skills", "attributes", "outcomesInitiatives", "selfBranching", "teamPerformance"] as const)
      .reduce((sum, k) => sum + (parseInt(evaluation[k]) || 0), 0);

  const handleSave = async (isSubmit: boolean) => {
    if (isSubmit) {
      const missing = ["knowledge", "skills", "attributes", "outcomesInitiatives", "selfBranching", "teamPerformance"].filter(
        (f) => evaluation[f as keyof EvaluationState] === ""
      );
      if (missing.length > 0) {
        toast({
          title: "Incomplete",
          description: "Please fill in all evaluation criteria before submitting.",
          variant: "destructive",
        });
        return;
      }
    }
    setSaving(true);
    try {
      if (isSubmit) {
        // TODO: POST /api/:department/dean_interaction_marks/:deanId/:facultyId/:externalId
        await new Promise((r) => setTimeout(r, 700));
        toast({ title: "Evaluation submitted", description: "Interaction marks have been saved successfully." });
        router.push("/dean/interaction-marks");
      } else {
        await new Promise((r) => setTimeout(r, 300));
        toast({ title: "Progress saved", description: "Your evaluation progress has been saved." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save evaluation.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header bar */}
      <div className="bg-indigo-700 px-6 py-4 text-white">
        <h1 className="text-xl font-bold">Dean Interaction Evaluation</h1>
        <p className="text-indigo-200 text-sm mt-0.5">
          Evaluating faculty <span className="font-mono font-semibold">{facultyId}</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 hover:text-indigo-800 -ml-2"
          onClick={() => router.push("/dean/interaction-marks")}
        >
          <ArrowLeft size={15} className="mr-1" /> Back to Dashboard
        </Button>

        {/* Faculty profile */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <Card className="border bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                  <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 shrink-0">
                    <User size={36} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Faculty ID: {facultyId}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-indigo-600" />
                        Department information loaded from API
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please evaluate this faculty member based on your interactions. Your assessment will be
                      used as part of their overall performance appraisal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Evaluation criteria */}
          {CRITERIA.map((c) => (
            <motion.div key={c.key} variants={itemVariants} className="mt-4">
              <Card className={`border-l-4 ${c.color} border border-border bg-muted/30`}>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {c.label} <span className="text-sm font-normal text-muted-foreground">(Max {c.max} marks)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      name={c.key}
                      value={evaluation[c.key as keyof EvaluationState]}
                      onChange={handleChange}
                      min={0}
                      max={c.max}
                      placeholder={`0–${c.max}`}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">/ {c.max}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Comments */}
          <motion.div variants={itemVariants} className="mt-4">
            <Card className="border-l-4 border-l-amber-400 border border-border bg-muted/30">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-1">Additional Comments</h3>
                <Textarea
                  name="comments"
                  value={evaluation.comments}
                  onChange={handleChange}
                  placeholder="Please provide any additional feedback or comments about this faculty member's performance."
                  className="h-32 mt-2"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Total score */}
          <motion.div variants={itemVariants} className="mt-4">
            <Card className="border bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Total Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{calcTotal()}</span>
                  <span className="text-lg text-indigo-500">/ 100</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="mt-6 flex justify-between border-t pt-4">
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save size={15} className="mr-2" /> Save Progress
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setConfirmOpen(true)}
              disabled={saving}
            >
              <Check size={15} className="mr-2" /> Submit Evaluation
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Details cannot be changed after final submission. Are you sure you want to submit this interaction evaluation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Submitting…" : "Confirm Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
