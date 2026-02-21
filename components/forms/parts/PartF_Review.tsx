"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Download,
    RefreshCw,
    ShieldAlert,
    FileText,
    Archive,
    Eye,
    Trash2,
    Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Loader from "@/components/loader";

// --- TYPES ---
interface PdfMetadata {
    faculty_name?: string;
    faculty_designation?: string;
    appraisal_year?: number;
    status?: string;
    upload_date?: string;
}

interface SavedPdf {
    _id: string;
    filename?: string;
    faculty_name?: string;
    appraisal_year?: number;
    upload_date?: string;
}

interface PartFReviewProps {
    apiBase: string;
    department: string;
    userId: string;
}

// --- COMPONENT ---
function PartFReview({ apiBase, department, userId }: PartFReviewProps) {
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showFreezeModal, setShowFreezeModal] = useState(false);
    const [isFormFrozen, setIsFormFrozen] = useState(false);
    const [formStatus, setFormStatus] = useState("pending");
    const [pdfMetadata, setPdfMetadata] = useState<PdfMetadata | null>(null);
    const [pdfExists, setPdfExists] = useState(false);
    const [savingPdf, setSavingPdf] = useState(false);
    const [showSavedPdfsModal, setShowSavedPdfsModal] = useState(false);
    const [savedPdfs, setSavedPdfs] = useState<SavedPdf[]>([]);
    const [loadingSavedPdfs, setLoadingSavedPdfs] = useState(false);
    const [selectedPdfForDelete, setSelectedPdfForDelete] = useState<string | null>(null);
    const [deletingPdf, setDeletingPdf] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const fetchPdfMetadata = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/pdf-metadata`);
            if (res.ok) {
                setPdfMetadata(await res.json());
                setPdfExists(true);
            } else {
                setPdfMetadata(null);
                setPdfExists(false);
            }
        } catch {
            setPdfMetadata(null);
            setPdfExists(false);
        }
    }, [apiBase, department, userId]);

    const fetchSavedPdfs = useCallback(async () => {
        setLoadingSavedPdfs(true);
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/saved-pdfs`);
            setSavedPdfs(res.ok ? (await res.json()).pdfs ?? [] : []);
        } catch {
            setSavedPdfs([]);
        } finally {
            setLoadingSavedPdfs(false);
        }
    }, [apiBase, department, userId]);

    const generatePDF = useCallback(
        async (force = false) => {
            setLoading(true);
            setLoadingProgress(0);
            const tick = setInterval(() => setLoadingProgress((p) => (p >= 90 ? 90 : p + 10)), 500);
            try {
                const res = await fetch(
                    `${apiBase}/${department}/${userId}/${force ? "generate-doc" : "faculty-pdf"}`
                );
                clearInterval(tick);
                setLoadingProgress(100);
                const process = async (r: Response) => {
                    const b = await r.blob();
                    setPdfUrl(URL.createObjectURL(b));
                    setPdfExists(true);
                    fetchPdfMetadata();
                };
                if (res.ok) await process(res);
                else if (!force) {
                    const gen = await fetch(`${apiBase}/${department}/${userId}/generate-doc`);
                    if (gen.ok) await process(gen);
                    else setPdfExists(false);
                } else setPdfExists(false);
            } catch {
                clearInterval(tick);
                setPdfExists(false);
            } finally {
                setLoading(false);
                setLoadingProgress(0);
            }
        },
        [apiBase, department, userId, fetchPdfMetadata]
    );

    const fetchFormStatus = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/get-status`);
            if (res.ok) {
                const d = await res.json();
                setFormStatus(d.status);
                if (d.status !== "pending") setIsFormFrozen(true);
            }
        } catch (err) {
            console.error("Fetch status failed", err);
        }
    }, [apiBase, department, userId]);

    useEffect(() => {
        generatePDF();
        fetchFormStatus();
        fetchPdfMetadata();
        fetchSavedPdfs();
    }, [generatePDF, fetchFormStatus, fetchPdfMetadata, fetchSavedPdfs]);

    const handleSavePdf = async () => {
        setSavingPdf(true);
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/save-pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                fetchPdfMetadata();
                generatePDF();
                fetchSavedPdfs();
            }
        } catch (err) {
            console.error("Save PDF failed", err);
        } finally {
            setSavingPdf(false);
        }
    };

    const handleViewSaved = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/view-saved-pdf/${id}`);
            if (res.ok) window.open(URL.createObjectURL(await res.blob()), "_blank");
        } catch (err) {
            console.error("View PDF failed", err);
        }
    };

    const handleDeleteSaved = async (id: string) => {
        setDeletingPdf(true);
        try {
            await fetch(`${apiBase}/${department}/${userId}/delete-saved-pdf/${id}`, {
                method: "DELETE",
            });
            setSelectedPdfForDelete(null);
            fetchSavedPdfs();
        } catch (err) {
            console.error("Delete PDF failed", err);
        } finally {
            setDeletingPdf(false);
        }
    };

    const handleFreeze = async () => {
        setSubmitError(null);
        try {
            const res = await fetch(`${apiBase}/${department}/${userId}/submit-form`, { method: "POST" });
            if (res.ok) {
                setIsFormFrozen(true);
                setShowFreezeModal(false);
                fetchFormStatus();
            } else {
                setSubmitError("Submission failed. Please check your connection and try again.");
            }
        } catch {
            setSubmitError("An error occurred during submission.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <div>
                        <h2 className="text-sm font-black text-indigo-700 uppercase tracking-widest">
                            Review and submit
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase opacity-70">
                            Generate, save and freeze your appraisal document
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {pdfUrl && pdfExists && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="gap-2 h-8 px-3 text-xs font-bold uppercase tracking-wider"
                            >
                                <a href={pdfUrl} download={`${userId}_appraisal.pdf`}>
                                    <Download size={14} /> Download
                                </a>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 h-8 px-3 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setShowSavedPdfsModal(true)}
                        >
                            <Archive size={14} /> Archives
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 h-8 px-3 text-xs font-bold uppercase tracking-wider"
                            onClick={() => generatePDF(true)}
                            disabled={loading}
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
                            {pdfExists ? "Regenerate Draft" : "Generate Draft"}
                        </Button>
                        {pdfUrl && (
                            <Button
                                size="sm"
                                className="gap-2 h-8 px-3 text-xs font-bold uppercase tracking-wider shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleSavePdf}
                                disabled={savingPdf}
                            >
                                <Save size={14} className={savingPdf ? "animate-pulse" : ""} />{" "}
                                {savingPdf ? "Saving…" : "Save to Profile"}
                            </Button>
                        )}
                    </div>
                </div>

                {pdfMetadata && pdfExists && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border border-border bg-muted/20 p-4">
                        {[
                            { label: "Faculty", value: pdfMetadata.faculty_name },
                            { label: "Year", value: pdfMetadata.appraisal_year },
                            { label: "Status", value: pdfMetadata.status?.replace("_", " ") },
                            {
                                label: "Last Updated",
                                value: pdfMetadata.upload_date
                                    ? new Date(pdfMetadata.upload_date).toLocaleDateString()
                                    : "N/A",
                            },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight opacity-70">
                                    {label}
                                </p>
                                <p className="text-sm font-semibold text-foreground truncate uppercase">
                                    {String(value ?? "N/A")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="mb-6 space-y-2">
                        <div className="w-full rounded-full bg-muted h-1 overflow-hidden">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-center font-bold text-muted-foreground uppercase animate-pulse">
                            Processing Appraisal Document... {loadingProgress}%
                        </p>
                    </div>
                )}

                {pdfUrl && pdfExists && !loading && (
                    <div className="w-full h-[60vh] rounded-lg border border-border overflow-hidden bg-muted/5 shadow-inner mb-6">
                        <iframe src={pdfUrl} className="w-full h-full" title="Appraisal PDF" />
                    </div>
                )}


                {!pdfExists && !loading && (
                    <div className="py-20 text-center rounded-lg border border-dashed border-border bg-muted/5">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-bold text-muted-foreground uppercase">
                            No PDF generated for this session
                        </p>
                        <Button
                            variant="link"
                            size="sm"
                            className="mt-2 text-xs uppercase font-bold"
                            onClick={() => generatePDF(true)}
                        >
                            Generate Now
                        </Button>
                    </div>
                )}
            </div>

            {submitError && (
                <div className="mx-auto max-w-lg p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase text-center tracking-wider">
                    {submitError}
                </div>
            )}

            {isFormFrozen ? (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 px-6 py-4">
                    <ShieldAlert size={18} className="text-muted-foreground" />
                    <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Document Frozen &bull; Status: {formStatus}
                    </p>
                </div>
            ) : (
                formStatus === "pending" && (
                    <div className="flex justify-center pt-2">
                        <Button
                            onClick={() => setShowFreezeModal(true)}
                            className="group relative h-14 px-10 overflow-hidden rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <ShieldAlert size={20} className="transition-transform group-hover:rotate-12" />
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest leading-none">
                                        Final Submission
                                    </p>
                                    <p className="text-sm font-bold opacity-80 mt-1">Freeze & Submit Appraisal</p>
                                </div>
                            </div>
                        </Button>
                    </div>
                )
            )}

            <Dialog open={showFreezeModal} onOpenChange={setShowFreezeModal}>
                <DialogContent className="max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-destructive">
                            Critical: Confirm Freeze
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-tight">
                            Freezing will lock all 6 parts of your appraisal form. You will not be able to make
                            further changes until the evaluation cycle is reset by the admin.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 text-xs font-bold uppercase"
                                onClick={() => setShowFreezeModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 text-xs font-bold uppercase"
                                onClick={handleFreeze}
                            >
                                Lock &amp; Submit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSavedPdfsModal} onOpenChange={setShowSavedPdfsModal}>
                <DialogContent className="max-w-2xl bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">
                            Saved Appraisal Archives
                        </DialogTitle>
                    </DialogHeader>
                    {loadingSavedPdfs ? (
                        <Loader message="Loading Archives..." />
                    ) : savedPdfs.length > 0 ? (
                        <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-2">
                            {savedPdfs.map((pdf, i) => (
                                <div
                                    key={pdf._id ?? i}
                                    className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate uppercase">
                                            {pdf.filename || `Archive_${i + 1}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase opacity-70">
                                            {pdf.appraisal_year} &bull;{" "}
                                            {pdf.upload_date ? new Date(pdf.upload_date).toLocaleDateString() : "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleViewSaved(pdf._id)}
                                        >
                                            <Eye size={14} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setSelectedPdfForDelete(pdf._id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center opacity-40">
                            <Archive size={40} className="mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase">No records found</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedPdfForDelete}
                onOpenChange={(open) => !open && setSelectedPdfForDelete(null)}
            >
                <DialogContent className="max-w-xs bg-card border-border">
                    <p className="text-xs font-bold text-center uppercase py-4">
                        Permanently delete this record?
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-8 text-xs font-bold uppercase"
                            onClick={() => setSelectedPdfForDelete(null)}
                        >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 h-8 text-xs font-bold uppercase"
                            onClick={() => selectedPdfForDelete && handleDeleteSaved(selectedPdfForDelete)}
                            disabled={deletingPdf}
                        >
                            {deletingPdf ? "..." : "Yes, Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PartFReview;
