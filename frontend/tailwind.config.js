/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#fff5eb',
          100: '#ffdcb8',
          200: '#ffc185',
          300: '#ffa552',
          400: '#ff8a24',
          500: '#f07100', // Brand Color: Premium Orange-Gold
          600: '#d95f00',
          700: '#c14c00',
          800: '#9f3700',
          900: '#7d2500',
          950: '#4d1500',
        }
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'IBM Plex Sans Thai', 'Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  safelist: [
    {
      pattern: /(bg|text|border|ring)-(emerald|blue|teal|amber|rose|indigo|purple|gray|red|orange|cyan|pink)-(50|100|200|300|400|500|600|700)/,
    }
  ],
  plugins: [],
}
