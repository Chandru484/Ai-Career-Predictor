export default function HarvardTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { font_size = 'medium', spacing = 'normal' } = settings;

  const fontSizes = { small: { name: 24, section: 13, body: 10 }, medium: { name: 28, section: 14, body: 11 }, large: { name: 32, section: 15, body: 12 } };
  const sz = fontSizes[font_size] || fontSizes.medium;
  const sectionGap = spacing === 'compact' ? 14 : spacing === 'relaxed' ? 24 : 18;
  const itemGap = spacing === 'compact' ? 8 : spacing === 'relaxed' ? 14 : 11;

  const SectionTitle = ({ title }) => (
    <div style={{ borderBottom: '1px solid #000', marginBottom: itemGap, paddingBottom: 2, marginTop: sectionGap }}>
      <div style={{ fontSize: sz.section, fontWeight: 'bold', color: '#000', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>
        {title}
      </div>
    </div>
  );

  return (
    <div className="rb-template-root" style={{ padding: '40px 50px', color: '#000', fontSize: sz.body, lineHeight: 1.5, fontFamily: '"Merriweather", "Times New Roman", serif', background: '#fff', flex: 1, minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: sectionGap }}>
        <h1 style={{ fontSize: sz.name, fontWeight: 'normal', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
          {personal.fullName || personal.name || 'Your Name'}
        </h1>
        <div style={{ fontSize: sz.body, marginBottom: 4 }}>
          {personal.location && <span>{personal.location}</span>}
        </div>
        <div style={{ fontSize: sz.body, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.linkedin && <span>{personal.linkedin.replace('https://', '')}</span>}
          {personal.github && <span>{personal.github.replace('https://', '')}</span>}
          {personal.website && <span>{personal.website.replace('https://', '')}</span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div>
          <SectionTitle title="Summary" />
          <p style={{ margin: 0, textAlign: 'justify' }}>{summary}</p>
        </div>
      )}

      {/* EDUCATION (Usually first in Harvard format) */}
      {education?.length > 0 && (
        <div>
          <SectionTitle title="Education" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {education.map((edu, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>{edu.school || edu.institution}</span>
                  <span>{edu.location || ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginBottom: 4 }}>
                  <span>{edu.degree} {edu.field && `in ${edu.field}`} {edu.grade && `— ${edu.grade}`}</span>
                  <span>{edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPERIENCE */}
      {experience?.length > 0 && (
        <div>
          <SectionTitle title="Experience" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {experience.map((exp, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>{exp.company}</span>
                  <span>{exp.location || ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginBottom: 4 }}>
                  <span>{exp.title}</span>
                  <span>{exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}</span>
                </div>
                {exp.description && (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                      <li key={bi} style={{ marginBottom: 2 }}>{b.replace(/^•\s*/, '')}</li>
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
        <div>
          <SectionTitle title="Projects" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
            {projects.map((proj, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 2 }}>
                  <span>{proj.name}</span>
                  <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{proj.technologies}</span>
                </div>
                {proj.description && (
                  <p style={{ margin: 0 }}>{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS */}
      {skills?.length > 0 && (
        <div>
          <SectionTitle title="Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontWeight: 'bold' }}>Technical Skills:</span>
            <span>{skills.join(', ')}</span>
          </div>
        </div>
      )}

    </div>
  );
}
