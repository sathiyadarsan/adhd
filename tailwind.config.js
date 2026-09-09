/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#000000",
          card: "#1273D0",
          accent: "#f49301",
          secondary: "#259dbb",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'brutal': '6px 6px 0px 0px rgba(255,255,255,1)',
        'brutal-accent': '6px 6px 0px 0px #f49301',
        'brutal-card': '6px 6px 0px 0px #1273D0',
        'brutal-sm': '3px 3px 0px 0px rgba(255,255,255,1)',
      }
    },
  },
  plugins: [],
}