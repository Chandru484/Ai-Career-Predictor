import { Mail, Phone, MapPin, Link, GitBranch, Globe } from 'lucide-react';

function getContrastColor(hexColor) {
  try {
    const hex = (hexColor || '#000000').replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) || 0;
    const g = parseInt(hex.substr(2, 2), 16) || 0;
    const b = parseInt(hex.substr(4, 2), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#ffffff';
  } catch { return '#ffffff'; }
}

/* Professional Template — Two-column layout with a bold solid-colored sidebar */
export default function ProfessionalTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#1e40af', font_size = 'medium', spacing = 'normal' } = settings;

  const sizes = { small: { name: 24, section: 12, body: 9.5 }, medium: { name: 28, section: 13, body: 10.5 }, large: { name: 32, section: 14, body: 11.5 } };
  const sz = sizes[font_size] ?? sizes.medium;
  const sectionGap = { compact: 16, normal: 24, relaxed: 32 }[spacing] ?? 24;
  const sidebarTextColor = getContrastColor(theme_color);

  // Dynamic name scaling
  const nameLength = (personal.fullName || personal.name || '').length;
  let dynamicNameSize = sz.name;
  if (nameLength > 20) dynamicNameSize = sz.name * 0.8;
  if (nameLength > 25) dynamicNameSize = sz.name * 0.65;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: sectionGap }}>
      <div style={{ borderBottom: `2px solid ${theme_color}`, paddingBottom: 4, marginBottom: 10 }}>
        <span style={{ fontSize: sz.section, fontWeight: 700, color: theme_color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="rb-template-root" style={{ lineHeight: 1.6, flex: 1, minHeight: '100%', height: '100%', display: 'flex', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR - 35% */}
      <div style={{ width: '35%', background: theme_color, color: sidebarTextColor, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Name and Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: dynamicNameSize, fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.1 }}>
            {personal.fullName || personal.name || 'Your Name'}
          </h1>
          {personal.title && (
            <div style={{ fontSize: sz.body + 1, fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {personal.title}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {personal.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <Mail size={14} /> <span style={{ wordBreak: 'break-all' }}>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <Phone size={14} /> <span>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <MapPin size={14} /> <span>{personal.location}</span>
            </div>
          )}
          {personal.linkedin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <Link size={14} /> <span style={{ wordBreak: 'break-all' }}>{personal.linkedin.replace('https://', '')}</span>
            </div>
          )}
          {personal.github && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <GitBranch size={14} /> <span style={{ wordBreak: 'break-all' }}>{personal.github.replace('https://', '')}</span>
            </div>
          )}
          {personal.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz.body, opacity: 0.9 }}>
              <Globe size={14} /> <span style={{ wordBreak: 'break-all' }}>{personal.website.replace('https://', '')}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills?.length > 0 && (
          <div>
            <div style={{ fontSize: sz.section, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 4, marginBottom: 12 }}>
              Skills
            </div>
            <ul style={{ paddingLeft: 16, margin: 0, opacity: 0.9, fontSize: sz.body, lineHeight: 1.8 }}>
              {skills.map((skill, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT - 65% */}
      <div style={{ width: '65%', background: '#ffffff', color: '#1f2937', padding: '32px', display: 'flex', flexDirection: 'column' }}>
        
        {summary && (
          <Section title="Professional Summary">
            <p style={{ fontSize: sz.body, color: '#374151', lineHeight: 1.8, margin: 0 }}>{summary}</p>
          </Section>
        )}

        {experience?.length > 0 && (
          <Section title="Experience">
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{exp.title}</span>
                  <span style={{ fontSize: sz.body - 1, color: '#6b7280' }}>
                    {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#4b5563', marginBottom: 4 }}>
                  {exp.company} {exp.location && `· ${exp.location}`}
                </div>
                {exp.description && (
                  <ul style={{ paddingLeft: 16, margin: '4px 0 0 0', color: '#4b5563' }}>
                    {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                      <li key={bi} style={{ fontSize: sz.body, marginBottom: 3 }}>{b.replace(/^•\s*/, '')}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {projects?.length > 0 && (
          <Section title="Projects">
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{proj.name}</span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#4b5563', marginBottom: 4 }}>
                  {proj.technologies}
                </div>
                {proj.description && (
                  <p style={{ fontSize: sz.body, color: '#4b5563', margin: '4px 0 0 0' }}>{proj.description}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {education?.length > 0 && (
          <Section title="Education">
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{edu.degree} {edu.field && `in ${edu.field}`}</span>
                  <span style={{ fontSize: sz.body - 1, color: '#6b7280' }}>
                    {edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#4b5563' }}>
                  {edu.school || edu.institution}
                </div>
                {edu.grade && <div style={{ fontSize: sz.body - 1, color: '#4b5563', marginTop: 2 }}>{edu.grade}</div>}
              </div>
            ))}
          </Section>
        )}

      </div>
    </div>
  );
}
