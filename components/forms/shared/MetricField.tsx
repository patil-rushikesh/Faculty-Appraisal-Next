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

/**
 * Reusable field for metrics that require both a count/value and a proof document link.
 */
export default function MetricField({
    label,
    hint,
    name,
    value,
    onChange,
    proofValue,
    onProofChange,
    verifiedScore,
    placeholder = "0",
    proofPlaceholder = "Proof link (e.g. Google Drive)",
    disabled = false,
}: MetricFieldProps) {
    return (
        <div className="py-4 border-b border-border last:border-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Label and Hint */}
                <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium text-foreground block">
                        {label}
                    </label>
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:w-2/3 lg:w-3/5">
                    {/* Numeric Value Input */}
                    <div className="w-full sm:w-24 shrink-0">
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
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                        />
                    </div>

                    {/* Proof Document Link Input */}
                    <div className="flex-1 w-full">
                        <input
                            type="url"
                            value={proofValue}
                            onChange={onProofChange}
                            disabled={disabled}
                            placeholder={proofPlaceholder}
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition disabled:opacity-50"
                        />
                    </div>

                    {/* Verified Score Display (if present) */}
                    {verifiedScore !== undefined && (
                        <div className="w-16 shrink-0 bg-muted/40 rounded-md border border-border px-2 py-1.5 text-[11px] text-center font-bold text-muted-foreground" title="Verified Score">
                            {verifiedScore}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
