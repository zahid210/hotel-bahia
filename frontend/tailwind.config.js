/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Neutros semánticos por variables CSS (claro/oscuro) ──────
      // Todo el uso existente de `gray-*` se adapta al tema solo.
      colors: {
        gray: {
          50:  'rgb(var(--g-50) / <alpha-value>)',
          100: 'rgb(var(--g-100) / <alpha-value>)',
          200: 'rgb(var(--g-200) / <alpha-value>)',
          300: 'rgb(var(--g-300) / <alpha-value>)',
          400: 'rgb(var(--g-400) / <alpha-value>)',
          500: 'rgb(var(--g-500) / <alpha-value>)',
          600: 'rgb(var(--g-600) / <alpha-value>)',
          700: 'rgb(var(--g-700) / <alpha-value>)',
          800: 'rgb(var(--g-800) / <alpha-value>)',
          900: 'rgb(var(--g-900) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        fog: 'rgb(var(--fog) / <alpha-value>)',
        // Acento índigo (estilo Linear/Stripe)
        brand: {
          DEFAULT: '#4f46e5',
          light:   '#6366f1',
          dark:    '#4338ca',
          soft:    'rgb(var(--brand-soft) / <alpha-value>)',
        },
        // Alias histórico `apple` → índigo
        apple: {
          DEFAULT: '#4f46e5',
          dark:    '#4338ca',
          light:   '#6366f1',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"SF Pro Text"',
          '"Segoe UI Variable"', 'Segoe UI',
          'Roboto', '"Helvetica Neue"', 'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        card: '0 1px 3px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.06)',
        modal: '0 24px 80px rgba(15, 23, 42, 0.22)',
        glow: '0 0 0 1px rgba(79, 70, 229, 0.20), 0 8px 24px rgba(79, 70, 229, 0.25)',
      },
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'    },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.2s ease',
        slideUp: 'slideUp 0.25s ease',
        fadeIn:  'fadeIn 0.2s ease',
      },
    },
  },
  plugins: [],
}