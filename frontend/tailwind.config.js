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
        brand: {
          DEFAULT: '#0220A4',
          dark: '#01166F',
          light: '#E8EDFF',
          soft: '#F3F5FF',
          secondary: '#4169E1',
          accent: '#5B7CFF',
        },
        emerald: {
          50: '#F3F5FF',   // Primary Soft
          100: '#E8EDFF',  // Primary Light
          200: '#C7D4FF',
          300: '#9DB5FF',
          400: '#5B7CFF',  // Accent
          500: '#0220A4',  // Primary Brand Color
          600: '#01166F',  // Primary Dark (Hover)
          700: '#00105A',  // Active
          800: '#000B3B',
          900: '#111827',  // Heading / Text
          950: '#080D1A',  // Surface Dark
        },
        primary: {
          50: '#F3F5FF',
          100: '#E8EDFF',
          200: '#C7D4FF',
          300: '#9DB5FF',
          400: '#5B7CFF',
          500: '#0220A4',
          600: '#01166F',
          700: '#00105A',
          800: '#000B3B',
          900: '#111827',
          950: '#080D1A',
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
      pattern: /(bg|text|border|ring)-(emerald|primary|brand|green|blue|teal|amber|rose|indigo|purple|gray|red|orange|cyan|pink)-(50|100|200|300|400|500|600|700|800|900|950)/,
    }
  ],
  plugins: [],
}

