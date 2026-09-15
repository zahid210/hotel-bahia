/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // ── Paleta "estilo Apple" ─────────────────────────────────
      colors: {
        // Fondo de app argénteo (Apple usa #f5f5f7 en secciones claras)
        fog:  '#f5f5f7',
        // Texto primario casi negro
        ink:  '#1d1d1f',
        // Azul de acción de apple.com (#0071e3)
        apple: {
          DEFAULT: '#0071e3',
          dark:    '#0a5dc2',
          light:   '#2997ff',
        },
      },
      fontFamily: {
        // Preferencia SF Pro (sistema), con degradado estilo Apple
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"SF Pro Text"',
          '"Segoe UI Variable"', 'Segoe UI',
          'Roboto', '"Helvetica Neue"', 'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        // Sombra suave y difusa — evita bordes duros tipo material
        soft:  '0 4px 14px rgba(0, 0, 0, 0.06)',
        card:  '0 1px 3px rgba(0, 0, 0, 0.05)',
        modal: '0 24px 60px rgba(0, 0, 0, 0.18)',
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