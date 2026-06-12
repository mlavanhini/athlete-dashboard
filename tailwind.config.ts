import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0E0E10',
        panel: '#18181B',
        'panel-hover': '#1F1F26',
        border: '#2A2A35',
        'text-primary': '#E8E8F0',
        'text-muted': '#6B6B80',
        accent: '#F59E0B',
        'accent-hover': '#D97706',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
