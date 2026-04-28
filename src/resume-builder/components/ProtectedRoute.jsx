import { useAuth } from '@clerk/react';
import { Spinner } from './ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  // Wait for Clerk to finish initialising
  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // User is not signed in — show a friendly message instead of redirecting
  // (redirect would break because we're inside a MemoryRouter, not the browser URL)
  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: '#fff', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sign in required</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Please sign in to use the Resume Builder.</p>
      </div>
    );
  }

  return children;
}
