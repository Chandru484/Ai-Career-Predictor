import { useState } from 'react';
import '../App.css';
import { useAuth } from '@clerk/react';
import { extractSkillsFromResume } from '../utils/skillExtractor';
import { UploadCloud, FileCheck2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UploadPage({ navigate, setUserData, PAGES }) {
  const { getToken } = useAuth();
  const [uploadState, setUploadState] = useState('idle'); // idle | loading | success | error
  const [uploadMsg, setUploadMsg]   = useState('');
  const [fileName, setFileName]     = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploadState('loading');
    setUploadMsg('Parsing resume…');

    const form = new FormData();
    form.append('file', file);

    let token = null;
    try {
      token = await getToken();
    } catch (err) {
      console.error("Clerk Token error:", err);
      setUploadState('error');
      setUploadMsg(`Error getting auth token: ${err.message}`);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res  = await fetch(`${API_URL}/api/resume`, { 
        method: 'POST', 
        body: form,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();

      if (data.error || data.detail) {
        setUploadState('error');
        setUploadMsg(data.error || data.detail || 'Upload failed');
        return;
      }

      const text = data.resume_text || '';
      const inferredSkills = extractSkillsFromResume(text);

      setUserData((prev) => ({
        ...prev,
        resume_text: text,
        skills: inferredSkills || prev.skills,
      }));

      setUploadState('success');
      setUploadMsg(inferredSkills ? 'Resume parsed — skills auto-filled' : 'Resume parsed successfully');
    } catch (err) {
      console.error("Upload error:", err);
      setUploadState('error');
      setUploadMsg(`Error: ${err.message}. Backend running?`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const dropIcon = () => {
    if (uploadState === 'loading') return <Loader2 size={38} className="spin" strokeWidth={1.5} />;
    if (uploadState === 'success') return <FileCheck2 size={38} strokeWidth={1.5} style={{ color: 'var(--success, #4ade80)' }} />;
    return <UploadCloud size={38} strokeWidth={1.5} />;
  };

  return (
    <div className="upload-page page-content">
      <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>

      <div className="glass upload-card fade-up" style={{ position: 'relative', zIndex: 1 }}>
        {/* Progress */}
        <div className="progress-nav">
          <div className="prog-step done"><div className="prog-dot" /></div>
          <div className="prog-line" />
          <div className="prog-step active"><div className="prog-dot" /> <span>Upload</span></div>
          <div className="prog-line" />
          <div className="prog-step"><div className="prog-dot" /> <span>Profile</span></div>
          <div className="prog-line" />
          <div className="prog-step"><div className="prog-dot" /> <span>Results</span></div>
        </div>

        <div className="page-step">Step 1 of 3</div>
        <h2>Upload Your <span className="gradient-text">Resume</span></h2>
        <p>We'll extract your skills automatically. Supports PDF and TXT files.</p>

        {/* Drop zone */}
        <div
          className={`drop-zone ${uploadState === 'loading' ? 'active' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{ position: 'relative' }}
        >
          <div className="drop-zone-inner">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            <div className="drop-icon">{dropIcon()}</div>
            <h3>
              {uploadState === 'loading' ? 'Parsing your resume…' :
               uploadState === 'success' ? 'Resume Parsed!' :
               'Drag & drop your resume here'}
            </h3>
            <p>or click to browse — PDF or TXT, up to 5 MB</p>
            {fileName && <div className="file-name">{fileName}</div>}
          </div>
        </div>

        {/* Status bar */}
        {uploadState !== 'idle' && (
          <div className={`upload-status-bar ${uploadState}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {uploadState === 'loading' && <Loader2 size={15} className="spin" />}
            {uploadState === 'error'   && <AlertCircle size={15} />}
            {uploadState === 'success' && <FileCheck2 size={15} />}
            {uploadMsg}
          </div>
        )}

        <div className="divider">or</div>

        <button
          className="btn btn-primary"
          onClick={() => navigate(PAGES.QUESTIONS)}
        >
          {uploadState === 'success' ? (
            <><FileCheck2 size={16} /> Continue to Profile</>
          ) : (
            <>Skip — Fill Manually <ChevronRight size={16} /></>
          )}
        </button>
        <button className="btn btn-ghost" onClick={() => navigate(PAGES.LANDING)}>
          <ChevronLeft size={16} /> Back
        </button>
      </div>
    </div>
  );
}
