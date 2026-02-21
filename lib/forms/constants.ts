import { DesignationValue } from "../constants";

export const ROLE_FACTOR: Record<DesignationValue, number> = {
    Professor: 0.68,
    "Associate Professor": 0.818,
    "Assistant Professor": 1.0,
};

export const ROLE_MAX: Record<DesignationValue, number> = {
    Professor: 300,
    "Associate Professor": 360,
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
    Professor: 370,
    "Associate Professor": 300,
    "Assistant Professor": 210,
};

export const PART_B_WEIGHTS = {
    journal: { sci: 100, esci: 50, scopus: 50, ugc: 10, other: 5 },
    conference: { scopus: 30, other: 5 },
    bookChapter: { scopus: 30, other: 5 },
    bookAuthored: { intlIndexed: 100, intlNatlNonIndexed: 30, local: 10 },
    citations: { wos: 3 / 3, scopus: 3 / 3, scholar: 1 / 3 }, // marks per citation (divide by 3)
    copyrightIndiv: { registered: 5, granted: 15 },
    copyrightInst: { registered: 10, granted: 30 },
    patentIndiv: { registered: 15, published: 30, granted: 50, commercialized: 100 },
    patentInst: { registered: 30, published: 60, granted: 100, commercialized: 200 },
    grantsResearch: 10 / 200000, // marks per Rupee
    grantsNonResearch: 5 / 10000, // marks per Rupee
    revenueTraining: 5 / 10000, // marks per Rupee
    product: { commercialized: 100, developed: 40, poc: 10 },
    startup: { rev50k: 100, fund5L: 100, product: 40, poc: 10, registered: 5 },
    award: { intl: 30, govt: 20, national: 5, intlFellow: 50, natlFellow: 30 },
    interaction: { mou: 10, collab: 20 },
    placement: { offer: 10 },
};

export const PART_B_SECTION_MAXES = {
    qualityJournal: Infinity,
    conference: 180,
    bookChapter: 150,
    bookAuthored: 200,
    citations: 50,
    copyrightIndiv: 30,
    copyrightInst: Infinity,
    patentIndiv: 100,
    patentInst: Infinity,
    grantsResearch: Infinity,
    grantsNonResearch: 40,
    revenueTraining: 40,
    product: 100,
    startup: Infinity,
    award: 50,
    interaction: Infinity,
    placement: Infinity,
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
