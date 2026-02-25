"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ROLE_FACTOR, ROLE_MAX, PART_A_MAXES, PartAScoreKey } from "@/lib/forms/constants";
import { DesignationValue } from "@/lib/constants";
import { useCourses } from "@/context/CourseContext";
import SectionCard from "../shared/SectionCard";
import FormProgressBar from "../shared/FormProgressBar";
import CourseManagementHeader from "../shared/CourseManagementHeader";
import Loader from "@/components/loader";

// --- CONSTANTS ---
const ACADEMIC_SECTIONS: {
  title: string;
  field: PartAScoreKey;
  formula: string;
}[] = [
    {
      title: "Result Analysis",
      field: "resultAnalysis",
      formula: "Marks = 10 * [(Students > 60% * 5 + Students 50-59% * 4 + Students 40-49% * 3) / Total Students]"
    },
    {
      title: "Course Outcome Analysis",
      field: "courseOutcome",
      formula: "Marks = 20 + (Avg CO % * 30 / 100) [for timely submission]"
    },
    {
      title: "E-Learning Content Development",
      field: "eLearning",
      formula: "Marks = Number of instances * 10"
    },
    {
      title: "Academic Engagement",
      field: "academicEngagement",
      formula: "Marks = 50 * (Present Students / Enrolled Students Total)"
    },
    {
      title: "Teaching Load",
      field: "teachingLoad",
      formula: "Marks = Min(50, 50 * [(Avg Load + E) / Min Load]) [Min Load: Prof=12, Assoc=14, Asst=16]"
    },
    {
      title: "UG Projects / PG Dissertations Guided",
      field: "projectsGuided",
      formula: "Marks = Min(40, Count * 20)"
    },
    {
      title: "Feedback of Faculty by Student",
      field: "studentFeedback",
      formula: "Marks = Average Feedback Performance Index"
    },
    {
      title: "Guardian / PTG Meetings",
      field: "ptgMeetings",
      formula: "Marks = (Meetings * 50) / 6 [Max 50]"
    },
  ];

// --- SECTION MANDATORY CONFIG ---
// Defines which sections of Part A are mandatory for form submission.
// If a mandatory section has zero score (indicating no data was entered),
// the form will not be submitted until it is filled.
const SECTION_CONFIG: { name: string; field: PartAScoreKey; mandatory: boolean }[] = [
  { name: "Result Analysis", field: "resultAnalysis", mandatory: true },
  { name: "Course Outcome Analysis", field: "courseOutcome", mandatory: true },
  { name: "E-Learning Content Development", field: "eLearning", mandatory: false },
  { name: "Academic Engagement", field: "academicEngagement", mandatory: true },
  { name: "Teaching Load", field: "teachingLoad", mandatory: true },
  { name: "UG Projects / PG Dissertations Guided", field: "projectsGuided", mandatory: false },
  { name: "Feedback of Faculty by Student", field: "studentFeedback", mandatory: true },
  { name: "Guardian / PTG Meetings", field: "ptgMeetings", mandatory: false },
];


// --- TYPES ---
interface CourseData {
  studentsAbove60: string;
  students50to59: string;
  students40to49: string;
  totalStudents: string;
  coAttainment: string;
  timelySubmissionCO: boolean;
  studentsPresent: string;
  totalEnrolledStudents: string;
  feedbackPercentage: string;
}

interface ScoreState {
  resultAnalysis: number;
  courseOutcome: number;
  eLearning: number;
  academicEngagement: number;
  teachingLoad: number;
  projectsGuided: number;
  studentFeedback: number;
  ptgMeetings: number;
}

interface PartAAcademicInvolvementProps {
  userDesignation?: DesignationValue;
  apiBase: string;
  department: string;
  userId: string;
}

// --- HELPERS ---
const MetricInputField = ({ label, value, onChange, className = "", placeholder = "Enter value" }: { label: string; value: string | undefined; onChange: (v: string) => void; className?: string; placeholder?: string }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-base uppercase font-extrabold text-indigo-900 tracking-wider block px-0.5" style={{letterSpacing: '0.08em'}}>
      {label}
    </label>
    <input
      type="number"
      min={0}
      aria-label={label}
      onWheel={(e) => e.currentTarget.blur()}
      onKeyDown={(e) => e.key === "-" && e.preventDefault()}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2 text-lg font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-600 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm placeholder:text-xs placeholder:font-normal placeholder:text-slate-900"
    />
  </div>
);

// --- COMPONENT ---
function PartAAcademicInvolvement({
  userDesignation = "Professor",
  apiBase,
  department,
  userId
}: PartAAcademicInvolvementProps) {
  const { courses, isInitialized, setCourses } = useCourses();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [manualSections, setManualSections] = useState<Record<PartAScoreKey, boolean>>({
    resultAnalysis: false,
    courseOutcome: false,
    eLearning: false,
    academicEngagement: false,
    teachingLoad: false,
    projectsGuided: false,
    studentFeedback: false,
    ptgMeetings: false,
  });

  const [scores, setScores] = useState<ScoreState>({
    resultAnalysis: 0,
    courseOutcome: 0,
    eLearning: 0,
    academicEngagement: 0,
    teachingLoad: 0,
    projectsGuided: 0,
    studentFeedback: 0,
    ptgMeetings: 0,
  });

  // Per-course data state
  const [courseMetrics, setCourseMetrics] = useState<Record<string, CourseData>>({});

  // Global metric state
  const [globalMetrics, setGlobalMetrics] = useState({
    eLearningInstances: "",
    weeklyLoadSem1: "",
    weeklyLoadSem2: "",
    adminResponsibility: false,
    projectsGuided: "",
    ptgMeetings: "",
  });

  // --- LOCAL STORAGE PERSISTENCE ---
  const STORAGE_KEY = `partA_data_${userId}`;

  // Load from local storage on mount (as fallback)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.courseMetrics) setCourseMetrics(parsed.courseMetrics);
        if (parsed.globalMetrics) setGlobalMetrics(parsed.globalMetrics);
        if (parsed.manualSections) setManualSections(parsed.manualSections);
        if (parsed.scores) setScores(parsed.scores);
      } catch (e) {
        console.error("Failed to parse saved Part A data", e);
      }
    }
  }, [STORAGE_KEY]);

  // Save to local storage on change
  useEffect(() => {
    if (!isLoading) {
      const dataToSave = {
        courseMetrics,
        globalMetrics,
        manualSections,
        scores
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [courseMetrics, globalMetrics, manualSections, scores, STORAGE_KEY, isLoading]);

  // Load data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${apiBase}/${department}/${userId}/A`, { validateStatus: () => true });
        if (res.status >= 200 && res.status < 300) {
          const data = res.data;

          // Check if we have local data already. If we do, we might want to be careful.
          // For now, let's merge or only load if local is empty.
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            // If there's non-empty local data, we prefer it as the active draft
            if (Object.keys(parsed.courseMetrics || {}).length > 0 || parsed.globalMetrics?.eLearningInstances) {
              setIsLoading(false);
              return;
            }
          }

          // 1. Manual scoring status
          if (data.isManualScoring) {
            const ms: any = {};
            ACADEMIC_SECTIONS.forEach((s) => {
              ms[s.field] = true;
            });
            setManualSections(ms);
          }

          // 2. Load global metrics
          setGlobalMetrics({
            eLearningInstances: data["3"]?.elearningInstances?.toString() || "",
            weeklyLoadSem1: data["5"]?.weeklyLoadSem1?.toString() || "",
            weeklyLoadSem2: data["5"]?.weeklyLoadSem2?.toString() || "",
            adminResponsibility: data["5"]?.adminResponsibility === 1,
            projectsGuided: data["6"]?.projectsGuided?.toString() || "",
            ptgMeetings: data["8"]?.ptgMeetings?.toString() || "",
          });

          // 3. Load course metrics
          if (data["1"]?.courses) {
            const newMetrics: Record<string, CourseData> = {};
            const loadedCourses: any[] = [];

            Object.entries(data["1"].courses).forEach(([code, cData]: [string, any]) => {
              const id = Math.random().toString(36).substr(2, 9);
              loadedCourses.push({
                id,
                code,
                semester: data["2"]?.courses[code]?.semester || "Sem I"
              });
              newMetrics[id] = {
                studentsAbove60: cData.studentsAbove60?.toString() || "",
                students50to59: cData.students50to59?.toString() || "",
                students40to49: cData.students40to49?.toString() || "",
                totalStudents: cData.totalStudents?.toString() || "",
                coAttainment: data["2"]?.courses[code]?.coAttainment?.toString() || "",
                timelySubmissionCO: data["2"]?.courses[code]?.timelySubmissionCO || false,
                studentsPresent: data["4"]?.courses[code]?.studentsPresent?.toString() || "",
                totalEnrolledStudents: data["4"]?.courses[code]?.totalEnrolledStudents?.toString() || "",
                feedbackPercentage: data["7"]?.courses[code]?.feedbackPercentage?.toString() || "",
              };
            });

            if (loadedCourses.length > 0) {
              setCourses(loadedCourses);
              setCourseMetrics(newMetrics);
            }
          }
        }
      } catch (e) {
        console.error("Fetch A failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (isInitialized) fetchData();
  }, [apiBase, department, userId, isInitialized, setCourses, STORAGE_KEY]);

  // Sync courseMetrics when courses change (ID maintenance)
  useEffect(() => {
    setCourseMetrics(prev => {
      const next = { ...prev };
      let changed = false;
      courses.forEach(c => {
        if (!next[c.id]) {
          next[c.id] = {
            studentsAbove60: "",
            students50to59: "",
            students40to49: "",
            totalStudents: "",
            coAttainment: "",
            timelySubmissionCO: false,
            studentsPresent: "",
            totalEnrolledStudents: "",
            feedbackPercentage: "",
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [courses]);

  // --- HELPERS ---
  const handleCourseMetricChange = (courseId: string, field: keyof CourseData, value: string | boolean) => {
    setCourseMetrics(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], [field]: value }
    }));
  };

  const toggleManual = (field: PartAScoreKey) => {
    setManualSections((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const setScore = (field: PartAScoreKey, value: number) => {
    setScores((prev) => ({
      ...prev,
      [field]: Math.min(PART_A_MAXES[field], Math.max(0, value)),
    }));
  };

  const handleSubmit = async () => {
    // Validate mandatory sections before submission
    const unfilledMandatory = SECTION_CONFIG.filter(
      (s) => s.mandatory && scores[s.field] === 0
    );
    if (unfilledMandatory.length > 0) {
      setSubmitError(
        `Please fill the following mandatory sections before saving: ${unfilledMandatory.map((s) => s.name).join(", ")}`
      );
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const activeCourseIds = courses.map(c => c.id);
      const relevantCourseMetrics = activeCourseIds.map(id => ({ ...courseMetrics[id], code: courses.find(c => c.id === id)?.code, sem: courses.find(c => c.id === id)?.semester }));

      const payload: any = {
        isManualScoring: Object.values(manualSections).some(v => v), // Legacy bridge
        1: {
          courses: Object.fromEntries(relevantCourseMetrics.map(m => [m.code, {
            studentsAbove60: Number(m.studentsAbove60) || 0,
            students50to59: Number(m.students50to59) || 0,
            students40to49: Number(m.students40to49) || 0,
            totalStudents: Number(m.totalStudents) || 0,
            marks: (10 * ((Number(m.studentsAbove60) || 0) * 5 + (Number(m.students50to59) || 0) * 4 + (Number(m.students40to49) || 0) * 3)) / (Number(m.totalStudents) || 1)
          }])),
          total_marks: scores.resultAnalysis
        },
        2: {
          courses: Object.fromEntries(relevantCourseMetrics.map(m => [m.code, {
            coAttainment: Number(m.coAttainment) || 0,
            timelySubmissionCO: m.timelySubmissionCO,
            semester: m.sem,
            marks: (Number(m.coAttainment) || 0) * 30 / 100 + (m.timelySubmissionCO ? 20 : 0)
          }])),
          total_marks: scores.courseOutcome
        },
        3: {
          elearningInstances: Number(globalMetrics.eLearningInstances) || 0,
          total_marks: scores.eLearning
        },
        4: {
          courses: Object.fromEntries(relevantCourseMetrics.map(m => [m.code, {
            studentsPresent: Number(m.studentsPresent) || 0,
            totalEnrolledStudents: Number(m.totalEnrolledStudents) || 0,
            marks: 50 * ((Number(m.studentsPresent) || 0) / (Number(m.totalEnrolledStudents) || 1))
          }])),
          total_marks: scores.academicEngagement
        },
        5: {
          weeklyLoadSem1: Number(globalMetrics.weeklyLoadSem1) || 0,
          weeklyLoadSem2: Number(globalMetrics.weeklyLoadSem2) || 0,
          adminResponsibility: globalMetrics.adminResponsibility ? 1 : 0,
          cadre: userDesignation,
          total_marks: scores.teachingLoad
        },
        6: {
          projectsGuided: Number(globalMetrics.projectsGuided) || 0,
          total_marks: scores.projectsGuided
        },
        7: {
          courses: Object.fromEntries(relevantCourseMetrics.map(m => [m.code, {
            feedbackPercentage: Number(m.feedbackPercentage) || 0,
            marks: Number(m.feedbackPercentage) || 0
          }])),
          total_marks: scores.studentFeedback
        },
        8: {
          ptgMeetings: Number(globalMetrics.ptgMeetings) || 0,
          total_marks: scores.ptgMeetings
        },
        total_marks: finalScore
      };

      const res = await axios.post(`${apiBase}/${department}/${userId}/A`, payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      });
      if (res.status < 200 || res.status >= 300) throw new Error("Save Failed");
      alert("Performance data saved successfully!");
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- AUTOMATED CALCULATION LOGIC ---
  useEffect(() => {
    const activeCourseIds = courses.map(c => c.id);
    const relevantCourseMetrics = activeCourseIds.map(id => courseMetrics[id]).filter(Boolean);

    setScores(prevScores => {
      const nextScores = { ...prevScores };

      // A. Course-based Metrics
      if (relevantCourseMetrics.length > 0) {
        // 1. Result Analysis
        if (!manualSections.resultAnalysis) {
          let totalVal = 0;
          relevantCourseMetrics.forEach(m => {
            const above60 = Number(m.studentsAbove60) || 0;
            const s50 = Number(m.students50to59) || 0;
            const s40 = Number(m.students40to49) || 0;
            const total = Number(m.totalStudents) || 1;
            totalVal += (10 * (above60 * 5 + s50 * 4 + s40 * 3)) / total;
          });
          nextScores.resultAnalysis = totalVal / relevantCourseMetrics.length;
        }

        // 2. Course Outcome
        if (!manualSections.courseOutcome) {
          let totalVal = 0;
          relevantCourseMetrics.forEach(m => {
            const attainment = Number(m.coAttainment) || 0;
            const bonus = m.timelySubmissionCO ? 20 : 0;
            totalVal += (attainment * 30 / 100) + bonus;
          });
          nextScores.courseOutcome = totalVal / relevantCourseMetrics.length;
        }

        // 4. Academic Engagement
        if (!manualSections.academicEngagement) {
          let totalVal = 0;
          relevantCourseMetrics.forEach(m => {
            const present = Number(m.studentsPresent) || 0;
            const total = Number(m.totalEnrolledStudents) || 1;
            totalVal += 50 * (present / total);
          });
          nextScores.academicEngagement = totalVal / relevantCourseMetrics.length;
        }

        // 7. Student Feedback
        if (!manualSections.studentFeedback) {
          let totalVal = 0;
          relevantCourseMetrics.forEach(m => {
            totalVal += Number(m.feedbackPercentage) || 0;
          });
          nextScores.studentFeedback = totalVal / relevantCourseMetrics.length;
        }
      }

      // B. Global Metrics

      // 3. E-Learning
      if (!manualSections.eLearning) {
        nextScores.eLearning = Math.min(50, (Number(globalMetrics.eLearningInstances) || 0) * 10);
      }

      // 5. Teaching Load
      if (!manualSections.teachingLoad) {
        const loadSem1 = Number(globalMetrics.weeklyLoadSem1) || 0;
        const loadSem2 = Number(globalMetrics.weeklyLoadSem2) || 0;
        const avgLoad = (loadSem1 + loadSem2) / 2;
        const e = globalMetrics.adminResponsibility ? 2 : 0;

        let minLoad = 16;
        if (userDesignation === "Professor") minLoad = 12;
        else if (userDesignation === "Associate Professor") minLoad = 14;

        nextScores.teachingLoad = Math.min(50, 50 * ((avgLoad + e) / minLoad));
      }

      // 6. Projects Guided
      if (!manualSections.projectsGuided) {
        nextScores.projectsGuided = Math.min(40, (Number(globalMetrics.projectsGuided) || 0) * 20);
      }

      // 8. PTG Meetings
      if (!manualSections.ptgMeetings) {
        nextScores.ptgMeetings = Math.min(50, (Number(globalMetrics.ptgMeetings) || 0) * 50 / 6);
      }

      return nextScores;
    });
  }, [courseMetrics, globalMetrics, manualSections, courses, userDesignation]);

  const rawSum = Object.values(scores).reduce((a, b) => a + b, 0);
  const factor = ROLE_FACTOR[userDesignation] ?? 1.0;
  const maxScore = ROLE_MAX[userDesignation] ?? 440;
  const finalScore = Math.round(Math.min(maxScore, rawSum * factor));

  // Progress Calculation
  const interactedCount = Object.values(scores).filter((v) => v > 0).length;
  const totalFields = Object.keys(scores).length;
  const progressPercent = (interactedCount / totalFields) * 100;

  if (isLoading) return <Loader message="Loading Academic Performance..." />;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 text-[1.15rem]" style={{lineHeight: 1.7}}>
      <CourseManagementHeader />
      <FormProgressBar progress={progressPercent} label="Part A Completion" />

      <div className="flex items-center justify-between rounded-2xl border-2 border-indigo-200 bg-card px-7 py-5 shadow-md">
        <span className="text-lg font-extrabold text-indigo-800 tracking-tight uppercase">
          Part A: Academic Involvement
        </span>
        <div className="flex items-center gap-3">
          <span className="text-base text-indigo-900 uppercase font-extrabold tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg">
            Designation: {userDesignation}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {ACADEMIC_SECTIONS.map(({ title, field, formula }) => (
          <SectionCard
            key={field}
            title={title}
            actions={
              <button
                type="button"
                aria-pressed={manualSections[field]}
                aria-label={manualSections[field] ? `Manual entry enabled for ${title}` : `Enable manual entry for ${title}`}
                onClick={() => toggleManual(field)}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-700 ${manualSections[field]
                  ? "bg-indigo-700 text-white border-indigo-700 shadow-md"
                  : "bg-white text-indigo-700 border-indigo-300 hover:border-indigo-700 hover:text-indigo-900"
                  }`}
              >
                {manualSections[field] ? "Manual Entry On" : "Enable Manual Entry"}
              </button>
            }
          >
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-100 shadow-sm">
                <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest mb-1 opacity-80">
                  Computation Guidelines
                </p>
                <p className="text-base text-indigo-900 leading-relaxed italic font-semibold">
                  {formula}
                </p>
              </div>

              {/* Data Entry Fields */}
              {!manualSections[field] && (
                <div className="space-y-5">
                  {/* Result Analysis Per Subject */}
                  {field === "resultAnalysis" && courses.map(c => (
                    <div key={c.id} className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50 space-y-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded border border-indigo-200">
                          Subject: {c.code || "Unnamed"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <MetricInputField label="Students > 60%" value={courseMetrics[c.id]?.studentsAbove60} onChange={(v) => handleCourseMetricChange(c.id, "studentsAbove60", v)} placeholder="Enter number of students" />
                        <MetricInputField label="Students 50-59%" value={courseMetrics[c.id]?.students50to59} onChange={(v) => handleCourseMetricChange(c.id, "students50to59", v)} placeholder="Enter number of students" />
                        <MetricInputField label="Students 40-49%" value={courseMetrics[c.id]?.students40to49} onChange={(v) => handleCourseMetricChange(c.id, "students40to49", v)} placeholder="Enter number of students" />
                        <MetricInputField label="Total Students" value={courseMetrics[c.id]?.totalStudents} onChange={(v) => handleCourseMetricChange(c.id, "totalStudents", v)} placeholder="Enter total number of students" />
                      </div>
                    </div>
                  ))}

                  {/* Course Outcome Analysis Per Subject */}
                  {field === "courseOutcome" && courses.map(c => (
                    <div key={c.id} className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50 space-y-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded border border-indigo-200">
                          Subject: {c.code || "Unnamed"} ({c.semester})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <MetricInputField label="Avg CO Attainment (%)" value={courseMetrics[c.id]?.coAttainment} onChange={(v) => handleCourseMetricChange(c.id, "coAttainment", v)} placeholder="Enter CO attainment percentage" />
                        <div className="flex flex-col gap-2 justify-center">
                          <label className="text-base uppercase font-extrabold text-indigo-900 tracking-wider">Timely Submission</label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={courseMetrics[c.id]?.timelySubmissionCO} onChange={(e) => handleCourseMetricChange(c.id, "timelySubmissionCO", e.target.checked)} className="w-5 h-5 rounded border-indigo-300 text-indigo-700 focus:ring-indigo-400" aria-label="Timely Submission" />
                            <span className="text-base font-semibold text-indigo-800 group-hover:text-indigo-900 transition-colors">Submitted on time</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* E-Learning Global */}
                  {field === "eLearning" && (
                    <MetricInputField label="Number of E-Learning Content Instances" value={globalMetrics.eLearningInstances} onChange={(v) => setGlobalMetrics(p => ({ ...p, eLearningInstances: v }))} className="max-w-xs" placeholder="Enter number of instances" />
                  )}

                  {/* Academic Engagement Per Subject */}
                  {field === "academicEngagement" && courses.map(c => (
                    <div key={c.id} className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50 space-y-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded border border-indigo-200">
                          Subject: {c.code || "Unnamed"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <MetricInputField label="Students Present" value={courseMetrics[c.id]?.studentsPresent} onChange={(v) => handleCourseMetricChange(c.id, "studentsPresent", v)} placeholder="Enter number of students present" />
                        <MetricInputField label="Total Enrolled Students" value={courseMetrics[c.id]?.totalEnrolledStudents} onChange={(v) => handleCourseMetricChange(c.id, "totalEnrolledStudents", v)} placeholder="Enter total enrolled students" />
                      </div>
                    </div>
                  ))}

                  {/* Teaching Load Global */}
                  {field === "teachingLoad" && (
                    <div className="space-y-5 max-w-lg">
                      <div className="grid grid-cols-2 gap-5">
                        <MetricInputField label="Weekly Load Sem I" value={globalMetrics.weeklyLoadSem1} onChange={(v) => setGlobalMetrics(p => ({ ...p, weeklyLoadSem1: v }))} placeholder="e.g. 18 hours/week" />
                        <MetricInputField label="Weekly Load Sem II" value={globalMetrics.weeklyLoadSem2} onChange={(v) => setGlobalMetrics(p => ({ ...p, weeklyLoadSem2: v }))} placeholder="e.g. 16 hours/week" />
                      </div>
                      <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 cursor-pointer group">
                        <input type="checkbox" checked={globalMetrics.adminResponsibility} onChange={(e) => setGlobalMetrics(p => ({ ...p, adminResponsibility: e.target.checked }))} className="w-6 h-6 rounded border-indigo-300 text-indigo-700 focus:ring-indigo-400" aria-label="Admin Responsibility" />
                        <div>
                          <p className="text-base font-extrabold text-indigo-900 group-hover:text-indigo-700 transition-colors uppercase tracking-tight">Admin Responsibility</p>
                          <p className="text-xs text-indigo-700 opacity-90">(Held Dean/HOD/HOD and HOD roles)</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Projects Guided Global */}
                  {field === "projectsGuided" && (
                    <MetricInputField label="Number of Projects/Dissertations Guided" value={globalMetrics.projectsGuided} onChange={(v) => setGlobalMetrics(p => ({ ...p, projectsGuided: v }))} className="max-w-xs" placeholder="Enter count" />
                  )}

                  {/* Student Feedback Per Subject */}
                  {field === "studentFeedback" && courses.map(c => (
                    <div key={c.id} className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50 flex items-center justify-between">
                      <span className="text-base font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded border border-indigo-200">
                        Subject: {c.code || "Unnamed"}
                      </span>
                      <MetricInputField label="Feedback (%)" value={courseMetrics[c.id]?.feedbackPercentage} onChange={(v) => handleCourseMetricChange(c.id, "feedbackPercentage", v)} className="w-40" placeholder="Enter feedback %" />
                    </div>
                  ))}

                  {/* PTG Meetings Global */}
                  {field === "ptgMeetings" && (
                    <MetricInputField label="Number of PTG Meetings Conducted" value={globalMetrics.ptgMeetings} onChange={(v) => setGlobalMetrics(p => ({ ...p, ptgMeetings: v }))} className="max-w-xs" placeholder="Enter number of meetings" />
                  )}
                </div>
              )}

              {/* Parameters & Marks Summary */}
              <div className="flex items-center justify-between px-2 pt-3 border-t-2 border-indigo-100">
                <span className="text-indigo-900 text-lg font-black uppercase tracking-widest opacity-90">
                  Calculated Mark (Section Total)
                </span>
                {manualSections[field] ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={PART_A_MAXES[field]}
                      aria-label={`Manual score for ${title}`}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                      value={scores[field] === 0 ? "" : scores[field]}
                      onChange={(e) => setScore(field, Number(e.target.value))}
                      placeholder="0"
                      className="w-24 rounded-lg border-2 border-indigo-300 bg-white px-4 py-2 text-lg text-right font-black text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-700 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm placeholder:text-xs placeholder:font-normal placeholder:text-slate-900"
                    />
                    <span className="text-base font-bold text-indigo-700 tabular-nums uppercase">
                      / {PART_A_MAXES[field]}
                    </span>
                  </div>
                ) : (
                  <span className="font-black text-indigo-900 text-lg tabular-nums">
                    {scores[field].toFixed(1)}
                    <span className="font-bold text-indigo-700 text-lg uppercase ml-2 tracking-tighter opacity-80">
                      / {PART_A_MAXES[field]}
                    </span>
                  </span>
                )}
              </div>
              {/* Score After Verification — hidden until enabled by verification team */}
              <div className="hidden">
                <div className="flex items-center justify-between px-2 pt-2 border-t border-green-100">
                  <span className="text-green-700 text-sm font-black uppercase tracking-widest">
                    Score After Verification
                  </span>
                  <span className="font-black text-green-700 text-sm tabular-nums px-3 py-1 rounded border border-green-200 bg-green-50">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Final Score Calculation">
        <div className="overflow-hidden rounded-xl border-2 border-indigo-200">
          <table className="min-w-full divide-y divide-indigo-200 text-base">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left font-extrabold text-indigo-700 uppercase tracking-widest text-base">
                  Component
                </th>
                <th className="px-6 py-3 text-right font-extrabold text-indigo-700 uppercase tracking-widest text-base">
                  Score
                </th>
                <th className="px-6 py-3 text-right font-extrabold text-indigo-700 uppercase tracking-widest text-base">
                  Maximum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100 bg-white">
              <tr>
                <td className="px-6 py-4 text-indigo-900 font-bold uppercase text-base tracking-tight">
                  Raw Sum of All Sections
                </td>
                <td className="px-6 py-4 text-right text-indigo-900 tabular-nums font-extrabold">
                  {rawSum.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-right text-indigo-700 tabular-nums font-bold">
                  440.0
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-indigo-800 italic flex items-center gap-3 text-base uppercase tracking-tight">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                  Role Factor ({userDesignation})
                </td>
                <td className="px-6 py-4 text-right text-indigo-900 tabular-nums font-extrabold">
                   {factor.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-indigo-700 tabular-nums font-bold">
                  —
                </td>
              </tr>
              <tr className="bg-indigo-100 font-extrabold border-t-2 border-indigo-200">
                <td className="px-6 py-5 text-indigo-800 uppercase tracking-widest font-black">
                  Final Adjusted Score
                </td>
                <td className="px-6 py-5 text-right text-indigo-700 tabular-nums text-2xl font-black underline decoration-2 decoration-indigo-300 underline-offset-4">
                  {finalScore}
                </td>
                <td className="px-6 py-5 text-right text-indigo-700 tabular-nums text-2xl font-black">
                  {maxScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="flex flex-col items-end gap-3 pt-3">
        {submitError && <p className="text-base font-extrabold text-destructive uppercase tracking-tight">Error: {submitError}</p>}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          aria-label="Save Performance Data"
          className="min-w-[260px] shadow-lg shadow-indigo-200 uppercase tracking-widest text-base font-black bg-indigo-700 hover:bg-indigo-800 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </div>
          ) : "Save Performance"}
        </Button>
      </div>
    </div>
  );
}


export default PartAAcademicInvolvement;
