/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // ✨ D.One System Tokens
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',

        // Brand Overrides
        primary: 'var(--color-brand-primary)',
        'primary-hover': 'var(--color-brand-primary-light)',
        'primary-active': 'var(--color-brand-primary-dark)',
        'primary-soft': 'var(--color-brand-primary-soft)',

        // Text Colors (Theme Aware)
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Semantic
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Priority
        'priority-critical': 'var(--color-priority-critical)',
        'priority-high': 'var(--color-priority-high)',
        'priority-medium': 'var(--color-priority-medium)',
        'priority-low': 'var(--color-priority-low)',

        // Legacy Compatibility
        canvas: {
          light: 'var(--color-slate-50)',
          dark: 'var(--color-slate-900)',
        },
        panel: {
          light: 'var(--color-slate-100)',
          dark: 'var(--color-slate-800)',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'card-lift': '0 12px 24px -8px rgba(0, 0, 0, 0.15), 0 4px 8px -4px rgba(0, 0, 0, 0.1)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(255, 107, 53, 0.3)', /* Updated to Orange */
        'glow-lg': '0 0 40px rgba(255, 107, 53, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}