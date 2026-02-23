"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, X, Users, UserCheck, Save, RefreshCw } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExternalEvaluator {
  id: string;
  full_name: string;
  desg: string;
  organization: string;
  mail: string;
}

interface InternalFaculty {
  id: string;
  name: string;
  designation: string;
}

// Mock empty data — replaced by API
const MOCK_EXTERNALS: ExternalEvaluator[] = [];
const MOCK_FACULTY: InternalFaculty[] = [];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AssignFacultyExternalPage() {
  const { toast } = useToast();

  const [externals] = useState<ExternalEvaluator[]>(MOCK_EXTERNALS);
  const [internalFaculty] = useState<InternalFaculty[]>(MOCK_FACULTY);

  // assignments: externalId → Set of faculty ids
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeExternal, setActiveExternal] = useState<ExternalEvaluator | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Currently staged selection inside the modal
  const [staged, setStaged] = useState<Set<string>>(new Set());

  const openModal = (ext: ExternalEvaluator) => {
    setActiveExternal(ext);
    setStaged(new Set(assignments[ext.id] ?? []));
    setModalSearch("");
    setDialogOpen(true);
  };

  const modalFaculty = useMemo(
    () =>
      internalFaculty.filter(
        (f) =>
          f.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
          f.id.toLowerCase().includes(modalSearch.toLowerCase())
      ),
    [internalFaculty, modalSearch]
  );

  const toggleStaged = (id: string) => {
    setStaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!activeExternal) return;
    setSaving(true);
    try {
      // TODO: POST /api/hod/assign-faculty-external  { externalId, facultyIds: [...staged] }
      await new Promise((r) => setTimeout(r, 500));
      setAssignments((prev) => ({ ...prev, [activeExternal.id]: [...staged] }));
      toast({
        title: "Assignments saved",
        description: `${staged.size} faculty assigned to ${activeExternal.full_name}.`,
      });
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save assignments.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getFacultyNames = (ids: string[]) =>
    ids.map((id) => internalFaculty.find((f) => f.id === id)?.name ?? id);

  return (
    <>
      {externals.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Users size={40} className="text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm max-w-sm">
            No external evaluators found for your department. Go to{" "}
            <strong>Add External Faculty</strong> first to register evaluators, then come back here to assign faculty.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {externals.map((ext) => {
            const assignedIds = assignments[ext.id] ?? [];
            const assignedNames = getFacultyNames(assignedIds);
            return (
              <motion.div key={ext.id} variants={itemVariants}>
                <Card className="border hover:border-primary/40 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{ext.full_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{ext.desg}</p>
                        <p className="text-xs text-muted-foreground truncate">{ext.organization}</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {assignedIds.length} assigned
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    {/* Assigned faculty chips */}
                    <div className="min-h-[3rem]">
                      {assignedNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border"
                            >
                              <UserCheck size={11} /> {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No faculty assigned yet.</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => openModal(ext)}
                    >
                      <Plus size={14} />
                      {assignedIds.length > 0 ? "Manage Assignments" : "Assign Faculty"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Assignment Modal */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Assign Faculty to{" "}
              <span className="text-primary">{activeExternal?.full_name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
              <Input
                placeholder="Search faculty…"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {internalFaculty.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No faculty found in your department.
                </p>
              ) : modalFaculty.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results for "{modalSearch}".
                </p>
              ) : (
                modalFaculty.map((f) => {
                  const checked = staged.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleStaged(f.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        checked
                          ? "bg-primary/10 border border-primary/30 text-foreground"
                          : "bg-muted/40 hover:bg-muted border border-transparent"
                      }`}
                    >
                      <span className="text-left">
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{f.designation}</span>
                      </span>
                      {checked && <UserCheck size={15} className="text-primary" />}
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-xs text-muted-foreground">{staged.size} faculty selected</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={14} /> {saving ? "Saving…" : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
