import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import '../App.css';
import {
  Trophy, Puzzle, BarChart2, Sparkles, Lightbulb, Star,
  AlertTriangle, CheckCircle2, MessageCircle, X, Send,
  ChevronLeft, RotateCcw, Zap
} from 'lucide-react';

const EMPTY_CAREERS = [];

export default function ResultsPage({ results, reset, navigate, PAGES }) {
  const { getToken } = useAuth();
  const [optimizerData, setOptimizerData] = useState(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerError, setOptimizerError] = useState('');
  const [selectedOptimizerRole, setSelectedOptimizerRole] = useState('');
  const [copiedSection, setCopiedSection] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState('');
  const [selectedInterviewRole, setSelectedInterviewRole] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const predictionId = results?.prediction_id;
  const careers = results?.careers || EMPTY_CAREERS;
  const topCareer = careers[0] || {};
  const reasons = topCareer.reasons || [];
  const skills_to_develop = topCareer.skills_to_develop || [];
  const summary = results?.summary || '';
  const optimizerRole = selectedOptimizerRole || topCareer.title || '';
  const interviewRole = selectedInterviewRole || topCareer.title || '';
  const safeInterviewData = {
    target_role: interviewData?.target_role || interviewRole,
    warmup_questions: Array.isArray(interviewData?.warmup_questions) ? interviewData.warmup_questions : [],
    technical_questions: Array.isArray(interviewData?.technical_questions) ? interviewData.technical_questions : [],
    behavioral_questions: Array.isArray(interviewData?.behavioral_questions) ? interviewData.behavioral_questions : [],
    interviewer_focus: Array.isArray(interviewData?.interviewer_focus) ? interviewData.interviewer_focus : [],
    answer_tips: Array.isArray(interviewData?.answer_tips) ? interviewData.answer_tips : [],
  };
  const hasInterviewContent = Object.entries(safeInterviewData)
    .some(([key, value]) => key !== 'target_role' && value.length > 0);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      if (!predictionId) {
        setChatMessages([]);
        setChatError('');
        return;
      }

      setChatLoading(true);
      setChatError('');

      try {
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/chat/${predictionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Failed to load assistant messages.');
        }

        if (active) {
          setChatMessages(data);
        }
      } catch (error) {
        if (active) {
          setChatError(error.message || 'Failed to load assistant messages.');
          setChatMessages([]);
        }
      } finally {
        if (active) {
          setChatLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [getToken, predictionId]);

  useEffect(() => {
    if (!careers.length) {
      setSelectedOptimizerRole('');
      setSelectedInterviewRole('');
      return;
    }

    setSelectedOptimizerRole((currentRole) => {
      if (currentRole && careers.some((career) => career.title === currentRole)) {
        return currentRole;
      }
      return careers[0]?.title || '';
    });

    setSelectedInterviewRole((currentRole) => {
      if (currentRole && careers.some((career) => career.title === currentRole)) {
        return currentRole;
      }
      return careers[0]?.title || '';
    });
  }, [careers]);

  const loadOptimizer = async () => {
    if (!predictionId) return;

    setOptimizerLoading(true);
    setOptimizerError('');

    try {
      const token = await getToken();
      const search = new URLSearchParams();
      if (optimizerRole) {
        search.set('target_role', optimizerRole);
      }
      const API_URL = import.meta.env.VITE_API_URL || '';
      const endpoint = `${API_URL}/api/resume-optimizer/${predictionId}${search.toString() ? `?${search.toString()}` : ''}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load resume optimizer.');
      }

      setOptimizerData(data);
    } catch (error) {
      setOptimizerError(error.message || 'Failed to load resume optimizer.');
      setOptimizerData(null);
    } finally {
      setOptimizerLoading(false);
    }
  };

  // Reset data if role changes, requiring explicit re-generation
  useEffect(() => {
    setOptimizerData(null);
    setOptimizerError('');
  }, [optimizerRole]);

  // Reset interview data if role changes
  useEffect(() => {
    setInterviewData(null);
    setInterviewError('');
  }, [interviewRole]);

  const loadInterview = async () => {
    if (!predictionId) return;

    setInterviewLoading(true);
    setInterviewError('');

    try {
      const token = await getToken();
      const search = new URLSearchParams();
      if (interviewRole) {
        search.set('target_role', interviewRole);
      }
      const API_URL = import.meta.env.VITE_API_URL || '';
      const endpoint = `${API_URL}/api/mock-interview/${predictionId}${search.toString() ? `?${search.toString()}` : ''}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load mock interview.');
      }

      setInterviewData(data);
    } catch (error) {
      setInterviewError(error.message || 'Failed to load mock interview.');
      setInterviewData(null);
    } finally {
      setInterviewLoading(false);
    }
  };

  if (!results) return null;

  if (results.error) {
    return (
      <div className="results-page page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass r-card" style={{ maxWidth: 500, textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <AlertTriangle size={48} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{results.error}</p>
          <button className="btn btn-primary" onClick={reset}><RotateCcw size={15} /> Start Over</button>
        </div>
      </div>
    );
  }

  const starterPrompts = [
    `Why am I a good fit for ${topCareer.title || 'this role'}?`,
    `What should I learn first for ${topCareer.title || 'my top role'}?`,
    `How can I improve my resume for ${topCareer.title || 'this career path'}?`,
  ];

  const copyText = async (sectionKey, content) => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionKey);
      window.setTimeout(() => {
        setCopiedSection((currentKey) => (currentKey === sectionKey ? '' : currentKey));
      }, 1800);
    } catch {
      setCopiedSection('');
    }
  };

  const sendMessage = async (presetMessage) => {
    const message = (presetMessage ?? chatInput).trim();
    if (!message || !predictionId || chatLoading) return;

    setChatLoading(true);
    setChatError('');

    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prediction_id: predictionId,
          message,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send message.');
      }

      setChatMessages(data.messages || []);
      setChatInput('');
    } catch (error) {
      setChatError(error.message || 'Failed to send message.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage();
  };

  const renderInterviewList = (items, emptyText) => {
    if (!items.length) {
      return <div className="assistant-empty">{emptyText}</div>;
    }

    return (
      <div className="optimizer-list compact">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="optimizer-list-item">
            <span className="optimizer-index">{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="results-page page-content">
      <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>

      <div className="results-layout">
        <div className="results-inner">
          {/* Header */}
          <div className="results-header fade-up">
            <span className="badge"><Zap size={13} /> Analysis Complete</span>
            <h1 style={{ marginTop: '1rem' }}>Your <span className="gradient-text">Career Matches</span></h1>
            <p>Based on your profile, here are the best-fit career paths for you.</p>
          </div>

          <div className="results-grid">
            {/* Left column: career cards + AI Summary */}
            <div>
              {/* Career Cards */}
              <div className="glass r-card fade-up fade-up-delay-1" style={{ marginBottom: '1.5rem' }}>
                <h3><Trophy size={18} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:'0.4rem' }} />Top Career Paths</h3>
                {careers.map((c, i) => (
                  <div key={i} className={`career-item ${i === 0 ? 'top-match' : ''}`}>
                    {i === 0 && <div className="top-badge"><Star size={12} fill="currentColor" /> Best Match</div>}
                    <div className="career-name">{c.title}</div>
                    <div className="career-meta">
                      <span className="conf-badge">{c.match_percentage.toFixed(0)}% Match</span>
                      <div className="conf-bar-track">
                        <div className="conf-bar-fill" style={{ width: `${c.match_percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: skills to develop + stats */}
            <div>
              {skills_to_develop.length > 0 && (
                <div className="glass r-card fade-up fade-up-delay-2" style={{ marginBottom: '1.5rem' }}>
                  <h3><Puzzle size={18} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:'0.4rem' }} />Skills to Bridge</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                    Focus on these skills to strengthen your candidacy for <strong>{topCareer.title}</strong>.
                  </p>
                  <div className="gaps-wrap">
                    {skills_to_develop.map((g, i) => (
                      <span key={i} className="gap-chip">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Summary Stats */}
              <div className="glass r-card fade-up fade-up-delay-3">
                <h3><BarChart2 size={18} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:'0.4rem' }} />Score Summary</h3>
                {careers.map((c, i) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem', color: i === 0 ? 'var(--text)' : 'var(--muted)' }}>
                      <span>{c.title}</span>
                      <span style={{ fontWeight: 600 }}>{c.match_percentage.toFixed(0)}%</span>
                    </div>
                    <div className="conf-bar-track" style={{ height: 7, borderRadius: 4 }}>
                      <div
                        className="conf-bar-fill"
                        style={{
                          width: `${c.match_percentage}%`,
                          background: i === 0
                            ? 'linear-gradient(90deg,var(--primary),#a78bfa)'
                            : 'linear-gradient(90deg,rgba(124,107,255,0.3),rgba(255,140,66,0.25))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(summary || reasons.length > 0) && (
            <div className="results-insight-row">
              {summary && (
                <div className="glass r-card fade-up fade-up-delay-2 results-insight-card results-insight-main">
                  <h3><Sparkles size={18} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:'0.4rem' }} />AI Overall Insights</h3>
                  <p style={{ lineHeight: '1.7', color: 'var(--text)' }}>
                    {summary}
                  </p>
                </div>
              )}

              {reasons.length > 0 && (
                <div className="glass r-card fade-up fade-up-delay-2 results-insight-card results-insight-side">
                  <h3><Lightbulb size={18} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:'0.4rem' }} />Why This Matches You ({topCareer.title})</h3>
                  <div className="roadmap-steps">
                    {reasons.map((step, i) => (
                      <div key={i} className="roadmap-step">
                        <div className="step-num">{i + 1}</div>
                        <div className="step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="glass r-card fade-up fade-up-delay-3 resume-optimizer-card">
            <div className="section-header-row">
              <div>
                <h3>Resume Optimizer</h3>
                <p className="section-subtext">
                  Tune your resume for a selected role with sharper, ATS-friendly suggestions.
                </p>
              </div>
              <div className="optimizer-controls">
                {careers.length > 0 && (
                  <label className="optimizer-role-picker">
                    <span>Target role</span>
                    <select
                      className="optimizer-role-select"
                      value={optimizerRole}
                      onChange={(e) => setSelectedOptimizerRole(e.target.value)}
                    >
                      {careers.map((career) => (
                        <option key={career.title} value={career.title}>
                          {career.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {optimizerData?.target_role && (
                  <span className="optimizer-role-badge">{optimizerData.target_role}</span>
                )}
              </div>
            </div>

            {optimizerLoading && (
              <div className="assistant-empty">Generating resume improvements...</div>
            )}

            {!optimizerLoading && !optimizerData && !optimizerError && (
              <div className="assistant-empty" style={{ padding: '3rem 2rem', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem' }}>Click below to generate an AI-tailored resume strategy for this role.</p>
                  <button className="btn btn-primary" onClick={loadOptimizer}>
                    <Sparkles size={16} /> Generate Resume Optimizer
                  </button>
                </div>
              </div>
            )}

            {!optimizerLoading && optimizerError && (
              <div className={`upload-status-bar ${optimizerError.includes('requires parsed resume text') ? 'loading' : 'error'} optimizer-status`}>
                {optimizerError.includes('requires parsed resume text')
                  ? 'Upload a resume to unlock role-specific resume optimization.'
                  : optimizerError}
              </div>
            )}

            {!optimizerLoading && !optimizerError && optimizerData && (
              <div className="optimizer-grid">
                <div className="optimizer-main">
                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Professional Summary</h4>
                      <button
                        type="button"
                        className="optimizer-copy-btn"
                        onClick={() => copyText('summary', optimizerData.professional_summary)}
                      >
                        {copiedSection === 'summary' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p>{optimizerData.professional_summary}</p>
                  </div>

                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Stronger Resume Bullets</h4>
                      <button
                        type="button"
                        className="optimizer-copy-btn"
                        onClick={() => copyText('bullets', optimizerData.bullet_improvements.map((bullet) => `- ${bullet}`).join('\n'))}
                      >
                        {copiedSection === 'bullets' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="optimizer-list">
                      {optimizerData.bullet_improvements.map((bullet, index) => (
                        <div key={index} className="optimizer-list-item">
                          <span className="optimizer-index">{index + 1}</span>
                          <p>{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="optimizer-side">
                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Missing Keywords</h4>
                      <button
                        type="button"
                        className="optimizer-copy-btn"
                        onClick={() => copyText('keywords', optimizerData.missing_keywords.join(', '))}
                      >
                        {copiedSection === 'keywords' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="gaps-wrap">
                      {optimizerData.missing_keywords.map((keyword, index) => (
                        <span key={index} className="gap-chip optimizer-chip">{keyword}</span>
                      ))}
                    </div>
                  </div>

                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Recruiter Tips</h4>
                      <button
                        type="button"
                        className="optimizer-copy-btn"
                        onClick={() => copyText('tips', optimizerData.recruiter_tips.map((tip) => `- ${tip}`).join('\n'))}
                      >
                        {copiedSection === 'tips' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="optimizer-list compact">
                      {optimizerData.recruiter_tips.map((tip, index) => (
                        <div key={index} className="optimizer-list-item">
                          <span className="optimizer-index">{index + 1}</span>
                          <p>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="glass r-card fade-up fade-up-delay-4 mock-interview-card">
            <div className="section-header-row">
              <div>
                <h3>Mock Interview Agent</h3>
                <p className="section-subtext">
                  Practice role-specific interview questions based on your profile and matched career path.
                </p>
              </div>
              <div className="optimizer-controls">
                {careers.length > 0 && (
                  <label className="optimizer-role-picker">
                    <span>Interview role</span>
                    <select
                      className="optimizer-role-select"
                      value={interviewRole}
                      onChange={(e) => setSelectedInterviewRole(e.target.value)}
                    >
                      {careers.map((career) => (
                        <option key={career.title} value={career.title}>
                          {career.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {safeInterviewData.target_role && (
                  <span className="optimizer-role-badge">{safeInterviewData.target_role}</span>
                )}
              </div>
            </div>

            {interviewLoading && (
              <div className="assistant-empty">Generating your mock interview kit...</div>
            )}

            {!interviewLoading && !interviewData && !interviewError && (
              <div className="assistant-empty" style={{ padding: '3rem 2rem', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem' }}>Click below to generate a behavioral and technical mock interview toolkit tailored to your skills for this role.</p>
                  <button className="btn btn-primary" onClick={loadInterview}>
                    <Sparkles size={16} /> Generate Mock Interview
                  </button>
                </div>
              </div>
            )}

            {!interviewLoading && interviewError && (
              <div className="upload-status-bar error optimizer-status">
                {interviewError}
              </div>
            )}

            {!interviewLoading && !interviewError && interviewData && (
              <div className="mock-interview-grid">
                <div className="mock-interview-column">
                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Warm-Up Questions</h4>
                    </div>
                    {renderInterviewList(safeInterviewData.warmup_questions, 'No warm-up questions were generated for this role yet.')}
                  </div>

                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Technical Questions</h4>
                    </div>
                    {renderInterviewList(safeInterviewData.technical_questions, 'No technical questions were generated for this role yet.')}
                  </div>
                </div>

                <div className="mock-interview-column">
                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Behavioral Questions</h4>
                    </div>
                    {renderInterviewList(safeInterviewData.behavioral_questions, 'No behavioral questions were generated for this role yet.')}
                  </div>

                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>What Interviewers Will Focus On</h4>
                    </div>
                    {renderInterviewList(safeInterviewData.interviewer_focus, 'No interviewer focus points were generated for this role yet.')}
                  </div>

                  <div className="optimizer-block">
                    <div className="optimizer-block-header">
                      <h4>Answer Tips</h4>
                    </div>
                    {renderInterviewList(safeInterviewData.answer_tips, 'No answer tips were generated for this role yet.')}
                  </div>
                </div>
              </div>
            )}

            {!interviewLoading && !interviewError && interviewData && !hasInterviewContent && (
              <div className="assistant-empty">We could not generate a complete mock interview kit this time. Try switching the role or re-running the analysis.</div>
            )}
          </div>

          {/* Actions */}
          <div className="results-actions fade-up fade-up-delay-4">
            <button className="btn btn-ghost" onClick={() => navigate(PAGES.QUESTIONS)}><ChevronLeft size={16} /> Edit Profile</button>
            <button className="btn btn-primary" onClick={reset}><RotateCcw size={16} /> Start New Analysis</button>
          </div>
        </div>
      </div>

        <button
          type="button"
          className="assistant-fab"
          onClick={() => setPanelOpen(true)}
          aria-label="Open AI assistant"
        >
          <span className="assistant-fab-ring" aria-hidden="true" />
          <span className="assistant-fab-inner">
            <MessageCircle size={20} strokeWidth={2} />
          </span>
          <span className="assistant-fab-label">Career Copilot</span>
        </button>

      {panelOpen && <button type="button" className="assistant-backdrop" onClick={() => setPanelOpen(false)} aria-label="Close AI assistant" />}

      <aside className={`assistant-side-panel glass ${panelOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="assistant-dock-toggle"
          onClick={() => setPanelOpen(false)}
          aria-label="Close assistant panel"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="assistant-panel-glow" aria-hidden="true" />

        <div className="assistant-header">
          <div>
            <span className="assistant-kicker">Career Copilot</span>
            <p className="assistant-subtitle">
              Ask about role fit, resume edits, or next steps.
            </p>
            <div className="assistant-suggestions">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="assistant-suggestion-chip"
                  onClick={() => sendMessage(prompt)}
                  disabled={chatLoading || !predictionId}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          {predictionId && <span className="assistant-status">Prediction #{predictionId}</span>}
        </div>

        <div className="assistant-thread">
          {chatMessages.length === 0 && !chatLoading && !chatError && (
            <div className="assistant-empty assistant-empty-hero">
              <div className="assistant-empty-logo"><Sparkles size={22} strokeWidth={1.5} /></div>
              <div>
                <strong>Career Copilot is ready.</strong>
                <p>Ask a question or tap one of the suggested prompts above.</p>
              </div>
            </div>
          )}

          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`assistant-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}
            >
              <div className="assistant-role">
                {message.role === 'assistant' ? 'AI Assistant' : 'You'}
              </div>
              <div>{message.content}</div>
            </div>
          ))}

          {chatLoading && (
            <div className="assistant-empty assistant-thinking">
              <span className="typing-dots"><i /><i /><i /></span>
              The assistant is thinking...
            </div>
          )}
        </div>

        {chatError && <div className="upload-status-bar error assistant-error">{chatError}</div>}

        <form className="assistant-form" onSubmit={handleSubmit}>
          <div className="assistant-composer">
            <input
              className="assistant-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message Career Copilot..."
              disabled={!predictionId || chatLoading}
            />
            <button
              type="submit"
              className="assistant-send-button"
              disabled={!predictionId || chatLoading || !chatInput.trim()}
              aria-label="Send message"
            >
              <Send size={17} strokeWidth={2} />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
