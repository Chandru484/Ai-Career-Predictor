import { useState, useEffect, useCallback } from "react";
import { useAuth, UserButton } from '@clerk/react';
import { ArrowLeft, Zap, Settings, PlayCircle, BarChart, ExternalLink, RefreshCw } from 'lucide-react';
import '../App.css';
import './LandingPage.css'; // Import landing page css for reused tokens
import './CareerAIDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE_URL}/api/agent`;

function DrawerPanel({ app, onClose }) {
  if (!app) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{app.job.title}</div>
            <div className="drawer-company">{app.job.company} · {app.job.location}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-tags">
          <span className={`status-badge ${app.status}`}>{app.status}</span>
          <span className={`platform-badge ${app.job.platform}`}>{app.job.platform}</span>
          {app.match_score && (
             <span className={`score-badge ${app.match_score >= 80 ? 'high' : app.match_score >= 65 ? 'medium' : 'low'}`}>
                {Math.round(app.match_score)}
             </span>
          )}
        </div>

        {app.match_reason && (
          <div className="drawer-block" style={{borderColor: 'rgba(150, 230, 48, 0.2)', background: 'rgba(150, 230, 48, 0.05)'}}>
            <div className="drawer-block-title">MATCH REASON</div>
            <div className="drawer-block-content">{app.match_reason}</div>
          </div>
        )}

        {app.cover_letter && (
          <div className="drawer-block">
            <div className="drawer-block-title">COVER LETTER</div>
            <div className="drawer-block-content" style={{fontFamily: 'monospace', fontSize: '0.8rem'}}>{app.cover_letter}</div>
          </div>
        )}

        {app.skip_reason && (
          <div className="drawer-block" style={{borderColor: 'rgba(251, 191, 36, 0.2)', background: 'rgba(251, 191, 36, 0.05)'}}>
            <div className="drawer-block-title" style={{color: '#fbbf24'}}>SKIP REASON</div>
            <div className="drawer-block-content">{app.skip_reason}</div>
          </div>
        )}

        {app.error && (
          <div className="drawer-block" style={{borderColor: 'rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.05)'}}>
            <div className="drawer-block-title" style={{color: '#f87171'}}>ERROR</div>
            <div className="drawer-block-content">{app.error}</div>
          </div>
        )}

        <a href={app.job.url} target="_blank" rel="noreferrer" className="drawer-link">
          View Original Job Posting <ExternalLink size={14} style={{marginLeft: 4, display: 'inline'}}/>
        </a>

        {app.applied_at && (
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 24 }}>
            Applied {new Date(app.applied_at).toLocaleString("en-IN")}
          </div>
        )}
      </div>
    </>
  );
}

export default function CareerAIDashboard({ navigate, PAGES, theme, toggleTheme }) {
  const { getToken } = useAuth();
  
  const [stats, setStats] = useState({
    total_applied: 0, total_skipped: 0, total_failed: 0,
    today_applied: 0, daily_limit: 10, avg_score: 0, auto_apply_on: false
  });
  const [apps, setApps]           = useState([]);
  const [filterStatus, setFilter] = useState("all");
  const [selected, setSelected]   = useState(null);
  
  const [autoApply, setAutoApply] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [minScore, setMinScore]   = useState(70);
  
  const [linkedinCookie, setLinkedinCookie] = useState("");
  const [indeedCookie, setIndeedCookie]     = useState("");
  
  const [loading, setLoading]     = useState(true);
  const [scrapeRole, setScrapeRole] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState("");
  const [autoRunning, setAutoRunning] = useState(false);

  const filtered = filterStatus === "all"
    ? apps
    : apps.filter(a => a.status === filterStatus);

  const loadData = useCallback(async () => {
     setLoading(true);
     try {
       const token = await getToken();
       const headers = { 'Authorization': `Bearer ${token}` };
       
       const [statsRes, appsRes] = await Promise.all([
         fetch(`${API}/stats`, { headers }),
         fetch(`${API}/applications`, { headers })
       ]);
       
       if (statsRes.ok) {
         const data = await statsRes.json();
         setStats(data);
         setAutoApply(data.auto_apply_on);
         setDailyLimit(data.daily_limit);
         if (data.linkedin_cookie === "set") setLinkedinCookie("(Saved securely)");
         if (data.indeed_cookie === "set") setIndeedCookie("(Saved securely)");
       }
       if (appsRes.ok) {
         const a = await appsRes.json();
         setApps(a.applications || []);
       }
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  async function updateSettings(updates) {
     try {
       const token = await getToken();
       const res = await fetch(`${API}/settings`, {
         method: 'PATCH',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
         body: JSON.stringify(updates)
       });
       if (res.ok) {
         await loadData();
       }
       return res.ok;
     } catch (err) {
       console.error(err);
       return false;
     }
  }

  async function triggerAutoRun() {
    setAutoRunning(true);
    setScrapeStatus("Finding matching jobs from your analyzed resume...");
    try {
      const token = await getToken();
      const res = await fetch(`${API}/auto-run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ max_jobs: 18, location: 'India' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Automatic job search failed.');
      }

      setScrapeStatus(`Searched ${data.search_roles.length} matching roles and processed ${data.jobs_considered} jobs.`);
      await loadData();
      setTimeout(() => setScrapeStatus(""), 3000);
    } catch (err) {
      setScrapeStatus(`Error: ${err.message}`);
    } finally {
      setAutoRunning(false);
    }
  }

  const handleToggleAutoApply = async () => {
    const next = !autoApply;
    setAutoApply(next);
    const saved = await updateSettings({ auto_apply: next ? 1 : 0 });
    if (!saved) {
      setAutoApply(!next);
      return;
    }
    setStats(s => ({...s, auto_apply_on: next}));
    if (next) {
      if (linkedinCookie === "(Saved securely)") {
        await triggerAutoRun();
      } else {
        setScrapeStatus("Save your LinkedIn cookie first, then auto-apply can search and run automatically.");
      }
    } else {
      setScrapeStatus("");
    }
  };

  const handleChangeLimit = (val) => {
    setDailyLimit(val);
    updateSettings({ daily_limit: val });
  };

  const handleChangeScore = (val) => {
    setMinScore(val);
    updateSettings({ min_score: val });
  };

  async function handleScrape() {
    if (!scrapeRole.trim()) return;
    setScrapeStatus("Scraping platforms...");
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' };
      
      const scrapeRes = await fetch(`${API}/scrape`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: scrapeRole, max_jobs: 10 })
      });
      const data = await scrapeRes.json();
      
      setScrapeStatus(`Found ${data.total} jobs. Running agent...`);
      
      const runRes = await fetch(`${API}/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobs: data.jobs })
      });
      const runData = await runRes.json();
      setScrapeStatus(`Applied to ${runData.summary.ready} jobs. Refreshing...`);
      
      await loadData();
      setScrapeStatus("");
    } catch(err) {
      setScrapeStatus("Error: " + err.message);
    }
  }

  return (
    <div className="lp-root fade-up">
      <div className="bg-orbs"><span /><span /><span /></div>

      {/* ─── NAV ─── */}
      <nav className="lp-nav page-content">
        <div className="lp-nav-logo" onClick={() => navigate(PAGES.LANDING)} style={{ cursor: 'pointer' }}>
          <div className="logo-icon"><Zap size={14} fill="currentColor" strokeWidth={0} /></div>
          <span className="lp-wordmark">CareerAI</span>
        </div>

        <div className="lp-nav-links">
          <button className="lp-nav-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'}} onClick={() => navigate(PAGES.DASHBOARD)}>Dashboard</button>
        </div>

        <div className="lp-nav-actions">
          <button className="lp-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '◐ Dark' : '◑ Light'}
          </button>
          <UserButton />
        </div>
      </nav>

      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '4rem 3rem' }}>
        
        <button className="btn btn-ghost lp-cta-btn" onClick={() => navigate(PAGES.DASHBOARD)} style={{ marginBottom: '2rem', padding: '0.6rem 1.2rem !important' }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* ─── HEADER ─── */}
        <div className="agent-header-row">
          <div>
            <div className="lp-hero-eyebrow" style={{marginBottom: '1rem'}}>
              <span className="badge"><BarChart size={10} /> agent command center</span>
            </div>
            <h1 className="lp-section-title" style={{marginBottom: 0}}>
              Application Tracker
            </h1>
          </div>

          <div className={`auto-apply-toggle ${autoApply ? 'active' : ''}`} onClick={handleToggleAutoApply}>
            <span className="toggle-label">Auto-apply Engine</span>
            <div className={`toggle-switch ${autoApply ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
            <span className="toggle-status">{autoApply ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* ─── STATS (Landing page style) ─── */}
        <div className="lp-stats-bar" style={{ marginTop: '2.5rem', marginBottom: '3rem', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="lp-stat">
            <strong style={{color: 'var(--text)'}}>{stats.total_applied}</strong>
            <span>Total Applied</span>
          </div>
          <div className="lp-stat">
            <strong style={{color: 'var(--primary)'}}>{stats.today_applied}<span style={{fontSize:'1rem', color:'var(--muted)'}}>/{dailyLimit}</span></strong>
            <span>Today's Progress</span>
          </div>
          <div className="lp-stat">
            <strong style={{color: '#fbbf24'}}>{stats.total_skipped}</strong>
            <span>Skipped Jobs</span>
          </div>
          <div className="lp-stat">
            <strong style={{color: '#f87171'}}>{stats.total_failed}</strong>
            <span>Failed Applies</span>
          </div>
          <div className="lp-stat">
            <strong style={{color: '#a855f7'}}>{stats.avg_score}</strong>
            <span>Avg Match Score</span>
          </div>
        </div>

        {/* ─── CONTROLS (Landing page features style) ─── */}
        <div className="lp-features" style={{ gridTemplateColumns: '1.2fr 1fr 1fr', marginBottom: '3rem' }}>
          {/* Run Agent */}
          <div className="lp-feature-card">
            <div className="lp-feature-header">
              <span className="lp-feature-num">01</span>
              <span className="lp-feature-icon"><PlayCircle size={20} /></span>
            </div>
            <h4 className="lp-feature-title">Run Agent Interactively</h4>
            <div className="scrape-input-group" style={{marginTop: '1rem'}}>
              <input
                className="form-input"
                value={scrapeRole}
                onChange={e => setScrapeRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                style={{background: 'rgba(0,0,0,0.2)'}}
              />
              <button className="btn btn-primary" onClick={handleScrape} disabled={loading || !!scrapeStatus}>
                {scrapeStatus || autoRunning ? <RefreshCw className="spin" size={16}/> : 'Run'}
              </button>
            </div>
            {scrapeStatus && <div className="scrape-status" style={{marginTop: '1rem'}}>{scrapeStatus}</div>}
          </div>

          {/* Parameters */}
          <div className="lp-feature-card">
            <div className="lp-feature-header">
              <span className="lp-feature-num">02</span>
              <span className="lp-feature-icon"><Settings size={20} /></span>
            </div>
            <h4 className="lp-feature-title">Agent Parameters</h4>
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div className="setting-row">
                <span className="setting-label">Daily Apply Limit</span>
                <div className="setting-control">
                  <input type="range" className="range-input" min={1} max={25} step={1} value={dailyLimit}
                    onMouseUp={e => handleChangeLimit(Number(e.target.value))}
                    onChange={e => setDailyLimit(Number(e.target.value))} />
                  <span className="setting-value">{dailyLimit}</span>
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-label">Min Match Score</span>
                <div className="setting-control">
                  <input type="range" className="range-input" min={40} max={95} step={5} value={minScore}
                    onMouseUp={e => handleChangeScore(Number(e.target.value))}
                    onChange={e => setMinScore(Number(e.target.value))} />
                  <span className="setting-value">{minScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies */}
          <div className="lp-feature-card">
            <div className="lp-feature-header">
              <span className="lp-feature-num">03</span>
              <span className="lp-feature-icon"><Zap size={20} /></span>
            </div>
            <h4 className="lp-feature-title">Platform Cookies</h4>
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div className="integration-row">
                <input className="form-input" style={{padding:'0.5rem', fontSize:'0.8rem', background: 'rgba(0,0,0,0.2)'}} placeholder="LinkedIn li_at cookie" value={linkedinCookie} onChange={e => setLinkedinCookie(e.target.value)} />
                <button className="btn btn-ghost" style={{padding:'0.5rem 1rem'}} onClick={async () => {
                  const saved = await updateSettings({ linkedin_cookie: linkedinCookie });
                  if (saved) {
                    setLinkedinCookie("(Saved securely)");
                    setScrapeStatus("LinkedIn cookie saved. Turn on Auto-apply Engine to start profile-based matching.");
                  }
                }}>Save</button>
              </div>
              <div className="integration-row">
                <input className="form-input" style={{padding:'0.5rem', fontSize:'0.8rem', background: 'rgba(0,0,0,0.2)'}} placeholder="Indeed session cookie" value={indeedCookie} onChange={e => setIndeedCookie(e.target.value)} />
                <button className="btn btn-ghost" style={{padding:'0.5rem 1rem'}} onClick={async () => {
                  const saved = await updateSettings({ indeed_cookie: indeedCookie });
                  if (saved) {
                    setIndeedCookie("(Saved securely)");
                  }
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── APPLICATIONS ─── */}
        <div className="lp-section-label">
          <span className="badge">Applications</span>
        </div>
        
        {/* Filter Tabs */}
        <div className="filter-tabs">
          {["all", "applied", "skipped", "failed", "pending"].map(s => (
            <button key={s} className={`filter-tab ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === "all" ? `All (${apps.length})` : `${s} (${apps.filter(a => a.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Applications Table inside Landing Page styling */}
        <div className="apps-table-container">
          <table className="apps-table">
            <thead>
              <tr>
                <th>ROLE & COMPANY</th>
                <th>PLATFORM</th>
                <th>SCORE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="job-title">
                      {app.job.title}
                      {app.job.easy_apply && <span className="badge" style={{fontSize:'0.6rem'}}>EASY APPLY</span>}
                    </div>
                    <div className="job-company">{app.job.company}</div>
                  </td>
                  <td><span className={`platform-badge ${app.job.platform}`}>{app.job.platform}</span></td>
                  <td>
                    {app.match_score ? (
                      <span className={`score-badge ${app.match_score >= 80 ? 'high' : app.match_score >= 65 ? 'medium' : 'low'}`}>
                        {Math.round(app.match_score)}
                      </span>
                    ) : '—'}
                  </td>
                  <td><span className={`status-badge ${app.status}`}>{app.status}</span></td>
                  <td style={{color:'var(--muted)'}}>{new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td>
                    <button className="btn btn-ghost" style={{padding:'0.4rem 0.8rem', fontSize:'0.75rem'}} onClick={() => setSelected(app)}>Details</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign:'center', padding:'3rem', color:'var(--muted-2)'}}>
                    No applications found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer page-content" style={{marginTop: 'auto'}}>
        <div className="lp-footer-logo">
          <div className="logo-icon"><Zap size={12} fill="currentColor" strokeWidth={0} /></div>
          <span>CareerAI Agent</span>
        </div>
        <p className="lp-footer-copy">© 2026 CareerAI — AI-Powered Career Intelligence</p>
      </footer>

      <DrawerPanel app={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
