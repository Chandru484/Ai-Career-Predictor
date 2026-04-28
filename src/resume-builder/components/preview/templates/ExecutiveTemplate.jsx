export default function ExecutiveTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#1e3a8a', font_size = 'medium', spacing = 'normal' } = settings;

  const fontSizes = { small: { name: 26, section: 12, body: 9.5 }, medium: { name: 30, section: 13, body: 10.5 }, large: { name: 34, section: 14, body: 11.5 } };
  const sz = fontSizes[font_size] || fontSizes.medium;
  const sectionGap = spacing === 'compact' ? 16 : spacing === 'relaxed' ? 28 : 22;
  const itemGap = spacing === 'compact' ? 10 : spacing === 'relaxed' ? 16 : 13;

  const SectionTitle = ({ title }) => (
    <div style={{ marginBottom: itemGap, borderBottom: `2px solid #e5e7eb`, paddingBottom: 6 }}>
      <span style={{ fontSize: sz.section, fontWeight: 700, color: theme_color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="rb-template-root" style={{ padding: '45px 50px', color: '#374151', fontSize: sz.body, lineHeight: 1.6, background: '#fff', flex: 1, minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sectionGap, borderBottom: `4px solid ${theme_color}`, paddingBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: sz.name, fontWeight: 800, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            {personal.fullName || personal.name || 'Your Name'}
          </h1>
          {personal.title && (
            <div style={{ fontSize: sz.body + 2, color: theme_color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {personal.title}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: sz.body - 1, color: '#4b5563', textAlign: 'right' }}>
          {personal.email && <div>{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.linkedin && <div>{personal.linkedin.replace('https://', '')}</div>}
          {personal.website && <div>{personal.website.replace('https://', '')}</div>}
          {personal.github && <div>{personal.github.replace('https://', '')}</div>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ marginBottom: sectionGap }}>
          <p style={{ margin: 0, fontSize: sz.body + 0.5, lineHeight: 1.8, color: '#1f2937' }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experience?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Executive Experience" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap * 1.2 }}>
            {experience.map((exp, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <h3 style={{ margin: 0, fontSize: sz.body + 2, fontWeight: 700, color: '#111827' }}>{exp.title}</h3>
                  <span style={{ fontSize: sz.body - 0.5, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
                  </span>
                </div>
                <div style={{ fontSize: sz.body + 0.5, color: theme_color, fontWeight: 600, marginBottom: 8 }}>
                  {exp.company} {exp.location && <span style={{ color: '#9ca3af', fontWeight: 400 }}>| {exp.location}</span>}
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

      {/* PROJECTS & INITIATIVES */}
      {projects?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Key Initiatives" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {projects.map((proj, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <h3 style={{ margin: 0, fontSize: sz.body + 1, fontWeight: 700, color: '#111827' }}>{proj.name}</h3>
                </div>
                <div style={{ fontSize: sz.body - 0.5, color: theme_color, fontWeight: 600, marginBottom: 4 }}>
                  {proj.technologies}
                </div>
                {proj.description && (
                  <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDUCATION */}
      {education?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Education" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: itemGap }}>
            {education.map((edu, i) => (
              <div key={i}>
                <h3 style={{ margin: 0, fontSize: sz.body + 1, fontWeight: 700, color: '#111827' }}>
                  {edu.school || edu.institution}
                </h3>
                <div style={{ fontSize: sz.body, color: theme_color, fontWeight: 600, margin: '2px 0 4px 0' }}>
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </div>
                <div style={{ fontSize: sz.body - 0.5, color: '#6b7280' }}>
                  {edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS */}
      {skills?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Core Competencies" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {skills.map((skill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: sz.body, fontWeight: 500, color: '#374151' }}>
                <div style={{ width: 4, height: 4, background: theme_color, borderRadius: '50%' }} />
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
