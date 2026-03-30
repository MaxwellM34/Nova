import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Providers ---
export const providersApi = {
  apply: (data) => api.post("/providers/apply", data),
  browse: (params) => api.get("/providers", { params }),
  getById: (id) => api.get(`/providers/${id}`),
  getMe: () => api.get("/providers/me"),
  updateMe: (data) => api.put("/providers/me", data),
  getDashboard: () => api.get("/providers/me/dashboard"),
  getAvailability: (id, params) => api.get(`/providers/${id}/availability`, { params }),
  getReviews: (id) => api.get(`/providers/${id}/reviews`),
};

// --- Certifications ---
export const certsApi = {
  add: (data) => api.post("/providers/me/certifications", data),
  update: (id, data) => api.put(`/providers/me/certifications/${id}`, data),
  remove: (id) => api.delete(`/providers/me/certifications/${id}`),
};

// --- Availability ---
export const availApi = {
  add: (data) => api.post("/providers/me/availability", data),
  update: (id, data) => api.put(`/providers/me/availability/${id}`, data),
  remove: (id) => api.delete(`/providers/me/availability/${id}`),
};

// --- Arrangements ---
export const arrangementsApi = {
  create: (data) => api.post("/arrangements", data),
  getMe: () => api.get("/arrangements/me"),
  getById: (id) => api.get(`/arrangements/${id}`),
  update: (id, data) => api.put(`/arrangements/${id}`, data),
  review: (id, data) => api.post(`/arrangements/${id}/review`, data),
};

// --- Scheduling ---
export const callsApi = {
  schedule: (providerId, data) => api.post(`/providers/${providerId}/schedule-call`, data),
  update: (id, data) => api.put(`/calls/${id}`, data),
  getMyCalls: () => api.get("/providers/me/calls"),
};

// --- Admin ---
export const adminApi = {
  getProviders: (params) => api.get("/admin/providers", { params }),
  getProvider: (id) => api.get(`/admin/providers/${id}`),
  approveProvider: (id) => api.put(`/admin/providers/${id}/approve`),
  rejectProvider: (id, reason) => api.put(`/admin/providers/${id}/reject`, null, { params: { reason } }),
  boostProvider: (id, boosted) => api.put(`/admin/providers/${id}/boost`, null, { params: { is_boosted: boosted } }),
  verifyProviderId: (id) => api.put(`/admin/providers/${id}/verify-id`),
  getCertifications: (params) => api.get("/admin/certifications", { params }),
  verifyCert: (id) => api.put(`/admin/certifications/${id}/verify`),
  getUsers: () => api.get("/admin/users"),
  flagUser: (id, flagged) => api.put(`/admin/users/${id}/flag`, null, { params: { flagged } }),
  getArrangements: () => api.get("/admin/arrangements"),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

// --- Payments ---
export const paymentsApi = {
  connectStripe: () => api.post("/payments/connect-account"),
  createSubscription: (data) => api.post("/payments/create-subscription", data),
  createPaymentIntent: (data) => api.post("/payments/create-payment-intent", data),
};

// --- Users ---
export const usersApi = {
  getMe: () => api.get("/users/me"),
  updateMe: (data) => api.put("/users/me", data),
};
