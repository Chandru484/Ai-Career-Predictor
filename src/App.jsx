import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { PAGES } from './constants/pages';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const AnalyzingPage = lazy(() => import('./pages/AnalyzingPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CareerAIDashboard = lazy(() => import('./pages/CareerAIDashboard'));
const ResumeBuilderApp = lazy(() => import('./resume-builder/ResumeBuilderApp'));

// Page order: landing → upload → questions → analyzing → results
const normalizeAppError = (error) => {
  const message = error?.message || 'Failed to reach the prediction engine. Make sure the FastAPI server is running.';
  const lowered = message.toLowerCase();

  if (error?.name === 'AbortError') {
    return 'The prediction request took too long. Please try again.';
  }

  if (lowered.includes('429') || lowered.includes('too many requests') || lowered.includes('quota')) {
    return 'The AI service is temporarily busy right now. Please wait a moment and try again.';
  }

  return message;
};

export default function App() {
  const { getToken } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('career-theme') || 'dark');
  const [page, setPage] = useState(PAGES.LANDING);
  const [userData, setUserData] = useState({
    resume_text: '',
    skills: '',
    interests: '',
    target_roles: '',
    strengths: '',
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('career-theme', theme);
  }, [theme]);

  const navigate = (to) => setPage(to);

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const runPrediction = async (finalData) => {
    navigate(PAGES.ANALYZING);
    try {
      const token = await getToken();
      const payload = {
        personality_answers: {
          Skills: finalData.skills,
          Interests: finalData.interests,
          "Target Roles": finalData.target_roles,
          Strengths: finalData.strengths
        },
        resume_text: finalData.resume_text || "",
      };
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetchWithTimeout(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to generate prediction.');
      }
      // Minimum delay so the animation plays fully
      await new Promise(r => setTimeout(r, 2800));
      setResults(data);
      navigate(PAGES.RESULTS);
    } catch (error) {
      await new Promise(r => setTimeout(r, 2000));
      setResults({
        error: normalizeAppError(error),
      });
      navigate(PAGES.RESULTS);
    }
  };

  const reset = () => {
    setResults(null);
    setUserData({ resume_text: '', skills: '', interests: '', target_roles: '', strengths: '' });
    navigate(PAGES.LANDING);
  };

  const props = {
    navigate,
    userData,
    setUserData,
    results,
    setResults,
    runPrediction,
    reset,
    PAGES,
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  };

  const loadingFallback = (
    <div
      style={{
        minHeight: '50vh',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      Loading...
    </div>
  );

  // Resume Builder is a full-page sub-app — render it outside the page-shell
  if (page === PAGES.RESUME_BUILDER) {
    return (
      <Suspense fallback={loadingFallback}>
        <ResumeBuilderApp />
      </Suspense>
    );
  }

  return (
    <div className="page-shell">
      <Suspense fallback={loadingFallback}>
        {page === PAGES.LANDING   && <LandingPage {...props} />}
        {page === PAGES.UPLOAD    && <UploadPage {...props} />}
        {page === PAGES.QUESTIONS && <QuestionsPage {...props} />}
        {page === PAGES.ANALYZING && <AnalyzingPage {...props} />}
        {page === PAGES.RESULTS   && <ResultsPage {...props} />}
        {page === PAGES.DASHBOARD && <DashboardPage {...props} />}
        {page === PAGES.AGENT     && <CareerAIDashboard {...props} />}
      </Suspense>
    </div>
  );
}
