"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface PortfolioData {
  portfolioType: string;
  selfAwardedMarks: number;
  hodMarks: number;
  deanMarks: number;
  isMarkHOD: boolean;
  isMarkDean: boolean;
  isAdministrativeRole: boolean;
  administrativeRole: string;
  instituteLevelPortfolio: string;
  departmentLevelPortfolio: string;
  total_marks: number;
}

const EMPTY_PORTFOLIO: PortfolioData = {
  portfolioType: "both",
  selfAwardedMarks: 0,
  hodMarks: 0,
  deanMarks: 0,
  isMarkHOD: false,
  isMarkDean: false,
  isAdministrativeRole: false,
  administrativeRole: "",
  instituteLevelPortfolio: "",
  departmentLevelPortfolio: "",
  total_marks: 0,
};

// ── Inner page — needs Suspense ───────────────────────────────────────────────

function EvaluationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Faculty info from query params (passed from associate-deans page)
  const faculty = {
    id: searchParams.get("id") ?? "",
    name: searchParams.get("name") ?? "",
    role: searchParams.get("role") ?? "",
    department: searchParams.get("department") ?? "",
    designation: searchParams.get("designation") ?? "",
  };

  const [portfolioData, setPortfolioData] = useState<PortfolioData>({ ...EMPTY_PORTFOLIO });
  const [deanMarks, setDeanMarks] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!faculty.id || !faculty.department) return;
    // TODO: GET /api/:department/:userId/D
  }, [faculty.id, faculty.department]);

  const calcTotal = () => {
    const self = Math.min(60, portfolioData.selfAwardedMarks ?? 0);
    const hod = Math.min(60, portfolioData.hodMarks ?? 0);
    const dean = Math.min(60, deanMarks ?? 0);
    if (faculty.designation === "Associate Dean") {
      return Math.min(120, self + hod / 2 + dean / 2);
    }
    return Math.min(120, self + dean);
  };

  const handleConfirmSubmit = async () => {
    if (!faculty.id || !faculty.department) {
      toast({ title: "Error", description: "Faculty information is missing.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // TODO: POST /api/:department/:userId/D  with deanMarks + isMarkDean + total_marks
      await new Promise((r) => setTimeout(r, 700));
      toast({ title: "Evaluation submitted", description: `Portfolio marks for ${faculty.name} have been saved.` });
      router.push("/dean/associate-deans");
    } catch {
      toast({ title: "Error", description: "Failed to submit evaluation. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const infoItems = [
    { label: "Faculty Name", value: faculty.name },
    { label: "Faculty ID", value: faculty.id },
    { label: "Faculty Role", value: faculty.role },
    { label: "Department", value: faculty.department },
    { label: "Designation", value: faculty.designation },
  ];

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 hover:text-indigo-800 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft size={15} className="mr-1" /> Back to Associate Deans
        </Button>
      </motion.div>

      {/* Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Faculty Portfolio Evaluation — Dean Review</h1>
      </motion.div>

      {/* Faculty info */}
      <motion.div variants={itemVariants}>
        <Card className="border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
              <User size={16} /> Faculty Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="bg-white dark:bg-card rounded-lg border border-indigo-200 p-4">
                  <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-400 block mb-1">
                    {item.label}
                  </Label>
                  <p className="text-sm font-semibold text-foreground bg-blue-50 dark:bg-indigo-950/30 rounded px-2 py-1">
                    {item.value || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio type + docs */}
      {(portfolioData.instituteLevelPortfolio || portfolioData.departmentLevelPortfolio) && (
        <motion.div variants={itemVariants}>
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Portfolio Type: {portfolioData.portfolioType?.toUpperCase() || "Not Specified"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolioData.instituteLevelPortfolio && (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Institute Level Portfolio</p>
                  <p className="text-sm text-foreground">{portfolioData.instituteLevelPortfolio}</p>
                </div>
              )}
              {portfolioData.departmentLevelPortfolio && (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Department Level Portfolio</p>
                  <p className="text-sm text-foreground">{portfolioData.departmentLevelPortfolio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dean marks input */}
      <motion.div variants={itemVariants}>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Enter Dean Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dean Marks (Max 60)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={deanMarks}
                  onChange={(e) => setDeanMarks(Math.min(60, Math.max(0, Number(e.target.value))))}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary table */}
      <motion.div variants={itemVariants}>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Marks Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Evaluation Type</TableHead>
                  <TableHead className="text-center">Maximum</TableHead>
                  <TableHead className="text-center">Marks Awarded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Self Awarded Marks</TableCell>
                  <TableCell className="text-center">60</TableCell>
                  <TableCell className="text-center">{portfolioData.selfAwardedMarks}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>HOD Evaluation Marks</TableCell>
                  <TableCell className="text-center">60</TableCell>
                  <TableCell className="text-center">{portfolioData.hodMarks}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dean Evaluation Marks</TableCell>
                  <TableCell className="text-center">60</TableCell>
                  <TableCell className="text-center font-semibold text-indigo-700">{deanMarks}</TableCell>
                </TableRow>
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell colSpan={2}>Total Marks Obtained</TableCell>
                  <TableCell className="text-center text-lg font-bold text-indigo-700">{calcTotal()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants} className="flex justify-end pb-8">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Submit Evaluation
        </Button>
      </motion.div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Details cannot be changed after final submission. Are you sure you want to submit portfolio marks for{" "}
              <strong>{faculty.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? "Submitting…" : "Confirm Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default function DeanEvaluationFormPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
      <EvaluationFormContent />
    </Suspense>
  );
}
