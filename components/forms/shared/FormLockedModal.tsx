"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormLockedModalProps {
    formStatus: string;
    onClose: () => void;
}

export default function FormLockedModal({
    formStatus,
    onClose,
}: FormLockedModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-border">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-7 w-7 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Form Locked</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        This form cannot be edited because its current status is{" "}
                        <span className="font-semibold text-foreground capitalize">
                            &ldquo;{formStatus}&rdquo;
                        </span>
                        . Only forms with <em>pending</em> status can be modified.
                    </p>
                    <Button onClick={onClose} className="mt-2 w-full">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
