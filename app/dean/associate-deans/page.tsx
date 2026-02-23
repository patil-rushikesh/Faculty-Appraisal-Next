"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────────────────────

interface AssociateDean {
  id: string;
  name: string;
  department: string;
  role: string;
  designation: string;
  status: "Portfolio_Mark_Dean_pending" | "Done" | "pending" | string;
}

const DEPARTMENTS = [
  "AIML", "ASH", "Civil", "Computer", "Computer(Regional)", "ENTC", "IT", "Mechanical",
];

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Portfolio_Mark_Dean_pending")
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Dean Portfolio Mark Pending</Badge>;
  if (status === "Done")
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Done</Badge>;
  if (status === "pending")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
  return (
    <Badge variant="secondary">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AssociateDeansPage() {
  const router = useRouter();

  const [list, setList] = useState<AssociateDean[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "department" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // TODO: GET /api/dean/:deanId/associates
    setLoading(false);
    setList([]);
  }, []);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col
      ? sortDir === "asc" ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />
      : null;

  const filtered = useMemo(() => {
    let data = list.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || a.department === deptFilter;
      return matchSearch && matchDept;
    });
    if (sortKey) {
      data = [...data].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return data;
  }, [list, search, deptFilter, sortKey, sortDir]);

  const handleEvaluate = (associate: AssociateDean) => {
    // Pass faculty info via query params so evaluation-form page can read them
    const params = new URLSearchParams({
      id: associate.id,
      name: associate.name,
      role: associate.role,
      department: associate.department,
      designation: associate.designation,
    });
    router.push(`/dean/evaluation-form?${params.toString()}`);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="border">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Associate Deans List
                <span className="text-sm font-normal text-muted-foreground ml-1">({filtered.length})</span>
              </CardTitle>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or Name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full sm:w-56"
                  />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Loading associates…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                      Name <SortIcon col="name" />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("department")}>
                      Department <SortIcon col="department" />
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                      Status <SortIcon col="status" />
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                        {list.length === 0 ? "No associate deans have been added yet." : "No results match your filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{a.id}</TableCell>
                        <TableCell className="text-sm">{a.department}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.role}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {a.status === "Portfolio_Mark_Dean_pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                              onClick={() => handleEvaluate(a)}
                            >
                              Give Portfolio Marks
                            </Button>
                          ) : a.status === "Done" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
                              <CheckCircle2 size={15} /> Evaluation Complete
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
