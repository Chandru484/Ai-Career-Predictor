/* Creative Template — Visually striking two-column layout with centered sidebar */

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

export default function CreativeTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], projects = [], skills = [] } = content;
  const { theme_color = '#7c3aed', font_size = 'medium', spacing = 'normal' } = settings;

  const sizes = { small: { name: 24, section: 13, body: 9.5 }, medium: { name: 28, section: 14, body: 10.5 }, large: { name: 32, section: 15, body: 11.5 } };
  const sz = sizes[font_size] ?? sizes.medium;
  const sectionGap = { compact: 20, normal: 30, relaxed: 40 }[spacing] ?? 30;
  const sidebarTextColor = getContrastColor(theme_color);

  const MainSection = ({ title, children }) => (
    <div style={{ marginBottom: sectionGap }}>
      <div style={{ borderBottom: `2px solid ${theme_color}`, paddingBottom: 6, marginBottom: 12 }}>
        <span style={{ fontSize: sz.section, fontWeight: 800, color: theme_color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="rb-template-root" style={{ lineHeight: 1.6, flex: 1, minHeight: '100%', height: '100%', display: 'flex', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR - 35% */}
      <div style={{ width: '35%', background: theme_color, color: sidebarTextColor, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {/* Profile Picture */}
        {personal.photo_url ? (
          <img 
            src={personal.photo_url} 
            alt="Profile" 
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: 20 }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40, color: 'white', fontWeight: 'bold' }}>
              {(personal.fullName || personal.name || 'Y').charAt(0)}
            </span>
          </div>
        )}

        {/* Name and Title */}
        <h1 style={{ fontSize: sz.name, fontWeight: 900, margin: '0 0 8px 0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {personal.fullName || personal.name || 'Your Name'}
        </h1>
        {personal.title && (
          <div style={{ fontSize: sz.body + 1, fontWeight: 500, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 24 }}>
            {personal.title}
          </div>
        )}

        {/* Contact Info */}
        <div style={{ width: '100%', marginBottom: 32 }}>
          <div style={{ fontSize: sz.body - 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 6, marginBottom: 12 }}>
            Contact
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: sz.body, opacity: 0.9 }}>
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.linkedin && <div>{personal.linkedin.replace('https://', '')}</div>}
            {personal.website && <div>{personal.website.replace('https://', '')}</div>}
          </div>
        </div>

        {/* Skills */}
        {skills?.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: sz.body - 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 6, marginBottom: 12 }}>
              Expertise
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {skills.map((skill, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 9999, fontSize: sz.body - 0.5 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT - 65% */}
      <div style={{ width: '65%', background: '#ffffff', color: '#111827', padding: '40px 32px', display: 'flex', flexDirection: 'column' }}>
        
        {summary && (
          <MainSection title="Profile">
            <p style={{ fontSize: sz.body, color: '#374151', lineHeight: 1.8, margin: 0 }}>{summary}</p>
          </MainSection>
        )}

        {experience?.length > 0 && (
          <MainSection title="Experience">
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 2, fontWeight: 800, color: '#111827' }}>{exp.title}</span>
                  <span style={{ fontSize: sz.body - 1, color: theme_color, fontWeight: 600 }}>
                    {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#6b7280', marginBottom: 6 }}>
                  {exp.company} {exp.location && `· ${exp.location}`}
                </div>
                {exp.description && (
                  <ul style={{ paddingLeft: 18, margin: 0, color: '#4b5563', lineHeight: 1.6 }}>
                    {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                      <li key={bi} style={{ fontSize: sz.body, marginBottom: 4 }}>{b.replace(/^•\s*/, '')}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {projects?.length > 0 && (
          <MainSection title="Selected Projects">
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>{proj.name}</span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#6b7280', marginBottom: 4 }}>
                  {proj.technologies}
                </div>
                {proj.description && (
                  <p style={{ fontSize: sz.body, color: '#4b5563', margin: 0 }}>{proj.description}</p>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {education?.length > 0 && (
          <MainSection title="Education">
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>{edu.degree} {edu.field && `in ${edu.field}`}</span>
                  <span style={{ fontSize: sz.body - 1, color: theme_color, fontWeight: 600 }}>
                    {edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: '#6b7280' }}>
                  {edu.school || edu.institution}
                </div>
                {edu.grade && <div style={{ fontSize: sz.body - 1, color: '#4b5563', marginTop: 2 }}>{edu.grade}</div>}
              </div>
            ))}
          </MainSection>
        )}

      </div>
    </div>
  );
}
