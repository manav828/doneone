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
      colors: {
        primary: 'var(--color-primary, #3b82f6)',
        'primary-hover': 'var(--color-primary-hover, #2563eb)',
        // Custom background layers for the 3-level depth model
        canvas: {
          light: '#F8FAFC', // Slate-50
          dark: '#0F172A',  // Slate-900
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',  // Slate-800
        },
        panel: {
          light: '#F1F5F9', // Slate-100
          dark: '#334155',  // Slate-700
        }
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}