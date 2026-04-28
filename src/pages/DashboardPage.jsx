import { useState, useEffect } from 'react';
import { UserButton, useAuth } from '@clerk/react';
import { Clock, FileText, Settings, UploadCloud, CheckCircle2 } from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage({ navigate, PAGES, userData, setUserData, setResults }) {
  const { getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);

  // Load history from backend
  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [getToken]);

  useEffect(() => {
    async function fetchLatestResume() {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/resume/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setUserData((prev) => ({
          ...prev,
          resume_text: data.resume_text || prev.resume_text,
        }));
      } catch (err) {
        console.error("Failed to fetch latest resume:", err);
      } finally {
        setResumeLoading(false);
      }
    }

    fetchLatestResume();
  }, [getToken, setUserData]);

  const [activeTab, setActiveTab] = useState('overview');

  const handleProfileSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setUserData({
      ...userData,
      skills: fd.get('skills') || '',
      interests: fd.get('interests') || '',
      target_roles: fd.get('target_roles') || '',
      strengths: fd.get('strengths') || '',
    });
    // Trigger toast or visual feedback
    const btn = e.target.querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Saved Successfully!';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.innerHTML = oldText;
      btn.classList.remove('btn-success');
    }, 2000);
  };

  const openPrediction = async (predictionId) => {
    setOpeningId(predictionId);
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/history/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // set the global results state and navigate to the results view
        const fullResult = { ...data.prediction_result, prediction_id: data.id };
        setResults(fullResult);
        navigate(PAGES.RESULTS);
      } else {
        alert("Failed to load prediction details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading prediction.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="dashboard-layout fade-up">
      <div className="bg-orbs"></div>
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo" onClick={() => navigate(PAGES.LANDING)} style={{ cursor: 'pointer' }}>
          <div className="logo-icon"><span className="lp-wordmark" style={{fontSize: '1.2rem', paddingLeft: 0, color: '#000'}}>CareerAI</span></div>
          <span className="lp-wordmark" style={{fontSize: '1.2rem', paddingLeft: '0.5rem'}}>CareerAI</span>
        </div>

        <nav className="dashboard-nav">
          <button 
            className={`dash-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Clock size={16} /> History & Predictions
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings size={16} /> Profile Preferences
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FileText size={16} /> Resume Storage
          </button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="user-profile-widget">
            <UserButton showName />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="dashboard-header-bar">
          <h2>{activeTab === 'overview' ? 'Command Center' : activeTab === 'profile' ? 'Profile Settings' : 'Resume Management'}</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => navigate(PAGES.RESUME_BUILDER)}>
              📄 Resume Builder
            </button>
            <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }} onClick={() => navigate(PAGES.AGENT)}>
              ⚡ Auto-Apply Agent
            </button>
            <button className="btn btn-primary" onClick={() => navigate(userData.resume_text ? PAGES.QUESTIONS : PAGES.UPLOAD)}>
               New Analysis
            </button>
          </div>
        </div>

        <div className="dashboard-content-scroll">
          {activeTab === 'overview' && (
            <div className="dash-section animate-fade-in">
              <h3 className="dash-section-title">Past Predictions</h3>
              {loading ? (
                <div className="dash-loading"><div className="spinner"></div></div>
              ) : history.length > 0 ? (
                <div className="history-grid">
                  {history.map((item) => (
                    <div 
                      className="history-card" 
                      key={item.id} 
                      onClick={() => openPrediction(item.id)}
                      style={{ opacity: openingId === item.id ? 0.5 : 1, pointerEvents: openingId === item.id ? 'none' : 'auto' }}
                    >
                      <div className="history-card-header">
                        <span className="history-date">
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="badge">P-{item.id} {openingId === item.id && '...'}</span>
                      </div>
                      <h4 className="history-title">{item.top_career}</h4>
                      <p className="history-summary">{item.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={32} /></div>
                  <h4>No predictions yet</h4>
                  <p>Upload your resume to get your first AI career analysis.</p>
                  <button className="btn btn-primary" onClick={() => navigate(PAGES.UPLOAD)}>Get Started</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="dash-section animate-fade-in">
              <div className="profile-edit-card">
                <div className="profile-header">
                  <h3>Career Intelligence Profile</h3>
                  <p>This data is injected into the AI during predictions to tailor results.</p>
                </div>
                
                <form className="profile-form" onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label>Target Roles</label>
                    <input 
                      type="text" 
                      name="target_roles" 
                      defaultValue={userData.target_roles} 
                      placeholder="e.g. Frontend Developer, Product Manager"
                      className="dash-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Key Skills</label>
                    <textarea 
                      name="skills" 
                      defaultValue={userData.skills}
                      placeholder="e.g. React, Python, UI/UX Design, Agile"
                      className="dash-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Interests</label>
                    <textarea 
                      name="interests" 
                      defaultValue={userData.interests}
                      placeholder="e.g. FinTech, Artificial Intelligence, Open Source"
                      className="dash-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Top Strengths</label>
                    <textarea 
                      name="strengths" 
                      defaultValue={userData.strengths}
                      placeholder="e.g. Public speaking, system architecture, rapid learning"
                      className="dash-textarea"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      <CheckCircle2 size={16} /> Save Profile Preferences
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="dash-section animate-fade-in">
              <div className="resume-hub">
                <div className="resume-hub-left">
                  <div className="profile-header" style={{padding:0, borderBottom:'none', marginBottom:'1rem'}}>
                    <h3>Your Uploaded Resume</h3>
                    <p>Whenever you request a new prediction, it will default to reading the last resume you uploaded.</p>
                  </div>
                  
                  {resumeLoading ? (
                    <div className="empty-state" style={{padding:'2rem'}}>
                      <p>Loading your saved resume...</p>
                    </div>
                  ) : userData.resume_text ? (
                    <div className="active-resume-card">
                      <div className="resume-icon-badge"><FileText size={24} /></div>
                      <div className="resume-meta">
                        <h4>Active Resume Extracted</h4>
                        <span>{userData.resume_text.length} characters parsed</span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state" style={{padding:'2rem'}}>
                      <p>No active resume in local memory.</p>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => navigate(PAGES.QUESTIONS)} disabled={!userData.resume_text}>
                      <CheckCircle2 size={16} /> Analyze Resume
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate(PAGES.UPLOAD)}>
                      <UploadCloud size={16} /> Upload New PDF
                    </button>
                  </div>
                </div>
                
                <div className="resume-preview-box">
                  {userData.resume_text ? (
                    <pre className="resume-raw-text">
                      {userData.resume_text}
                    </pre>
                  ) : (
                    <div className="empty-preview">
                      <FileText size={48} opacity={0.2} />
                      <p>Resume preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
