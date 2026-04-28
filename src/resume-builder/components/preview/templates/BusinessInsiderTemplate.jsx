/* Business Insider Template — Editorial layout with a 60/40 reversed split */

export default function BusinessInsiderTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#1e3a5f', font_size = 'medium', spacing = 'normal' } = settings;

  const sizes = { small: { name: 26, section: 12, body: 9.5 }, medium: { name: 30, section: 13, body: 10.5 }, large: { name: 34, section: 14, body: 11.5 } };
  const sz = sizes[font_size] ?? sizes.medium;
  const sectionGap = { compact: 18, normal: 28, relaxed: 40 }[spacing] ?? 28;

  const SectionTitle = ({ title }) => (
    <div style={{ borderBottom: `2px solid ${theme_color}`, paddingBottom: 4, marginBottom: 12 }}>
      <span style={{ fontSize: sz.section, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="rb-template-root" style={{ color: '#1f2937', lineHeight: 1.7, flex: 1, minHeight: '100%', height: '100%', display: 'flex', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* LEFT MAIN CONTENT - 60% */}
      <div style={{ width: '60%', padding: '40px 32px 40px 40px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ marginBottom: sectionGap }}>
          <h1 style={{ fontSize: sz.name, fontWeight: 900, color: '#111827', margin: '0 0 4px 0', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            {personal.fullName || personal.name || 'Your Name'}
          </h1>
          {personal.title && (
            <div style={{ fontSize: sz.body + 2, fontWeight: 700, color: theme_color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              {personal.title}
            </div>
          )}

          {/* Contact Grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: sz.body - 0.5, color: '#4b5563', }}>
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.linkedin && <div>{personal.linkedin.replace('https://', '')}</div>}
            {personal.github && <div>{personal.github.replace('https://', '')}</div>}
            {personal.website && <div>{personal.website.replace('https://', '')}</div>}
          </div>

          {/* Thick short divider */}
          <div style={{ width: 64, height: 4, background: theme_color, marginTop: 16 }} />
        </div>

        {summary && (
          <div style={{ marginBottom: sectionGap }}>
            <SectionTitle title="Profile" />
            <p style={{ fontSize: sz.body, color: '#374151', lineHeight: 1.85, margin: 0 }}>{summary}</p>
          </div>
        )}

        {experience?.length > 0 && (
          <div style={{ marginBottom: sectionGap }}>
            <SectionTitle title="Experience" />
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>{exp.title}</span>
                  <span style={{ fontSize: sz.body - 1, color: '#6b7280', }}>
                    {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: theme_color, fontWeight: 600, marginBottom: 6 }}>
                  {exp.company} {exp.location && `· ${exp.location}`}
                </div>
                {exp.description && (
                  <ul style={{ paddingLeft: 18, margin: 0, color: '#4b5563', }}>
                    {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                      <li key={bi} style={{ fontSize: sz.body, marginBottom: 4 }}>{b.replace(/^•\s*/, '')}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {projects?.length > 0 && (
          <div style={{ marginBottom: sectionGap }}>
            <SectionTitle title="Projects" />
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: sz.body + 1, fontWeight: 800, color: '#111827' }}>{proj.name}</span>
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: theme_color, fontWeight: 600, marginBottom: 4 }}>
                  {proj.technologies}
                </div>
                {proj.description && (
                  <p style={{ fontSize: sz.body, color: '#4b5563', margin: 0, }}>{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - 40% */}
      <div style={{ width: '40%', padding: '40px 40px 40px 32px', borderLeft: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
        
        {/* Profile Picture (Optional) */}
        {personal.photo_url && (
          <div style={{ marginBottom: sectionGap }}>
            <img 
              src={personal.photo_url} 
              alt="Profile" 
              style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'cover', border: `3px solid ${theme_color}` }}
            />
          </div>
        )}

        {education?.length > 0 && (
          <div style={{ marginBottom: sectionGap }}>
            <SectionTitle title="Education" />
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: sz.body + 1, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </div>
                <div style={{ fontSize: sz.body, fontStyle: 'italic', color: theme_color, fontWeight: 600, marginTop: 4 }}>
                  {edu.school || edu.institution}
                </div>
                <div style={{ fontSize: sz.body - 1, color: '#6b7280', marginTop: 4 }}>
                  {edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}
                </div>
                {edu.grade && <div style={{ fontSize: sz.body - 1, color: '#4b5563', marginTop: 2 }}>{edu.grade}</div>}
              </div>
            ))}
          </div>
        )}

        {skills?.length > 0 && (
          <div style={{ marginBottom: sectionGap }}>
            <SectionTitle title="Strengths" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, }}>
              {skills.map((skill, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme_color, flexShrink: 0 }} />
                  <span style={{ fontSize: sz.body, color: '#374151', fontWeight: 500 }}>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
