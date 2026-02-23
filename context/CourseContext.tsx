"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Course {
    id: string;
    code: string;
    semester: "Sem I" | "Sem II";
    metadata?: any;
}

interface CourseContextType {
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    isInitialized: boolean;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("appraisal_courses");
        if (stored) {
            try {
                setCourses(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored courses", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Persist to localStorage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("appraisal_courses", JSON.stringify(courses));
        }
    }, [courses, isInitialized]);

    return (
        <CourseContext.Provider value={{ courses, setCourses, isInitialized }}>
            {children}
        </CourseContext.Provider>
    );
}

export function useCourses() {
    const context = useContext(CourseContext);
    if (context === undefined) {
        throw new Error("useCourses must be used within a CourseProvider");
    }
    return context;
}
