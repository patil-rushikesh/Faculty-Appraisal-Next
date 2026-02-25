"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
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

// --- SECTION MANDATORY CONFIG ---
// Defines which review/submission actions of Part F are mandatory.
// Faculty must generate the PDF and check their form status before submitting.
const SECTION_CONFIG = [
    { name: "Generate PDF", key: "pdfGenerated" as const, mandatory: true },
    { name: "Form Status Check", key: "statusChecked" as const, mandatory: true },
    { name: "Save PDF Snapshot", key: "savedPdf" as const, mandatory: false },
];

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
            const res = await axios.get(`${apiBase}/${department}/${userId}/pdf-metadata`, { validateStatus: () => true });
            if (res.status >= 200 && res.status < 300) {
                setPdfMetadata(res.data);
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
            const res = await axios.get(`${apiBase}/${department}/${userId}/saved-pdfs`, { validateStatus: () => true });
            setSavedPdfs((res.status >= 200 && res.status < 300) ? res.data.pdfs ?? [] : []);
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
                const processBlob = (blobData: Blob) => {
                    setPdfUrl(URL.createObjectURL(blobData));
                    setPdfExists(true);
                    fetchPdfMetadata();
                };
                const res = await axios.get(
                    `${apiBase}/${department}/${userId}/${force ? "generate-doc" : "faculty-pdf"}`,
                    { responseType: "blob", validateStatus: () => true }
                );
                clearInterval(tick);
                setLoadingProgress(100);
                if (res.status >= 200 && res.status < 300) {
                    processBlob(res.data);
                } else if (!force) {
                    const gen = await axios.get(
                        `${apiBase}/${department}/${userId}/generate-doc`,
                        { responseType: "blob", validateStatus: () => true }
                    );
                    if (gen.status >= 200 && gen.status < 300) processBlob(gen.data);
                    else setPdfExists(false);
                } else {
                    setPdfExists(false);
                }
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
            const res = await axios.get(`${apiBase}/${department}/${userId}/get-status`, { validateStatus: () => true });
            if (res.status >= 200 && res.status < 300) {
                const d = res.data;
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
            const res = await axios.post(`${apiBase}/${department}/${userId}/save-pdf`, {}, {
                headers: { "Content-Type": "application/json" },
                validateStatus: () => true,
            });
            if (res.status >= 200 && res.status < 300) {
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
            const res = await axios.get(`${apiBase}/${department}/${userId}/view-saved-pdf/${id}`, {
                responseType: "blob",
                validateStatus: () => true,
            });
            if (res.status >= 200 && res.status < 300) window.open(URL.createObjectURL(res.data), "_blank");
        } catch (err) {
            console.error("View PDF failed", err);
        }
    };

    const handleDeleteSaved = async (id: string) => {
        setDeletingPdf(true);
        try {
            await axios.delete(`${apiBase}/${department}/${userId}/delete-saved-pdf/${id}`, {
                validateStatus: () => true,
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
        // Validate mandatory sections before submission
        if (SECTION_CONFIG.find((s) => s.key === "pdfGenerated" && s.mandatory) && !pdfExists) {
            setSubmitError("Please generate and review your PDF before submitting the form.");
            return;
        }
        try {
            const res = await axios.post(`${apiBase}/${department}/${userId}/submit-form`, {}, {
                validateStatus: () => true,
            });
            if (res.status >= 200 && res.status < 300) {
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
        <div className="max-w-4xl mx-auto py-8 space-y-6 text-[1.15rem]" style={{lineHeight: 1.7}}>
            <div className="rounded-2xl border-2 border-indigo-200 bg-card p-6 shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                    <div>
                        <h2 className="text-xl font-black text-indigo-800 uppercase tracking-widest">
                            Review and submit
                        </h2>
                        <p className="text-base text-indigo-700 uppercase opacity-85 font-semibold mt-1">
                            Generate, save and freeze your appraisal document
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {pdfUrl && pdfExists && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="gap-2 py-2 px-4 text-base font-bold uppercase tracking-wider border-2 border-indigo-300 hover:bg-indigo-50"
                            >
                                <a href={pdfUrl} download={`${userId}_appraisal.pdf`}>
                                    <Download size={18} /> Download
                                </a>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 py-2 px-4 text-base font-bold uppercase tracking-wider border-2 border-indigo-300 hover:bg-indigo-50"
                            onClick={() => setShowSavedPdfsModal(true)}
                        >
                            <Archive size={18} /> Archives
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 py-2 px-4 text-base font-bold uppercase tracking-wider border-2 border-indigo-300 hover:bg-indigo-50"
                            onClick={() => generatePDF(true)}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />{" "}
                            {pdfExists ? "Regenerate Draft" : "Generate Draft"}
                        </Button>
                        {pdfUrl && (
                            <Button
                                size="sm"
                                className="gap-2 py-2 px-4 text-base font-bold uppercase tracking-wider shadow-md bg-indigo-700 hover:bg-indigo-800 text-white"
                                onClick={handleSavePdf}
                                disabled={savingPdf}
                            >
                                <Save size={18} className={savingPdf ? "animate-pulse" : ""} />{" "}
                                {savingPdf ? "Saving…" : "Save to Profile"}
                            </Button>
                        )}
                    </div>
                </div>

                {pdfMetadata && pdfExists && (
                    <div className="mb-7 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 p-5">
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
                                <p className="text-base font-bold text-indigo-700 uppercase tracking-tight opacity-85">
                                    {label}
                                </p>
                                <p className="text-lg font-extrabold text-indigo-900 truncate uppercase">
                                    {String(value ?? "N/A")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="mb-7 space-y-3">
                        <div className="w-full rounded-full bg-muted h-2 overflow-hidden">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <p className="text-base text-center font-bold text-indigo-700 uppercase animate-pulse">
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
                    <div className="py-24 text-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50">
                        <FileText size={56} className="mx-auto mb-4 opacity-30 text-indigo-700" />
                        <p className="text-lg font-bold text-indigo-700 uppercase">
                            No PDF generated for this session
                        </p>
                        <Button
                            variant="link"
                            size="sm"
                            className="mt-3 text-base uppercase font-black text-indigo-700 hover:text-indigo-900"
                            onClick={() => generatePDF(true)}
                        >
                            Generate Now
                        </Button>
                    </div>
                )}
            </div>

            {submitError && (
                <div className="mx-auto max-w-lg p-4 rounded-lg bg-destructive/15 border-2 border-destructive/30 text-destructive text-base font-bold uppercase text-center tracking-wider">
                    {submitError}
                </div>
            )}

            {isFormFrozen ? (
                <div className="flex items-center justify-center gap-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-7 py-5 shadow-md">
                    <ShieldAlert size={24} className="text-indigo-700 flex-shrink-0" />
                    <p className="text-lg font-black text-indigo-800 uppercase tracking-wider">
                        Document Frozen &bull; Status: {formStatus}
                    </p>
                </div>
            ) : (
                formStatus === "pending" && (
                    <div className="flex justify-center pt-3">
                        <Button
                            onClick={() => setShowFreezeModal(true)}
                            className="group relative h-16 px-12 overflow-hidden rounded-2xl bg-indigo-700 text-white transition-all hover:bg-indigo-800 hover:scale-[1.02] active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <div className="flex items-center gap-4">
                                <ShieldAlert size={24} className="transition-transform group-hover:rotate-12 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-base font-black uppercase tracking-widest leading-none">
                                        Final Submission
                                    </p>
                                    <p className="text-lg font-bold opacity-90 mt-1">Freeze & Submit Appraisal</p>
                                </div>
                            </div>
                        </Button>
                    </div>
                )
            )}

            <Dialog open={showFreezeModal} onOpenChange={setShowFreezeModal}>
                <DialogContent className="max-w-md bg-card border-2 border-indigo-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest text-destructive">
                            Critical: Confirm Freeze
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-3">
                        <p className="text-base text-indigo-900 leading-relaxed uppercase tracking-tight font-semibold">
                            Freezing will lock all 6 parts of your appraisal form. You will not be able to make
                            further changes until the evaluation cycle is reset by the admin.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 text-base font-bold uppercase border-2"
                                onClick={() => setShowFreezeModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 text-base font-bold uppercase"
                                onClick={handleFreeze}
                            >
                                Lock &amp; Submit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSavedPdfsModal} onOpenChange={setShowSavedPdfsModal}>
                <DialogContent className="max-w-2xl bg-card border-2 border-indigo-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest">
                            Saved Appraisal Archives
                        </DialogTitle>
                    </DialogHeader>
                    {loadingSavedPdfs ? (
                        <Loader message="Loading Archives..." />
                    ) : savedPdfs.length > 0 ? (
                        <div className="space-y-3 mt-5 max-h-[50vh] overflow-y-auto pr-2">
                            {savedPdfs.map((pdf, i) => (
                                <div
                                    key={pdf._id ?? i}
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-base font-bold text-indigo-900 truncate uppercase">
                                            {pdf.filename || `Archive_${i + 1}`}
                                        </p>
                                        <p className="text-sm text-indigo-700 uppercase opacity-80 font-semibold">
                                            {pdf.appraisal_year} &bull;{" "}
                                            {pdf.upload_date ? new Date(pdf.upload_date).toLocaleDateString() : "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 p-0 hover:bg-indigo-200"
                                            onClick={() => handleViewSaved(pdf._id)}
                                        >
                                            <Eye size={18} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/15"
                                            onClick={() => setSelectedPdfForDelete(pdf._id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center opacity-50">
                            <Archive size={48} className="mx-auto mb-3 text-muted-foreground" />
                            <p className="text-base font-bold uppercase">No records found</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedPdfForDelete}
                onOpenChange={(open) => !open && setSelectedPdfForDelete(null)}
            >
                <DialogContent className="max-w-xs bg-card border-2 border-indigo-200">
                    <p className="text-base font-bold text-center uppercase py-6">
                        Permanently delete this record?
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-10 text-base font-bold uppercase border-2"
                            onClick={() => setSelectedPdfForDelete(null)}
                        >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 h-10 text-base font-bold uppercase"
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
