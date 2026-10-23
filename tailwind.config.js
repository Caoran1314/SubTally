/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'hsl(var(--ink-950))',
          900: 'hsl(var(--ink-900))',
          850: 'hsl(var(--ink-850))',
          800: 'hsl(var(--ink-800))',
          700: 'hsl(var(--ink-700))',
        },
        paper: {
          DEFAULT: 'hsl(var(--paper))',
          soft: 'hsl(var(--paper-soft))',
          mute: 'hsl(var(--paper-mute))',
          faint: 'hsl(var(--paper-faint))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          soft: 'hsl(var(--accent-soft))',
          deep: 'hsl(var(--accent-deep))',
          glow: 'hsl(var(--accent-glow))',
        },
        line: {
          DEFAULT: 'hsl(var(--line))',
          strong: 'hsl(var(--line-strong))',
        },
        danger: 'hsl(var(--danger))',
        ok: 'hsl(var(--ok))',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Songti SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        glass: '0 24px 60px -24px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.07)',
        lift: '0 18px 44px -20px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,255,255,.05)',
        glow: '0 0 42px -8px hsl(var(--accent-glow))',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2.2%,-1.8%,0) scale(1.06)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '12%': { opacity: '.5' },
          '100%': { transform: 'translateY(-120vh) rotate(24deg)', opacity: '0' },
        },
        breathe: {
          '0%,100%': { opacity: '.55' },
          '50%': { opacity: '.9' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(.965)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        drift: 'drift 26s ease-in-out infinite alternate',
        breathe: 'breathe 9s ease-in-out infinite',
        riseIn: 'riseIn .5s cubic-bezier(.22,.8,.3,1) both',
        scaleIn: 'scaleIn .28s cubic-bezier(.22,.8,.3,1) both',
        sheen: 'sheen 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
