"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PART_C_ROLE_MAX, PART_C_SECTION_MAXES } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import SectionCard from "../shared/SectionCard";
import ScoreCard from "../shared/ScoreCard";
import FormProgressBar from "../shared/FormProgressBar";
import FormLockedModal from "../shared/FormLockedModal";
import Loader from "@/components/loader";

// --- CONSTANTS ---
const FORMULAS = {
    qualification: "Marks=20 (Completed/Awarded), 15 (Ongoing)",
    attended: "Marks: 2-week=20, 1-week=10, 2-5 days=5, 1-day=2 (Max 40)",
    organized: "Marks: 2-week=40, 1-week=20, 2-5 days=10, 1-day=2 (Max 80)",
    phdGuided: "Marks: Awarded=50, Thesis Submitted=25, Guiding=10 (No limit)",
};

// --- TYPES ---
interface SelfDevData {
    pdfCompleted: boolean;
    pdfOngoing: boolean;
    phdAwarded: boolean;
    twoWeekProgram: number;
    oneWeekProgram: number;
    twoToFiveDayProgram: number;
    oneDayProgram: number;
    organizedTwoWeekProgram: number;
    organizedOneWeekProgram: number;
    organizedTwoToFiveDayProgram: number;
    organizedOneDayProgram: number;
    phdDegreeAwarded: number;
    phdThesisSubmitted: number;
    phdScholarsGuiding: number;
}

interface PartCSelfDevelopmentProps {
    apiBase: string;
    department: string;
    userId: string;
    userDesignation: DesignationValue;
}

type QualStatus = "pdfCompleted" | "pdfOngoing" | "phdAwarded" | "none";

// --- HELPERS ---
const TransparencyGuideline = ({ formula }: { formula: string }) => (
    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 shadow-sm mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 opacity-60">
            Computation Guidelines
        </p>
        <p className="text-xs text-foreground/70 leading-relaxed italic font-medium">
            {formula}
        </p>
    </div>
);

function NumericRow({
    label,
    hint,
    name,
    value,
    onChange,
    disabled = false,
}: {
    label: string;
    hint?: string;
    name: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 hover:bg-muted/5 transition-colors px-1">
            <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 uppercase tracking-tight">{label}</p>
                {hint && (
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight opacity-70">
                        {hint}
                    </p>
                )}
            </div>
            <input
                type="number"
                name={name}
                min={0}
                disabled={disabled}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onWheel={(e) => e.currentTarget.blur()}
                value={value === 0 ? "" : value}
                onChange={onChange}
                placeholder="0"
                className="w-20 shrink-0 rounded-md border border-slate-400 bg-background px-3 py-1.5 text-base text-right font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
            />
        </div>
    );
}

// --- COMPONENT ---
function PartCSelfDevelopment({
    apiBase,
    department,
    userId,
    userDesignation,
}: PartCSelfDevelopmentProps) {
    const [formData, setFormData] = useState<SelfDevData>({
        pdfCompleted: false,
        pdfOngoing: false,
        phdAwarded: false,
        twoWeekProgram: 0,
        oneWeekProgram: 0,
        twoToFiveDayProgram: 0,
        oneDayProgram: 0,
        organizedTwoWeekProgram: 0,
        organizedOneWeekProgram: 0,
        organizedTwoToFiveDayProgram: 0,
        organizedOneDayProgram: 0,
        phdDegreeAwarded: 0,
        phdThesisSubmitted: 0,
        phdScholarsGuiding: 0,
    });

    const [verifiedScore, setVerifiedScore] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- LOCAL STORAGE PERSISTENCE ---
    const STORAGE_KEY = `partC_data_${userId}`;

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) setFormData(parsed);
            } catch (e) {
                console.error("Failed to parse saved Part C data", e);
            }
        }
    }, [STORAGE_KEY]);

    // Save to local storage on change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, STORAGE_KEY, isLoading]);

    // Score Calculations
    const scores = {
        qual: formData.pdfCompleted || formData.phdAwarded ? 20 : formData.pdfOngoing ? 15 : 0,
        attended: Math.min(
            PART_C_SECTION_MAXES.attended,
            formData.twoWeekProgram * 20 +
            formData.oneWeekProgram * 10 +
            formData.twoToFiveDayProgram * 5 +
            formData.oneDayProgram * 2
        ),
        organized: Math.min(
            PART_C_SECTION_MAXES.organized,
            formData.organizedTwoWeekProgram * 40 +
            formData.organizedOneWeekProgram * 20 +
            formData.organizedTwoToFiveDayProgram * 10 +
            formData.organizedOneDayProgram * 2
        ),
        phd:
            formData.phdDegreeAwarded * 50 +
            formData.phdThesisSubmitted * 25 +
            formData.phdScholarsGuiding * 10,
    };

    const maxTotal = PART_C_ROLE_MAX[userDesignation] ?? 180;
    const totalScore = Math.min(maxTotal, Object.values(scores).reduce((a, b) => a + b, 0));

    // Progress Calculation
    const fieldsToExclude = ["pdfCompleted", "pdfOngoing", "phdAwarded"];
    const interactedCount =
        Object.entries(formData).filter(
            ([k, v]) => !fieldsToExclude.includes(k) && (v as number) > 0
        ).length + (formData.pdfCompleted || formData.pdfOngoing || formData.phdAwarded ? 1 : 0);
    const totalFields = 1 + (Object.keys(formData).length - 3);
    const progressPercent = (interactedCount / totalFields) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiBase}/${department}/${userId}/C`);
                if (res.ok) {
                    const d = await res.json();
                    if (d) {
                        setFormData({
                            pdfCompleted: d[1]?.qualification?.pdfCompleted ?? false,
                            pdfOngoing: d[1]?.qualification?.pdfOngoing ?? false,
                            phdAwarded: d[1]?.qualification?.phdAwarded ?? false,
                            twoWeekProgram: d[2]?.trainingAttended?.twoWeekProgram ?? 0,
                            oneWeekProgram: d[2]?.trainingAttended?.oneWeekProgram ?? 0,
                            twoToFiveDayProgram: d[2]?.trainingAttended?.twoToFiveDayProgram ?? 0,
                            oneDayProgram: d[2]?.trainingAttended?.oneDayProgram ?? 0,
                            organizedTwoWeekProgram: d[3]?.trainingOrganized?.twoWeekProgram ?? 0,
                            organizedOneWeekProgram: d[3]?.trainingOrganized?.oneWeekProgram ?? 0,
                            organizedTwoToFiveDayProgram: d[3]?.trainingOrganized?.twoToFiveDayProgram ?? 0,
                            organizedOneDayProgram: d[3]?.trainingOrganized?.oneDayProgram ?? 0,
                            phdDegreeAwarded: d[4]?.phdGuided?.degreesAwarded ?? 0,
                            phdThesisSubmitted: d[4]?.phdGuided?.thesisSubmitted ?? 0,
                            phdScholarsGuiding: d[4]?.phdGuided?.scholarsGuiding ?? 0,
                        });
                        setVerifiedScore(d?.verified_total_marks);
                    }
                }
                const sr = await fetch(`${apiBase}/${department}/${userId}/get-status`);
                if (sr.ok) {
                    const s = await sr.json();
                    setFormStatus(s.status);
                }
            } catch (err) {
                console.error("Fetch C failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [apiBase, department, userId]);

    const qualStatus: QualStatus = formData.pdfCompleted
        ? "pdfCompleted"
        : formData.pdfOngoing
            ? "pdfOngoing"
            : formData.phdAwarded
                ? "phdAwarded"
                : "none";

    const setQual = (f: QualStatus) =>
        setFormData((p) => ({
            ...p,
            pdfCompleted: f === "pdfCompleted",
            pdfOngoing: f === "pdfOngoing",
            phdAwarded: f === "phdAwarded",
        }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData((p) => ({ ...p, [e.target.name]: Math.max(0, Number(e.target.value)) }));

    const handleSubmit = async () => {
        if (formStatus !== "pending") {
            setShowStatusModal(true);
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                1: { qualification: { ...formData, marks: scores.qual } },
                2: { trainingAttended: { ...formData, marks: scores.attended } },
                3: { trainingOrganized: { ...formData, marks: scores.organized } },
                4: {
                    phdGuided: {
                        degreesAwarded: formData.phdDegreeAwarded,
                        thesisSubmitted: formData.phdThesisSubmitted,
                        scholarsGuiding: formData.phdScholarsGuiding,
                        marks: scores.phd,
                    },
                },
                total_marks: totalScore,
            };
            const res = await fetch(`${apiBase}/${department}/${userId}/C`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Save Failed");
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loader message="Loading self-development data…" />;
    const locked = formStatus !== "pending";

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-4">
            <FormProgressBar progress={progressPercent} label="Part C Completion" />

            <SectionCard title="Qualification">
                <TransparencyGuideline formula={FORMULAS.qualification} />
                <div className="grid grid-cols-1 gap-2 mb-4">
                    {(["pdfCompleted", "pdfOngoing", "phdAwarded", "none"] as QualStatus[]).map((v) => (
                        <label
                            key={v}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${qualStatus === v
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-card text-muted-foreground border-slate-300 hover:border-indigo-600/50 hover:text-indigo-600"
                                } ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                            <input
                                type="radio"
                                name="qualStatus"
                                disabled={locked}
                                checked={qualStatus === v}
                                onChange={() => setQual(v)}
                                className="sr-only"
                            />
                            <span className="text-xs font-bold uppercase tracking-tight">
                                {v === "pdfCompleted" ? "Ph.D. Completed" :
                                    v === "pdfOngoing" ? "Ph.D. Ongoing" :
                                        v === "phdAwarded" ? "Ph.D. Degree Awarded / Thesis Submitted" :
                                            "None"}
                            </span>
                        </label>
                    ))}
                </div>
                <ScoreCard label="Qualification Score" score={scores.qual} total={20} />
            </SectionCard>

            <SectionCard title="Training Programs Attended">
                <TransparencyGuideline formula={FORMULAS.attended} />
                <NumericRow
                    label="2-week Programs Attended"
                    hint="20 pts each"
                    name="twoWeekProgram"
                    value={formData.twoWeekProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="1-week Programs Attended"
                    hint="10 pts each"
                    name="oneWeekProgram"
                    value={formData.oneWeekProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="2–5 Day Programs Attended"
                    hint="5 pts each"
                    name="twoToFiveDayProgram"
                    value={formData.twoToFiveDayProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="1 Day Programs Attended"
                    hint="2 pts each"
                    name="oneDayProgram"
                    value={formData.oneDayProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <ScoreCard label="Attended Score" score={scores.attended} total={40} />
            </SectionCard>

            <SectionCard title="Training Programs Organized">
                <TransparencyGuideline formula={FORMULAS.organized} />
                <NumericRow
                    label="2-week Programs Organized"
                    hint="40 pts each"
                    name="organizedTwoWeekProgram"
                    value={formData.organizedTwoWeekProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="1-week Programs Organized"
                    hint="20 pts each"
                    name="organizedOneWeekProgram"
                    value={formData.organizedOneWeekProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="2–5 Day Programs Organized"
                    hint="10 pts each"
                    name="organizedTwoToFiveDayProgram"
                    value={formData.organizedTwoToFiveDayProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="1 Day Programs Organized"
                    hint="2 pts each"
                    name="organizedOneDayProgram"
                    value={formData.organizedOneDayProgram}
                    onChange={handleChange}
                    disabled={locked}
                />
                <ScoreCard label="Organized Score" score={scores.organized} total={80} />
            </SectionCard>

            <SectionCard title="Ph.D. Guided (Extra)">
                <TransparencyGuideline formula={FORMULAS.phdGuided} />
                <NumericRow
                    label="Ph.D. Degrees Awarded"
                    hint="50 pts each"
                    name="phdDegreeAwarded"
                    value={formData.phdDegreeAwarded}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="Ph.D. Thesis Submitted"
                    hint="25 pts each"
                    name="phdThesisSubmitted"
                    value={formData.phdThesisSubmitted}
                    onChange={handleChange}
                    disabled={locked}
                />
                <NumericRow
                    label="Ph.D. Scholars Currently Guiding"
                    hint="10 pts each"
                    name="phdScholarsGuiding"
                    value={formData.phdScholarsGuiding}
                    onChange={handleChange}
                    disabled={locked}
                />
                <ScoreCard label="Ph.D. Guided Score" score={scores.phd} total="No limit" />
            </SectionCard>

            <SectionCard title="Score Summary">
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                        <tbody className="divide-y divide-border">
                            {verifiedScore !== undefined && (
                                <tr className="bg-muted/10">
                                    <td className="px-4 py-3 font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
                                        Verified Score
                                    </td>
                                    <td className="px-4 py-3 text-right font-black tabular-nums text-slate-900">
                                        {verifiedScore}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-muted/10 font-bold border-t-2 border-border">
                                <td className="px-4 py-4 font-black uppercase tracking-widest text-foreground text-slate-900 text-sm">
                                    Total Part C Score
                                </td>
                                <td className="px-4 py-4 text-right font-black tabular-nums text-xl text-indigo-700">
                                    {totalScore} / {maxTotal}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {submitSuccess && (
                <p className="text-xs text-center text-muted-foreground font-medium italic">
                    Changes saved successfully.
                </p>
            )}
            {submitError && (
                <p className="text-xs text-center text-destructive font-bold">{submitError}</p>
            )}

            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || locked}
                    className="min-w-[200px] shadow-sm uppercase tracking-wider text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isSubmitting ? "Saving…" : "Save Development Details"}
                </Button>
            </div>

            {showStatusModal && (
                <FormLockedModal formStatus={formStatus} onClose={() => setShowStatusModal(false)} />
            )}
        </div>
    );
}

export default PartCSelfDevelopment;
