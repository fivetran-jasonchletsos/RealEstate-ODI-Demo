/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        midnight: {
          DEFAULT: '#1a1f2e',
          deep: '#11141e',
          soft: '#262c3d',
        },
        gold: {
          DEFAULT: '#c8a951',
          bright: '#d9bf6a',
          dim: '#a08736',
          bg: '#f5ecd3',
        },
        paper: {
          DEFAULT: '#f5f1e8',
          deep: '#ece6d5',
        },
        alert: {
          DEFAULT: '#8b1d2c',
          soft: '#fbe7ea',
        },
      },
    },
  },
  plugins: [],
};
