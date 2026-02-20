"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PART_E_MAX } from "@/lib/forms/constants";
import SectionCard from "../shared/SectionCard";
import ScoreCard from "../shared/ScoreCard";
import FormProgressBar from "../shared/FormProgressBar";
import FormLockedModal from "../shared/FormLockedModal";
import Loader from "@/components/loader";

// --- TYPES ---
interface ExtraFormData {
    contributions: string;
    selfAwardedMarks: number;
}

interface PartEExtraProps {
    apiBase: string;
    department: string;
    userId: string;
}

// --- COMPONENT ---
function PartEExtra({ apiBase, department, userId }: PartEExtraProps) {
    const [formData, setFormData] = useState<ExtraFormData>({
        contributions: "",
        selfAwardedMarks: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Progress Calculation
    let interactedCount = 0;
    if (formData.contributions.trim().length > 0) interactedCount++;
    if (formData.selfAwardedMarks > 0) interactedCount++;
    const progressPercent = (interactedCount / 2) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiBase}/${department}/${userId}/E`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        contributions: data.bullet_points ?? "",
                        selfAwardedMarks: data.total_marks ?? 0,
                    });
                    setIsFirstTime(false);
                }
                const sr = await fetch(`${apiBase}/${department}/${userId}/get-status`);
                if (sr.ok) {
                    const s = await sr.json();
                    setFormStatus(s.status);
                }
            } catch {
                /* silent */
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [apiBase, department, userId]);

    const handleSubmit = async () => {
        if (formStatus !== "pending") {
            setShowStatusModal(true);
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                E: { total_marks: formData.selfAwardedMarks, bullet_points: formData.contributions },
                isFirstTime,
            };
            const res = await fetch(`${apiBase}/${department}/${userId}/E`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Save Failed");
            setIsFirstTime(false);
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loader message="Loading contributions…" />;
    const locked = formStatus !== "pending";

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-4">
            <FormProgressBar progress={progressPercent} label="Part E Completion" />

            <SectionCard title="Extraordinary Contributions">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                            Contributions Description & Highlights
                        </label>
                        <Textarea
                            placeholder={`Describe any contributions not covered in Parts A–D (Max ${PART_E_MAX} points)...`}
                            value={formData.contributions}
                            disabled={locked}
                            onChange={(e) => setFormData((p) => ({ ...p, contributions: e.target.value }))}
                            rows={10}
                            className="resize-none text-sm leading-relaxed placeholder:italic focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600"
                        />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-border pt-4">
                        <div>
                            <p className="text-sm font-medium text-indigo-700 uppercase tracking-tight">
                                Self-Awarded Marks
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Maximum {PART_E_MAX} points
                            </p>
                        </div>
                        <input
                            type="number"
                            min={0}
                            max={PART_E_MAX}
                            disabled={locked}
                            onWheel={(e) => e.currentTarget.blur()}
                            value={formData.selfAwardedMarks === 0 ? "" : formData.selfAwardedMarks}
                            onChange={(e) =>
                                setFormData((p) => ({
                                    ...p,
                                    selfAwardedMarks: Math.min(PART_E_MAX, Math.max(0, Number(e.target.value))),
                                }))
                            }
                            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Score Summary">
                <ScoreCard
                    label="Extra Contributions Score"
                    score={formData.selfAwardedMarks}
                    total={PART_E_MAX}
                />
            </SectionCard>

            {submitSuccess && (
                <p className="text-xs text-center text-muted-foreground font-medium italic mt-2">
                    Contributions saved successfully.
                </p>
            )}
            {submitError && (
                <p className="text-xs text-center text-destructive font-bold mt-2">{submitError}</p>
            )}

            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || locked}
                    className="min-w-[220px] shadow-sm uppercase tracking-wider text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isSubmitting ? "Saving…" : "Save Contributions"}
                </Button>
            </div>

            {showStatusModal && (
                <FormLockedModal formStatus={formStatus} onClose={() => setShowStatusModal(false)} />
            )}
        </div>
    );
}

export default PartEExtra;
