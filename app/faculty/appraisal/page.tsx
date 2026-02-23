"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PartAcademicInvolvement from "@/components/forms/parts/PartA_AcademicInvolvement";
import PartBResearch from "@/components/forms/parts/PartB_Research";
import PartCSelfDevelopment from "@/components/forms/parts/PartC_SelfDevelopment";
import PartDPortfolio from "@/components/forms/parts/PartD_Portfolio";
import PartEExtra from "@/components/forms/parts/PartE_Extra";
import PartFReview from "@/components/forms/parts/PartF_Review";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignationValue } from "@/lib/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const tabs = [
    { id: "A", label: "Part A", description: "Academic Involvement" },
    { id: "B", label: "Part B", description: "Research" },
    { id: "C", label: "Part C", description: "Self Development" },
    { id: "D", label: "Part D", description: "Portfolio" },
    { id: "E", label: "Part E", description: "Extra Contributions" },
    { id: "F", label: "Review", description: "Review and submit" },
];

const VALID_TABS = ["A", "B", "C", "D", "E", "F"];

/** Inner component — uses useSearchParams, must be inside Suspense */
function AppraisalContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab")?.toUpperCase() ?? "A";
    const initialTab = VALID_TABS.includes(tabParam) ? tabParam : "A";
    const [activeTab, setActiveTab] = useState<string>(initialTab);

    // Sync tab → URL when changed via tab strip
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.replace(`/faculty/appraisal?tab=${tab}`, { scroll: false });
    };

    // Sync URL → tab when sidebar link changes the query param
    useEffect(() => {
        const t = searchParams.get("tab")?.toUpperCase() ?? "A";
        if (VALID_TABS.includes(t) && t !== activeTab) setActiveTab(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const department = user?.department ?? "";
    const userId = user?.id ?? "";
    const userRole = user?.role ?? "";
    const userDesignation = (user?.designation as DesignationValue) ?? "Assistant Professor";
    const isAdminFromDesignation = ["Director", "Dean", "Associate Dean", "HOD", "Associate Director"].includes(userDesignation);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Hero header */}
            <div className="bg-card border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Faculty Appraisal</h1>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
                            {user?.name} &bull; {userRole} &bull; {department}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    {/* Custom tab list in a scrollable horizontal strip */}
                    <TabsList className="w-full h-auto bg-muted/60 backdrop-blur rounded-xl p-1 overflow-x-auto flex gap-1 mb-6">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className={cn(
                                    "flex-1 min-w-[110px] flex flex-col items-center gap-0.5 py-3 px-2 rounded-lg text-sm transition-all duration-200 border-b-2 border-transparent",
                                    "data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 data-[state=active]:font-semibold data-[state=active]:border-indigo-600"
                                )}
                            >
                                <span className="text-sm font-medium">{tab.label}</span>
                                <span className="text-muted-foreground opacity-70 text-[11px] font-normal leading-tight text-center">
                                    {tab.description}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Part A */}
                    <TabsContent value="A" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartAcademicInvolvement
                            userDesignation={userDesignation}
                            apiBase={API_BASE}
                            department={department}
                            userId={userId}
                        />
                    </TabsContent>

                    {/* Part B */}
                    <TabsContent value="B" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartBResearch
                            apiBase={API_BASE}
                            department={department}
                            userId={userId}
                            userDesignation={userDesignation}
                        />
                    </TabsContent>

                    {/* Part C */}
                    <TabsContent value="C" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartCSelfDevelopment
                            apiBase={API_BASE}
                            department={department}
                            userId={userId}
                            userDesignation={userDesignation}
                        />
                    </TabsContent>

                    {/* Part D */}
                    <TabsContent value="D" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartDPortfolio
                            apiBase={API_BASE}
                            department={department}
                            userId={userId}
                            userDesignation={userDesignation}
                            isAdminFromDesignation={isAdminFromDesignation}
                        />
                    </TabsContent>

                    {/* Part E */}
                    <TabsContent value="E" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartEExtra apiBase={API_BASE} department={department} userId={userId} />
                    </TabsContent>

                    {/* Review and submit */}
                    <TabsContent value="F" forceMount className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
                        <PartFReview apiBase={API_BASE} department={department} userId={userId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default function FacultyAppraisalPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
                    Loading…
                </div>
            }
        >
            <AppraisalContent />
        </Suspense>
    );
}
