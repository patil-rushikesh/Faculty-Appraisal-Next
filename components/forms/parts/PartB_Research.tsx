"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PART_B_ROLE_MAX, PART_B_SECTION_MAXES, PART_B_WEIGHTS } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import SectionCard from "../shared/SectionCard";
import ScoreCard from "../shared/ScoreCard";
import MetricField from "../shared/MetricField";
import FormProgressBar from "../shared/FormProgressBar";
import FormLockedModal from "../shared/FormLockedModal";
import Loader from "@/components/loader";

// --- CONSTANTS ---
const FORMULAS = {
    journal: "Marks: SCI=100, ESCI=50, Scopus=50, UGC=10, Other=5 (No limit)",
    conference: "Marks: Scopus/WoS=30, Other=5 (Max 180)",
    bookChapter: "Marks: Scopus/WoS=30, Other=5 (Max 150)",
    bookAuthored: "Marks: Intl Indexed=100, Intl/Natl Non-Indexed=30, Local=10 (Max 200)",
    citations: "Marks: WoS/Scopus=1 pt/citation, Scholar=0.33 pt/citation (Max 50)",
    copyrightIndiv: "Marks: Registered=5, Granted=15 (Max 30)",
    copyrightInst: "Marks: Registered=10, Granted=30 (No limit)",
    patentIndiv: "Marks: Reg=15, Pub=30, Granted=50, Comm=100 (Max 100)",
    patentInst: "Marks: Reg=30, Pub=60, Granted=100, Comm=200 (No limit)",
    grantsResearch: "Marks: 10 per 2 Lakh (No limit)",
    revenueTraining: "Marks: 5 per 10k (Max 40)",
    grantsNonResearch: "Marks: 5 per 10k (Max 40)",
    product: "Marks: Comm=100, Developed=40, POC=10 (Max 100)",
    startup: "Marks: Rev>50k=100, Fund>5L=100, Prod=40, POC=10, Reg=5 (No limit)",
    award: "Marks: Intl=30, Govt=20, Natl=5, Intl Fel=50, Natl Fel=30 (Max 50)",
    interaction: "Marks: MoU=10, Collab=20 (No limit)",
    placement: "Marks: Offer=10 (No limit)",
};

// --- TYPES ---
interface MetricData {
    value: number;
    proof: string;
    verified: number | undefined;
}

interface ResearchFormData {
    journal: { sci: MetricData; esci: MetricData; scopus: MetricData; ugc: MetricData; other: MetricData };
    conference: { scopus: MetricData; other: MetricData };
    bookChapter: { scopus: MetricData; other: MetricData };
    books: { intlIn: MetricData; intlNatl: MetricData; local: MetricData };
    citations: { wos: MetricData; scopus: MetricData; scholar: MetricData };
    copyrightIndiv: { registered: MetricData; granted: MetricData };
    copyrightInst: { registered: MetricData; granted: MetricData };
    patentIndiv: { registered: MetricData; published: MetricData; granted: MetricData; commercialized: MetricData };
    patentInst: { registered: MetricData; published: MetricData; granted: MetricData; commercialized: MetricData };
    grantResearch: { amount: MetricData };
    revenueTraining: { amount: MetricData };
    grantNonResearch: { amount: MetricData };
    product: { commercialized: MetricData; developed: MetricData; poc: MetricData };
    startup: { rev50k: MetricData; fund5L: MetricData; product: MetricData; poc: MetricData; registered: MetricData };
    award: { intl: MetricData; govt: MetricData; national: MetricData; intlFellow: MetricData; natlFellow: MetricData };
    interaction: { mou: MetricData; collab: MetricData };
    placement: { offer: MetricData };
}

interface PartBResearchProps {
    apiBase: string;
    department: string;
    userId: string;
    userDesignation: DesignationValue;
}

// --- HELPERS ---
const emptyMetric = (): MetricData => ({ value: 0, proof: "", verified: undefined });

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

const DriveLinkNote = () => (
    <div className="p-2.5 mb-4 rounded-lg bg-indigo-50/80 border border-indigo-100 shadow-sm flex items-start gap-3">
        <div className="bg-indigo-100 p-1.5 rounded text-indigo-700 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        </div>
        <p className="text-[10px] text-indigo-900 leading-relaxed font-medium">
            <span className="font-bold uppercase tracking-tight text-indigo-700 block mb-0.5">Drive Link Instructions</span>
            If you have multiple documents (e.g. 4 entries), please upload them all to a <span className="underline decoration-indigo-300 font-bold">single Google Drive folder</span> and paste that folder link in the proof fields below. Ensure link access is set to <span className="italic">"Anyone with the link"</span>.
        </p>
    </div>
);


// --- COMPONENT ---
function PartBResearch({ apiBase, department, userId, userDesignation }: PartBResearchProps) {
    const [formData, setFormData] = useState<ResearchFormData>({
        journal: { sci: emptyMetric(), esci: emptyMetric(), scopus: emptyMetric(), ugc: emptyMetric(), other: emptyMetric() },
        conference: { scopus: emptyMetric(), other: emptyMetric() },
        bookChapter: { scopus: emptyMetric(), other: emptyMetric() },
        books: { intlIn: emptyMetric(), intlNatl: emptyMetric(), local: emptyMetric() },
        citations: { wos: emptyMetric(), scopus: emptyMetric(), scholar: emptyMetric() },
        copyrightIndiv: { registered: emptyMetric(), granted: emptyMetric() },
        copyrightInst: { registered: emptyMetric(), granted: emptyMetric() },
        patentIndiv: { registered: emptyMetric(), published: emptyMetric(), granted: emptyMetric(), commercialized: emptyMetric() },
        patentInst: { registered: emptyMetric(), published: emptyMetric(), granted: emptyMetric(), commercialized: emptyMetric() },
        grantResearch: { amount: emptyMetric() },
        revenueTraining: { amount: emptyMetric() },
        grantNonResearch: { amount: emptyMetric() },
        product: { commercialized: emptyMetric(), developed: emptyMetric(), poc: emptyMetric() },
        startup: { rev50k: emptyMetric(), fund5L: emptyMetric(), product: emptyMetric(), poc: emptyMetric(), registered: emptyMetric() },
        award: { intl: emptyMetric(), govt: emptyMetric(), national: emptyMetric(), intlFellow: emptyMetric(), natlFellow: emptyMetric() },
        interaction: { mou: emptyMetric(), collab: emptyMetric() },
        placement: { offer: emptyMetric() },
    });

    const [verifiedTotalScore, setVerifiedTotalScore] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- LOCAL STORAGE PERSISTENCE ---
    const STORAGE_KEY = `partB_data_${userId}`;

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) setFormData(parsed);
            } catch (e) {
                console.error("Failed to parse saved Part B data", e);
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
        journal: Math.min(PART_B_SECTION_MAXES.qualityJournal,
            formData.journal.sci.value * PART_B_WEIGHTS.journal.sci +
            formData.journal.esci.value * PART_B_WEIGHTS.journal.esci +
            formData.journal.scopus.value * PART_B_WEIGHTS.journal.scopus +
            formData.journal.ugc.value * PART_B_WEIGHTS.journal.ugc +
            formData.journal.other.value * PART_B_WEIGHTS.journal.other
        ),
        conference: Math.min(PART_B_SECTION_MAXES.conference,
            formData.conference.scopus.value * PART_B_WEIGHTS.conference.scopus +
            formData.conference.other.value * PART_B_WEIGHTS.conference.other
        ),
        bookChapter: Math.min(PART_B_SECTION_MAXES.bookChapter,
            formData.bookChapter.scopus.value * PART_B_WEIGHTS.bookChapter.scopus +
            formData.bookChapter.other.value * PART_B_WEIGHTS.bookChapter.other
        ),
        books: Math.min(PART_B_SECTION_MAXES.bookAuthored,
            formData.books.intlIn.value * PART_B_WEIGHTS.bookAuthored.intlIndexed +
            formData.books.intlNatl.value * PART_B_WEIGHTS.bookAuthored.intlNatlNonIndexed +
            formData.books.local.value * PART_B_WEIGHTS.bookAuthored.local
        ),
        citations: Math.min(PART_B_SECTION_MAXES.citations,
            formData.citations.wos.value * PART_B_WEIGHTS.citations.wos +
            formData.citations.scopus.value * PART_B_WEIGHTS.citations.scopus +
            formData.citations.scholar.value * PART_B_WEIGHTS.citations.scholar
        ),
        copyrightIndiv: Math.min(PART_B_SECTION_MAXES.copyrightIndiv,
            formData.copyrightIndiv.registered.value * PART_B_WEIGHTS.copyrightIndiv.registered +
            formData.copyrightIndiv.granted.value * PART_B_WEIGHTS.copyrightIndiv.granted
        ),
        copyrightInst: Math.min(PART_B_SECTION_MAXES.copyrightInst,
            formData.copyrightInst.registered.value * PART_B_WEIGHTS.copyrightInst.registered +
            formData.copyrightInst.granted.value * PART_B_WEIGHTS.copyrightInst.granted
        ),
        patentIndiv: Math.min(PART_B_SECTION_MAXES.patentIndiv,
            formData.patentIndiv.registered.value * PART_B_WEIGHTS.patentIndiv.registered +
            formData.patentIndiv.published.value * PART_B_WEIGHTS.patentIndiv.published +
            formData.patentIndiv.granted.value * PART_B_WEIGHTS.patentIndiv.granted +
            formData.patentIndiv.commercialized.value * PART_B_WEIGHTS.patentIndiv.commercialized
        ),
        patentInst: Math.min(PART_B_SECTION_MAXES.patentInst,
            formData.patentInst.registered.value * PART_B_WEIGHTS.patentInst.registered +
            formData.patentInst.published.value * PART_B_WEIGHTS.patentInst.published +
            formData.patentInst.granted.value * PART_B_WEIGHTS.patentInst.granted +
            formData.patentInst.commercialized.value * PART_B_WEIGHTS.patentInst.commercialized
        ),
        grantResearch: Math.min(PART_B_SECTION_MAXES.grantsResearch,
            formData.grantResearch.amount.value * PART_B_WEIGHTS.grantsResearch
        ),
        revenueTraining: Math.min(PART_B_SECTION_MAXES.revenueTraining,
            formData.revenueTraining.amount.value * PART_B_WEIGHTS.revenueTraining
        ),
        grantNonResearch: Math.min(PART_B_SECTION_MAXES.grantsNonResearch,
            formData.grantNonResearch.amount.value * PART_B_WEIGHTS.grantsNonResearch
        ),
        product: Math.min(PART_B_SECTION_MAXES.product,
            formData.product.commercialized.value * PART_B_WEIGHTS.product.commercialized +
            formData.product.developed.value * PART_B_WEIGHTS.product.developed +
            formData.product.poc.value * PART_B_WEIGHTS.product.poc
        ),
        startup: Math.min(PART_B_SECTION_MAXES.startup,
            formData.startup.rev50k.value * PART_B_WEIGHTS.startup.rev50k +
            formData.startup.fund5L.value * PART_B_WEIGHTS.startup.fund5L +
            formData.startup.product.value * PART_B_WEIGHTS.startup.product +
            formData.startup.poc.value * PART_B_WEIGHTS.startup.poc +
            formData.startup.registered.value * PART_B_WEIGHTS.startup.registered
        ),
        award: Math.min(PART_B_SECTION_MAXES.award,
            formData.award.intl.value * PART_B_WEIGHTS.award.intl +
            formData.award.govt.value * PART_B_WEIGHTS.award.govt +
            formData.award.national.value * PART_B_WEIGHTS.award.national +
            formData.award.intlFellow.value * PART_B_WEIGHTS.award.intlFellow +
            formData.award.natlFellow.value * PART_B_WEIGHTS.award.natlFellow
        ),
        interaction: Math.min(PART_B_SECTION_MAXES.interaction,
            formData.interaction.mou.value * PART_B_WEIGHTS.interaction.mou +
            formData.interaction.collab.value * PART_B_WEIGHTS.interaction.collab
        ),
        placement: Math.min(PART_B_SECTION_MAXES.placement,
            formData.placement.offer.value * PART_B_WEIGHTS.placement.offer
        ),
    };

    const maxTotal = PART_B_ROLE_MAX[userDesignation] ?? 300;
    const totalScore = Math.min(maxTotal, Object.values(scores).reduce((a, b) => a + b, 0));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiBase}/${department}/${userId}/B`);
                if (res.ok) {
                    const d = await res.json();
                    if (d) {
                        const m = (sec: number, field: string): MetricData => ({
                            value: d[sec]?.[field]?.value ?? 0,
                            proof: d[sec]?.[field]?.proof ?? "",
                            verified: d[sec]?.[field]?.verifiedScore ?? undefined,
                        });
                        setFormData({
                            journal: { sci: m(1, "sci"), esci: m(1, "esci"), scopus: m(1, "scopus"), ugc: m(1, "ugc"), other: m(1, "other") },
                            conference: { scopus: m(2, "scopus"), other: m(2, "other") },
                            bookChapter: { scopus: m(3, "scopus"), other: m(3, "other") },
                            books: { intlIn: m(4, "intlIn"), intlNatl: m(4, "intlNatl"), local: m(4, "local") },
                            citations: { wos: m(5, "wos"), scopus: m(5, "scopus"), scholar: m(5, "scholar") },
                            copyrightIndiv: { registered: m(6, "registered"), granted: m(6, "granted") },
                            copyrightInst: { registered: m(7, "registered"), granted: m(7, "granted") },
                            patentIndiv: { registered: m(8, "registered"), published: m(8, "published"), granted: m(8, "granted"), commercialized: m(8, "commercialized") },
                            patentInst: { registered: m(9, "registered"), published: m(9, "published"), granted: m(9, "granted"), commercialized: m(9, "commercialized") },
                            grantResearch: { amount: m(10, "amount") },
                            revenueTraining: { amount: m(11, "amount") },
                            grantNonResearch: { amount: m(12, "amount") },
                            product: { commercialized: m(13, "commercialized"), developed: m(13, "developed"), poc: m(13, "poc") },
                            startup: { rev50k: m(14, "rev50k"), fund5L: m(14, "fund5L"), product: m(14, "product"), poc: m(14, "poc"), registered: m(14, "registered") },
                            award: { intl: m(15, "intl"), govt: m(15, "govt"), national: m(15, "national"), intlFellow: m(15, "intlFellow"), natlFellow: m(15, "natlFellow") },
                            interaction: { mou: m(16, "mou"), collab: m(16, "collab") },
                            placement: { offer: m(17, "offer") },
                        });
                        setVerifiedTotalScore(d?.verified_total_marks);
                    }
                }
                const sr = await fetch(`${apiBase}/${department}/${userId}/get-status`);
                if (sr.ok) {
                    const s = await sr.json();
                    setFormStatus(s.status);
                }
            } catch (err) {
                console.error("Fetch B failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [apiBase, department, userId]);

    const updateField = (section: keyof ResearchFormData, field: string, updates: Partial<MetricData>) => {
        setFormData(prev => {
            const secData = prev[section] as any;
            const fieldData = secData[field] as MetricData;
            return {
                ...prev,
                [section]: {
                    ...secData,
                    [field]: { ...fieldData, ...updates }
                }
            };
        });
    };

    const handleSubmit = async () => {
        if (formStatus !== "pending") {
            setShowStatusModal(true);
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                1: { ...formData.journal, marks: scores.journal },
                2: { ...formData.conference, marks: scores.conference },
                3: { ...formData.bookChapter, marks: scores.bookChapter },
                4: { ...formData.books, marks: scores.books },
                5: { ...formData.citations, marks: scores.citations },
                6: { ...formData.copyrightIndiv, marks: scores.copyrightIndiv },
                7: { ...formData.copyrightInst, marks: scores.copyrightInst },
                8: { ...formData.patentIndiv, marks: scores.patentIndiv },
                9: { ...formData.patentInst, marks: scores.patentInst },
                10: { ...formData.grantResearch, marks: scores.grantResearch },
                11: { ...formData.revenueTraining, marks: scores.revenueTraining },
                12: { ...formData.grantNonResearch, marks: scores.grantNonResearch },
                13: { ...formData.product, marks: scores.product },
                14: { ...formData.startup, marks: scores.startup },
                15: { ...formData.award, marks: scores.award },
                16: { ...formData.interaction, marks: scores.interaction },
                17: { ...formData.placement, marks: scores.placement },
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

    // Progress Calculation
    const interactedCount = Object.values(formData).reduce((acc, sec) => {
        return acc + Object.values(sec).filter((m: any) => (m.value && m.value > 0) || (m.proof && m.proof.trim().length > 0)).length;
    }, 0);
    const totalFields = Object.values(formData).reduce((acc, sec) => acc + Object.keys(sec).length, 0);
    const progressPercent = (interactedCount / totalFields) * 100;

    if (isLoading) return <Loader message="Loading research data..." />;
    const locked = formStatus !== "pending";

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-4 font-sans text-slate-900">
            <FormProgressBar progress={progressPercent} label="Part B Completion" />

            <SectionCard title="1. Papers Published in Quality Journal (Being among First Two Authors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.journal} />
                <MetricField
                    label="SCI/SCIE Journal (WoS) Papers (100 marks per paper)"
                    name="journal.sci"
                    value={formData.journal.sci.value}
                    onChange={(e) => updateField("journal", "sci", { value: Number(e.target.value) })}
                    proofValue={formData.journal.sci.proof}
                    onProofChange={(e) => updateField("journal", "sci", { proof: e.target.value })}
                    verifiedScore={formData.journal.sci.verified}
                    disabled={locked}
                />
                <MetricField
                    label="ESCI Journal (WoS) Papers (50 marks per paper)"
                    name="journal.esci"
                    value={formData.journal.esci.value}
                    onChange={(e) => updateField("journal", "esci", { value: Number(e.target.value) })}
                    proofValue={formData.journal.esci.proof}
                    onProofChange={(e) => updateField("journal", "esci", { proof: e.target.value })}
                    verifiedScore={formData.journal.esci.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Scopus Journal Papers (50 marks per paper)"
                    name="journal.scopus"
                    value={formData.journal.scopus.value}
                    onChange={(e) => updateField("journal", "scopus", { value: Number(e.target.value) })}
                    proofValue={formData.journal.scopus.proof}
                    onProofChange={(e) => updateField("journal", "scopus", { proof: e.target.value })}
                    verifiedScore={formData.journal.scopus.verified}
                    disabled={locked}
                />
                <MetricField
                    label="UGC CARE Listed Journal Papers (10 marks per paper)"
                    name="journal.ugc"
                    value={formData.journal.ugc.value}
                    onChange={(e) => updateField("journal", "ugc", { value: Number(e.target.value) })}
                    proofValue={formData.journal.ugc.proof}
                    onProofChange={(e) => updateField("journal", "ugc", { proof: e.target.value })}
                    verifiedScore={formData.journal.ugc.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Other Journal Papers (5 marks per paper)"
                    name="journal.other"
                    value={formData.journal.other.value}
                    onChange={(e) => updateField("journal", "other", { value: Number(e.target.value) })}
                    proofValue={formData.journal.other.proof}
                    onProofChange={(e) => updateField("journal", "other", { proof: e.target.value })}
                    verifiedScore={formData.journal.other.verified}
                    disabled={locked}
                />
                <ScoreCard label="Quality Journal Papers Score" score={scores.journal} total="No limit" />
            </SectionCard>

            <SectionCard title="2. Paper Publication in International Conference (Being among First Two Authors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.conference} />
                <MetricField
                    label="Papers Indexed in Scopus/WoS (30 marks per paper)"
                    name="conference.scopus"
                    value={formData.conference.scopus.value}
                    onChange={(e) => updateField("conference", "scopus", { value: Number(e.target.value) })}
                    proofValue={formData.conference.scopus.proof}
                    onProofChange={(e) => updateField("conference", "scopus", { proof: e.target.value })}
                    verifiedScore={formData.conference.scopus.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Other Conference Papers (5 marks per paper)"
                    name="conference.other"
                    value={formData.conference.other.value}
                    onChange={(e) => updateField("conference", "other", { value: Number(e.target.value) })}
                    proofValue={formData.conference.other.proof}
                    onProofChange={(e) => updateField("conference", "other", { proof: e.target.value })}
                    verifiedScore={formData.conference.other.verified}
                    disabled={locked}
                />
                <ScoreCard label="Conference Papers Score" score={scores.conference} total={180} />
            </SectionCard>

            <SectionCard title="3. Book Chapter Publication (Being among First Two Authors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.bookChapter} />
                <MetricField
                    label="Book Chapters Indexed in Scopus/WoS (30 marks per chapter)"
                    name="bookChapter.scopus"
                    value={formData.bookChapter.scopus.value}
                    onChange={(e) => updateField("bookChapter", "scopus", { value: Number(e.target.value) })}
                    proofValue={formData.bookChapter.scopus.proof}
                    onProofChange={(e) => updateField("bookChapter", "scopus", { proof: e.target.value })}
                    verifiedScore={formData.bookChapter.scopus.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Other Book Chapters (5 marks per chapter)"
                    name="bookChapter.other"
                    value={formData.bookChapter.other.value}
                    onChange={(e) => updateField("bookChapter", "other", { value: Number(e.target.value) })}
                    proofValue={formData.bookChapter.other.proof}
                    onProofChange={(e) => updateField("bookChapter", "other", { proof: e.target.value })}
                    verifiedScore={formData.bookChapter.other.verified}
                    disabled={locked}
                />
                <ScoreCard label="Book Chapters Score" score={scores.bookChapter} total={150} />
            </SectionCard>

            <SectionCard title="4. Book Publication (as Author)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.bookAuthored} />
                <MetricField
                    label="Books Published with International Publisher and Indexed in Scopus/WoS (100 marks per book)"
                    name="books.intlIn"
                    value={formData.books.intlIn.value}
                    onChange={(e) => updateField("books", "intlIn", { value: Number(e.target.value) })}
                    proofValue={formData.books.intlIn.proof}
                    onProofChange={(e) => updateField("books", "intlIn", { proof: e.target.value })}
                    verifiedScore={formData.books.intlIn.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Books Published with International/National Publisher (non-indexed) (30 marks per book)"
                    name="books.intlNatl"
                    value={formData.books.intlNatl.value}
                    onChange={(e) => updateField("books", "intlNatl", { value: Number(e.target.value) })}
                    proofValue={formData.books.intlNatl.proof}
                    onProofChange={(e) => updateField("books", "intlNatl", { proof: e.target.value })}
                    verifiedScore={formData.books.intlNatl.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Books Published with Local Publisher (10 marks per book)"
                    name="books.local"
                    value={formData.books.local.value}
                    onChange={(e) => updateField("books", "local", { value: Number(e.target.value) })}
                    proofValue={formData.books.local.proof}
                    onProofChange={(e) => updateField("books", "local", { proof: e.target.value })}
                    verifiedScore={formData.books.local.verified}
                    disabled={locked}
                />
                <ScoreCard label="Books Score" score={scores.books} total={200} />
            </SectionCard>

            <SectionCard title="5. Last three Years Citations">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.citations} />
                <MetricField
                    label="Web of Science Citations (3 marks per 3 citations)"
                    name="citations.wos"
                    value={formData.citations.wos.value}
                    onChange={(e) => updateField("citations", "wos", { value: Number(e.target.value) })}
                    proofValue={formData.citations.wos.proof}
                    onProofChange={(e) => updateField("citations", "wos", { proof: e.target.value })}
                    verifiedScore={formData.citations.wos.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Scopus Citations (3 marks per 3 citations)"
                    name="citations.scopus"
                    value={formData.citations.scopus.value}
                    onChange={(e) => updateField("citations", "scopus", { value: Number(e.target.value) })}
                    proofValue={formData.citations.scopus.proof}
                    onProofChange={(e) => updateField("citations", "scopus", { proof: e.target.value })}
                    verifiedScore={formData.citations.scopus.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Google Scholar Citations (1 mark per 3 citations)"
                    name="citations.scholar"
                    value={formData.citations.scholar.value}
                    onChange={(e) => updateField("citations", "scholar", { value: Number(e.target.value) })}
                    proofValue={formData.citations.scholar.proof}
                    onProofChange={(e) => updateField("citations", "scholar", { proof: e.target.value })}
                    verifiedScore={formData.citations.scholar.verified}
                    disabled={locked}
                />
                <ScoreCard label="Citations Score" score={scores.citations} total={50} />
            </SectionCard>

            <SectionCard title="6. Copyright in Individual Name (Being Among first Three Inventors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.copyrightIndiv} />
                <MetricField
                    label="Indian Copyright Registered/Filed (5 marks per copyright)"
                    name="copyrightIndiv.registered"
                    value={formData.copyrightIndiv.registered.value}
                    onChange={(e) => updateField("copyrightIndiv", "registered", { value: Number(e.target.value) })}
                    proofValue={formData.copyrightIndiv.registered.proof}
                    onProofChange={(e) => updateField("copyrightIndiv", "registered", { proof: e.target.value })}
                    verifiedScore={formData.copyrightIndiv.registered.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Copyright Granted (15 marks per copyright)"
                    name="copyrightIndiv.granted"
                    value={formData.copyrightIndiv.granted.value}
                    onChange={(e) => updateField("copyrightIndiv", "granted", { value: Number(e.target.value) })}
                    proofValue={formData.copyrightIndiv.granted.proof}
                    onProofChange={(e) => updateField("copyrightIndiv", "granted", { proof: e.target.value })}
                    verifiedScore={formData.copyrightIndiv.granted.verified}
                    disabled={locked}
                />
                <ScoreCard label="Copyright Individual Score" score={scores.copyrightIndiv} total={30} />
            </SectionCard>

            <SectionCard title="7. Copyright in Institute Name (Being Among first Three Authors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.copyrightInst} />
                <MetricField
                    label="Indian Copyright Registered/Filed (10 marks per copyright)"
                    name="copyrightInst.registered"
                    value={formData.copyrightInst.registered.value}
                    onChange={(e) => updateField("copyrightInst", "registered", { value: Number(e.target.value) })}
                    proofValue={formData.copyrightInst.registered.proof}
                    onProofChange={(e) => updateField("copyrightInst", "registered", { proof: e.target.value })}
                    verifiedScore={formData.copyrightInst.registered.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Copyright Granted (30 marks per copyright)"
                    name="copyrightInst.granted"
                    value={formData.copyrightInst.granted.value}
                    onChange={(e) => updateField("copyrightInst", "granted", { value: Number(e.target.value) })}
                    proofValue={formData.copyrightInst.granted.proof}
                    onProofChange={(e) => updateField("copyrightInst", "granted", { proof: e.target.value })}
                    verifiedScore={formData.copyrightInst.granted.verified}
                    disabled={locked}
                />
                <ScoreCard label="Copyright Institute Score" score={scores.copyrightInst} total="No limit" />
            </SectionCard>

            <SectionCard title="8. Patent in Individual name (Being among First Three inventors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.patentIndiv} />
                <MetricField
                    label="Indian Patent Registered/Filed (15 marks per patent)"
                    name="patentIndiv.registered"
                    value={formData.patentIndiv.registered.value}
                    onChange={(e) => updateField("patentIndiv", "registered", { value: Number(e.target.value) })}
                    proofValue={formData.patentIndiv.registered.proof}
                    onProofChange={(e) => updateField("patentIndiv", "registered", { proof: e.target.value })}
                    verifiedScore={formData.patentIndiv.registered.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Published (30 marks per patent)"
                    name="patentIndiv.published"
                    value={formData.patentIndiv.published.value}
                    onChange={(e) => updateField("patentIndiv", "published", { value: Number(e.target.value) })}
                    proofValue={formData.patentIndiv.published.proof}
                    onProofChange={(e) => updateField("patentIndiv", "published", { proof: e.target.value })}
                    verifiedScore={formData.patentIndiv.published.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Granted (50 marks per patent)"
                    name="patentIndiv.granted"
                    value={formData.patentIndiv.granted.value}
                    onChange={(e) => updateField("patentIndiv", "granted", { value: Number(e.target.value) })}
                    proofValue={formData.patentIndiv.granted.proof}
                    onProofChange={(e) => updateField("patentIndiv", "granted", { proof: e.target.value })}
                    verifiedScore={formData.patentIndiv.granted.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Commercialized (100 marks per patent)"
                    name="patentIndiv.commercialized"
                    value={formData.patentIndiv.commercialized.value}
                    onChange={(e) => updateField("patentIndiv", "commercialized", { value: Number(e.target.value) })}
                    proofValue={formData.patentIndiv.commercialized.proof}
                    onProofChange={(e) => updateField("patentIndiv", "commercialized", { proof: e.target.value })}
                    verifiedScore={formData.patentIndiv.commercialized.verified}
                    disabled={locked}
                />
                <ScoreCard label="Patent Individual Score" score={scores.patentIndiv} total={100} />
            </SectionCard>

            <SectionCard title="9. Patent in Institute name (Being among First Three inventors)">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.patentInst} />
                <MetricField
                    label="Indian Patent Registered/Filed (30 marks per patent)"
                    name="patentInst.registered"
                    value={formData.patentInst.registered.value}
                    onChange={(e) => updateField("patentInst", "registered", { value: Number(e.target.value) })}
                    proofValue={formData.patentInst.registered.proof}
                    onProofChange={(e) => updateField("patentInst", "registered", { proof: e.target.value })}
                    verifiedScore={formData.patentInst.registered.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Published (60 marks per patent)"
                    name="patentInst.published"
                    value={formData.patentInst.published.value}
                    onChange={(e) => updateField("patentInst", "published", { value: Number(e.target.value) })}
                    proofValue={formData.patentInst.published.proof}
                    onProofChange={(e) => updateField("patentInst", "published", { proof: e.target.value })}
                    verifiedScore={formData.patentInst.published.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Granted (100 marks per patent)"
                    name="patentInst.granted"
                    value={formData.patentInst.granted.value}
                    onChange={(e) => updateField("patentInst", "granted", { value: Number(e.target.value) })}
                    proofValue={formData.patentInst.granted.proof}
                    onProofChange={(e) => updateField("patentInst", "granted", { proof: e.target.value })}
                    verifiedScore={formData.patentInst.granted.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Indian Patent Commercialized (200 marks per patent)"
                    name="patentInst.commercialized"
                    value={formData.patentInst.commercialized.value}
                    onChange={(e) => updateField("patentInst", "commercialized", { value: Number(e.target.value) })}
                    proofValue={formData.patentInst.commercialized.proof}
                    onProofChange={(e) => updateField("patentInst", "commercialized", { proof: e.target.value })}
                    verifiedScore={formData.patentInst.commercialized.verified}
                    disabled={locked}
                />
                <ScoreCard label="Patent Institute Score" score={scores.patentInst} total="No limit" />
            </SectionCard>

            <SectionCard title="10. Grants received for research projects">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.grantsResearch} />
                <MetricField
                    label="Research Grants (10 marks per Two Lakh Rupees)"
                    name="grantResearch.amount"
                    value={formData.grantResearch.amount.value}
                    onChange={(e) => updateField("grantResearch", "amount", { value: Number(e.target.value) })}
                    proofValue={formData.grantResearch.amount.proof}
                    onProofChange={(e) => updateField("grantResearch", "amount", { proof: e.target.value })}
                    verifiedScore={formData.grantResearch.amount.verified}
                    disabled={locked}
                />
                <ScoreCard label="Research Grants Score" score={scores.grantResearch} total="No limit" />
            </SectionCard>

            <SectionCard title="11. Revenue Generated through Training Programs">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.revenueTraining} />
                <MetricField
                    label="Training Programs Revenue (5 marks per 10,000 Rupees)"
                    name="revenueTraining.amount"
                    value={formData.revenueTraining.amount.value}
                    onChange={(e) => updateField("revenueTraining", "amount", { value: Number(e.target.value) })}
                    proofValue={formData.revenueTraining.amount.proof}
                    onProofChange={(e) => updateField("revenueTraining", "amount", { proof: e.target.value })}
                    verifiedScore={formData.revenueTraining.amount.verified}
                    disabled={locked}
                />
                <ScoreCard label="Training Programs Revenue Score" score={scores.revenueTraining} total={40} />
            </SectionCard>

            <SectionCard title="12. Non-research/ Non consultancy Grant">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.grantsNonResearch} />
                <MetricField
                    label="Non-Research Grants (5 marks per 10,000 Rupees)"
                    name="grantNonResearch.amount"
                    value={formData.grantNonResearch.amount.value}
                    onChange={(e) => updateField("grantNonResearch", "amount", { value: Number(e.target.value) })}
                    proofValue={formData.grantNonResearch.amount.proof}
                    onProofChange={(e) => updateField("grantNonResearch", "amount", { proof: e.target.value })}
                    verifiedScore={formData.grantNonResearch.amount.verified}
                    disabled={locked}
                />
                <ScoreCard label="Non-Research Grants Score" score={scores.grantNonResearch} total={40} />
            </SectionCard>

            <SectionCard title="13. Product Developed with PCCoE-CIIL Stake">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.product} />
                <MetricField
                    label="Commercialized Products (100 marks per product)"
                    name="product.commercialized"
                    value={formData.product.commercialized.value}
                    onChange={(e) => updateField("product", "commercialized", { value: Number(e.target.value) })}
                    proofValue={formData.product.commercialized.proof}
                    onProofChange={(e) => updateField("product", "commercialized", { proof: e.target.value })}
                    verifiedScore={formData.product.commercialized.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Developed Products (40 marks per product)"
                    name="product.developed"
                    value={formData.product.developed.value}
                    onChange={(e) => updateField("product", "developed", { value: Number(e.target.value) })}
                    proofValue={formData.product.developed.proof}
                    onProofChange={(e) => updateField("product", "developed", { proof: e.target.value })}
                    verifiedScore={formData.product.developed.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Proof of Concepts (10 marks per POC)"
                    name="product.poc"
                    value={formData.product.poc.value}
                    onChange={(e) => updateField("product", "poc", { value: Number(e.target.value) })}
                    proofValue={formData.product.poc.proof}
                    onProofChange={(e) => updateField("product", "poc", { proof: e.target.value })}
                    verifiedScore={formData.product.poc.verified}
                    disabled={locked}
                />
                <ScoreCard label="Product Development Score" score={scores.product} total={100} />
            </SectionCard>

            <SectionCard title="14. Start Up with PCCoE-CIIL Stake">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.startup} />
                <MetricField
                    label="Startup with Revenue > 50k (100 marks per startup)"
                    name="startup.rev50k"
                    value={formData.startup.rev50k.value}
                    onChange={(e) => updateField("startup", "rev50k", { value: Number(e.target.value) })}
                    proofValue={formData.startup.rev50k.proof}
                    onProofChange={(e) => updateField("startup", "rev50k", { proof: e.target.value })}
                    verifiedScore={formData.startup.rev50k.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Startup with Funds > 5 Lakhs (100 marks per startup)"
                    name="startup.fund5L"
                    value={formData.startup.fund5L.value}
                    onChange={(e) => updateField("startup", "fund5L", { value: Number(e.target.value) })}
                    proofValue={formData.startup.fund5L.proof}
                    onProofChange={(e) => updateField("startup", "fund5L", { proof: e.target.value })}
                    verifiedScore={formData.startup.fund5L.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Startup Products (40 marks per product)"
                    name="startup.product"
                    value={formData.startup.product.value}
                    onChange={(e) => updateField("startup", "product", { value: Number(e.target.value) })}
                    proofValue={formData.startup.product.proof}
                    onProofChange={(e) => updateField("startup", "product", { proof: e.target.value })}
                    verifiedScore={formData.startup.product.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Startup POCs (10 marks per POC)"
                    name="startup.poc"
                    value={formData.startup.poc.value}
                    onChange={(e) => updateField("startup", "poc", { value: Number(e.target.value) })}
                    proofValue={formData.startup.poc.proof}
                    onProofChange={(e) => updateField("startup", "poc", { proof: e.target.value })}
                    verifiedScore={formData.startup.poc.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Registered Startups (5 marks per startup)"
                    name="startup.registered"
                    value={formData.startup.registered.value}
                    onChange={(e) => updateField("startup", "registered", { value: Number(e.target.value) })}
                    proofValue={formData.startup.registered.proof}
                    onProofChange={(e) => updateField("startup", "registered", { proof: e.target.value })}
                    verifiedScore={formData.startup.registered.verified}
                    disabled={locked}
                />
                <ScoreCard label="Startup Score" score={scores.startup} total="No limit" />
            </SectionCard>

            <SectionCard title="15. Award/ Fellowship Received">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.award} />
                <MetricField
                    label="International Awards (30 marks per award)"
                    name="award.intl"
                    value={formData.award.intl.value}
                    onChange={(e) => updateField("award", "intl", { value: Number(e.target.value) })}
                    proofValue={formData.award.intl.proof}
                    onProofChange={(e) => updateField("award", "intl", { proof: e.target.value })}
                    verifiedScore={formData.award.intl.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Government Awards (20 marks per award)"
                    name="award.govt"
                    value={formData.award.govt.value}
                    onChange={(e) => updateField("award", "govt", { value: Number(e.target.value) })}
                    proofValue={formData.award.govt.proof}
                    onProofChange={(e) => updateField("award", "govt", { proof: e.target.value })}
                    verifiedScore={formData.award.govt.verified}
                    disabled={locked}
                />
                <MetricField
                    label="National Awards (5 marks per award)"
                    name="award.national"
                    value={formData.award.national.value}
                    onChange={(e) => updateField("award", "national", { value: Number(e.target.value) })}
                    proofValue={formData.award.national.proof}
                    onProofChange={(e) => updateField("award", "national", { proof: e.target.value })}
                    verifiedScore={formData.award.national.verified}
                    disabled={locked}
                />
                <MetricField
                    label="International Fellowships (50 marks per fellowship)"
                    name="award.intlFellow"
                    value={formData.award.intlFellow.value}
                    onChange={(e) => updateField("award", "intlFellow", { value: Number(e.target.value) })}
                    proofValue={formData.award.intlFellow.proof}
                    onProofChange={(e) => updateField("award", "intlFellow", { proof: e.target.value })}
                    verifiedScore={formData.award.intlFellow.verified}
                    disabled={locked}
                />
                <MetricField
                    label="National Fellowships (30 marks per fellowship)"
                    name="award.natlFellow"
                    value={formData.award.natlFellow.value}
                    onChange={(e) => updateField("award", "natlFellow", { value: Number(e.target.value) })}
                    proofValue={formData.award.natlFellow.proof}
                    onProofChange={(e) => updateField("award", "natlFellow", { proof: e.target.value })}
                    verifiedScore={formData.award.natlFellow.verified}
                    disabled={locked}
                />
                <ScoreCard label="Awards & Fellowships Score" score={scores.award} total={50} />
            </SectionCard>

            <SectionCard title="16. Outcome through National/International Industry/University Interaction">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.interaction} />
                <MetricField
                    label="Active MoUs (10 marks per MoU)"
                    name="interaction.mou"
                    value={formData.interaction.mou.value}
                    onChange={(e) => updateField("interaction", "mou", { value: Number(e.target.value) })}
                    proofValue={formData.interaction.mou.proof}
                    onProofChange={(e) => updateField("interaction", "mou", { proof: e.target.value })}
                    verifiedScore={formData.interaction.mou.verified}
                    disabled={locked}
                />
                <MetricField
                    label="Industry Collaboration (20 marks per collaboration)"
                    name="interaction.collab"
                    value={formData.interaction.collab.value}
                    onChange={(e) => updateField("interaction", "collab", { value: Number(e.target.value) })}
                    proofValue={formData.interaction.collab.proof}
                    onProofChange={(e) => updateField("interaction", "collab", { proof: e.target.value })}
                    verifiedScore={formData.interaction.collab.verified}
                    disabled={locked}
                />
                <ScoreCard label="Industry/University Interaction Score" score={scores.interaction} total="No limit" />
            </SectionCard>

            <SectionCard title="17. Industry association for internship/placement">
                <DriveLinkNote />
                <TransparencyGuideline formula={FORMULAS.placement} />
                <MetricField
                    label="Internship/Placement Offers (10 marks per offer)"
                    name="placement.offer"
                    value={formData.placement.offer.value}
                    onChange={(e) => updateField("placement", "offer", { value: Number(e.target.value) })}
                    proofValue={formData.placement.offer.proof}
                    onProofChange={(e) => updateField("placement", "offer", { proof: e.target.value })}
                    verifiedScore={formData.placement.offer.verified}
                    disabled={locked}
                />
                <ScoreCard label="Internship/Placement Score" score={scores.placement} total="No limit" />
            </SectionCard>

            <SectionCard title="Score Summary">
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                        <tbody className="divide-y divide-border">
                            {verifiedTotalScore !== undefined && (
                                <tr className="bg-muted/10">
                                    <td className="px-4 py-3 font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
                                        Total Marks After Verification
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                                        {verifiedTotalScore}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-muted/10">
                                <td className="px-4 py-3 font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
                                    Score before cadre limit
                                </td>
                                <td className="px-4 py-3 text-right font-bold tabular-nums">
                                    {Object.values(scores).reduce((a, b) => a + b, 0)}
                                </td>
                            </tr>
                            <tr className="bg-muted/10 font-bold border-t-2 border-border font-black text-slate-900">
                                <td className="px-4 py-4 uppercase tracking-widest text-sm">
                                    Final Score (after cadre limit)
                                </td>
                                <td className="px-4 py-4 text-right tabular-nums text-xl text-indigo-700 font-black">
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
                    disabled={isSubmitting}
                    className="min-w-[200px] shadow-sm uppercase tracking-wider text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
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
