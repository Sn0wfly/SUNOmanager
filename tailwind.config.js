/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        suno: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a24',
          border: '#2a2a38',
          accent: '#7c3aed',
          'accent-hover': '#6d28d9',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      }
    }
  },
  plugins: []
}
