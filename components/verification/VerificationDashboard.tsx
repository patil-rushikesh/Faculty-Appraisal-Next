"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/AuthProvider";
import axios from "axios";
import {
    User as UserIcon,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loader from "@/components/loader";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

interface AssignedFaculty {
    _id: string;
    name: string;
    status: string;
    isApproved: boolean;
}

interface VerificationData {
    _id: string;
    name: string;
    assigned_faculties: Record<string, AssignedFaculty[]>;
}

export default function VerificationDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VerificationData | null>(null);

    const fetchAssigned = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const resp = await axios.get(`${BACKEND}/faculty_to_verify/${user.id}`, { withCredentials: true });
            setData(resp.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch assigned faculties");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAssigned();
    }, [fetchAssigned]);

    if (loading) return <Loader message="Fetching assigned faculties..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <AlertCircle className="w-16 h-16 text-destructive mb-4 opacity-20" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Error Loading Dashboard</h2>
                <p className="text-slate-600 font-medium mb-6 max-w-md">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider">
                    Retry
                </Button>
            </div>
        );
    }

    const hasAssignments = data && Object.keys(data.assigned_faculties).length > 0;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">
                        Paper Verification <span className="text-indigo-600">Panel</span>
                    </h1>
                    <p className="text-lg font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={20} className="text-indigo-500" />
                        Verifier: <span className="text-slate-900">{data?.name}</span>
                    </p>
                </div>
                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-6 py-4 flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Total Assigned</p>
                        <p className="text-2xl font-black text-indigo-700 leading-none">
                            {data ? Object.values(data.assigned_faculties).flat().length : 0}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-indigo-200" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Departments</p>
                        <p className="text-2xl font-black text-indigo-700 leading-none">
                            {data ? Object.keys(data.assigned_faculties).length : 0}
                        </p>
                    </div>
                </div>
            </header>

            {!hasAssignments ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                    <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No assigned faculties found</p>
                    <p className="text-slate-500 font-medium mt-2 italic">Assignments are managed by the administration</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {Object.entries(data!.assigned_faculties).map(([dept, faculties]) => (
                        <section key={dept} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                                    <Building2 size={20} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                    Department: <span className="text-indigo-600">{dept}</span>
                                </h2>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {faculties.map((faculty) => (
                                    <div
                                        key={faculty._id}
                                        className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                                    >
                                        <div className="p-5 flex-1 space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                    <UserIcon size={24} />
                                                </div>
                                                {faculty.isApproved ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors duration-300">
                                                    {faculty.name}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    ID: {faculty._id}
                                                </p>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                                <p className="text-sm font-bold text-slate-600 italic">
                                                    {faculty.status.replace(/_/g, " ").toUpperCase()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                            <Link
                                                href={`/verification-team/givemarks/${dept}/${faculty._id}`}
                                                className="flex-1"
                                            >
                                                <Button
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider text-xs gap-2 py-5 rounded-xl shadow-lg shadow-indigo-200"
                                                >
                                                    {faculty.isApproved ? "Review Marks" : "Verify & Mark"}
                                                    <ChevronRight size={16} />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
