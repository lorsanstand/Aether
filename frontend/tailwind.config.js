/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-sand': '#F5F5F1',
        'card-white': '#FFFFFF',
        'accent-terracotta': '#D27D56',
        'accent-olive': '#6B705C',
        'text-main': '#2C2C2C',
        'text-muted': '#8B8B8B',
        'input-bg': '#F9F9F7',
        'error-soft': '#C79A8B',
      },
      fontFamily: {
        'lora': ['Lora', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 15px 45px rgba(107, 112, 92, 0.1), 0 0 0 1px rgba(107, 112, 92, 0.05)',
        'logo': '0 4px 12px rgba(107, 112, 92, 0.15)',
      },
      spacing: {
        'safe-start': 'max(1rem, env(safe-area-inset-left))',
        'safe-end': 'max(1rem, env(safe-area-inset-right))',
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      screens: {
        'xs': '360px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      },
    },
  },
  plugins: [],
}
