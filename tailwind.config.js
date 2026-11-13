/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arkada: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          primary: '#0D9488',
          primaryHover: '#0F766E',
          secondary: '#0284C7',
          streak: '#F59E0B',
          text: '#0F172A',
          muted: '#475569'
        }
      },
      boxShadow: {
        none: 'none',
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none'
      }
    }
  },
  plugins: []
};

