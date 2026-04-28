import axios from 'axios';

const api = axios.create({
  baseURL: '/api/rb',
  headers: { 'Content-Type': 'application/json' },
});

// ── Token provider ────────────────────────────────────────────────────────────
// Call setTokenProvider(getToken) once from within a React component that has
// access to Clerk's useAuth() hook (done in ResumeBuilderApp.jsx).
let _getToken = null;
export function setTokenProvider(fn) {
  _getToken = fn;
}

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    if (_getToken) {
      const token = await _getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[api] Could not retrieve auth token:', e);
  }
  return config;
});

// ── Response interceptor: normalise errors ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ── Resume CRUD ───────────────────────────────────────────────────────────────
export const resumeApi = {
  list:      ()         => api.get('/resumes').then(r => r.data),
  get:       (id)       => api.get(`/resumes/${id}`).then(r => r.data),
  create:    (body)     => api.post('/resumes', body).then(r => r.data),
  update:    (id, body) => api.put(`/resumes/${id}`, body).then(r => r.data),
  delete:    (id)       => api.delete(`/resumes/${id}`),
  duplicate: (id)       => api.post(`/resumes/${id}/duplicate`).then(r => r.data),
};

// ── AI features ───────────────────────────────────────────────────────────────
export const aiApi = {
  enhance:     (body) => api.post('/ai/enhance', body).then(r => r.data),
  parse:       (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/ai/parse', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  analyze:     (body) => api.post('/ai/analyze', body).then(r => r.data),
  jobMatch:    (body) => api.post('/ai/job-match', body).then(r => r.data),
  coverLetter: (body) => api.post('/ai/cover-letter', body).then(r => r.data),
  trim:        (body) => api.post('/ai/trim', body).then(r => r.data),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  pdf:  (body) => api.post('/export/pdf',  body, { responseType: 'blob' }).then(r => r.data),
  docx: (body) => api.post('/export/docx', body, { responseType: 'blob' }).then(r => r.data),
};

export default api;
