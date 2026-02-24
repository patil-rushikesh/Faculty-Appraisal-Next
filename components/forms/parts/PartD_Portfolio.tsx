"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PART_D_MAX, PART_D_SELF_MAX } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import SectionCard from "../shared/SectionCard";
import FormProgressBar from "../shared/FormProgressBar";
import FormLockedModal from "../shared/FormLockedModal";
import Loader from "@/components/loader";

// --- CONSTANTS ---
const PORTFOLIO_TYPES = ["institute", "department", "both"] as const;

// --- SECTION MANDATORY CONFIG ---
// Defines which sections of Part D are mandatory for form submission.
// Faculty must declare a portfolio type and provide self-awarded marks.
const SECTION_CONFIG = [
    { name: "Portfolio Type Selection", key: "portfolioType" as const, mandatory: true },
    { name: "Self-Awarded Marks", key: "selfAwardedMarks" as const, mandatory: true },
];

// --- TYPES ---
interface PortfolioFormData {
    portfolioType: "institute" | "department" | "both";
    selfAwardedMarks: number;
    deanMarks: number;
    hodMarks: number;
    isMarkHOD: boolean;
    isMarkDean: boolean;
    isAdministrativeRole: boolean;
    administrativeRole: string;
    adminSelfAwardedMarks: number;
    directorMarks: number;
    adminDeanMarks: number;
}

interface PartDPortfolioProps {
    apiBase: string;
    department: string;
    userId: string;
    isAdminFromDesignation: boolean;
    userDesignation: DesignationValue;
}

// --- COMPONENT ---
function PartDPortfolio({
    apiBase,
    department,
    userId,
    isAdminFromDesignation,
    userDesignation,
}: PartDPortfolioProps) {
    const [formData, setFormData] = useState<PortfolioFormData>({
        portfolioType: "both",
        selfAwardedMarks: 0,
        deanMarks: 0,
        hodMarks: 0,
        isMarkHOD: false,
        isMarkDean: false,
        isAdministrativeRole: isAdminFromDesignation,
        administrativeRole: userDesignation,
        adminSelfAwardedMarks: 0,
        directorMarks: 0,
        adminDeanMarks: 0,
    });

    const [instituteLevelPortfolio, setInstituteLevelPortfolio] = useState("");
    const [departmentLevelPortfolio, setDepartmentLevelPortfolio] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- LOCAL STORAGE PERSISTENCE ---
    const STORAGE_KEY = `partD_data_${userId}`;

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) setFormData(parsed);
            } catch (e) {
                console.error("Failed to parse saved Part D data", e);
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
        self: Math.min(
            PART_D_SELF_MAX,
            formData.isAdministrativeRole ? formData.adminSelfAwardedMarks : formData.selfAwardedMarks
        ),
        superior: formData.isAdministrativeRole
            ? formData.administrativeRole === "Associate Dean" || formData.administrativeRole === "associate_dean"
                ? formData.adminDeanMarks
                : formData.directorMarks
            : formData.portfolioType === "both"
                ? ((formData.deanMarks ?? 0) + (formData.hodMarks ?? 0)) / 2
                : formData.portfolioType === "institute"
                    ? formData.deanMarks
                    : formData.hodMarks,
    };

    const totalScore = Math.min(PART_D_MAX, scores.self + scores.superior);
    const locked = formStatus !== "pending";

    const selfMarksValue = formData.isAdministrativeRole
        ? formData.adminSelfAwardedMarks
        : formData.selfAwardedMarks;

    // Progress Calculation
    let interactedCount = 0;
    let totalFields = 0;
    if (selfMarksValue > 0) interactedCount++;
    totalFields++;

    const showInstitute =
        formData.portfolioType === "both" ||
        formData.portfolioType === "institute" ||
        formData.isAdministrativeRole;
    const showDepartment =
        formData.portfolioType === "both" ||
        formData.portfolioType === "department" ||
        formData.isAdministrativeRole;

    if (showInstitute) {
        totalFields++;
        if (instituteLevelPortfolio.trim().length > 0) interactedCount++;
    }
    if (showDepartment) {
        totalFields++;
        if (departmentLevelPortfolio.trim().length > 0) interactedCount++;
    }
    const progressPercent = totalFields > 0 ? (interactedCount / totalFields) * 100 : 0;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${apiBase}/${department}/${userId}/D`, { validateStatus: () => true });
                if (res.status >= 200 && res.status < 300) {
                    const data = res.data;
                    if (data) {
                        setFormData({
                            portfolioType: data.portfolioType ?? "both",
                            selfAwardedMarks: data.selfAwardedMarks ?? 0,
                            deanMarks: data.deanMarks ?? 0,
                            hodMarks: data.hodMarks ?? 0,
                            isMarkHOD: data.isMarkHOD ?? false,
                            isMarkDean: data.isMarkDean ?? false,
                            isAdministrativeRole: data.isAdministrativeRole ?? isAdminFromDesignation,
                            administrativeRole: data.administrativeRole ?? userDesignation,
                            adminSelfAwardedMarks: data.adminSelfAwardedMarks ?? 0,
                            directorMarks: data.directorMarks ?? 0,
                            adminDeanMarks: data.adminDeanMarks ?? 0,
                        });
                        setInstituteLevelPortfolio(data.instituteLevelPortfolio ?? "");
                        setDepartmentLevelPortfolio(data.departmentLevelPortfolio ?? "");
                        setIsFirstTime(false);
                    }
                }
                const sr = await axios.get(`${apiBase}/${department}/${userId}/get-status`, { validateStatus: () => true });
                if (sr.status >= 200 && sr.status < 300) {
                    const s = sr.data;
                    setFormStatus(s.status);
                }
            } catch (err) {
                console.error("Fetch D failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [apiBase, department, userId, isAdminFromDesignation, userDesignation]);

    const handleSubmit = async () => {
        if (locked) {
            setShowStatusModal(true);
            return;
        }
        // Validate mandatory sections before submission
        const selfMarks = formData.isAdministrativeRole ? formData.adminSelfAwardedMarks : formData.selfAwardedMarks;
        if (SECTION_CONFIG.find((s) => s.key === "selfAwardedMarks" && s.mandatory) && selfMarks <= 0) {
            setSubmitError("Please provide your Self-Awarded Marks before saving.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                D: { ...formData, instituteLevelPortfolio, departmentLevelPortfolio, marks: totalScore },
                isFirstTime,
            };
            const res = await axios.post(`${apiBase}/${department}/${userId}/D`, payload, {
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

    if (isLoading) return <Loader message="Loading portfolio data…" />;

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-6 text-[1.15rem]" style={{lineHeight: 1.7}}>
            <FormProgressBar progress={progressPercent} label="Part D Completion" />

            {!formData.isAdministrativeRole && (
                <SectionCard title="Portfolio Selection">
                    <div className="flex gap-4 mb-5">
                        {PORTFOLIO_TYPES.map((t) => (
                            <button
                                key={t}
                                disabled={locked}
                                onClick={() => setFormData((p) => ({ ...p, portfolioType: t }))}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 text-base font-extrabold uppercase tracking-wider transition-all ${formData.portfolioType === t
                                    ? "bg-indigo-700 text-white border-indigo-700 shadow-md"
                                    : "bg-white text-indigo-800 border-indigo-300 hover:border-indigo-700 hover:text-indigo-900"
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50`}
                            >
                                {t} Level
                            </button>
                        ))}
                    </div>
                </SectionCard>
            )}

            {showInstitute && (
                <SectionCard title="Institute Level Portfolio">
                    <Textarea
                        placeholder="Describe your institute level contributions..."
                        value={instituteLevelPortfolio}
                        disabled={locked}
                        onChange={(e) => setInstituteLevelPortfolio(e.target.value)}
                        rows={6}
                        className="resize-none text-lg placeholder:italic placeholder:text-muted-foreground font-medium text-slate-900 border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-300 shadow-sm"
                    />
                </SectionCard>
            )}

            {showDepartment && (
                <SectionCard title="Department Level Portfolio">
                    <Textarea
                        placeholder="Describe your department level contributions..."
                        value={departmentLevelPortfolio}
                        disabled={locked}
                        onChange={(e) => setDepartmentLevelPortfolio(e.target.value)}
                        rows={6}
                        className="resize-none text-lg placeholder:italic placeholder:text-muted-foreground font-medium text-slate-900 border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-300 shadow-sm"
                    />
                </SectionCard>
            )}

            <SectionCard title="Self Assessment">
                <div className="flex items-center justify-between py-4 px-2">
                    <div>
                        <p className="text-lg font-extrabold text-indigo-900 uppercase tracking-tight">
                            Self-Awarded Marks
                        </p>
                        <p className="text-base text-indigo-700 uppercase font-semibold mt-1">
                            Maximum {PART_D_SELF_MAX} points
                        </p>
                    </div>
                    <input
                        type="number"
                        min={0}
                        max={PART_D_SELF_MAX}
                        disabled={locked}
                        aria-label="Self-Awarded Marks"
                        onWheel={(e) => e.currentTarget.blur()}
                        value={selfMarksValue === 0 ? "" : selfMarksValue}
                        onChange={(e) => {
                            const v = Math.min(PART_D_SELF_MAX, Math.max(0, Number(e.target.value)));
                            setFormData((p) =>
                                formData.isAdministrativeRole
                                    ? { ...p, adminSelfAwardedMarks: v }
                                    : { ...p, selfAwardedMarks: v }
                            );
                        }}
                        className="w-28 rounded-lg border-2 border-indigo-300 bg-white px-4 py-2 text-lg text-right font-black tabular-nums text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-700 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm"
                    />
                </div>
            </SectionCard>

            <SectionCard title="Score Summary">
                <div className="overflow-hidden rounded-xl border-2 border-indigo-200">
                    <table className="w-full text-base">
                        <tbody className="divide-y divide-indigo-100">
                            <tr className="bg-indigo-50">
                                <td className="px-6 py-4 font-semibold uppercase tracking-widest text-base text-indigo-700">
                                    Self Evaluation
                                </td>
                                <td className="px-6 py-4 text-right font-extrabold tabular-nums text-indigo-900">
                                    {scores.self} / {PART_D_SELF_MAX}
                                </td>
                            </tr>
                            <tr className="bg-indigo-50">
                                <td className="px-6 py-4 font-semibold uppercase tracking-widest text-base text-indigo-700">
                                    Superior Evaluation
                                </td>
                                <td className="px-6 py-4 text-right font-extrabold tabular-nums text-indigo-900">
                                    {scores.superior} / {PART_D_SELF_MAX}
                                </td>
                            </tr>
                            <tr className="bg-indigo-100 font-extrabold border-t-2 border-indigo-200">
                                <td className="px-6 py-5 font-black uppercase tracking-widest text-indigo-800 text-lg">
                                    Total Portfolio Score
                                </td>
                                <td className="px-6 py-5 text-right font-black tabular-nums text-2xl text-indigo-800">
                                    {totalScore} / {PART_D_MAX}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {submitSuccess && (
                <p className="text-base text-center text-indigo-700 font-semibold italic">
                    Portfolio details saved.
                </p>
            )}
            {submitError && (
                <p className="text-base text-center text-destructive font-extrabold">{submitError}</p>
            )}

            <div className="flex justify-end pt-3">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || locked}
                    aria-label="Save Portfolio Details"
                    className="min-w-[260px] shadow-lg shadow-indigo-200 uppercase tracking-widest text-base font-black bg-indigo-700 hover:bg-indigo-800 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:transform-none"
                >
                    {isSubmitting ? "Saving..." : "Save Portfolio Details"}
                </Button>
            </div>

            {showStatusModal && (
                <FormLockedModal formStatus={formStatus} onClose={() => setShowStatusModal(false)} />
            )}
        </div>
    );
}

export default PartDPortfolio;
