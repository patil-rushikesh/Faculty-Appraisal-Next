"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PART_B_ROLE_MAX, PART_B_SECTION_MAXES } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import SectionCard from "../shared/SectionCard";
import ScoreCard from "../shared/ScoreCard";
import MetricField from "../shared/MetricField";
import FormProgressBar from "../shared/FormProgressBar";
import FormLockedModal from "../shared/FormLockedModal";
import Loader from "@/components/loader";

// --- TYPES ---
interface MetricData {
    value: number;
    proof: string;
    verified: number | undefined;
}

interface ResearchFormData {
    journalPublications: MetricData;
    conferencePublications: MetricData;
    bookChapters: MetricData;
    books: MetricData;
    hIndex: MetricData;
    citations: MetricData;
    copyrights: MetricData;
    patentsFiled: MetricData;
    patentsGranted: MetricData;
    grantsAbove10L: MetricData;
    grants2To10L: MetricData;
    grantsBelow2L: MetricData;
    productDevelopment: MetricData;
    startups: MetricData;
    awards: MetricData;
}

interface PartBResearchProps {
    apiBase: string;
    department: string;
    userId: string;
    userDesignation: DesignationValue;
}

// --- HELPERS ---
const emptyMetric = (): MetricData => ({ value: 0, proof: "", verified: undefined });

// --- COMPONENT ---
function PartBResearch({ apiBase, department, userId, userDesignation }: PartBResearchProps) {
    const [formData, setFormData] = useState<ResearchFormData>({
        journalPublications: emptyMetric(),
        conferencePublications: emptyMetric(),
        bookChapters: emptyMetric(),
        books: emptyMetric(),
        hIndex: emptyMetric(),
        citations: emptyMetric(),
        copyrights: emptyMetric(),
        patentsFiled: emptyMetric(),
        patentsGranted: emptyMetric(),
        grantsAbove10L: emptyMetric(),
        grants2To10L: emptyMetric(),
        grantsBelow2L: emptyMetric(),
        productDevelopment: emptyMetric(),
        startups: emptyMetric(),
        awards: emptyMetric(),
    });

    const [verifiedTotalScore, setVerifiedTotalScore] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Score Calculations
    const scores = {
        pub: Math.min(
            PART_B_SECTION_MAXES.publications,
            formData.journalPublications.value * 40 +
            formData.conferencePublications.value * 20 +
            formData.bookChapters.value * 15 +
            formData.books.value * 50
        ),
        cit: Math.min(
            PART_B_SECTION_MAXES.citations,
            formData.hIndex.value * 5 + Math.floor(formData.citations.value / 20)
        ),
        ip: Math.min(
            PART_B_SECTION_MAXES.ip,
            formData.copyrights.value * 10 +
            formData.patentsFiled.value * 20 +
            formData.patentsGranted.value * 50
        ),
        grant: Math.min(
            PART_B_SECTION_MAXES.grant,
            formData.grantsAbove10L.value * 50 +
            formData.grants2To10L.value * 20 +
            formData.grantsBelow2L.value * 10
        ),
        product: Math.min(
            PART_B_SECTION_MAXES.product,
            formData.productDevelopment.value * 30 +
            formData.startups.value * 20 +
            formData.awards.value * 10
        ),
    };

    const maxTotal = PART_B_ROLE_MAX[userDesignation] ?? 300;
    const totalScore = Math.min(maxTotal, Object.values(scores).reduce((a, b) => a + b, 0));

    // Progress Calculation
    const interactedCount = Object.values(formData).filter(
        (m) => m.value > 0 || m.proof.trim().length > 0
    ).length;
    const totalFields = Object.keys(formData).length;
    const progressPercent = (interactedCount / totalFields) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiBase}/${department}/${userId}/B`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        const mapM = (i: any): MetricData => ({
                            value: i?.value ?? 0,
                            proof: i?.proof ?? "",
                            verified: i?.verifiedScore ?? undefined,
                        });
                        setFormData({
                            journalPublications: mapM(data[1]?.journalPublications),
                            conferencePublications: mapM(data[1]?.conferencePublications),
                            bookChapters: mapM(data[1]?.bookChapters),
                            books: mapM(data[1]?.books),
                            hIndex: mapM(data[2]?.hIndex),
                            citations: mapM(data[2]?.citations),
                            copyrights: mapM(data[3]?.copyrights),
                            patentsFiled: mapM(data[3]?.patentsFiled),
                            patentsGranted: mapM(data[3]?.patentsGranted),
                            grantsAbove10L: mapM(data[4]?.grantsAbove10L),
                            grants2To10L: mapM(data[4]?.grants2To10L),
                            grantsBelow2L: mapM(data[4]?.grantsBelow2L),
                            productDevelopment: mapM(data[5]?.productDevelopment),
                            startups: mapM(data[5]?.startups),
                            awards: mapM(data[5]?.awards),
                        });
                        setVerifiedTotalScore(data?.verified_total_marks);
                    }
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

    const handleValueChange = (n: keyof ResearchFormData, v: number) =>
        setFormData((p) => ({ ...p, [n]: { ...p[n], value: Math.max(0, v) } }));
    const handleProofChange = (n: keyof ResearchFormData, pf: string) =>
        setFormData((p) => ({ ...p, [n]: { ...p[n], proof: pf } }));

    const handleSubmit = async () => {
        if (formStatus !== "pending") {
            setShowStatusModal(true);
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                1: {
                    journalPublications: formData.journalPublications,
                    conferencePublications: formData.conferencePublications,
                    bookChapters: formData.bookChapters,
                    books: formData.books,
                    marks: scores.pub,
                },
                2: { hIndex: formData.hIndex, citations: formData.citations, marks: scores.cit },
                3: {
                    copyrights: formData.copyrights,
                    patentsFiled: formData.patentsFiled,
                    patentsGranted: formData.patentsGranted,
                    marks: scores.ip,
                },
                4: {
                    grantsAbove10L: formData.grantsAbove10L,
                    grants2To10L: formData.grants2To10L,
                    grantsBelow2L: formData.grantsBelow2L,
                    marks: scores.grant,
                },
                5: {
                    productDevelopment: formData.productDevelopment,
                    startups: formData.startups,
                    awards: formData.awards,
                    marks: scores.product,
                },
                total_marks: totalScore,
            };
            const res = await fetch(`${apiBase}/${department}/${userId}/B`, {
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

    if (isLoading) return <Loader message="Loading research data..." />;
    const locked = formStatus !== "pending";

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-4">
            <FormProgressBar progress={progressPercent} label="Part B Completion" />

            <SectionCard title="Publications">
                <MetricField
                    label="Journal Publications"
                    hint="40 pts each"
                    name="journalPublications"
                    value={formData.journalPublications.value}
                    onChange={(e) => handleValueChange("journalPublications", Number(e.target.value))}
                    proofValue={formData.journalPublications.proof}
                    onProofChange={(e) => handleProofChange("journalPublications", e.target.value)}
                    verifiedScore={formData.journalPublications.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Conference Publications"
                    hint="20 pts each"
                    name="conferencePublications"
                    value={formData.conferencePublications.value}
                    onChange={(e) => handleValueChange("conferencePublications", Number(e.target.value))}
                    proofValue={formData.conferencePublications.proof}
                    onProofChange={(e) => handleProofChange("conferencePublications", e.target.value)}
                    verifiedScore={formData.conferencePublications.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Book Chapters"
                    hint="15 pts each"
                    name="bookChapters"
                    value={formData.bookChapters.value}
                    onChange={(e) => handleValueChange("bookChapters", Number(e.target.value))}
                    proofValue={formData.bookChapters.proof}
                    onProofChange={(e) => handleProofChange("bookChapters", e.target.value)}
                    verifiedScore={formData.bookChapters.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Books Authored"
                    hint="50 pts each"
                    name="books"
                    value={formData.books.value}
                    onChange={(e) => handleValueChange("books", Number(e.target.value))}
                    proofValue={formData.books.proof}
                    onProofChange={(e) => handleProofChange("books", e.target.value)}
                    verifiedScore={formData.books.verified}
                    disabled={locked}
                />
                <ScoreCard label="Publications Score" score={scores.pub} total={200} />
            </SectionCard>

            <SectionCard title="Impact & Citations">
                <MetricField
                    label="H-Index"
                    hint="5 pts each"
                    name="hIndex"
                    value={formData.hIndex.value}
                    onChange={(e) => handleValueChange("hIndex", Number(e.target.value))}
                    proofValue={formData.hIndex.proof}
                    onProofChange={(e) => handleProofChange("hIndex", e.target.value)}
                    verifiedScore={formData.hIndex.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Total Citations"
                    hint="1 pt per 20 citations"
                    name="citations"
                    value={formData.citations.value}
                    onChange={(e) => handleValueChange("citations", Number(e.target.value))}
                    proofValue={formData.citations.proof}
                    onProofChange={(e) => handleProofChange("citations", e.target.value)}
                    verifiedScore={formData.citations.verified}
                    disabled={locked}
                />
                <ScoreCard label="Citations Score" score={scores.cit} total={50} />
            </SectionCard>

            <SectionCard title="Intellectual Property">
                <MetricField
                    label="Copyrights"
                    hint="10 pts each"
                    name="copyrights"
                    value={formData.copyrights.value}
                    onChange={(e) => handleValueChange("copyrights", Number(e.target.value))}
                    proofValue={formData.copyrights.proof}
                    onProofChange={(e) => handleProofChange("copyrights", e.target.value)}
                    verifiedScore={formData.copyrights.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Patents Filed"
                    hint="20 pts each"
                    name="patentsFiled"
                    value={formData.patentsFiled.value}
                    onChange={(e) => handleValueChange("patentsFiled", Number(e.target.value))}
                    proofValue={formData.patentsFiled.proof}
                    onProofChange={(e) => handleProofChange("patentsFiled", e.target.value)}
                    verifiedScore={formData.patentsFiled.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Patents Granted"
                    hint="50 pts each"
                    name="patentsGranted"
                    value={formData.patentsGranted.value}
                    onChange={(e) => handleValueChange("patentsGranted", Number(e.target.value))}
                    proofValue={formData.patentsGranted.proof}
                    onProofChange={(e) => handleProofChange("patentsGranted", e.target.value)}
                    verifiedScore={formData.patentsGranted.verified}
                    disabled={locked}
                />
                <ScoreCard label="IP Score" score={scores.ip} total={100} />
            </SectionCard>

            <SectionCard title="Grants & Funding">
                <MetricField
                    label="Grants above ₹10L"
                    hint="50 pts each"
                    name="grantsAbove10L"
                    value={formData.grantsAbove10L.value}
                    onChange={(e) => handleValueChange("grantsAbove10L", Number(e.target.value))}
                    proofValue={formData.grantsAbove10L.proof}
                    onProofChange={(e) => handleProofChange("grantsAbove10L", e.target.value)}
                    verifiedScore={formData.grantsAbove10L.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Grants ₹2L – ₹10L"
                    hint="20 pts each"
                    name="grants2To10L"
                    value={formData.grants2To10L.value}
                    onChange={(e) => handleValueChange("grants2To10L", Number(e.target.value))}
                    proofValue={formData.grants2To10L.proof}
                    onProofChange={(e) => handleProofChange("grants2To10L", e.target.value)}
                    verifiedScore={formData.grants2To10L.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Grants below ₹2L"
                    hint="10 pts each"
                    name="grantsBelow2L"
                    value={formData.grantsBelow2L.value}
                    onChange={(e) => handleValueChange("grantsBelow2L", Number(e.target.value))}
                    proofValue={formData.grantsBelow2L.proof}
                    onProofChange={(e) => handleProofChange("grantsBelow2L", e.target.value)}
                    verifiedScore={formData.grantsBelow2L.verified}
                    disabled={locked}
                />
                <ScoreCard label="Grants Score" score={scores.grant} total={100} />
            </SectionCard>

            <SectionCard title="Products & Awards">
                <MetricField
                    label="Product Development"
                    hint="30 pts each"
                    name="productDevelopment"
                    value={formData.productDevelopment.value}
                    onChange={(e) => handleValueChange("productDevelopment", Number(e.target.value))}
                    proofValue={formData.productDevelopment.proof}
                    onProofChange={(e) => handleProofChange("productDevelopment", e.target.value)}
                    verifiedScore={formData.productDevelopment.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Startups"
                    hint="20 pts each"
                    name="startups"
                    value={formData.startups.value}
                    onChange={(e) => handleValueChange("startups", Number(e.target.value))}
                    proofValue={formData.startups.proof}
                    onProofChange={(e) => handleProofChange("startups", e.target.value)}
                    verifiedScore={formData.startups.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Awards"
                    hint="10 pts each"
                    name="awards"
                    value={formData.awards.value}
                    onChange={(e) => handleValueChange("awards", Number(e.target.value))}
                    proofValue={formData.awards.proof}
                    onProofChange={(e) => handleProofChange("awards", e.target.value)}
                    verifiedScore={formData.awards.verified}
                    disabled={locked}
                />
                <ScoreCard label="Products Score" score={scores.product} total={50} />
            </SectionCard>

            <div className="rounded-xl border border-border bg-card px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Total Part B Score
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Maximum for {userDesignation}: {maxTotal}
                    </p>
                </div>
                <span className="text-2xl font-black text-indigo-700 tabular-nums">{totalScore}</span>
            </div>

            {verifiedTotalScore !== undefined && (
                <div className="rounded-xl border border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Verified Score
                    </p>
                    <span className="text-xl font-bold text-indigo-700 tabular-nums">
                        {verifiedTotalScore}
                    </span>
                </div>
            )}

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
                    disabled={isSubmitting}
                    className="min-w-[200px] shadow-sm uppercase tracking-wider text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isSubmitting ? "Saving…" : "Save Research Data"}
                </Button>
            </div>

            {showStatusModal && (
                <FormLockedModal formStatus={formStatus} onClose={() => setShowStatusModal(false)} />
            )}
        </div>
    );
}

export default PartBResearch;
