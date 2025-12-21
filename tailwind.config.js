/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. 定義動畫的關鍵影格 (Keyframes)
      keyframes: {
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      // 2. 定義在 class 可以直接用的名稱 (Utilities)
      animation: {
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards',
      }
    },
  },
  plugins: [],
}