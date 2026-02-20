import { cn } from "@/lib/utils";
import React from "react";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Clean section card — no rainbow borders, no emoji icons.
 * Uses a simple left-aligned bold title and a subtle separator.
 */
export default function SectionCard({
  title,
  children,
  className,
  actions,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm p-6 mb-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h2 className="text-base font-semibold text-indigo-700 tracking-tight">
          {title}
        </h2>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
