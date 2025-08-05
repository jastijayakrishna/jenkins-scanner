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
        
        // Enhanced brand colors for dark theme
        brand: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Primary blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // Dark-themed accent colors
        accent: {
          success: {
            50: '#ecfdf5',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          warning: {
            50: '#fffbeb',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          error: {
            50: '#fef2f2',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
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

  plugins: [],
}
