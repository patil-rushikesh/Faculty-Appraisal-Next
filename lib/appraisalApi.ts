/**
 * appraisalApi.ts
 *
 * Two axios instances:
 *  - `api`      → for all /appraisal/:userId/* routes (uses NEXT_PUBLIC_BACKEND_URL as baseURL)
 *  - `pdfApi`   → for legacy PDF endpoints that live at /:department/:userId/*
 *                 Same baseURL, exported separately so PartF can call it without
 *                 prepending apiBase again (which would double the URL).
 *
 * Both send credentials (cookies / JWT) automatically.
 */

import axios from "axios";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"
).replace(/\/$/, ""); // strip trailing slash

// ── Shared axios instance (used by all parts) ──────────────────────────────
const api = axios.create({
  baseURL: BACKEND_ORIGIN,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default api;

// ── /appraisal/:userId/* helpers ───────────────────────────────────────────
const BASE = "/appraisal";

export const appraisalApi = {
  // Read
  getAppraisal:    (userId: string)              => api.get(`${BASE}/${userId}`),
  getAllAppraisals: ()                            => api.get(`${BASE}`),
  getByDepartment: (department: string)          => api.get(`${BASE}/department/${department}`),

  // Create
  createAppraisal: ()                            => api.post(`${BASE}`),

  // Part updates
  updatePartA:          (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-a`, data),
  updatePartB:          (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-b`, data),
  updatePartC:          (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-c`, data),
  updatePartD:          (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-d`, data),
  updatePartDEvaluator: (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-d/evaluator`, data),
  updatePartE:          (userId: string, data: unknown) => api.put(`${BASE}/${userId}/part-e`, data),
  updateDeclaration:    (userId: string, data: { agreed: boolean }) => api.patch(`${BASE}/${userId}/declaration`, data),

  // Workflow
  submitAppraisal:  (userId: string)              => api.patch(`${BASE}/${userId}/submit`),
  verifyAppraisal:  (userId: string, data: unknown) => api.patch(`${BASE}/${userId}/verify`, data),
  approveAppraisal: (userId: string)              => api.patch(`${BASE}/${userId}/approve`),

  // Delete
  deleteAppraisal: (userId: string)              => api.delete(`${BASE}/${userId}`),
};

// ── Legacy PDF helpers ─────────────────────────────────────────────────────
// These are called in PartF.  PartF used to pass `apiBase` as a prop and
// prepend it to the path — e.g. api.get(`${apiBase}/${dept}/${uid}/pdf-metadata`).
// That caused double-URL when api.baseURL is already set to the backend origin.
//
// Usage in PartF:
//   import { pdfApi } from "@/lib/appraisalApi";
//   pdfApi.getMetadata(department, userId)
//
// No `apiBase` prop is needed in PartF anymore.

export const pdfApi = {
  getMetadata:  (dept: string, uid: string) =>
    api.get(`/${dept}/${uid}/pdf-metadata`),

  getFacultyPdf: (dept: string, uid: string) =>
    api.get(`/${dept}/${uid}/faculty-pdf`, { responseType: "blob" }),

  generateDoc: (dept: string, uid: string) =>
    api.get(`/${dept}/${uid}/generate-doc`, { responseType: "blob" }),

  savePdf: (dept: string, uid: string) =>
    api.post(`/${dept}/${uid}/save-pdf`),

  getSavedPdfs: (dept: string, uid: string) =>
    api.get(`/${dept}/${uid}/saved-pdfs`),

  viewSavedPdf: (dept: string, uid: string, id: string) =>
    api.get(`/${dept}/${uid}/view-saved-pdf/${id}`, { responseType: "blob" }),

  deleteSavedPdf: (dept: string, uid: string, id: string) =>
    api.delete(`/${dept}/${uid}/delete-saved-pdf/${id}`),
};