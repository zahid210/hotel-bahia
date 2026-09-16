/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Colores semánticos ligados a variables CSS ───────────────
      // Permite que TODO el uso existente de `gray-*` cambie de tema
      // (claro/oscuro) automáticamente sin tocar cada componente.
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
        // Acento de marca (violeta → fucsia → cian)
        brand: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          dark:    '#5b21b6',
        },
        // Alias histórico `apple` → ahora apunta al acento de marca
        apple: {
          DEFAULT: '#7c3aed',
          dark:    '#6d28d9',
          light:   '#a78bfa',
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
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #d946ef 45%, #06b6d4 100%)',
        'brand-soft':     'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(217,70,239,0.10) 45%, rgba(6,182,212,0.12) 100%)',
        'glass-sheen':    'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 60%)',
        'glass-sheen-d':  'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02) 60%)',
      },
      boxShadow: {
        soft:      '0 8px 30px rgba(15, 23, 42, 0.08)',
        card:      '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.08)',
        modal:     '0 24px 80px rgba(15, 23, 42, 0.25)',
        glow:      '0 0 0 1px rgba(124,58,237,0.25), 0 12px 40px rgba(124,58,237,0.28)',
        'glow-cyan':'0 0 0 1px rgba(6,182,212,0.25), 0 12px 40px rgba(6,182,212,0.25)',
        'glow-pink':'0 0 0 1px rgba(217,70,239,0.25), 0 12px 40px rgba(217,70,239,0.25)',
        'glow-amber':'0 0 0 1px rgba(245,158,11,0.25), 0 12px 40px rgba(245,158,11,0.25)',
        'glow-emerald':'0 0 0 1px rgba(16,185,129,0.25), 0 12px 40px rgba(16,185,129,0.25)',
      },
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'    },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%':      { transform: 'translate3d(4%, -6%, 0) scale(1.08)' },
          '66%':      { transform: 'translate3d(-5%, 4%, 0) scale(0.96)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%':      { opacity: '0.85' },
        },
      },
      animation: {
        slideIn:   'slideIn 0.2s ease',
        slideUp:   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fadeIn:    'fadeIn 0.25s ease',
        float:     'float 18s ease-in-out infinite',
        'float-slow':'float 26s ease-in-out infinite',
        pulseSoft: 'pulseSoft 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
