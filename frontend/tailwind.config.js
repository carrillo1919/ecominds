/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-bright': '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#3f4944',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',
        outline: '#6f7973',
        'outline-variant': '#bec9c2',
        'surface-tint': '#1b6b51',
        primary: '#004532',
        'on-primary': '#ffffff',
        'primary-container': '#065f46',
        'on-primary-container': '#8bd6b7',
        'inverse-primary': '#8bd6b6',
        secondary: '#006d3e',
        'on-secondary': '#ffffff',
        'secondary-container': '#8cf5b2',
        'on-secondary-container': '#007241',
        tertiary: '#2d3d52',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#44546a',
        'on-tertiary-container': '#b8c8e2',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-fixed': '#a6f2d1',
        'primary-fixed-dim': '#8bd6b6',
        'on-primary-fixed': '#002116',
        'on-primary-fixed-variant': '#00513b',
        'secondary-fixed': '#8ff8b4',
        'secondary-fixed-dim': '#73db9a',
        'on-secondary-fixed': '#00210f',
        'on-secondary-fixed-variant': '#00522d',
        'tertiary-fixed': '#d3e4fe',
        'tertiary-fixed-dim': '#b7c8e1',
        'on-tertiary-fixed': '#0b1c30',
        'on-tertiary-fixed-variant': '#38485d',
        background: '#f7f9fb',
        'on-background': '#191c1e',
        'surface-variant': '#e0e3e5'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        xs: '4px',
        base: '8px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        xl: '80px',
        gutter: '24px',
        'container-max': '1280px'
      },
      fontFamily: {
        sans: ['Roboto Flex', 'system-ui', 'sans-serif'],
        display: ['Roboto Flex', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '600' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }]
      },
      boxShadow: {
        'eco-glow': '0px 4px 20px rgba(6, 95, 70, 0.05)',
        'eco-glow-lg': '0px 8px 30px rgba(6, 95, 70, 0.1)'
      },
      maxWidth: {
        'container-max': '1280px'
      }
    }
  },
  plugins: []
}

