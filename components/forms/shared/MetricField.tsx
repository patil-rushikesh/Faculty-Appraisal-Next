import { cn } from "@/lib/utils";
import React from "react";

export interface MetricData {
    value: number;
    proof: string;
    verified?: number | string;
}

interface MetricFieldProps {
    label: string;
    hint?: string;
    name: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    proofValue: string;
    onProofChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    verifiedScore?: string | number;
    placeholder?: string;
    proofPlaceholder?: string;
    disabled?: boolean;
}

export default function MetricField({
    label,
    hint,
    name,
    value,
    onChange,
    proofValue,
    onProofChange,
    verifiedScore,
    placeholder = "Enter count",
    proofPlaceholder = "Proof Document Link (Google Drive)",
    disabled = false,
}: MetricFieldProps) {
    return (
        <div className="py-4 border-b border-border last:border-0">
            {/* Column headers (shown once per row for clarity) */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Label and Hint */}
                <div className="flex-1 min-w-0">
                    <label className="text-base font-semibold text-slate-900 block uppercase tracking-tight">
                        {label}
                    </label>
                    {hint && <p className="text-xs font-semibold text-muted-foreground uppercase opacity-70 tracking-tight">{hint}</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:w-2/3 lg:w-3/5">
                    {/* Numeric Value Input */}
                    <div className="w-full sm:w-28 shrink-0">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 hidden sm:block">{placeholder}</p>
                        <input
                            type="number"
                            name={name}
                            min={0}
                            disabled={disabled}
                            onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                            onWheel={(e) => e.currentTarget.blur()}
                            value={value === 0 ? "" : value}
                            onChange={onChange}
                            placeholder={placeholder}
                            className="w-full rounded-md border border-slate-400 bg-blue-50 px-3 py-1.5 text-base text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 placeholder:text-xs placeholder:font-normal placeholder:text-slate-900"
                        />
                    </div>

                    {/* Proof Document Link Input */}
                    <div className="flex-1 w-full">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 hidden sm:block">Proof Document</p>
                        <input
                            type="url"
                            value={proofValue}
                            onChange={onProofChange}
                            disabled={disabled}
                            placeholder={proofPlaceholder}
                            className="w-full rounded-md border border-slate-400 bg-background px-3 py-1.5 text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition disabled:opacity-50 placeholder:text-xs placeholder:font-normal placeholder:text-slate-900"
                        />
                    </div>

                    {/* Verified Score — hidden until enabled by verification team */}
                    <div className="hidden w-24 shrink-0">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Verified Score</p>
                        <input
                            type="text"
                            readOnly
                            disabled
                            value={verifiedScore !== undefined && verifiedScore !== 0 ? String(verifiedScore) : ""}
                            placeholder="Pending"
                            title="Score after verification (set by verification team)"
                            className="w-full rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-sm text-center font-bold text-green-700 cursor-not-allowed opacity-80 placeholder:text-green-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
