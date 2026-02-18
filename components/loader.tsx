"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  /** "page" = centered section loader, "inline" = small spinner for buttons */
  variant?: "page" | "inline";
  /** Optional message shown below the spinner (page variant only) */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Loader({
  variant = "page",
  message,
  className,
}: LoaderProps) {
  if (variant === "inline") {
    return (
      <Loader2
        className={cn("h-4 w-4 animate-spin", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full py-12 flex flex-col justify-center items-center text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin mb-2" />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
