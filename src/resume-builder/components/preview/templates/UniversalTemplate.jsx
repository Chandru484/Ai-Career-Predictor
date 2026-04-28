import { Mail, Phone, MapPin, Link, GitBranch, Globe } from 'lucide-react';

/* Universal Template — Clean, minimal, ATS-friendly */
export default function UniversalTemplate({ content = {}, settings = {} }) {
  const { personal = {}, summary = '', experience = [], education = [], skills = [], projects = [] } = content;
  const { theme_color = '#1e3a8a', font_size = 'medium', spacing = 'normal' } = settings;

  const sizes = { small: { name: 20, section: 11, body: 9.5 }, medium: { name: 24, section: 12, body: 10.5 }, large: { name: 28, section: 13, body: 11.5 } };
  const sz = sizes[font_size] ?? sizes.medium;
  const sectionGap = { compact: 16, normal: 26, relaxed: 38 }[spacing] ?? 26;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: sectionGap }}>
      <div style={{ borderBottom: `2px solid ${theme_color}`, paddingBottom: 4, marginBottom: 10 }}>
        <span style={{ fontSize: sz.section, fontWeight: 700, color: theme_color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );

  const SECTIONS = {
    summary: summary && <Section title="Summary" key="summary"><p style={{ fontSize: sz.body, color: '#333', lineHeight: 1.85, margin: 0 }}>{summary}</p></Section>,
    
    experience: experience?.length > 0 && (
      <Section title="Experience" key="experience">
        {experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{exp.title}</span>
              <span style={{ fontSize: sz.body - 1, color: '#666' }}>
                {exp.startDate || exp.start_date} – {exp.endDate || exp.end_date || 'Present'}
              </span>
            </div>
            <div style={{ fontSize: sz.body, color: theme_color, fontWeight: 600, marginBottom: 4 }}>{exp.company} {exp.location && `· ${exp.location}`}</div>
            {exp.description && (
              <ul style={{ paddingLeft: 16, margin: '4px 0 0 0', color: '#444' }}>
                {exp.description.split('\n').filter(Boolean).map((b, bi) => (
                  <li key={bi} style={{ fontSize: sz.body, marginBottom: 3 }}>{b.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Section>
    ),

    projects: projects?.length > 0 && (
      <Section title="Projects" key="projects">
        {projects.map((proj, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{proj.name}</span>
            </div>
            <div style={{ fontSize: sz.body, color: theme_color, fontWeight: 600, marginBottom: 4 }}>{proj.technologies}</div>
            {proj.description && (
              <p style={{ fontSize: sz.body, color: '#444', margin: '4px 0 0 0' }}>{proj.description}</p>
            )}
          </div>
        ))}
      </Section>
    ),

    education: education?.length > 0 && (
      <Section title="Education" key="education">
        {education.map((edu, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: sz.body + 1, fontWeight: 700 }}>{edu.school || edu.institution}</div>
              <div style={{ fontSize: sz.body, color: '#444' }}>{edu.degree} {edu.field && `in ${edu.field}`}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: sz.body - 1, color: '#666' }}>{edu.startDate || edu.start_date} – {edu.endDate || edu.end_date || 'Present'}</div>
              {edu.grade && <div style={{ fontSize: sz.body - 1, color: theme_color }}>{edu.grade}</div>}
            </div>
          </div>
        ))}
      </Section>
    ),

    skills: skills?.length > 0 && (
      <Section title="Skills" key="skills">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {skills.map((skill, i) => (
            <span key={i} style={{ padding: '3px 10px', background: '#f3f4f6', borderRadius: 9999, fontSize: sz.body - 0.5, color: '#374151', border: '1px solid #e5e7eb' }}>
              {skill}
            </span>
          ))}
        </div>
      </Section>
    )
  };

  const activeOrder = settings.section_order || ['summary', 'experience', 'education', 'skills', 'projects'];

  return (
    <div className="rb-template-root" style={{ color: '#1a1a1a', lineHeight: 1.7, padding: '32px 36px 32px', flex: 1, minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: sectionGap }}>
        <div style={{ fontSize: sz.name, fontWeight: 700, color: '#0f0f1a', textTransform: 'uppercase' }}>{personal.fullName || personal.name || 'Your Name'}</div>
        {personal.title && (
          <div style={{ fontSize: sz.body + 1, color: theme_color, fontWeight: 600, textTransform: 'uppercase', marginTop: 2, opacity: 0.9 }}>
            {personal.title}
          </div>
        )}
        
        {/* Contact Info Row 1 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: sz.body, color: '#555', marginTop: 8, flexWrap: 'wrap' }}>
          {personal.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={sz.body} /> {personal.email}</span>}
          {personal.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={sz.body} /> {personal.phone}</span>}
          {personal.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={sz.body} /> {personal.location}</span>}
        </div>
        
        {/* Contact Info Row 2 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: sz.body, color: '#777', marginTop: 4, flexWrap: 'wrap' }}>
          {personal.linkedin && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Link size={sz.body} /> {personal.linkedin.replace('https://', '')}</span>}
          {personal.github && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitBranch size={sz.body} /> {personal.github.replace('https://', '')}</span>}
          {personal.website && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={sz.body} /> {personal.website.replace('https://', '')}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {activeOrder.map(key => SECTIONS[key])}
      </div>
    </div>
  );
}
