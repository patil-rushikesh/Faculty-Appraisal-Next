"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import {
    Save,
    CheckSquare,
    AlertCircle,
    ArrowLeft,
    ChevronRight,
    Calculator,
    MessageSquare,
    User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/loader";
import SectionCard from "../forms/shared/SectionCard";
import MetricField from "../forms/shared/MetricField";
import ScoreCard from "../forms/shared/ScoreCard";
import { PART_B_WEIGHTS } from "@/lib/forms/constants";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

// --- DEFAULTS ---
const SECTION_LIMITS = {
    bookChapters: 150,
    books: 200,
    citations: 50,
    copyrightIndividual: 30,
    patentIndividual: 100,
    trainingPrograms: 40,
    nonResearchGrants: 40,
    productDevelopment: 100,
    awardsAndFellowships: 50,
};

const CADRE_LIMITS = {
    "Professor": 370,
    "Associate Professor": 300,
    "Assistant Professor": 210,
    "default": 210,
};

// --- TYPES ---
interface MetricMarks {
    marks: number;
}

interface VerifiedScores {
    [key: string]: MetricMarks;
}

interface FacultyData {
    id: string;
    name: string;
    role: string;
    department: string;
    partB?: any;
}

export default function VerificationForm() {
    const params = useParams();
    const router = useRouter();
    const facultyId = params.facultyId as string;
    const department = params.department as string;

    const [faculty, setFaculty] = useState<FacultyData | null>(null);
    const [originalData, setOriginalData] = useState<any>(null);
    const [verifiedScores, setVerifiedScores] = useState<VerifiedScores>({});
    const [remarks, setRemarks] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch faculty data and their appraisal
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [userResp, appraisalResp] = await Promise.all([
                axios.get(`${BACKEND}/users/${facultyId}`, { withCredentials: true }),
                axios.get(`${BACKEND}/appraisal/${facultyId}`, { withCredentials: true })
            ]);

            const userData = userResp.data;
            const appraisal = appraisalResp.data?.data;

            setFaculty({
                id: userData.id,
                name: userData.name,
                role: userData.role,
                department: userData.department,
            });

            setOriginalData(appraisal?.partB || {});
            setRemarks(appraisal?.partB?.verificationRemarks || "");

            // Map existing verified marks if any
            const existing: VerifiedScores = {};
            // This mapping depends on backend schema, assume flat structure for now or map correctly
            // Logic to populate verifiedScores from appraisal.partB...
            setVerifiedScores({});
        } catch (err: any) {
            setError("Failed to load data for verification");
        } finally {
            setLoading(false);
        }
    }, [facultyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleScoreChange = (key: string, val: number) => {
        setVerifiedScores(prev => ({
            ...prev,
            [key]: { marks: val }
        }));
    };

    const sections = useMemo(() => [
        {
            id: "journal",
            title: "1. Journal Publications",
            metrics: [
                { label: mProps("sci", "SCI Journal Papers"), name: "sci", weight: 100, original: originalData?.journal?.sci },
                { label: mProps("esci", "ESCI Journal Papers"), name: "esci", weight: 50, original: originalData?.journal?.esci },
                { label: mProps("scopus", "Scopus Journal Papers"), name: mProps("scopus", "scopus"), weight: 50, original: originalData?.journal?.scopus },
                { label: mProps("ugc", "UGC CARE Journal Papers"), name: "ugc", weight: 10, original: originalData?.journal?.ugc },
                { label: mProps("other", "Other Journal Papers"), name: "other", weight: 5, original: originalData?.journal?.other },
            ]
        },
        {
            id: "conference",
            title: "2. Conference Publications",
            metrics: [
                { label: "Scopus/WoS Conference", name: "confScopus", weight: 20, original: originalData?.conference?.scopus },
                { label: "Other Conference", name: mProps("confOther", "confOther"), weight: 10, original: originalData?.conference?.other },
            ]
        },
        {
            id: "bookChapters",
            title: "3. Book Chapters",
            metrics: [
                { label: "Scopus/WoS Book Chapter", name: "bcScopus", weight: 20, original: originalData?.bookChapter?.scopus },
                { label: "Other Book Chapter", name: "bcOther", weight: 10, original: originalData?.bookChapter?.other },
            ],
            limit: SECTION_LIMITS.bookChapters
        },
        {
            id: "patent",
            title: "4. Patents (Individual)",
            metrics: [
                { label: "Patent Registered", name: "patReg", weight: 10, original: originalData?.patentIndiv?.registered },
                { label: "Patent Published", name: "patPub", weight: 20, original: originalData?.patentIndiv?.published },
                { label: "Patent Granted", name: "patGrant", weight: 50, original: originalData?.patentIndiv?.granted },
            ],
            limit: SECTION_LIMITS.patentIndividual
        }
    ], [originalData, verifiedScores]);

    // Simple helper to avoid TS errors on dynamic keys
    function mProps(k: string, d: string) { return d; }

    // Calculation logic
    const results = useMemo(() => {
        let totalUnfiltered = 0;
        const sectionScores: Record<string, number> = {};

        sections.forEach(sec => {
            let secSum = sec.metrics.reduce((a, b: any) => a + (verifiedScores[b.name]?.marks || 0), 0);
            if (sec.limit) {
                secSum = Math.min(sec.limit, secSum);
            }
            sectionScores[sec.id] = secSum;
            totalUnfiltered += secSum;
        });

        const limit = (faculty?.role && (CADRE_LIMITS as any)[faculty.role]) || CADRE_LIMITS.default;
        const finalTotal = Math.min(limit, totalUnfiltered);

        return { sectionScores, totalUnfiltered, finalTotal, limit };
    }, [verifiedScores, faculty?.role, sections]);

    const handleSave = async (isFinal = false) => {
        setSaving(true);
        try {
            const payload = {
                verifiedScores,
                verificationRemarks: remarks,
                totalVerified: results.finalTotal,
                isApproved: isFinal
            };
            await axios.put(`${BACKEND}/appraisal/${facultyId}/verify/part-b`, payload, { withCredentials: true });
            router.push("/verification-team/dashboard");
        } catch (err) {
            alert("Failed to save verification");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader message="Preparing verification environment..." />;

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 space-y-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                    <Button variant="outline" onClick={() => router.back()} className="rounded-xl h-12 w-12 p-0 border-2">
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            Verify <span className="text-indigo-600">Contributions</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                            <span className="flex items-center gap-1"><UserIcon size={14} /> {faculty?.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>{faculty?.role}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>{department}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-5 py-3 text-right">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Total Verified</p>
                        <p className="text-3xl font-black text-emerald-700 leading-none flex items-baseline gap-1">
                            {results.finalTotal}
                            <span className="text-sm text-emerald-500/60 font-black">/ {results.limit}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Form Sections */}
            <div className="space-y-8 pb-32">
                {sections.map(sec => (
                    <SectionCard key={sec.id} title={sec.title}>
                        <div className="divide-y divide-slate-100">
                            {sec.metrics.map(m => (
                                <MetricField
                                    key={m.name}
                                    label={m.label}
                                    name={m.name}
                                    value={m.original?.value || 0}
                                    onChange={(e) => handleScoreChange(m.name, Number(e.target.value))}
                                    proofValue={m.original?.proof || ""}
                                    onProofChange={() => { }}
                                    verifiedScore={verifiedScores[m.name]?.marks}
                                    isVerificationMode={true}
                                    hint={`Weight: ${m.weight} per unit | Claimed: ${m.original?.value || 0}`}
                                />
                            ))}
                        </div>
                        {sec.limit && (
                            <div className="mt-6 p-5 bg-indigo-50/50 rounded-2xl flex items-center justify-between border-2 border-indigo-100/50 group hover:border-indigo-200 transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                                        <Calculator size={16} />
                                    </div>
                                    <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Section Total / Max Limit</span>
                                </div>
                                <span className="text-xl font-black text-indigo-700">
                                    {results.sectionScores[sec.id]} <span className="text-sm text-indigo-400">/ {sec.limit}</span>
                                </span>
                            </div>
                        )}
                    </SectionCard>
                ))}

                {/* Final Remarks & Action Bar */}
                <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 border-4 border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="text-indigo-400" size={20} />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Verifier Remarks</h2>
                        </div>
                        <Textarea
                            placeholder="Provide feedback or justification for mark adjustments..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white font-medium text-lg min-h-[120px] focus:ring-indigo-500 rounded-2xl p-6"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-800">
                        <div className="flex-1 flex flex-col justify-center">
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Calculated Total</p>
                            <p className="text-2xl font-black text-white leading-none">
                                {results.totalUnfiltered} <span className="text-slate-500 text-sm font-bold">(Unfiltered)</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                variant="outline"
                                className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-bold uppercase tracking-wider h-14 px-8 rounded-2xl border-2"
                            >
                                Save Draft
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider h-14 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 gap-2"
                            >
                                <CheckSquare size={20} />
                                Finalize Verification
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
