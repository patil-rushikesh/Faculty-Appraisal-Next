"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_FACTOR, ROLE_MAX, PART_A_MAXES, PartAScoreKey } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import SectionCard from "../shared/SectionCard";
import FormProgressBar from "../shared/FormProgressBar";

// --- CONSTANTS ---
const SECTIONS: {
  title: string;
  field: PartAScoreKey;
}[] = [
    { title: "Result Analysis", field: "resultAnalysis" },
    { title: "Course Outcome Analysis", field: "courseOutcome" },
    { title: "E-Learning Content Development", field: "eLearning" },
    { title: "Academic Engagement", field: "academicEngagement" },
    { title: "Teaching Load", field: "teachingLoad" },
    { title: "UG Projects / PG Dissertations Guided", field: "projectsGuided" },
    { title: "Feedback of Faculty by Student", field: "studentFeedback" },
    { title: "Guardian / PTG Meetings", field: "ptgMeetings" },
  ];

// --- TYPES ---
interface ScoreState {
  resultAnalysis: number;
  courseOutcome: number;
  eLearning: number;
  academicEngagement: number;
  teachingLoad: number;
  projectsGuided: number;
  studentFeedback: number;
  ptgMeetings: number;
}

interface PartAAcademicInvolvementProps {
  userDesignation?: DesignationValue;
}

// --- COMPONENT ---
function PartAAcademicInvolvement({ userDesignation = "Professor" }: PartAAcademicInvolvementProps) {
  const [manualScoring, setManualScoring] = useState(false);
  const [scores, setScores] = useState<ScoreState>({
    resultAnalysis: 0,
    courseOutcome: 0,
    eLearning: 0,
    academicEngagement: 0,
    teachingLoad: 0,
    projectsGuided: 0,
    studentFeedback: 0,
    ptgMeetings: 0,
  });

  // --- HELPERS ---
  const setScore = (field: PartAScoreKey, value: number) => {
    setScores((prev) => ({
      ...prev,
      [field]: Math.min(PART_A_MAXES[field], Math.max(0, value)),
    }));
  };

  const rawSum = Object.values(scores).reduce((a, b) => a + b, 0);
  const factor = ROLE_FACTOR[userDesignation] ?? 1.0;
  const maxScore = ROLE_MAX[userDesignation] ?? 440;
  const finalScore = Math.round(Math.min(maxScore, rawSum * factor));

  // Progress Calculation
  const interactedCount = Object.values(scores).filter((v) => v > 0).length;
  const totalFields = Object.keys(scores).length;
  const progressPercent = (interactedCount / totalFields) * 100;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-4">
      <FormProgressBar progress={progressPercent} label="Part A Completion" />

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <span className="text-sm font-semibold text-indigo-700 tracking-tight uppercase">
          Part A: Academic Involvement
        </span>
        <button
          type="button"
          onClick={() => setManualScoring((v) => !v)}
          className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold border transition-all ${manualScoring
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-transparent text-muted-foreground border-border hover:border-indigo-600 hover:text-indigo-600"
            }`}
        >
          {manualScoring ? "Manual Entry On" : "Enable Manual Entry"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SECTIONS.map(({ title, field }) => (
          <SectionCard key={field} title={title}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs uppercase tracking-wider line-clamp-1 mr-2">
                {title}
              </span>
              {manualScoring ? (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={PART_A_MAXES[field]}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    value={scores[field] === 0 ? "" : scores[field]}
                    onChange={(e) => setScore(field, Number(e.target.value))}
                    placeholder="0"
                    className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                    / {PART_A_MAXES[field]}
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-foreground tabular-nums">
                  {scores[field]}
                  <span className="font-normal text-muted-foreground text-[10px] uppercase ml-1.5 tracking-tighter">
                    / {PART_A_MAXES[field]}
                  </span>
                </span>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Final Score Calculation">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Component
                </th>
                <th className="px-4 py-2 text-right font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Score
                </th>
                <th className="px-4 py-2 text-right font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Maximum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">
                  Raw Sum of All Sections
                </td>
                <td className="px-4 py-3 text-right text-foreground tabular-nums font-semibold">
                  {rawSum.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                  440.0
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground italic flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  Role Factor ({userDesignation})
                </td>
                <td className="px-4 py-3 text-right text-foreground tabular-nums font-semibold">
                  × {factor.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                  —
                </td>
              </tr>
              <tr className="bg-muted/10 font-bold border-t-2 border-border">
                <td className="px-4 py-4 text-foreground uppercase tracking-wider font-extrabold">
                  Final Adjusted Score
                </td>
                <td className="px-4 py-4 text-right text-indigo-600 tabular-nums text-lg font-black">
                  {finalScore}
                </td>
                <td className="px-4 py-4 text-right text-indigo-600 tabular-nums text-lg font-black">
                  {maxScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button className="min-w-[220px] shadow-sm uppercase tracking-wider text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
          Save Performance
        </Button>
      </div>
    </div>
  );
}

export default PartAAcademicInvolvement;
