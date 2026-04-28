import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import UniversalTemplate from '../components/preview/templates/UniversalTemplate';
import ProfessionalTemplate from '../components/preview/templates/ProfessionalTemplate';
import CreativeTemplate from '../components/preview/templates/CreativeTemplate';
import BusinessInsiderTemplate from '../components/preview/templates/BusinessInsiderTemplate';
import ModernMinimalistTemplate from '../components/preview/templates/ModernMinimalistTemplate';
import TechStartupTemplate from '../components/preview/templates/TechStartupTemplate';
import HarvardTemplate from '../components/preview/templates/HarvardTemplate';
import ExecutiveTemplate from '../components/preview/templates/ExecutiveTemplate';

const TEMPLATES = [
  {
    key: 'universal',
    label: 'Universal',
    description: 'Clean, minimal, ATS-friendly — works for any industry',
    badge: 'Most Popular',
    defaultColor: '#96e630',
    component: UniversalTemplate,
  },
  {
    key: 'executive',
    label: 'Executive Director',
    description: 'High-end centered layout conveying luxury, authority, and polish',
    badge: 'Premium',
    defaultColor: '#1e3a8a',
    component: ExecutiveTemplate,
  },
  {
    key: 'harvard',
    label: 'Harvard Academic',
    description: 'The strict Ivy League standard — serif fonts, heavy rules, zero fluff',
    badge: 'Classic',
    defaultColor: '#000000',
    component: HarvardTemplate,
  },
  {
    key: 'modern_minimalist',
    label: 'Modern Minimalist',
    description: 'Ultra-clean Apple-esque design with focus on typography and whitespace',
    badge: 'Minimal',
    defaultColor: '#000000',
    component: ModernMinimalistTemplate,
  },
  {
    key: 'tech_startup',
    label: 'Tech Startup',
    description: 'Neon accents and a two-column layout perfect for tech roles',
    badge: 'Developer',
    defaultColor: '#96e630',
    component: TechStartupTemplate,
  },
  {
    key: 'professional',
    label: 'Professional',
    description: 'Classic corporate layout with a bold coloured sidebar',
    badge: 'Corporate',
    defaultColor: '#1e40af',
    component: ProfessionalTemplate,
  },
  {
    key: 'creative',
    label: 'Creative',
    description: 'Bold modern design with strong typography — stand out in creative industries',
    badge: 'Design',
    defaultColor: '#7c3aed',
    component: CreativeTemplate,
  },
  {
    key: 'business_insider',
    label: 'Business Insider',
    description: 'Editorial serif layout — perfect for C-suite roles',
    badge: 'Executive',
    defaultColor: '#1e3a5f',
    component: BusinessInsiderTemplate,
  }
];

const DEMO_CONTENT = {
  personal: { name: 'Jane Doe', email: 'jane@example.com', phone: '+1 555-000-0000', location: 'San Francisco, CA', linkedin: 'linkedin.com/in/jane' },
  summary: 'Results-driven software engineer with 5+ years of experience building scalable web applications and leading high-performance teams.',
  experience: [{ id: '1', company: 'Acme Corp', title: 'Senior Engineer', location: 'Remote', start_date: 'Jan 2021', end_date: 'Present', current: true, bullets: ['Led migration to microservices, reducing latency by 40%', 'Mentored 3 junior engineers to promotion'] }],
  education: [{ id: '1', institution: 'MIT', degree: 'B.S.', field: 'Computer Science', start_date: '2014', end_date: '2018', gpa: '3.9' }],
  skills: ['React', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'TypeScript', 'Node.js', 'GraphQL'],
  projects: [{ id: '1', name: 'CloudDash', description: 'Real-time analytics dashboard', technologies: 'React, D3.js, FastAPI', bullets: ['Built in 3 weeks', 'Used by 500+ teams'] }],
};

export default function TemplatePicker() {
  const { resume, setField } = useResume();
  const toast = useToast();
  const navigate = useNavigate();

  const select = (tmpl) => {
    setField('template_name', tmpl.key);
    setField('theme_color', tmpl.defaultColor);
    toast.success(`Template set to ${tmpl.label}`);
    navigate('/resume-builder/builder');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          Choose a Template
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4b5563' }}>
          Pick a design — you can change it at any time from the builder
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl, i) => {
          const isActive = resume.template_name === tmpl.key;
          const Component = tmpl.component;
          return (
            <motion.div
              key={tmpl.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => select(tmpl)}
              className="relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 group"
              style={{
                border: isActive
                  ? `2px solid ${tmpl.defaultColor}`
                  : '2px solid rgba(255,255,255,0.07)',
                boxShadow: isActive
                  ? `0 0 32px ${tmpl.defaultColor}40`
                  : '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                     style={{ background: tmpl.defaultColor, boxShadow: `0 4px 12px ${tmpl.defaultColor}60` }}>
                  <Check size={14} className="text-white" />
                </div>
              )}

              {/* Hover overlay */}
              {!isActive && (
                <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                     style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <div className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                       style={{ background: tmpl.defaultColor, boxShadow: `0 4px 16px ${tmpl.defaultColor}60` }}>
                    Select Template
                  </div>
                </div>
              )}

              {/* Miniature preview */}
              <div style={{ height: 340, overflow: 'hidden', background: '#f8f9fa', position: 'relative' }}>
                <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: 794, pointerEvents: 'none' }}>
                  <Component
                    content={DEMO_CONTENT}
                    settings={{ theme_color: tmpl.defaultColor, font_size: 'medium', spacing: 'normal' }}
                  />
                </div>
              </div>

              {/* Info bar */}
              <div className="px-5 py-4" style={{ background: 'var(--rb-surface-2)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: tmpl.defaultColor }} />
                    <span className="font-bold text-white text-sm">{tmpl.label}</span>
                  </div>
                  <span className="rb-badge text-xs">{tmpl.badge}</span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#6b7280' }}>{tmpl.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
