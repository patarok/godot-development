import { defineConfig, defineGlobalStyles } from "@pandacss/dev";

const globalCss = defineGlobalStyles({
  'body': {
    fontFamily: 'token(fonts.body)',
    background: 'token(colors.bg1)',
    color: 'token(colors.fg1)',
    height: 'calc(100vh - 2rem)',
    margin: '1rem',
    lineHeight: 1.5
  },
  'h1, h2, h3, h4, h5, h6': {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 400,
    lineHeight: 1.1,
    margin: '1rem 0.1rem'
  },
  'p, label': {
    margin: '0.5rem 0.1rem'
  },
  ':is(h1, h2, h3, h4, h5, h6, p, label):first-child': {
    marginTop: 0
  },
  ':is(h1, h2, h3, h4, h5, h6, p, label):last-child': {
    marginBottom: 0
  },
  'a': {
    color: 'token(colors.link)',
    '&:hover': {
      color: 'token(colors.linkHover)'
    },
    '&:active': {
      color: 'token(colors.linkActive)'
    }
  },
  'button, input, select': {
    fontFamily: 'inherit',
    fontSize: 'inherit'
  },
  'button': {
    background: 'token(colors.link)',
    color: 'token(colors.bg1)',
    borderRadius: 'token(radii.borderRadius)',
    border: 'none',
    padding: '0.5rem 1rem',
    '&:hover': { background: 'token(colors.linkHover)' },
    '&:active': { background: 'token(colors.linkActive)' },
    '&:disabled': {
      background: 'token(colors.link)',
      filter: 'grayscale()',
      opacity: 0.4
    }
  },
  'input, textarea, select': {
    border: '1px solid token(colors.bg2)',
    borderRadius: 'token(radii.borderRadius)',
    boxSizing: 'border-box',
    padding: '0.5rem'
  },
  'input, textarea': {
    background: 'token(colors.bg1)',
    color: 'inherit'
  },
  'select:not([multiple])': {
    background: 'token(colors.bg2)'
  },
  'textarea': {
    fontFamily: 'token(fonts.mono)',
    fontSize: '0.9rem'
  },
  'form': {
    flexDirection: 'column',
    alignItems: 'baseline',
    gap: '1rem',
    display: 'flex'
  },
  'ul:has(form)': {
    padding: 0,
    listStyle: 'none'
  },
  '.error': {
    color: 'red'
  },
  'code': {
    background: 'token(colors.bg2)',
    fontFamily: 'token(fonts.mono)',
    borderRadius: 'token(radii.borderRadius)',
    padding: '0.15rem 0.3rem',
    fontSize: '0.9em'
  },
  'button:hover > svg, button:hover > svg > path, button:hover > span > svg, button:hover > span > svg > path': {
    fill: 'inherit',
    stroke: 'inherit'
  },
  'button > svg': {
    minHeight: '1rem',
    minWidth: '1rem'
  },
  'input[type="text"]':{
    boxSizing: 'content-box'
  },
  'input[type="checkbox"]:not(:checked)': {
    appearance: 'none',
    margin: '0 !important',
    padding: '0 !important'
  },
  'input[type="checkbox"]':{
    minHeight: '1rem',
    maxHeight: '1rem',
    minWidth:  '1rem',
    maxWidth:  '1rem',
    margin: '0 !important',
    padding: '0 !important'
  },
  'input.inactive':{
    border: 'none'
  },
  'label > input + svg':{
    minHeight: '1rem',
    minWidth: '1rem'
  },
  'label:hover > input + svg':{
    fill: 'inherit',
    stroke: 'inherit'
  }

});

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx,svelte}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      breakpoints: {
        'fhd': '1920px'
      },
      tokens: {
        colors: {
          brand: {
            500: { value: '#0070F3' },
            600: { value: '#005AC1' }
          },
          // Removed conflicting token names
        },
        fonts: {
          sans: { value: 'Inter, sans-serif' },
          serif: { value: 'Georgia, serif' },
          body: { value: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif' },
          mono: { value: 'ui-monospace,"Cascadia Code","Source Code Pro",Menlo,Consolas,"DejaVu Sans Mono",monospace' }
        },
        spacing: {
          '18': { value: '4.5rem' }
        },
        radii: {
          borderRadius: { value: '4px' }
        }
      },
      semanticTokens: {
        colors: {
          // These are the correct, non-conflicting tokens that will be used
          // by the globalCss and other styles.
          primary: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.600}'
            }
          },
          bg1: { value: { base: '#fff', _dark: '#2e2e2e' } },
          bg2: { value: { base: '#e0e6eb', _dark: '#4d4d4d' } },
          bg3: { value: { base: '#c2cdd6', _dark: '#666' } },
          fg1: { value: { base: '#212121', _dark: '#e6e6e6' } },
          fg2: { value: { base: '#4d4d4d', _dark: '#b3b3b3' } },
          fg3: { value: { _dark: '#999' } },
          link: { value: { base: '#1c7ed4', _dark: '#73c1fc' } },
          linkHover: { value: { base: '#3492e5', _dark: '#91cefd' } },
          linkActive: { value: { base: '#176bb5', _dark: '#4baffb' } }
        }
      },
      textStyles: {
        h1: {
          value: {
            fontSize: '4xl',
            fontWeight: 'bold',
            lineHeight: 'tight'
          }
        },
        body: {
          sm: {
            value: {
              fontSize: 'sm',
              lineHeight: 'normal'
            }
          }
        }
      },
      // automatic discovery of recipes
      // recipes: {
      //
      // },
      patterns: {
      },
      layerStyles: {
        todos: {
          description: 'The style for a todo list item.',
          value: {
            userSelect: 'none',
            background: 'token(colors.bg1)',
            filter: 'drop-shadow(2px 3px 6px rgba(0, 0, 0, 0.1))',
            borderRadius: '5px',
            alignItems: 'center',
            gap: '0.5em',
            margin: '0 0 0.5em',
            padding: '0.5em 0.5em 0.5em 1em',
            transition: 'filter 0.2s, opacity 0.2s',
            display: 'flex',
            position: 'relative'
          }
        }
      }
    }
  },
  globalCss,
  jsxFramework: "svelte",
  // The output directory for your css system
  outdir: "styled-system",
});
