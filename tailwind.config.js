/** @type {import('tailwindcss').Config} */
export default {
  // Scope Tailwind ONLY to resume-builder files — never touches existing pages
  content: [
    './src/resume-builder/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'rb-primary': 'var(--rb-primary)',
        'rb-bg':      'var(--rb-bg)',
        'rb-surface': 'var(--rb-surface)',
        'rb-border':  'var(--rb-border)',
        'rb-text':    'var(--rb-text)',
        'rb-muted':   'var(--rb-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in-r': 'slideInRight 0.35s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:      { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
