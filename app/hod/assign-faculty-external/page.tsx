"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, X, Users, UserCheck, Save, RefreshCw,
  Crown, CheckCircle, FileText, ArrowRight, UserPlus,
  ShieldCheck, Trash2, Info, LayoutGrid
} from "lucide-react";
import Loader from "@/components/loader";
import { StatCard } from "@/components/stat-card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/AuthProvider";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssignedFaculty {
  _id: string;
  name: string;
  desg: string;
}

interface ExternalEvaluator {
  userId: string;
  full_name: string;
  desg: string;
  organization: string;
  mail: string;
  assignedDean: string;
  assignedFaculties: AssignedFaculty[];
}

interface Faculty {
  id: string;
  name: string;
  designation: string;
  email?: string;
}

interface Dean {
  id: string;
  name: string;
  email?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssignFacultyExternalPage() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const router = useRouter();
  const dept = user?.department;

  const [externals, setExternals] = useState<ExternalEvaluator[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [deans, setDeans] = useState<Dean[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deanDialogOpen, setDeanDialogOpen] = useState(false);
  const [activeExternal, setActiveExternal] = useState<ExternalEvaluator | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staged faculty IDs for bulk assignment
  const [staged, setStaged] = useState<Set<string>>(new Set());

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!dept || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [extRes, facRes, deansRes] = await Promise.all([
        axios.get(`${API_BASE}/interaction/${dept}/get-externals`, authHeader),
        axios.get(`${API_BASE}/common/by-department?department=${dept}`, authHeader),
        axios.get(`${API_BASE}/interaction/${dept}/interaction-deans`, authHeader),
      ]);

      // Externals
      if (extRes.data.success) {
        setExternals(extRes.data.data || []);
      }

      // Filter faculty: role=faculty + valid academic designation
      const allowedDesignations = ["Professor", "Associate Professor", "Assistant Professor"];
      const allUsers = facRes.data.users || [];
      setFaculties(
        allUsers
          .filter(
            (u: any) =>
              u.role === "faculty" &&
              u.designation &&
              allowedDesignations.includes(u.designation)
          )
          .map((u: any) => ({
            id: u.userId,
            name: u.name,
            designation: u.designation,
            email: u.email,
          }))
      );

      // Interaction deans
      if (deansRes.data.success) {
        setDeans(
          (deansRes.data.data || []).map((d: any) => ({
            id: d.userId,
            name: d.name,
            email: d.email,
          }))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.response?.data?.message || "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dept, token, authHeader, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Faculty dialog helpers ──────────────────────────────────────────────────

  const openFacultyModal = (ext: ExternalEvaluator) => {
    setActiveExternal(ext);
    setStaged(new Set(ext.assignedFaculties.map((f) => f._id)));
    setModalSearch("");
    setDialogOpen(true);
  };

  const filteredFacultyRows = useMemo(
    () =>
      faculties.filter(
        (f) =>
          f.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
          f.id.toLowerCase().includes(modalSearch.toLowerCase())
      ),
    [faculties, modalSearch]
  );

  const toggleStaged = (id: string, blocked: boolean) => {
    if (blocked) return;
    setStaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /** Check if a faculty is assigned to a DIFFERENT external */
  const isAssignedToOther = (facultyId: string, currentExtId: string) =>
    externals.some(
      (ext) =>
        ext.userId !== currentExtId &&
        ext.assignedFaculties.some((f) => f._id === facultyId)
    );

  const handleSelectAll = () => {
    if (!activeExternal) return;
    const available = filteredFacultyRows.filter(
      (f) => !isAssignedToOther(f.id, activeExternal.userId)
    );
    const allSelected = available.every((f) => staged.has(f.id));
    setStaged((prev) => {
      const next = new Set(prev);
      available.forEach((f) => (allSelected ? next.delete(f.id) : next.add(f.id)));
      return next;
    });
  };

  const handleSaveFacultyAssignments = async () => {
    if (!activeExternal || !dept) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/interaction/${dept}/external/${activeExternal.userId}/assign-faculties`,
        { facultyUserIds: Array.from(staged) },
        authHeader
      );
      if (res.data.success) {
        toast({ title: "Success", description: `Faculty assignments updated for ${activeExternal.full_name}.` });
        fetchData();
        setDialogOpen(false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to save assignments.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFaculty = async (extUserId: string, facId: string) => {
    if (!dept) return;
    const ext = externals.find((e) => e.userId === extUserId);
    if (!ext) return;
    const updatedIds = ext.assignedFaculties.map((f) => f._id).filter((id) => id !== facId);
    try {
      const res = await axios.put(
        `${API_BASE}/interaction/${dept}/external/${extUserId}/assign-faculties`,
        { facultyUserIds: updatedIds },
        authHeader
      );
      if (res.data.success) {
        toast({ title: "Removed", description: "Faculty unassigned." });
        fetchData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove faculty.", variant: "destructive" });
    }
  };

  // ── Dean dialog helpers ─────────────────────────────────────────────────────

  const openDeanModal = (ext: ExternalEvaluator) => {
    setActiveExternal(ext);
    setModalSearch("");
    setDeanDialogOpen(true);
  };

  const filteredDeanRows = useMemo(
    () => deans.filter((d) => d.name.toLowerCase().includes(modalSearch.toLowerCase())),
    [deans, modalSearch]
  );

  const handleAssignDean = async (deanUserId: string) => {
    if (!activeExternal || !dept) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/interaction/${dept}/external/${activeExternal.userId}/assign-dean`,
        { deanUserId },
        authHeader
      );
      if (res.data.success) {
        toast({ title: "Dean Assigned", description: `Dean linked to ${activeExternal.full_name}.` });
        fetchData();
        setDeanDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign dean.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDean = async (extUserId: string) => {
    if (!dept) return;
    try {
      const res = await axios.put(
        `${API_BASE}/interaction/${dept}/external/${extUserId}/assign-dean`,
        { deanUserId: "" },
        authHeader
      );
      if (res.data.success) {
        toast({ title: "Dean Removed", description: "Dean assignment removed." });
        fetchData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove dean.", variant: "destructive" });
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const totalFacultyAssigned = externals.reduce((s, e) => s + e.assignedFaculties.length, 0);
  const deansLinked = externals.filter((e) => !!e.assignedDean).length;
  const getDeanName = (deanId: string) => deans.find((d) => d.id === deanId)?.name ?? deanId;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!user || !token || !dept) {
    return (
      <motion.div className="space-y-8 pb-12" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex justify-center py-16">
          <Empty className="max-w-md border-border/40 bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Authentication Required</EmptyTitle>
              <EmptyDescription>You need to be logged in as HOD to access this page.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => router.push("/auth/login")} className="gap-2 mt-4">
              Go to Login
            </Button>
          </Empty>
        </motion.div>
      </motion.div>
    );
  }

  if (loading) {
    return <Loader variant="page" message="Loading assignments and evaluators..." />;
  }

  if (externals.length === 0) {
    return (
      <motion.div className="space-y-8 pb-12" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex justify-center py-16">
          <Empty className="max-w-md border-border/40 bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No External Evaluators Found</EmptyTitle>
              <EmptyDescription>No external evaluators registered for your department yet.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => router.push("/hod/add-external-faculty")} className="gap-2 mt-4">
              <Plus size={16} /> Add External Faculty
            </Button>
          </Empty>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div className="space-y-8 pb-12" variants={containerVariants} initial="hidden" animate="visible">
        {/* ── Header Stats ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Registered Externals" value={externals.length} icon={Users} color="primary" />
          <StatCard title="Faculty Assigned" value={totalFacultyAssigned} icon={UserPlus} color="secondary" />
          <StatCard title="Deans Linked" value={deansLinked} icon={ShieldCheck} color="accent" />
        </motion.div>

        {/* ── Evaluator Grid ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Reviewer Assignments</h2>
          </div>

          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants}>
            {externals.map((ext) => {
              const assignedDeanId = ext.assignedDean;
              const assignedDeanName = assignedDeanId ? getDeanName(assignedDeanId) : null;

              return (
                <motion.div key={ext.userId} variants={itemVariants}>
                  <Card className="border shadow-sm hover:ring-1 hover:ring-primary/20 transition-all duration-300 h-full flex flex-col overflow-hidden">
                    {/* Card Header */}
                    <CardHeader className="pb-4 border-b border-border/50 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold text-indigo-900 flex items-center gap-2">
                            <span className="h-4 w-1 bg-indigo-600 rounded-full" />
                            {ext.full_name}
                          </CardTitle>
                          <CardDescription className="text-xs font-medium uppercase tracking-tight">
                            {ext.desg} &bull; {ext.organization}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-white/50 border-indigo-200 text-indigo-700">
                          {ext.assignedFaculties.length} Faculty
                        </Badge>
                      </div>

                      {/* Dean Banner */}
                      <div className="mt-3">
                        {assignedDeanName ? (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center">
                                <Crown size={14} className="text-amber-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-amber-900 leading-tight">Dean Evaluator</span>
                                <span className="text-[10px] text-amber-700 leading-tight truncate max-w-[150px]">
                                  {assignedDeanName}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveDean(ext.userId)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 rounded-lg border-dashed border border-amber-300 bg-amber-50/30">
                            <Info size={14} className="text-amber-500" />
                            <span className="text-[11px] font-medium text-amber-700 italic">No Dean assigned yet</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    {/* Assigned Faculty List */}
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="flex-1 max-h-[220px] overflow-y-auto px-5 py-4 space-y-2 thin-scrollbar bg-white/40">
                        {ext.assignedFaculties.length > 0 ? (
                          ext.assignedFaculties.map((f) => (
                            <div
                              key={f._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-border/60 shadow-sm hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                  <UserCheck size={14} className="text-indigo-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-foreground truncate">{f.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{f.desg}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignedDeanId ? (
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                                    onClick={() =>
                                      router.push(`/hod/evaluate/${f._id}?externalId=${ext.userId}`)
                                    }
                                  >
                                    Evaluate <FileText size={10} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                    onClick={() => handleRemoveFaculty(ext.userId, f._id)}
                                  >
                                    <X size={12} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-muted/10 rounded-xl border border-dashed">
                            <p className="text-xs text-muted-foreground italic">No faculty assigned yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="p-4 bg-muted/10 border-t border-border/50 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 gap-1.5 text-xs font-semibold border-amber-200 hover:bg-amber-100 hover:text-amber-800 text-amber-700"
                          onClick={() => openDeanModal(ext)}
                        >
                          <Crown size={14} />
                          {assignedDeanId ? "Change Dean" : "Link Dean"}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-9 gap-1.5 text-xs font-semibold shadow-indigo-200 shadow-lg"
                          onClick={() => openFacultyModal(ext)}
                        >
                          <Plus size={14} />
                          {ext.assignedFaculties.length > 0 ? "Manage Faculty" : "Assign Faculty"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Faculty Allocation Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 bg-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <UserPlus size={20} className="text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Assign Faculty Members</DialogTitle>
                <DialogDescription className="text-indigo-100 text-sm opacity-90">
                  Managing faculty for{" "}
                  <span className="font-bold underline">{activeExternal?.full_name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Dean status banner */}
            {activeExternal?.assignedDean && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                <Crown size={16} className="text-amber-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900">
                    Dean Assigned: {getDeanName(activeExternal.assignedDean)}
                  </p>
                  <p className="text-[10px] text-amber-700">
                    Faculty removals are locked when a Dean is assigned.
                  </p>
                </div>
              </div>
            )}

            {/* Search & Select All */}
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search by name or ID..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-9 h-11 border-indigo-100 focus:ring-indigo-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={handleSelectAll}
              >
                {filteredFacultyRows.every((f) => staged.has(f.id)) ? "Deselect All" : "Select All Visible"}
              </Button>
            </div>

            {/* Staged chips */}
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <h4 className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle size={12} /> Staged for Assignment ({staged.size})
              </h4>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {staged.size > 0 ? (
                  Array.from(staged).map((id) => {
                    const f = faculties.find((fac) => fac.id === id);
                    return f ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-white text-indigo-700 border-indigo-200 pr-1 gap-1 py-1 shadow-sm"
                      >
                        {f.name}
                        <button
                          onClick={() => toggleStaged(id, false)}
                          className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-indigo-100"
                        >
                          <X size={10} />
                        </button>
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-xs text-indigo-400 italic">No faculty selected.</span>
                )}
              </div>
            </div>

            {/* Faculty Table */}
            <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead className="text-xs font-bold uppercase">Faculty Details</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Designation</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacultyRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm italic">
                        No faculty matches your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFacultyRows.map((f) => {
                      const isStaged = staged.has(f.id);
                      const isOther = isAssignedToOther(f.id, activeExternal?.userId || "");
                      const isCurrent = activeExternal?.assignedFaculties.some((af) => af._id === f.id);

                      return (
                        <TableRow
                          key={f.id}
                          className={`group cursor-pointer ${
                            isOther
                              ? "opacity-40 cursor-not-allowed bg-muted/5"
                              : isStaged
                              ? "bg-indigo-50/40 hover:bg-indigo-50/60"
                              : "hover:bg-muted/20"
                          }`}
                          onClick={() => toggleStaged(f.id, isOther)}
                        >
                          <TableCell className="py-3 px-4">
                            <div
                              className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                isStaged
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "border-border group-hover:border-indigo-300"
                              }`}
                            >
                              {isStaged && <UserCheck size={12} className="text-white" />}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground">{f.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 py-0 border-indigo-100 text-indigo-600 bg-indigo-50/20"
                            >
                              {f.designation}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isOther ? (
                              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                                Already Allocated
                              </Badge>
                            ) : isCurrent ? (
                              <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">
                                Current
                              </Badge>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="px-8 font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleSaveFacultyAssignments}
              disabled={saving}
              className="px-10 font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              {saving ? "Processing..." : "Commit Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dean Allocation Dialog ─────────────────────────────────────────── */}
      <Dialog open={deanDialogOpen} onOpenChange={setDeanDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-amber-600 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Assign Interaction Dean</DialogTitle>
                <DialogDescription className="text-amber-100 text-sm opacity-90">
                  Selecting a Dean for{" "}
                  <span className="font-bold underline">{activeExternal?.full_name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 flex flex-col gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Find eligible Dean..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="pl-9 h-11 border-amber-100 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 thin-scrollbar">
              {filteredDeanRows.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center p-6 bg-amber-50/30 rounded-xl border border-dashed border-amber-200">
                  <span className="text-sm text-amber-800/60 font-medium italic">
                    No interaction deans found for this department.
                  </span>
                </div>
              ) : (
                filteredDeanRows.map((d) => {
                  const isCurrent = activeExternal?.assignedDean === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleAssignDean(d.id)}
                      disabled={saving}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                        isCurrent
                          ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300"
                          : "bg-white border-border hover:border-amber-400 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold truncate ${isCurrent ? "text-amber-900" : "text-foreground"}`}>
                          {d.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                          {d.email}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {isCurrent ? (
                          <Badge className="bg-amber-500 text-white border-transparent">Current</Badge>
                        ) : (
                          <ArrowRight
                            size={16}
                            className="text-amber-300 group-hover:text-amber-600 transition-transform group-hover:translate-x-1"
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/40">
              <span className="text-amber-600 font-bold uppercase mr-1">Note:</span>
              Only deans added to the Interaction Dean list for this department appear here.
              Manage the list from the Interaction Dean settings page.
            </p>
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t">
            <Button variant="ghost" onClick={() => setDeanDialogOpen(false)} className="w-full">
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
