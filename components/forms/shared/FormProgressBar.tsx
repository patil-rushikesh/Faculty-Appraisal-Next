"use client";

import { cn } from "@/lib/utils";

interface FormProgressBarProps {
    progress: number;
    label?: string;
    className?: string;
}

/**
 * A sleek, monochromatic progress bar for appraisal forms.
 */
export default function FormProgressBar({
    progress,
    label = "Completion Progress",
    className,
}: FormProgressBarProps) {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className={cn("w-full space-y-2 mb-6", className)}>
            <div className="flex justify-between items-end">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                    {Math.round(clampedProgress)}%
                </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                    className="h-full bg-indigo-600 transition-all duration-500 ease-in-out"
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
}
