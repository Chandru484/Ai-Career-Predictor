import '../App.css';
import { BrainCog, GitBranch, BarChart3, Map } from 'lucide-react';

const steps = [
  { icon: BrainCog,   label: 'Analysing your skill profile…' },
  { icon: GitBranch,  label: 'Matching against career paths…' },
  { icon: BarChart3,  label: 'Running confidence scoring…' },
  { icon: Map,        label: 'Generating your roadmap…' },
];

export default function AnalyzingPage() {
  return (
    <div className="analyzing-page page-content">
      <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>

      {/* Animated triple-ring orb */}
      <div className="analyzing-orb">
        <div className="orb-ring orb-ring-1" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-ring orb-ring-3" />
        <div className="orb-center">
          <BrainCog size={28} strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="fade-up">
        <span className="gradient-text">AI is Thinking…</span>
      </h2>
      <p className="fade-up fade-up-delay-1">
        Our model is analysing your profile and running career path scoring.
      </p>

      <div className="analysis-steps">
        {steps.map((step, i) => {
          const Icon = step.icon;

          return (
            <div key={i} className="astep">
              <div className="astep-dot">
                <Icon size={13} strokeWidth={2} />
              </div>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
