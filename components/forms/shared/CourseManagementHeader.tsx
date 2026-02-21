"use client";

import React, { useState, useEffect } from "react";
import { useCourses, Course } from "@/context/CourseContext";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const CourseManagementHeader = () => {
    const { courses, setCourses, isInitialized } = useCourses();

    const addCourse = () => {
        // Prevent adding new if there's already an empty one
        if (courses.some((c) => !c.code.trim())) return;
        setCourses((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), code: "", semester: "Sem I" }]);
    };

    const updateCourse = (id: string, field: keyof Course, value: string) => {
        setCourses((prev) =>
            prev.map((course) =>
                course.id === id ? { ...course, [field]: value } : course
            )
        );
    };

    const deleteCourse = (id: string) => {
        setCourses((prev) => prev.filter((course) => course.id !== id));
    };

    if (!isInitialized) return null;

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-indigo-600 rounded-full" />
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Subject Selection
                    </h2>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                    Academic Year 2024-25
                </p>
            </div>

            <div className="space-y-3">
                {courses.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">
                            No subjects added yet. Add your subjects to begin.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10"
                            >
                                <input
                                    type="text"
                                    placeholder="Course Code / Subject Name"
                                    value={course.code}
                                    onChange={(e) => updateCourse(course.id, "code", e.target.value)}
                                    className="flex-1 text-sm font-bold uppercase p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                                />
                                <select
                                    value={course.semester}
                                    onChange={(e) => updateCourse(course.id, "semester", e.target.value as any)}
                                    className="text-sm font-bold p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                                >
                                    <option value="Sem I">Sem I</option>
                                    <option value="Sem II">Sem II</option>
                                </select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCourse(course.id)}
                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-start">
                    <Button
                        onClick={addCourse}
                        disabled={courses.some((c) => !c.code.trim())}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        <Plus size={14} /> Add Subject
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseManagementHeader;
