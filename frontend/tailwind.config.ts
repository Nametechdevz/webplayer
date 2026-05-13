import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#111118',
        'bg-card': '#16161e',
        'accent-purple': '#6c63ff',
        'accent-red': '#ff6b6b',
        'text-secondary': '#a0a0b0',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6c63ff, #ff6b6b)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0f, #111118)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        fadeIn: 'fadeIn 0.4s ease forwards',
        slideUp: 'slideUp 0.4s ease forwards',
        scaleIn: 'scaleIn 0.3s ease forwards',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(108,99,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(108,99,255,0.7)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(108,99,255,0.4)',
        'glow-red': '0 0 20px rgba(255,107,107,0.4)',
        'glow-green': '0 0 20px rgba(74,222,128,0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
