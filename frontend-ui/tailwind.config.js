/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f4f5f8',
        surface: '#ffffff',
        brand: {
          DEFAULT: '#0c4a6e',
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      borderRadius: {
        'control': '12px',
        'card': '16px',
      }
    },
  },
  plugins: [],
};