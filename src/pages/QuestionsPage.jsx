import { useState } from 'react';
import '../App.css';
import { BrainCircuit, Target, Lightbulb, Stars, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

const fields = [
  {
    key: 'skills',
    icon: BrainCircuit,
    label: 'Current Skills',
    type: 'textarea',
    placeholder: 'Auto-filled from your resume, but you can edit or add more skills here…',
    hint: (hasResume) =>
      hasResume
        ? 'These skills were auto-filled from your resume and can be edited.'
        : 'Enter your main technical skills, separated with commas.',
  },
  {
    key: 'target_roles',
    icon: Target,
    label: 'Target Roles',
    type: 'input',
    placeholder: 'e.g. AI Engineer, Backend Developer, Data Analyst',
    hint: () => 'Optional, but helpful if you already have a role in mind.',
  },
  {
    key: 'interests',
    icon: Lightbulb,
    label: 'Interests',
    type: 'input',
    placeholder: 'e.g. AI, Cloud Architecture, UI/UX…',
    hint: () => 'Separate with commas.',
  },
  {
    key: 'strengths',
    icon: Stars,
    label: 'Key Strengths',
    type: 'input',
    placeholder: 'e.g. Problem Solving, Leadership, Analytics…',
    hint: () => 'Separate with commas.',
  },
];

export default function QuestionsPage({ navigate, userData, setUserData, runPrediction, PAGES }) {
  const [error, setError] = useState('');

  const set = (field) => (e) => setUserData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userData.skills.trim() && !userData.resume_text?.trim()) {
      setError('Please enter at least one skill, or upload a resume.');
      return;
    }
    setError('');
    runPrediction(userData);
  };

  return (
    <div className="questions-page">
      <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>

      <form className="glass questions-card fade-up" onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
        {/* Progress */}
        <div className="progress-nav">
          <div className="prog-step done"><div className="prog-dot" /></div>
          <div className="prog-line" />
          <div className="prog-step done"><div className="prog-dot" /> <span>Upload</span></div>
          <div className="prog-line" />
          <div className="prog-step active"><div className="prog-dot" /> <span>Profile</span></div>
          <div className="prog-line" />
          <div className="prog-step"><div className="prog-dot" /> <span>Results</span></div>
        </div>

        <div className="page-step">Step 2 of 3</div>
        <h2>Your <span className="gradient-text">Profile</span></h2>
        <p>Tell us about yourself — the more detail, the better the prediction.</p>

        {fields.map((field) => {
          const Icon = field.icon;

          return (
            <div className="form-group" key={field.key}>
              <label className="form-label">
                <Icon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-input"
                  rows="3"
                  value={userData[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  className="form-input"
                  type="text"
                  value={userData[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                />
              )}
              <div className="form-hint">{field.hint(!!userData.resume_text?.trim())}</div>
            </div>
          );
        })}

        {error && (
          <div className="upload-status-bar error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(PAGES.UPLOAD)}>
            <ChevronLeft size={16} /> Back
          </button>
          <button type="submit" className="btn btn-primary">
            <Sparkles size={16} /> Analyse My Profile
          </button>
        </div>
      </form>
    </div>
  );
}
