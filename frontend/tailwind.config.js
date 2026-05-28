/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable toggling dark mode via class
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Vibrant premium rose primary
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        darkbg: {
          50: '#1a191f',
          100: '#151419',
          200: '#0f0e12', // Rich black/gray canvas
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(244, 63, 94, 0.08)',
      }
    },
  },
  plugins: [],
}
