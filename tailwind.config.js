/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        theme: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          card: 'rgb(var(--color-card) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
