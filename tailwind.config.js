/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',                         // optional: enables dark: variants

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      /*───────────────────────────────────
        Brand palette
      ───────────────────────────────────*/
      colors: {
        brand: {
          50 : '#eef9ff',
          100: '#d6efff',
          200: '#aee0ff',
          300: '#7ad0ff',
          400: '#38b7ff',   // primary tint
          500: '#0b9dff',   // primary brand colour
          600: '#007ce9',
          700: '#0062c7',
          800: '#004fa1',
          900: '#003b75',
        },
      },

      /*───────────────────────────────────
        Animations
      ───────────────────────────────────*/
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%'     : { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%'     : { transform: 'translate(-20px,20px) scale(0.9)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to  : { opacity: 1 },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to  : { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        blob    : 'blob 18s ease-in-out infinite',
        'fade-in': 'fade-in 0.7s ease-in forwards',
        'slide-up': 'slide-up 0.5s 0.1s ease-out forwards',
      },

      /* tiny glass-blur utility */
      backdropBlur: { xs: '2px' },
    },
  },

  /*─────────────────────────────────────
    Safelist – keeps gradient & pill colours
  ─────────────────────────────────────*/
  safelist: [
    // gradients
    { pattern: /(from|to)-(emerald|amber|rose)-(400|500|600)/ },
    // subtle backgrounds
    { pattern: /bg-(emerald|amber|rose)-(50|100)/ },
    // text colours
    { pattern: /text-(emerald|amber|rose)-(600|700|800)/ },
    // borders
    { pattern: /border-amber-(200|400)/ },
  ],

  plugins: [],
}
