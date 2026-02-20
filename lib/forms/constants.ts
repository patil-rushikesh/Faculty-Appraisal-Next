import { DesignationValue } from "../constants";

export const ROLE_FACTOR: Record<DesignationValue, number> = {
    Professor: 0.68,
    "Associate Professor": 0.79,
    "Assistant Professor": 1.0,
};

export const ROLE_MAX: Record<DesignationValue, number> = {
    Professor: 300,
    "Associate Professor": 350,
    "Assistant Professor": 440,
};

// Part A: Academic Involvement
export const PART_A_MAXES = {
    resultAnalysis: 50,
    courseOutcome: 50,
    eLearning: 50,
    academicEngagement: 50,
    teachingLoad: 50,
    projectsGuided: 40,
    studentFeedback: 100,
    ptgMeetings: 50,
} as const;

export type PartAScoreKey = keyof typeof PART_A_MAXES;

// Part B: Research & Publications
export const PART_B_ROLE_MAX: Record<DesignationValue, number> = {
    Professor: 500,
    "Associate Professor": 400,
    "Assistant Professor": 300,
};

export const PART_B_SECTION_MAXES = {
    publications: 200,
    citations: 50,
    ip: 100,
    grant: 100,
    product: 50,
} as const;

// Part C: Self-Development
export const PART_C_ROLE_MAX: Record<DesignationValue, number> = {
    Professor: 160,
    "Associate Professor": 170,
    "Assistant Professor": 180,
};

export const PART_C_SECTION_MAXES = {
    qualification: 20,
    attended: 40,
    organized: 80,
} as const;

// Part D: Portfolio Contributions
export const PART_D_MAX = 120;
export const PART_D_SELF_MAX = 60;

// Part E: Extraordinary Contributions
export const PART_E_MAX = 50;
