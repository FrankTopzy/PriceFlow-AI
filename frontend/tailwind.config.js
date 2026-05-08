/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        surface: 'var(--bg-secondary)',
        border: 'var(--border-color)',
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-success': 'var(--accent-success)',
        'accent-danger': 'var(--accent-danger)',
        'accent-warning': 'var(--accent-warning)',
      }
    },
  },
  plugins: [],
}
