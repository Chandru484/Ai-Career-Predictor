import { useEffect, useMemo, useRef, useState } from 'react';
import { useResume, TEMPLATES } from '../../context/ResumeContext';

const normalizeSentence = (value = '') => {
  let text = String(value)
    .replace(/^[-*•\u2022\u25E6]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';

  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';
  return text;
};

const normalizeParagraph = (value = '') => {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return normalizeSentence(text);
};

const normalizeMultiline = (value = '') => {
  if (!value) return '';
  const lines = String(value)
    .split('\n')
    .map((line) => normalizeSentence(line))
    .filter(Boolean);
  return lines.join('\n');
};

export default function ResumePreview({ scale = 0.6, printRef: externalRef, onMetricsChange }) {
  const { resume } = useResume();
  const internalRef = useRef();
  const ref = externalRef ?? internalRef;
  const rafRef = useRef(0);
  const [fillScale, setFillScale] = useState(1);

  const TemplateComponent = TEMPLATES[resume.template_name] ?? TEMPLATES.universal;

  const settings = {
    theme_color:      resume.theme_color,
    font_size:        resume.font_size,
    spacing:          resume.spacing,
    show_decorations: resume.show_decorations,
    section_order:    resume.section_order,
  };

  const polishedContent = useMemo(() => {
    const content = resume.content || {};

    return {
      ...content,
      summary: normalizeParagraph(content.summary || ''),
      experience: (content.experience || []).map((exp) => ({
        ...exp,
        description: normalizeMultiline(exp.description || ''),
      })),
      projects: (content.projects || []).map((proj) => ({
        ...proj,
        description: normalizeMultiline(proj.description || ''),
      })),
    };
  }, [resume.content]);

  const fontMap = {
    sans: '"Inter", system-ui, sans-serif',
    serif: '"Merriweather", Georgia, serif',
    mono: '"JetBrains Mono", monospace'
  };
  const activeFont = fontMap[resume.font_family || 'sans'];

  useEffect(() => {
    if (!onMetricsChange) return;

    const node = ref.current;
    if (!node) return;

    const report = () => {
      const width = Math.max(node.scrollWidth, node.offsetWidth);
      const height = Math.max(node.scrollHeight, node.offsetHeight);
      const a4Width = 794;
      const a4Height = 1123;
      const overflowX = Math.max(0, width - a4Width);
      const overflowY = Math.max(0, height - a4Height);
      const nextFillScale = overflowY > 0 ? 1 : Math.min(1.14, Math.max(1, a4Height / Math.max(height, 1)));

      setFillScale((prev) => (Math.abs(prev - nextFillScale) > 0.01 ? nextFillScale : prev));

      onMetricsChange({
        width,
        height,
        overflowX,
        overflowY,
        fitsA4: overflowX === 0 && overflowY === 0,
      });
    };

    const scheduleReport = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(report);
    };

    scheduleReport();

    const resizeObserver = new ResizeObserver(scheduleReport);
    resizeObserver.observe(node);

    window.addEventListener('resize', scheduleReport);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleReport);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onMetricsChange, ref, resume.content, resume.font_size, resume.spacing, resume.template_name, scale]);

  return (
    <div className="flex flex-col items-center">
      {/* A4-ish paper wrapper */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 794 }}>
        <div ref={ref} className="rb-paper" style={{ width: 794, height: 1123, minHeight: 1123, backgroundColor: 'white', display: 'flex', flexDirection: 'column', fontFamily: activeFont }}>
          <div className="rb-paper-content">
            <div
              className="rb-paper-content-fill"
              style={{
                width: `${100 / fillScale}%`,
                minHeight: `${100 / fillScale}%`,
                transform: `scale(${fillScale})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateComponent content={polishedContent} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
