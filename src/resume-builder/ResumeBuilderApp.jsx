/**
 * ResumeBuilderApp — self-contained sub-app.
 * Uses MemoryRouter so it manages its own navigation stack internally
 * without interfering with the parent app's browser URL.
 */
import { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import './index.css';

import { ResumeProvider } from './context/ResumeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { setTokenProvider } from './services/api';

import Dashboard      from './pages/Dashboard';
import ResumeBuilder  from './pages/ResumeBuilder';
import TemplatePicker from './pages/TemplatePicker';
import FullPreview    from './pages/FullPreview';
import CareerLab      from './pages/CareerLab';
import CoverLetter    from './pages/CoverLetter';
import Profile        from './pages/Profile';

/**
 * Injects Clerk's getToken into the Axios API client.
 * Must be a child component so it has access to useAuth().
 */
function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);
  return null;
}

import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PageTransition from './components/ui/PageTransition';

function AnimatedLayoutRoutes() {
  const location = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="builder"      element={<PageTransition><ResumeBuilder /></PageTransition>} />
          <Route path="templates"    element={<PageTransition><TemplatePicker /></PageTransition>} />
          <Route path="career-lab"   element={<PageTransition><CareerLab /></PageTransition>} />
          <Route path="cover-letter" element={<PageTransition><CoverLetter /></PageTransition>} />
          <Route path="profile"      element={<PageTransition><Profile /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default function ResumeBuilderApp() {
  return (
    /* initialEntries starts at the dashboard so the first screen is correct */
    <MemoryRouter initialEntries={['/resume-builder/dashboard']} initialIndex={0}>
      <AuthTokenBridge />
      <ToastProvider>
        <ResumeProvider>
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Navigate to="/resume-builder/dashboard" replace />} />
              <Route path="/resume-builder/preview" element={<FullPreview />} />
              <Route path="/resume-builder/*" element={<AnimatedLayoutRoutes />} />
            </Routes>
          </ProtectedRoute>
        </ResumeProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}
