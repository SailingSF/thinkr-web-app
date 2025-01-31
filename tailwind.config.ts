import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '1rem',       // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
      },
      typography: {
        DEFAULT: {
          css: {
            lineHeight: '1.5',
            h1: {
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h2: {
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h3: {
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            'ul, ol': {
              lineHeight: '1.5',
              margin: '1em 0',
            },
            'li': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'p': {
              marginTop: '1em',
              marginBottom: '1em',
            },
            'blockquote': {
              fontStyle: 'italic',
              borderLeftWidth: '4px',
              borderLeftColor: '#4B5563',
              paddingLeft: '1em',
              marginLeft: 0,
            },
            'code': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              fontSize: '0.9em',
            },
            'pre': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '1em',
              borderRadius: '0.5em',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
