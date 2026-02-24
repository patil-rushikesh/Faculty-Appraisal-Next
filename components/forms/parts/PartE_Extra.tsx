"use client";

import { useState, useEffect } from "react";
import axios from "axios";
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

// --- HELPERS ---
const TransparencyGuideline = ({ formula }: { formula: string }) => (
    <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-100 shadow-sm mb-5">
        <p className="text-base font-extrabold text-indigo-700 uppercase tracking-widest mb-2 opacity-90">
            Computation Guidelines
        </p>
        <p className="text-lg text-indigo-900 leading-relaxed italic font-semibold">
            {formula}
        </p>
    </div>
);

const PART_E_GUIDELINE = "Faculty may list extra-ordinary or other contributions (not listed in Parts A, B, or C) for the academic year in bulleted form. Maximum marks self-awarded: 50.";

// --- SECTION MANDATORY CONFIG ---
// Defines which sections of Part E are mandatory for form submission.
// Both fields are optional since Part E covers extra-ordinary contributions only.
const SECTION_CONFIG = [
    { name: "Contributions Description", key: "contributions" as const, mandatory: false },
    { name: "Self-Awarded Marks", key: "selfAwardedMarks" as const, mandatory: false },
];

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

    // --- LOCAL STORAGE PERSISTENCE ---
    const STORAGE_KEY = `partE_data_${userId}`;

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) setFormData(parsed);
            } catch (e) {
                console.error("Failed to parse saved Part E data", e);
            }
        }
    }, [STORAGE_KEY]);

    // Save to local storage on change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, STORAGE_KEY, isLoading]);

    // Progress Calculation
    let interactedCount = 0;
    if (formData.contributions.trim().length > 0) interactedCount++;
    if (formData.selfAwardedMarks > 0) interactedCount++;
    const progressPercent = (interactedCount / 2) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${apiBase}/${department}/${userId}/E`, { validateStatus: () => true });
                if (res.status >= 200 && res.status < 300) {
                    const data = res.data;
                    setFormData({
                        contributions: data.bullet_points ?? "",
                        selfAwardedMarks: data.total_marks ?? 0,
                    });
                    setIsFirstTime(false);
                }
                const sr = await axios.get(`${apiBase}/${department}/${userId}/get-status`, { validateStatus: () => true });
                if (sr.status >= 200 && sr.status < 300) {
                    const s = sr.data;
                    setFormStatus(s.status);
                }
            } catch (err) {
                console.error("Fetch E failed", err);
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
            const res = await axios.post(`${apiBase}/${department}/${userId}/E`, payload, {
                headers: { "Content-Type": "application/json" },
                validateStatus: () => true,
            });
            if (res.status < 200 || res.status >= 300) throw new Error("Save Failed");
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
        <div className="max-w-4xl mx-auto py-8 space-y-6 text-[1.15rem]" style={{lineHeight: 1.7}}>
            <FormProgressBar progress={progressPercent} label="Part E Completion" />

            <SectionCard title="Extraordinary Contributions">
                <TransparencyGuideline formula={PART_E_GUIDELINE} />
                <div className="space-y-5">
                    <div>
                        <label className="block text-base font-extrabold text-indigo-900 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-700" />
                            Contributions Description & Highlights (Required in Bulleted Form)
                        </label>
                        <Textarea
                            placeholder={`• Point 1: Description of contribution\n• Point 2: Description of contribution\n...\n(Max ${PART_E_MAX} points total)`}
                            value={formData.contributions}
                            disabled={locked}
                            onChange={(e) => setFormData((p) => ({ ...p, contributions: e.target.value }))}
                            rows={16}
                            className="resize-none text-lg leading-relaxed placeholder:italic placeholder:text-slate-900 focus-visible:ring-indigo-300 focus-visible:border-indigo-600 focus-visible:ring-4 font-medium text-slate-900 border-2 border-indigo-200 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-indigo-100 pt-5">
                        <div>
                            <p className="text-lg font-extrabold text-indigo-900 uppercase tracking-tight">
                                Self-Awarded Marks
                            </p>
                            <p className="text-base font-semibold text-indigo-700 uppercase tracking-wider mt-1">
                                Maximum {PART_E_MAX} points
                            </p>
                        </div>
                        <input
                            type="number"
                            min={0}
                            max={PART_E_MAX}
                            disabled={locked}
                            placeholder="Enter marks"
                            aria-label="Self-Awarded Marks for Extra Contributions"
                            onWheel={(e) => e.currentTarget.blur()}
                            value={formData.selfAwardedMarks === 0 ? "" : formData.selfAwardedMarks}
                            onChange={(e) =>
                                setFormData((p) => ({
                                    ...p,
                                    selfAwardedMarks: Math.min(PART_E_MAX, Math.max(0, Number(e.target.value))),
                                }))
                            }
                            className="w-32 rounded-lg border-2 border-indigo-300 bg-white px-4 py-2 text-xl text-right font-black tabular-nums text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-700 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm placeholder:text-xs placeholder:font-normal placeholder:text-slate-900"
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
                {/* Score After Verification — hidden until enabled by verification team */}
                <div className="hidden">
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 mt-2">
                        <span className="text-sm font-bold text-green-700 uppercase tracking-wider">Score After Verification</span>
                        <span className="text-lg font-black text-green-700 tabular-nums">Pending</span>
                    </div>
                </div>
            </SectionCard>

            {submitSuccess && (
                <p className="text-base text-center text-indigo-700 font-semibold italic">
                    Contributions saved successfully.
                </p>
            )}
            {submitError && (
                <p className="text-base text-center text-destructive font-extrabold">{submitError}</p>
            )}

            <div className="flex justify-end pt-3">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || locked}
                    aria-label="Save Contributions"
                    className="min-w-[260px] shadow-lg shadow-indigo-200 uppercase tracking-widest text-base font-black bg-indigo-700 hover:bg-indigo-800 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:transform-none"
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
