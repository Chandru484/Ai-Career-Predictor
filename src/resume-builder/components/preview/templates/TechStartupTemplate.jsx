import { Mail, Phone, MapPin, Link, GitBranch, Globe, Code, Zap, Briefcase, GraduationCap, User } from 'lucide-react';

function hexToRgba(hex, alpha) {
  try {
    const h = (hex || '#000000').replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

export default function TechStartupTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#1e3a8a', font_size = 'medium', spacing = 'normal' } = settings;

  const sizes = { small: { name: 26, section: 12, body: 9.5 }, medium: { name: 30, section: 13, body: 10.5 }, large: { name: 34, section: 14, body: 11.5 } };
  const sz = sizes[font_size] ?? sizes.medium;
  const sectionGap = { compact: 16, normal: 24, relaxed: 32 }[spacing] ?? 24;
  const itemGap = { compact: 10, normal: 14, relaxed: 18 }[spacing] ?? 14;

  const SectionTitle = ({ title, icon: Icon }) => (
    <div style={{ marginBottom: itemGap, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ background: hexToRgba(theme_color, 0.15), padding: 6, borderRadius: 6, display: 'flex', color: theme_color }}>
        {Icon && <Icon size={sz.section + 2} />}
      </div>
      <span style={{ fontSize: sz.section, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
      <div style={{ flex: 1, height: '2px', background: hexToRgba(theme_color, 0.2), marginLeft: 8 }} />
    </div>
  );

  return (
    <div className="rb-template-root" style={{ color: '#374151', fontSize: sz.body, lineHeight: 1.6, background: '#fff', flex: 1, minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* HEADER: Dark and bold */}
      <div style={{ background: '#0f172a', padding: '36px 40px', color: '#f8fafc', borderBottom: `4px solid ${theme_color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: sz.name, fontWeight: 900, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {personal.fullName || personal.name || 'Your Name'}
            </h1>
            {personal.title && (
              <div style={{ fontSize: sz.body + 3, color: theme_color, fontWeight: 600, letterSpacing: '0.02em', marginTop: 4 }}>
                {personal.title}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', fontSize: sz.body - 0.5, color: '#cbd5e1' }}>
            {personal.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={sz.body} color={theme_color} /> {personal.email}</div>}
            {personal.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={sz.body} color={theme_color} /> {personal.phone}</div>}
            {personal.location && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={sz.body} color={theme_color} /> {personal.location}</div>}
            {personal.linkedin && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Link size={sz.body} color={theme_color} /> {personal.linkedin.replace('https://', '')}</div>}
            {personal.github && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GitBranch size={sz.body} color={theme_color} /> {personal.github.replace('https://', '')}</div>}
          </div>
        </div>
      </div>

      {/* CONTENT COLUMNS */}
      <div style={{ display: 'flex', flex: 1, padding: '32px 40px' }}>
        
        {/* LEFT COLUMN: 65% (Experience, Projects) */}
        <div style={{ width: '65%', paddingRight: 32, display: 'flex', flexDirection: 'column' }}>
          
          {summary && (
            <div style={{ marginBottom: sectionGap }}>
              <SectionTitle title="Summary" icon={User} />
              <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.7 }}>{summary}</p>
            </div>
          )}

          {experience?.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <SectionTitle title="Experience" icon={Briefcase} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap * 1.5 }}>
                {experience.map((exp, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 16, borderLeft: `2px solid ${hexToRgba(theme_color, 0.3)}` }}>
                    <div style={{ position: 'absolute', left: -5, top: 6, width: 8, height: 8, borderRadius: '50%', background: theme_color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h3 style={{ margin: 0, fontSize: sz.body + 2, fontWeight: 800, color: '#111827' }}>{exp.title}</h3>
                      <span style={{ fontSize: sz.body - 1, color: theme_color, fontWeight: 600, background: hexToRgba(theme_color, 0.1), padding: '2px 8px', borderRadius: 4 }}>
                        {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
                      </span>
                    </div>
                    <div style={{ fontSize: sz.body, fontWeight: 600, color: '#4b5563', margin: '2px 0 6px 0' }}>
                      {exp.company} {exp.location && `· ${exp.location}`}
                    </div>
                    {exp.description && (
                      <ul style={{ paddingLeft: 16, margin: 0, color: '#4b5563', lineHeight: 1.6 }}>
                        {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                          <li key={bi} style={{ marginBottom: 4 }}>{b.replace(/^•\s*/, '')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects?.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <SectionTitle title="Projects" icon={Zap} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
                {projects.map((proj, i) => (
                  <div key={i} style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: `1px solid #e2e8f0` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>{proj.name}</h3>
                    </div>
                    <div style={{ fontSize: sz.body - 1, color: theme_color, fontWeight: 600, marginBottom: 8 }}>{proj.technologies}</div>
                    {proj.description && (
                      <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 35% (Skills, Education) */}
        <div style={{ width: '35%', display: 'flex', flexDirection: 'column' }}>
          
          {skills?.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <SectionTitle title="Skills" icon={Code} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((skill, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: hexToRgba(theme_color, 0.1), color: '#111827', borderRadius: 6, fontSize: sz.body - 0.5, fontWeight: 600, border: `1px solid ${hexToRgba(theme_color, 0.2)}` }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education?.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <SectionTitle title="Education" icon={GraduationCap} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
                {education.map((edu, i) => (
                  <div key={i}>
                    <h3 style={{ margin: 0, fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>
                      {edu.school || edu.institution}
                    </h3>
                    <div style={{ fontSize: sz.body, color: '#4b5563', margin: '2px 0 4px 0', fontWeight: 500 }}>
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </div>
                    <div style={{ fontSize: sz.body - 1, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}</span>
                      {edu.grade && <span style={{ color: theme_color, fontWeight: 600 }}>{edu.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
