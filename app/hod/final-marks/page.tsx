"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronUp, ChevronDown, Send } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FacultyMarks {
  id: string;
  name: string;
  designation: string;
  status: string;
  verified_marks: number;
  scaled_verified_marks: number;
  interaction_average: number;
  total_marks: number;
}

type SortKey = keyof Pick<FacultyMarks, "name" | "verified_marks" | "interaction_average" | "total_marks">;
type SortDir = "asc" | "desc";

const MOCK_DATA: FacultyMarks[] = [];   // replaced by API

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinalMarksPage() {
  const { toast } = useToast();
  const [data] = useState<FacultyMarks[]>(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });
  const [sending, setSending] = useState(false);

  const toggleSort = (key: SortKey) =>
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortConfig.key === col ? (
      sortConfig.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : (
      <ChevronDown size={14} className="opacity-30" />
    );

  const eligible = useMemo(
    () => data.filter((f) => f.status?.toLowerCase() === "done"),
    [data]
  );

  const filtered = useMemo(() => {
    return data
      .filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.id.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const dir = sortConfig.dir === "asc" ? 1 : -1;
        if (sortConfig.key === "name") return a.name.localeCompare(b.name) * dir;
        return ((a[sortConfig.key] as number) - (b[sortConfig.key] as number)) * dir;
      });
  }, [data, search, sortConfig]);

  const allEligibleSelected =
    eligible.length > 0 && eligible.every((f) => selected.has(f.id));

  const toggleAll = () => {
    if (allEligibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((f) => f.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSendToDirector = async () => {
    if (selected.size === 0) {
      toast({ title: "No faculty selected", description: "Select at least one faculty member.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      // TODO: POST /api/hod/send-to-director  { facultyIds: [...selected] }
      await new Promise((r) => setTimeout(r, 800)); // simulate
      toast({ title: "Sent to Director", description: `${selected.size} faculty record(s) forwarded successfully.` });
      setSelected(new Set());
    } catch {
      toast({ title: "Error", description: "Failed to send to Director. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const summaryCards = [
    { label: "Total Faculty",   value: data.length },
    { label: "Eligible (Done)", value: eligible.length },
    { label: "Selected",        value: selected.size },
  ];

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

      {/* Toolbar */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSendToDirector}
          disabled={selected.size === 0 || sending}
          className="gap-2 shrink-0"
        >
          <Send size={16} />
          {sending ? "Sending…" : `Send to Director (${selected.size})`}
        </Button>
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
              <TableHead className="w-10">
                <Checkbox
                  checked={allEligibleSelected}
                  onCheckedChange={toggleAll}
                  disabled={eligible.length === 0}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <span className="inline-flex items-center gap-1">Faculty <SortIcon col="name" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("verified_marks")}>
                <span className="inline-flex items-center gap-1 float-right">Verified <SortIcon col="verified_marks" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("interaction_average")}>
                <span className="inline-flex items-center gap-1 float-right">Interaction Avg <SortIcon col="interaction_average" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("total_marks")}>
                <span className="inline-flex items-center gap-1 float-right">Total <SortIcon col="total_marks" /></span>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {data.length === 0
                    ? "No marks data yet. Data will appear once loaded from the server."
                    : "No results match the search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((f) => {
                const isDone = f.status?.toLowerCase() === "done";
                return (
                  <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(f.id)}
                        onCheckedChange={() => toggleOne(f.id)}
                        disabled={!isDone}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.id} · {f.designation}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{f.verified_marks.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{f.interaction_average.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{f.total_marks.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isDone
                          ? "bg-green-100 text-green-800 border-green-300"
                          : f.status?.toLowerCase() === "senttodirector"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : "border-gray-300 text-gray-600"
                      }`}>
                        {isDone ? "Done" : f.status?.toLowerCase() === "senttodirector" ? "Sent to Director" : f.status ?? "Pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      <p className="mt-4 text-xs text-muted-foreground">
        Only faculty with <strong>Done</strong> status can be selected and forwarded to the Director.
      </p>
    </>
  );
}
