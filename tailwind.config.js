/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      /*───────────────────────────────────
        Dark-optimized color palette
      ───────────────────────────────────*/
      colors: {
        // Primary dark backgrounds
        dark: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1f1f1f',
          900: '#171717',
          925: '#0f0f0f',
          950: '#0a0a0a',
        },
        
        // Clean blue palette for modern white and blue theme
        brand: {
          50: '#f8fafc',   // Pure white with minimal blue tint
          100: '#f1f5f9',  // Very light blue-grey
          200: '#e2e8f0',  // Light blue-grey
          300: '#cbd5e1',  // Medium blue-grey
          400: '#94a3b8',  // Muted blue-grey
          500: '#3b82f6',  // Clean modern blue
          600: '#2563eb',  // Primary blue
          700: '#1d4ed8',  // Deep blue
          800: '#1e40af',  // Darker blue
          900: '#1e3a8a',  // Very dark blue
          950: '#172554',  // Navy blue
        },

        // Apple-inspired accent colors for system feedback
        accent: {
          success: {
            50: '#ecfdf5',
            500: '#34c759',  // Apple green
            600: '#28a745',
            700: '#20a745',
            800: '#168f39',
            900: '#0e722d',
          },
          warning: {
            50: '#fffbeb',
            500: '#ff9500',  // Apple orange
            600: '#e6850e',
            700: '#cc7a00',
            800: '#b36b00',
            900: '#995c00',
          },
          error: {
            50: '#fef2f2',
            500: '#ff3b30',  // Apple red
            600: '#e6342a',
            700: '#cc2e24',
            800: '#b3281e',
            900: '#992218',
          },
        },

        // Glass effect colors
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
      },

      /*───────────────────────────────────
        Enhanced animations for dark theme
      ───────────────────────────────────*/
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.9)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: 0, transform: 'translateY(-20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.9)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' 
          },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.4)',
            transform: 'scale(1)' 
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.8)',
            transform: 'scale(1.02)' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      animation: {
        blob: 'blob 18s ease-in-out infinite',
        'fade-in': 'fade-in 0.7s ease-in forwards',
        'slide-up': 'slide-up 0.5s 0.1s ease-out forwards',
        'slide-down': 'slide-down 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        glow: 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },

      /*───────────────────────────────────
        Enhanced effects and utilities
      ───────────────────────────────────*/
      backdropBlur: { 
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.1)',
        'dark': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 20px 50px rgba(0, 0, 0, 0.7)',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
    },
  },

  /*─────────────────────────────────────
    Safelist for dynamic classes
  ─────────────────────────────────────*/
  safelist: [
    // Dark theme gradients
    { pattern: /(from|to|via)-(blue|purple|cyan|emerald|amber|rose)-(400|500|600|700)/ },
    // Dark backgrounds
    { pattern: /bg-(gray|slate|zinc)-(800|900|950)/ },
    // Glass effects
    { pattern: /bg-white\/([0-9]|10)/ },
    // Status colors
    { pattern: /bg-(green|yellow|red|blue)-(500|600)\/([0-9]|10|20)/ },
    { pattern: /text-(green|yellow|red|blue)-(400|500)/ },
    { pattern: /border-(green|yellow|red|blue)-(500|600)\/([0-9]|10|20|30)/ },
    // Animation classes
    'animate-glow',
    'animate-pulse-glow', 
    'animate-float',
    'glass-card',
    'blob-blue',
    'blob-purple', 
    'blob-cyan',
  ],

  plugins: [
    // Custom scrollbar and Apple-level utilities plugin
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          }
        },
        '.scrollbar-thumb-white\\/20': {
          '&::-webkit-scrollbar-thumb': {
            'background-color': 'rgba(255, 255, 255, 0.2)',
            'border-radius': '3px'
          }
        },
        '.scrollbar-track-transparent': {
          '&::-webkit-scrollbar-track': {
            'background-color': 'transparent'
          }
        },
        '.shadow-glow': {
          'box-shadow': '0 0 20px rgba(59, 130, 246, 0.4)'
        }
      })
    }
  ],
}
