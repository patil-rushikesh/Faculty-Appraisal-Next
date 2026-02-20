import { cn } from "@/lib/utils";

interface ScoreCardProps {
    label: string;
    score: number | string;
    total: number | string;
    verifiedScore?: number | string;
    className?: string;
}

export default function ScoreCard({
    label,
    score,
    total,
    verifiedScore,
    className,
}: ScoreCardProps) {
    return (
        <div className={cn("mt-4 space-y-2", className)}>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="text-base font-bold text-indigo-600">
                    {score}
                    <span className="text-muted-foreground font-normal"> / {total}</span>
                </span>
            </div>
            {verifiedScore !== undefined && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                        Score After Verification
                    </span>
                    <span className="text-base font-semibold text-foreground">
                        {verifiedScore || "Pending"}
                    </span>
                </div>
            )}
        </div>
    );
}
