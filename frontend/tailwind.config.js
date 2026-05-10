/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind utility names → CSS custom properties
        background:        'var(--bg-primary)',
        surface:           'var(--surface)',
        primary:           'var(--primary)',
        secondary:         'var(--secondary)',
        border:            'var(--border-color)',
        'text-primary':    'var(--text-primary)',
        'text-secondary':  'var(--text-secondary)',
        'accent-success':  'var(--accent-success)',
        'accent-danger':   'var(--accent-danger)',
        'accent-warning':  'var(--accent-warning)',
        'bg-secondary':    'var(--bg-secondary)',
      },
      animation: {
        'fade-in':    'fadeIn 0.35s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%':       { opacity: 0.45 },
        },
      },
    },
  },
  plugins: [],
}
