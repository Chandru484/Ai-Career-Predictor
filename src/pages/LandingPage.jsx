import { useEffect, useRef } from 'react';
import '../App.css';
import './LandingPage.css';
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/react";
import {
  ArrowRight,
  BarChart2,
  BrainCog,
  FileText,
  MapPin,
  ScanSearch,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const features = [
  { num: '01', icon: <ScanSearch size={18} />, title: 'Resume Parsing', body: 'Upload any PDF. AI extracts and indexes your full skill and experience graph in seconds.' },
  { num: '02', icon: <BrainCog size={18} />, title: 'Career Matching', body: 'Deep-learn models rank the top 3 career paths against your profile with confidence scores.' },
  { num: '03', icon: <BarChart2 size={18} />, title: 'Skill Gap Analysis', body: 'See exactly what is missing between where you are and where the market wants you.' },
  { num: '04', icon: <MapPin size={18} />, title: 'Learning Roadmap', body: 'AI generates a personalised, step-by-step upskilling plan tied to real industry demand.' },
];

const stats = [
  { value: '3', label: 'AI-ranked career matches' },
  { value: '<2s', label: 'average analysis time' },
  { value: '∞', label: 'questions to your copilot' },
];

export default function LandingPage({ navigate, PAGES, theme, toggleTheme }) {
  const { isSignedIn } = useAuth();
  const onStart = () => navigate(PAGES.UPLOAD);
  const onSkip  = () => navigate(PAGES.QUESTIONS);
  const onThemeToggle = toggleTheme;
  const heroRef = useRef(null);

  // Scroll-reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scramble-text effect on hero title letters
  useEffect(() => {
    const el = document.getElementById('hero-scramble');
    if (!el) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    const original = el.textContent;
    let frame = 0;
    let raf;
    const scramble = () => {
      el.textContent = original.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (frame / 3 > i) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      frame++;
      if (frame <= original.length * 3) raf = requestAnimationFrame(scramble);
      else el.textContent = original;
    };
    const timeout = setTimeout(scramble, 300);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="lp-root">
      {/* Grid background */}
      <div className="bg-orbs"><span /><span /><span /></div>

      {/* ─── NAV ─── */}
      <nav className="lp-nav page-content">
        <div className="lp-nav-logo">
          <div className="logo-icon"><Zap size={14} fill="currentColor" strokeWidth={0} /></div>
          <span className="lp-wordmark">CareerAI</span>
        </div>

        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
        </div>

        <div className="lp-nav-actions">
          <button
            className="lp-theme-btn"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '◐ Dark' : '◑ Light'}
          </button>
          {!isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className="btn btn-ghost lp-nav-btn">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary lp-nav-btn">Sign Up</button>
              </SignUpButton>
            </>
          )}
          {isSignedIn && (
            <>
              <button className="btn btn-primary lp-nav-btn" onClick={() => navigate(PAGES.DASHBOARD)}>Dashboard</button>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="lp-hero page-content" ref={heroRef}>
        <div className="lp-hero-eyebrow">
          <span className="badge"><Zap size={10} /> ai-powered career intelligence</span>
        </div>

        <h1 className="lp-hero-title fade-up">
          Turn Your{' '}
          <span className="lp-green" id="hero-scramble">Resume</span>
          <br />
          Into a Career
          <br />
          <span className="lp-hero-title-outline">Strategy.</span>
        </h1>

        <p className="lp-hero-sub fade-up fade-up-delay-2">
          AI analyses your skills and goals, ranks your best-fit tech roles,<br className="lp-br" />
          and hands you a step-by-step roadmap to get there.
        </p>

        <div className="lp-hero-cta fade-up fade-up-delay-3">
          <button className="btn btn-primary lp-cta-btn" onClick={onStart}>
            Start Free Analysis <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost lp-cta-btn" onClick={onSkip}>
            Explore Without Resume
          </button>
        </div>

        {/* Stats bar */}
        <div className="lp-stats-bar fade-up fade-up-delay-4">
          {stats.map(s => (
            <div className="lp-stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="lp-divider page-content" />

      {/* ─── HOW IT WORKS ─── */}
      <section className="lp-section page-content" id="how-it-works">
        <div className="lp-section-label" data-reveal>
          <span className="badge">How it works</span>
        </div>
        <h2 className="lp-section-title" data-reveal>
          Three steps to clarity.
        </h2>

        <div className="lp-steps" data-reveal>
          {[
            { n: '01', icon: <FileText size={20} />, t: 'Upload or describe', d: 'Drop your resume PDF or fill in your skills manually. Takes under a minute.' },
            { n: '02', icon: <BrainCog size={20} />, t: 'AI analyses your profile', d: 'Gemini processes your data and ranks your best-match tech careers instantly.' },
            { n: '03', icon: <Target size={20} />, t: 'Get your strategy', d: 'Receive your ranked careers, skill gaps, roadmap, resume tips and an AI copilot.' },
          ].map(s => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <h3 className="lp-step-title">{s.t}</h3>
              <p className="lp-step-body">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="lp-divider page-content" />

      {/* ─── FEATURES ─── */}
      <section className="lp-section page-content" id="features">
        <div className="lp-section-label" data-reveal>
          <span className="badge">What you get</span>
        </div>
        <h2 className="lp-section-title" data-reveal>
          Everything in one analysis.
        </h2>

        <div className="lp-features" data-reveal>
          {features.map(f => (
            <div className="lp-feature-card" key={f.num}>
              <div className="lp-feature-header">
                <span className="lp-feature-num">{f.num}</span>
                <span className="lp-feature-icon">{f.icon}</span>
              </div>
              <h4 className="lp-feature-title">{f.title}</h4>
              <p className="lp-feature-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="lp-divider page-content" />

      {/* ─── CTA BANNER ─── */}
      <section className="lp-cta-banner page-content" data-reveal>
        <div className="lp-cta-banner-inner">
          <div className="lp-cta-banner-left">
            <p className="lp-cta-banner-kicker">Ready to find your path?</p>
            <h2 className="lp-cta-banner-title">
              Start your free<br />
              <span className="lp-green">career analysis</span> now.
            </h2>
          </div>
          <div className="lp-cta-banner-right">
            <button className="btn btn-primary lp-cta-big" onClick={onStart}>
              <Sparkles size={16} /> Analyse My Resume
            </button>
            <p className="lp-cta-note">No account needed to start.</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer page-content">
        <div className="lp-footer-logo">
          <div className="logo-icon"><Zap size={12} fill="currentColor" strokeWidth={0} /></div>
          <span>CareerAI</span>
        </div>
        <p className="lp-footer-copy">© 2026 CareerAI — AI-Powered Career Intelligence</p>
      </footer>
    </div>
  );
}
