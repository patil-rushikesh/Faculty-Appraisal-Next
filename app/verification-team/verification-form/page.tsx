"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { ArrowLeft, ExternalLink, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface VerificationItem {
  key: string;
  label: string;
  claimed: number;
  proofUrl: string;
  verified: string;
}

interface VerificationSection {
  id: string;
  title: string;
  items: VerificationItem[];
}

// ── Default sections (claimed=0, will be populated from API) ─────────────────

const buildSections = (): VerificationSection[] => [
  {
    id: "journals",
    title: "Journal Papers",
    items: [
      { key: "sci", label: "SCI / SCI-E Indexed", claimed: 0, proofUrl: "", verified: "" },
      { key: "esci", label: "ESCI Indexed", claimed: 0, proofUrl: "", verified: "" },
      { key: "scopus", label: "Scopus Indexed", claimed: 0, proofUrl: "", verified: "" },
      { key: "ugc", label: "UGC Listed", claimed: 0, proofUrl: "", verified: "" },
      { key: "other_journal", label: "Other Journals", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "conference",
    title: "Conference Papers",
    items: [
      { key: "conf_international", label: "International Conference", claimed: 0, proofUrl: "", verified: "" },
      { key: "conf_national", label: "National Conference", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "books",
    title: "Books & Book Chapters",
    items: [
      { key: "book_authored", label: "Books Authored", claimed: 0, proofUrl: "", verified: "" },
      { key: "book_edited", label: "Books Edited", claimed: 0, proofUrl: "", verified: "" },
      { key: "book_chapter", label: "Book Chapters", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "citations",
    title: "Citations",
    items: [
      { key: "citation_wos", label: "Web of Science Citations", claimed: 0, proofUrl: "", verified: "" },
      { key: "citation_scopus", label: "Scopus Citations", claimed: 0, proofUrl: "", verified: "" },
      { key: "citation_google", label: "Google Scholar Citations", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property",
    items: [
      { key: "copyright_individual", label: "Copyright – Individual", claimed: 0, proofUrl: "", verified: "" },
      { key: "copyright_institute", label: "Copyright – Institute", claimed: 0, proofUrl: "", verified: "" },
      { key: "patent_individual", label: "Patent – Individual", claimed: 0, proofUrl: "", verified: "" },
      { key: "patent_institute", label: "Patent – Institute", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "grants",
    title: "Research Grants & Revenue",
    items: [
      { key: "research_grant", label: "Research Grants", claimed: 0, proofUrl: "", verified: "" },
      { key: "training_revenue", label: "Training Revenue", claimed: 0, proofUrl: "", verified: "" },
      { key: "non_research_grant", label: "Non-Research Grants", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
  {
    id: "startups",
    title: "Products, Startups & Awards",
    items: [
      { key: "products", label: "Products Developed", claimed: 0, proofUrl: "", verified: "" },
      { key: "startups", label: "Startups Founded", claimed: 0, proofUrl: "", verified: "" },
      { key: "awards", label: "Awards & Fellowships", claimed: 0, proofUrl: "", verified: "" },
      { key: "mou", label: "MoUs Signed", claimed: 0, proofUrl: "", verified: "" },
      { key: "industry_association", label: "Industry Association Activities", claimed: 0, proofUrl: "", verified: "" },
    ],
  },
];

// ── Content ──────────────────────────────────────────────────────────────────

function VerificationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const facultyId = searchParams.get("facultyId") ?? "";
  const department = searchParams.get("department") ?? "";

  const [sections, setSections] = useState<VerificationSection[]>(buildSections());
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!facultyId || !department) return;
    // TODO: GET /api/${department}/${facultyId}/B  — load claimed scores and proof URLs
    // then setSections with actual data
  }, [facultyId, department]);

  const handleVerifiedChange = (secId: string, itemKey: string, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.key === itemKey ? { ...item, verified: value } : item
              ),
            }
          : s
      )
    );
  };

  const handleSave = async (isSubmit: boolean) => {
    setSaving(true);
    try {
      // Build payload
      const payload: Record<string, number> = {};
      sections.forEach((s) => {
        s.items.forEach((item) => {
          payload[item.key] = parseInt(item.verified) || 0;
        });
      });

      if (isSubmit) {
        // TODO: POST /api/${department}/${facultyId}/B   body: payload
        await new Promise((r) => setTimeout(r, 800));
        toast({ title: "Verification submitted", description: "Part B research marks verified and saved." });
        router.push("/verification-team/dashboard");
      } else {
        await new Promise((r) => setTimeout(r, 400));
        toast({ title: "Progress saved" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save verification.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-slate-700 px-6 py-4 text-white">
        <h1 className="text-xl font-bold">Part B – Research Verification</h1>
        <p className="text-slate-300 text-sm mt-0.5">
          Faculty: <span className="font-mono font-semibold">{facultyId}</span>
          {department && <> · {department}</>}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-slate-900 -ml-2"
          onClick={() => router.push("/verification-team/dashboard")}
        >
          <ArrowLeft size={15} className="mr-1" /> Back to Dashboard
        </Button>

        {facultyId ? (
          <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
            {sections.map((section) => (
              <motion.div key={section.id} variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-1/2">Category</th>
                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Claimed Score</th>
                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Proof</th>
                            <th className="text-center px-4 py-3 font-medium text-muted-foreground w-32">Verified Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item, idx) => (
                            <tr
                              key={item.key}
                              className={`border-b last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/20"}`}
                            >
                              <td className="px-4 py-3 font-medium">{item.label}</td>
                              <td className="px-4 py-3 text-center">
                                <Input
                                  value={item.claimed}
                                  disabled
                                  className="w-20 mx-auto text-center bg-muted cursor-not-allowed opacity-70"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.proofUrl ? (
                                  <a
                                    href={item.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                  >
                                    <ExternalLink size={12} />
                                    View Proof
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-xs">No proof</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.verified}
                                  onChange={(e) => handleVerifiedChange(section.id, item.key, e.target.value)}
                                  placeholder="0"
                                  className="w-20 mx-auto text-center"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Actions */}
            <motion.div variants={itemVariants} className="flex justify-between border-t pt-4">
              <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
                <Save size={15} className="mr-2" /> Save Progress
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmOpen(true)}
                disabled={saving}
              >
                <CheckCircle size={15} className="mr-2" /> Submit Verification
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No faculty selected. Please navigate here from the dashboard.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Verification Submission</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit the final verified Part B marks for faculty {facultyId}.
              This action will finalize the research verification and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? "Submitting…" : "Confirm Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function VerificationFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <VerificationFormContent />
    </Suspense>
  );
}
