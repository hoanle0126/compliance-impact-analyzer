/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        foreground: '#f1f5f9',
        card: '#0f172a',
        'card-foreground': '#f8fafc',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
          hover: '#2563eb',
        },
        secondary: {
          DEFAULT: '#1e293b',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#0ea5e9',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1e293b',
          foreground: '#64748b',
        },
        border: '#1e293b',
        ring: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
