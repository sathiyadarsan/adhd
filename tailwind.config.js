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
          dark: "#064582",
          card: "#075CAD",
          accent: "#FFC064",
          accentDark: "#C97700",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}