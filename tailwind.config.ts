import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#1A237E',
          navydk:  '#0D1B6E',
          teal:    '#00BCD4',
          tealdk:  '#0097A7',
          teallite:'#E0F7FA',
        },
        gate: {
          amber:   '#BA7517',
          amberlite:'#FAEEDA',
          amberdk: '#633806',
        },
        target: {
          red:     '#A32D2D',
          redlite: '#FCEBEB',
          reddk:   '#501313',
        },
        success: {
          green:   '#3B6D11',
          greenlite:'#EAF3DE',
        },
        slate: {
          DEFAULT: '#37474F',
          mid:     '#90A4AE',
          lite:    '#ECEFF1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        node: '6px',
      },
      animation: {
        'breach-pulse': 'breach-pulse 0.6s ease-out',
        'fade-in':      'fade-in 0.3s ease-out',
        'slide-up':     'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'breach-pulse': {
          '0%':   { transform: 'scale(1)',    opacity: '1' },
          '50%':  { transform: 'scale(1.04)', opacity: '0.9' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
