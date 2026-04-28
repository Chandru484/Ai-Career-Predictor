import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { resumeApi } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import BusinessInsiderTemplate from '../components/preview/templates/BusinessInsiderTemplate';
import CreativeTemplate from '../components/preview/templates/CreativeTemplate';
import ProfessionalTemplate from '../components/preview/templates/ProfessionalTemplate';
import UniversalTemplate from '../components/preview/templates/UniversalTemplate';
import ModernMinimalistTemplate from '../components/preview/templates/ModernMinimalistTemplate';
import TechStartupTemplate from '../components/preview/templates/TechStartupTemplate';
import HarvardTemplate from '../components/preview/templates/HarvardTemplate';
import ExecutiveTemplate from '../components/preview/templates/ExecutiveTemplate';

export const TEMPLATES = {
  modern_minimalist: ModernMinimalistTemplate,
  tech_startup: TechStartupTemplate,
  business_insider: BusinessInsiderTemplate,
  creative: CreativeTemplate,
  professional: ProfessionalTemplate,
  universal: UniversalTemplate,
  harvard: HarvardTemplate,
  executive: ExecutiveTemplate,
};

const DEFAULT_CONTENT = {
  personal:   { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', photo_url: '' },
  summary:    '',
  experience: [],
  education:  [],
  skills:     [],
  projects:   [],
};

const DEFAULT_RESUME = {
  id: null,
  title: 'Untitled Resume',
  template_name: 'universal',
  theme_color: '#1e3a8a',
  font_size: 'medium',
  font_family: 'sans',
  spacing: 'normal',
  show_decorations: true,
  section_order: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
  content: DEFAULT_CONTENT,
};

const ResumeContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, resume: action.payload, isDirty: false, isSaving: false };
    case 'SET_FIELD':
      return { ...state, resume: { ...state.resume, [action.key]: action.value }, isDirty: true };
    case 'SET_CONTENT':
      return {
        ...state,
        resume: { ...state.resume, content: { ...state.resume.content, ...action.payload } },
        isDirty: true,
      };
    case 'SAVING':
      return { ...state, isSaving: true };
    case 'SAVED':
      return { ...state, isSaving: false, isDirty: false, resume: { ...state.resume, id: action.id ?? state.resume.id } };
    case 'ERROR':
      return { ...state, isSaving: false, error: action.message };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

const initialState = {
  resume: { ...DEFAULT_RESUME, content: { ...DEFAULT_CONTENT } },
  isDirty: false,
  isSaving: false,
  error: null,
};

export function ResumeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const autoSaveEnabled = useRef(true);

  // ── Auto-save with debounce ────────────────────────────────────────────────
  const _save = useCallback(async (resume, options = {}) => {
    const { silent = false } = options;
    if (!autoSaveEnabled.current) return;
    if (!silent) dispatch({ type: 'SAVING' });
    try {
      const payload = {
        title:            resume.title,
        template_name:    resume.template_name,
        theme_color:      resume.theme_color,
        font_size:        resume.font_size,
        spacing:          resume.spacing,
        show_decorations: resume.show_decorations,
        section_order:    resume.section_order,
        content:          resume.content,
      };
      if (resume.id) {
        await resumeApi.update(resume.id, payload);
        dispatch({ type: 'SAVED', ...(silent ? { silent: true } : {}) });
      } else {
        const created = await resumeApi.create(payload);
        dispatch({ type: 'SAVED', id: created.id, ...(silent ? { silent: true } : {}) });
      }
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message });
    }
  }, []);

  const debouncedSave = useDebounce(_save, 2500);

  useEffect(() => {
    if (state.isDirty) debouncedSave(state.resume, { silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDirty, state.resume, state.resume.id]);

  // ── Public API ─────────────────────────────────────────────────────────────
  const loadResume = useCallback((data) => dispatch({ type: 'LOAD', payload: data }), []);
  const newResume  = useCallback(() => dispatch({ type: 'RESET' }), []);

  const setField   = useCallback((key, value) => dispatch({ type: 'SET_FIELD', key, value }), []);
  const setContent = useCallback((patch) => dispatch({ type: 'SET_CONTENT', payload: patch }), []);

  const saveNow = useCallback(() => _save(state.resume), [state.resume, _save]);

  return (
    <ResumeContext.Provider value={{ ...state, loadResume, newResume, setField, setContent, saveNow }}>
      {children}
    </ResumeContext.Provider>
  );
}

export const useResume = () => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used inside <ResumeProvider>');
  return ctx;
};
