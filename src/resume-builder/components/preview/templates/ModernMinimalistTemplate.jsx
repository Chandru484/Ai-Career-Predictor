/* Modern Minimalist Template — Clean, Apple-esque design, strictly left-aligned */

export default function ModernMinimalistTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#000000', font_size = 'medium', spacing = 'normal' } = settings;

  const fontSizes = { small: { base: 9.5, h1: 22, h2: 12 }, medium: { base: 10.5, h1: 26, h2: 13 }, large: { base: 11.5, h1: 30, h2: 15 } };
  const sz = fontSizes[font_size] || fontSizes.medium;
  const sectionGap = spacing === 'compact' ? 14 : spacing === 'relaxed' ? 24 : 18;
  const itemGap = spacing === 'compact' ? 8 : spacing === 'relaxed' ? 14 : 11;

  const SectionTitle = ({ title }) => (
    <div style={{ marginBottom: itemGap, position: 'relative', paddingLeft: 12 }}>
      <div style={{ position: 'absolute', left: 0, top: 2, bottom: 2, width: 3, background: theme_color, borderRadius: 2 }} />
      <span style={{ fontSize: sz.h2, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="rb-template-root" style={{ padding: '45px 50px', color: '#374151', fontSize: sz.base, lineHeight: 1.6, background: '#fff', flex: 1, minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* HEADER - Strictly Left Aligned */}
      <div style={{ marginBottom: sectionGap * 1.5 }}>
        <h1 style={{ fontSize: sz.h1, fontWeight: 300, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          {personal.fullName || personal.name || 'Your Name'}
        </h1>
        {personal.title && (
          <div style={{ fontSize: sz.base + 1, fontWeight: 600, color: theme_color, marginBottom: 8 }}>
            {personal.title}
          </div>
        )}
        <div style={{ fontSize: sz.base * 0.9, color: '#6b7280' }}>
          {[
            personal.email,
            personal.phone,
            personal.location,
            personal.linkedin ? personal.linkedin.replace('https://', '') : '',
            personal.github ? personal.github.replace('https://', '') : '',
            personal.website ? personal.website.replace('https://', '') : ''
          ].filter(Boolean).join(' | ')}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ marginBottom: sectionGap }}>
          <p style={{ margin: 0, fontWeight: 300, color: '#4b5563', lineHeight: 1.8 }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experience?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Experience" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {experience.map((exp, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: sz.base + 0.5 }}>{exp.title}</div>
                <div style={{ color: '#4b5563', marginBottom: 4 }}>
                  {exp.company} {exp.location && `— ${exp.location}`} 
                  <span style={{ color: '#9ca3af', fontSize: sz.base * 0.85, marginLeft: 8 }}>
                    ({exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'})
                  </span>
                </div>
                {exp.description && (
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563' }}>
                    {exp.description.split('\n').filter(Boolean).map((line, j) => (
                      <li key={j} style={{ marginBottom: 2 }}>{line.replace(/^•\s*/, '')}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {projects?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Projects" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {projects.map((proj, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: sz.base + 0.5 }}>{proj.name}</div>
                {proj.technologies && (
                  <div style={{ color: theme_color, fontSize: sz.base * 0.9, marginBottom: 4 }}>
                    {proj.technologies}
                  </div>
                )}
                {proj.description && (
                  <p style={{ margin: 0, color: '#4b5563' }}>{proj.description}</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {education.map((edu, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: sz.base + 0.5 }}>{edu.degree} {edu.field && `in ${edu.field}`}</div>
                <div style={{ color: '#4b5563' }}>
                  {edu.school || edu.institution}
                  <span style={{ color: '#9ca3af', fontSize: sz.base * 0.85, marginLeft: 8 }}>
                    ({edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'})
                  </span>
                </div>
                {edu.grade && <div style={{ fontSize: sz.base * 0.9, color: '#6b7280', marginTop: 2 }}>{edu.grade}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS */}
      {skills?.length > 0 && (
        <div style={{ marginBottom: sectionGap }}>
          <SectionTitle title="Skills" />
          <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', columns: skills.length > 5 ? 2 : 1, columnGap: 32 }}>
            {skills.map((skill, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{skill}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
