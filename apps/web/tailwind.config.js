/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
        },
        amber: 'var(--accent-amber)',
        danger: 'var(--accent-red)',
        stage: {
          new: 'var(--stage-new)',
          'initial-contact': 'var(--stage-initial-contact)',
          'docs-pending': 'var(--stage-docs-pending)',
          'docs-received': 'var(--stage-docs-received)',
          analysis: 'var(--stage-analysis)',
          inspection: 'var(--stage-inspection)',
          adjustment: 'var(--stage-adjustment)',
          insurer: 'var(--stage-insurer)',
          payment: 'var(--stage-payment)',
          completed: 'var(--stage-completed)',
          denied: 'var(--stage-denied)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
};
