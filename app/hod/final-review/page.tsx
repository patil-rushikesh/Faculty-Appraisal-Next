"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Download, ShieldCheck } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SectionTotals {
  A_total: number; A_verified: number;
  B_total: number; B_verified: number;
  C_total: number; C_verified: number;
  D_total: number; D_verified: number;
  E_total: number; E_verified: number;
}

interface ReviewRow {
  id: string;
  name: string;
  designation: string;
  status: string;
  grand_total: number;
  grand_verified: number;
  sections: SectionTotals;
}

type SortKey = "name" | "grand_total" | "grand_verified";
type SortDir = "asc" | "desc";

const MOCK_DATA: ReviewRow[] = [];

const SECTION_LABELS = ["A", "B", "C", "D", "E"] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinalReviewPage() {
  const { toast } = useToast();
  const [data] = useState<ReviewRow[]>(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ReviewRow | null>(null);
  const [certifying, setCertifying] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });

  const toggleSort = (key: SortKey) =>
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortConfig.key === col ? (
      sortConfig.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : (
      <ChevronDown size={14} className="opacity-30" />
    );

  const filtered = useMemo(() => {
    return data
      .filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const dir = sortConfig.dir === "asc" ? 1 : -1;
        if (sortConfig.key === "name") return a.name.localeCompare(b.name) * dir;
        return (a[sortConfig.key] - b[sortConfig.key]) * dir;
      });
  }, [data, search, sortConfig]);

  const summaryCards = [
    { label: "Total Faculty",   value: data.length },
    { label: "Verified (Done)", value: data.filter((r) => r.status?.toLowerCase() === "done").length },
    { label: "Sent to Director", value: data.filter((r) => r.status?.toLowerCase().includes("senttodirector")).length },
  ];

  const openConfirm = (row: ReviewRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const handleCertify = async () => {
    if (!confirmTarget) return;
    setCertifying(true);
    try {
      // TODO: POST /api/hod/certify  { facultyId: confirmTarget.id }
      await new Promise((r) => setTimeout(r, 600));
      toast({ title: "Certified", description: `${confirmTarget.name}'s appraisal has been certified and forwarded.` });
      setConfirmOpen(false);
    } catch {
      toast({ title: "Error", description: "Certification failed. Please try again.", variant: "destructive" });
    } finally {
      setCertifying(false);
    }
  };

  return (
    <>
      {/* Summary */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={itemVariants}>
            <Card className="border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        className="flex gap-3 mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-border overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8" />
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <span className="inline-flex items-center gap-1">Faculty <SortIcon col="name" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("grand_total")}>
                <span className="inline-flex items-center gap-1 float-right">Claimed <SortIcon col="grand_total" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("grand_verified")}>
                <span className="inline-flex items-center gap-1 float-right">Verified <SortIcon col="grand_verified" /></span>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {data.length === 0
                    ? "No appraisal data yet. Data will appear once loaded from the server."
                    : "No results match the search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const isExpanded = expanded === row.id;
                const isDone = row.status?.toLowerCase() === "done";
                return (
                  <>
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : row.id)}
                    >
                      <TableCell className="text-muted-foreground">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.id} · {row.designation}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.grand_total.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{row.grand_verified.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isDone
                            ? "bg-green-100 text-green-800 border-green-300"
                            : row.status?.toLowerCase().includes("senttodirector")
                            ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                            : "border-gray-300 text-gray-600"
                        }`}>
                          {isDone ? "Done" : row.status?.toLowerCase().includes("senttodirector") ? "Sent to Director" : row.status ?? "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                            <Download size={13} /> PDF
                          </Button>
                          {isDone && (
                            <Button
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => openConfirm(row)}
                            >
                              <ShieldCheck size={13} /> Certify
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded section breakdown */}
                    {isExpanded && (
                      <TableRow key={`${row.id}-expanded`} className="bg-muted/20">
                        <TableCell colSpan={6} className="py-3 px-6">
                          <div className="grid grid-cols-5 gap-3">
                            {SECTION_LABELS.map((sec) => {
                              const total    = row.sections[`${sec}_total` as keyof SectionTotals];
                              const verified = row.sections[`${sec}_verified` as keyof SectionTotals];
                              return (
                                <div key={sec} className="bg-card rounded-lg border border-border p-3 text-center">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Part {sec}</p>
                                  <p className="text-xs text-muted-foreground">Claimed</p>
                                  <p className="text-sm font-semibold">{total.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Verified</p>
                                  <p className="text-sm font-bold text-primary">{verified.toFixed(2)}</p>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Certify Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Certify Appraisal
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are about to certify the appraisal of{" "}
            <strong className="text-foreground">{confirmTarget?.name}</strong>. This will mark the
            form as HOD-reviewed and forward it to the Director.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Claimed: <strong>{confirmTarget?.grand_total.toFixed(2)}</strong> &nbsp;·&nbsp;
            Verified: <strong>{confirmTarget?.grand_verified.toFixed(2)}</strong>
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleCertify} disabled={certifying} className="gap-2">
              <ShieldCheck size={14} /> {certifying ? "Certifying…" : "Confirm & Certify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
