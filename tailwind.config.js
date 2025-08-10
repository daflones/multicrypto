/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#D4AF37',
        'primary-dark': '#B8860B',
        secondary: '#7C3AED',
        background: '#0B0A12',
        surface: '#14121B',
        'surface-light': '#1F1B2B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
