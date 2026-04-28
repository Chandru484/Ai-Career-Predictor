import { useResume } from '../../context/ResumeContext';
import { User, Mail, Phone, MapPin, Link2, GitBranch, Globe } from 'lucide-react';

const FIELDS = [
  { key: 'name',     label: 'Full Name',         placeholder: 'Jane Doe',               icon: User,     col: 2 },
  { key: 'email',    label: 'Email',              placeholder: 'jane@example.com',        icon: Mail,     col: 1 },
  { key: 'phone',    label: 'Phone',              placeholder: '+1 (555) 000-0000',       icon: Phone,    col: 1 },
  { key: 'location', label: 'Location',           placeholder: 'City, State, Country',   icon: MapPin,   col: 2 },
  { key: 'linkedin', label: 'LinkedIn URL',       placeholder: 'linkedin.com/in/you',    icon: Link2,      col: 1 },
  { key: 'github',   label: 'GitHub URL',         placeholder: 'github.com/you',         icon: GitBranch,  col: 1 },
  { key: 'website',  label: 'Portfolio / Website',placeholder: 'yoursite.com',           icon: Globe,    col: 2 },
];

export default function PersonalInfoForm() {
  const { resume, setContent } = useResume();
  const p = resume.content.personal ?? {};
  const update = (field, val) => setContent({ personal: { ...p, [field]: val } });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">👤</span>
        <span className="rb-section-title mb-0">Personal Information</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, placeholder, icon: Icon, col }) => (
          <div key={key} className={col === 2 ? 'col-span-2' : 'col-span-1'}>
            <label className="rb-label">{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                   style={{ color: '#4b5563' }} />
              <input
                className="rb-input"
                style={{ paddingLeft: '2.25rem' }}
                value={p[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
