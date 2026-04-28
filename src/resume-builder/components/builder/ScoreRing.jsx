import { useResume } from '../../context/ResumeContext';

export default function ScoreRing() {
  const { resume } = useResume();
  const { personal, summary, experience, education, skills } = resume.content;
  let rawScore = 0;

  // Personal info (max 20)
  if (personal?.fullName || personal?.name) rawScore += 5;
  if (personal?.email) rawScore += 5;
  if (personal?.phone) rawScore += 5;
  if (personal?.linkedin) rawScore += 5;

  // Summary (max 20)
  if (summary && summary.length > 20) rawScore += 10;
  if (summary && summary.length > 100) rawScore += 10;

  // Experience (max 30)
  if (experience?.length > 0) rawScore += 15;
  if (experience?.some(e => e.description && e.description.length > 50)) rawScore += 15;

  // Education (max 15)
  if (education?.length > 0) rawScore += 15;

  // Skills (max 15)
  if (skills?.length >= 3) rawScore += 5;
  if (skills?.length >= 6) rawScore += 10;

  const score = Math.min(100, rawScore);

  // SVG calculations
  const size = 44;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let color = '#ef4444'; // Red
  if (score >= 40) color = '#f59e0b'; // Yellow
  if (score >= 70) color = '#96e630'; // Lime Green

  return (
    <div className="flex items-center gap-3 bg-[#1e1f36] px-3 py-1.5 rounded-full border border-white/5" title="ATS Resume Score">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="absolute top-0 left-0" width={size} height={size}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}
          />
        </svg>
        {/* Animated score ring */}
        <svg className="absolute top-0 left-0 rotate-[-90deg]" width={size} height={size}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-white">{score}</span>
        </div>
      </div>
      <div className="hidden md:flex flex-col">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-tight">ATS Score</span>
        <span className="text-xs font-semibold text-white leading-tight">
          {score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work'}
        </span>
      </div>
    </div>
  );
}
