const KNOWN_SKILLS = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go', 'Rust',
  'React', 'Next.js', 'Vue', 'Angular', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
  'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis',
  'Git', 'GitHub', 'Docker', 'Kubernetes', 'CI/CD', 'Linux',
  'AWS', 'Azure', 'GCP', 'Firebase',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch',
  'Pandas', 'NumPy', 'Scikit-learn', 'Data Analysis', 'Power BI', 'Tableau',
  'REST API', 'GraphQL', 'Microservices', 'System Design',
];

export function extractSkillsFromResume(resumeText = '') {
  const normalizedText = ` ${resumeText.toLowerCase()} `;

  const matched = KNOWN_SKILLS.filter((skill) => {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes('.')) {
      return normalizedText.includes(lowerSkill);
    }

    const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return pattern.test(normalizedText);
  });

  return matched.slice(0, 12).join(', ');
}
