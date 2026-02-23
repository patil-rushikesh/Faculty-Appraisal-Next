"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Briefcase, BookOpen, Building2, MapPin, Trash2, Plus } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExternalFaculty {
  id: string;
  full_name: string;
  mail: string;
  mob: string;
  desg: string;
  specialization: string;
  organization: string;
  address: string;
}

const EMPTY_FORM = {
  full_name: "",
  mail: "",
  mob: "",
  desg: "",
  specialization: "",
  organization: "",
  address: "",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AddExternalFacultyPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [externalList, setExternalList] = useState<ExternalFaculty[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ExternalFaculty | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.mail) {
      toast({ title: "Validation Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // TODO: POST /api/hod/add-external-faculty
      await new Promise((r) => setTimeout(r, 600));
      const newEntry: ExternalFaculty = { id: Date.now().toString(), ...formData };
      setExternalList((prev) => [newEntry, ...prev]);
      setFormData({ ...EMPTY_FORM });
      toast({ title: "External faculty added", description: `${newEntry.full_name} has been registered.` });
    } catch {
      toast({ title: "Error", description: "Failed to add external faculty.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // TODO: DELETE /api/hod/external-faculty/:id
      await new Promise((r) => setTimeout(r, 400));
      setExternalList((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast({ title: "Removed", description: `${deleteTarget.full_name} has been removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to remove external faculty.", variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const fields: { name: keyof typeof EMPTY_FORM; label: string; icon: React.ReactNode; placeholder: string; type?: string }[] = [
    { name: "full_name",     label: "Full Name",        icon: <User size={15} />,      placeholder: "Dr. Jane Smith" },
    { name: "mail",          label: "Email",            icon: <Mail size={15} />,      placeholder: "jane@example.com", type: "email" },
    { name: "mob",           label: "Mobile",           icon: <Phone size={15} />,     placeholder: "+91 9876543210" },
    { name: "desg",          label: "Designation",      icon: <Briefcase size={15} />, placeholder: "Professor" },
    { name: "specialization",label: "Specialization",   icon: <BookOpen size={15} />,  placeholder: "Machine Learning" },
    { name: "organization",  label: "Organization",     icon: <Building2 size={15} />, placeholder: "IIT Bombay" },
    { name: "address",       label: "Address",          icon: <MapPin size={15} />,    placeholder: "Mumbai, Maharashtra" },
  ];

  return (
    <>
      <motion.div
        className="flex flex-col gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Form */}
        <motion.div variants={itemVariants}>
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus size={16} className="text-primary" /> Register External Evaluator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {fields.map((f) => (
                    <div key={f.name} className="space-y-1.5">
                      <Label htmlFor={f.name} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {f.label}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">{f.icon}</span>
                        <Input
                          id={f.name}
                          name={f.name}
                          type={f.type ?? "text"}
                          placeholder={f.placeholder}
                          value={formData[f.name]}
                          onChange={handleChange}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="submit" className="mt-5" disabled={loading}>
                  {loading ? "Adding…" : "Add External Faculty"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* List */}
        <motion.div variants={itemVariants}>
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Registered External Evaluators
                <span className="ml-2 text-sm font-normal text-muted-foreground">({externalList.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                        No external evaluators registered yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    externalList.map((ef) => (
                      <TableRow key={ef.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <p className="font-medium text-foreground">{ef.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ef.mail}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ef.organization || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ef.specialization || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(ef)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove external faculty?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.full_name}</strong> will be removed from the external evaluators list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
