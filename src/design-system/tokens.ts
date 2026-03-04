/**
 * WP Dash Design System Tokens
 *
 * All measurements use relative units (rem, em, %).
 * Reference pixel values are provided in comments only.
 * Base font size assumed: 16px.
 *
 * These tokens mirror the CSS custom properties defined in globals.css
 * and are intended for use in TypeScript/component logic where
 * direct CSS variable access is impractical.
 */

// ---------------------------------------------------------------------------
// Color Palette
// Raw palette values — prefer semantic tokens for component styling.
// ---------------------------------------------------------------------------

export const colorPalette = {
  brand: {
    25: "var(--color-brand-25)", // #f2f7ff
    50: "var(--color-brand-50)", // #ecf3ff
    100: "var(--color-brand-100)", // #dde9ff
    200: "var(--color-brand-200)", // #c2d6ff
    300: "var(--color-brand-300)", // #9cb9ff
    400: "var(--color-brand-400)", // #7592ff
    500: "var(--color-brand-500)", // #465fff  ← primary action
    600: "var(--color-brand-600)", // #3641f5
    700: "var(--color-brand-700)", // #2a31d8
    800: "var(--color-brand-800)", // #252dae
    900: "var(--color-brand-900)", // #262e89
    950: "var(--color-brand-950)", // #161950
  },
  gray: {
    25: "var(--color-gray-25)", // #fcfcfd
    50: "var(--color-gray-50)", // #f9fafb
    100: "var(--color-gray-100)", // #f2f4f7
    200: "var(--color-gray-200)", // #e4e7ec
    300: "var(--color-gray-300)", // #d0d5dd
    400: "var(--color-gray-400)", // #98a2b3
    500: "var(--color-gray-500)", // #667085
    600: "var(--color-gray-600)", // #475467
    700: "var(--color-gray-700)", // #344054
    800: "var(--color-gray-800)", // #1d2939
    900: "var(--color-gray-900)", // #101828
    950: "var(--color-gray-950)", // #0c111d
    dark: "var(--color-gray-dark)", // #1a2231
  },
  success: {
    25: "var(--color-success-25)", // #f6fef9
    50: "var(--color-success-50)", // #ecfdf3
    100: "var(--color-success-100)", // #d1fadf
    200: "var(--color-success-200)", // #a6f4c5
    300: "var(--color-success-300)", // #6ce9a6
    400: "var(--color-success-400)", // #32d583
    500: "var(--color-success-500)", // #12b76a
    600: "var(--color-success-600)", // #039855
    700: "var(--color-success-700)", // #027a48
    800: "var(--color-success-800)", // #05603a
    900: "var(--color-success-900)", // #054f31
    950: "var(--color-success-950)", // #053321
  },
  warning: {
    25: "var(--color-warning-25)", // #fffcf5
    50: "var(--color-warning-50)", // #fffaeb
    100: "var(--color-warning-100)", // #fef0c7
    200: "var(--color-warning-200)", // #fedf89
    300: "var(--color-warning-300)", // #fec84b
    400: "var(--color-warning-400)", // #fdb022
    500: "var(--color-warning-500)", // #f79009
    600: "var(--color-warning-600)", // #dc6803
    700: "var(--color-warning-700)", // #b54708
    800: "var(--color-warning-800)", // #93370d
    900: "var(--color-warning-900)", // #7a2e0e
    950: "var(--color-warning-950)", // #4e1d09
  },
  error: {
    25: "var(--color-error-25)", // #fffbfa
    50: "var(--color-error-50)", // #fef3f2
    100: "var(--color-error-100)", // #fee4e2
    200: "var(--color-error-200)", // #fecdca
    300: "var(--color-error-300)", // #fda29b
    400: "var(--color-error-400)", // #f97066
    500: "var(--color-error-500)", // #f04438
    600: "var(--color-error-600)", // #d92d20
    700: "var(--color-error-700)", // #b42318
    800: "var(--color-error-800)", // #912018
    900: "var(--color-error-900)", // #7a271a
    950: "var(--color-error-950)", // #55160c
  },
  blueLight: {
    25: "var(--color-blue-light-25)", // #f5fbff
    50: "var(--color-blue-light-50)", // #f0f9ff
    100: "var(--color-blue-light-100)", // #e0f2fe
    200: "var(--color-blue-light-200)", // #b9e6fe
    300: "var(--color-blue-light-300)", // #7cd4fd
    400: "var(--color-blue-light-400)", // #36bffa
    500: "var(--color-blue-light-500)", // #0ba5ec
    600: "var(--color-blue-light-600)", // #0086c9
    700: "var(--color-blue-light-700)", // #026aa2
    800: "var(--color-blue-light-800)", // #065986
    900: "var(--color-blue-light-900)", // #0b4a6f
    950: "var(--color-blue-light-950)", // #062c41
  },
  orange: {
    25: "var(--color-orange-25)", // #fffaf5
    50: "var(--color-orange-50)", // #fff6ed
    100: "var(--color-orange-100)", // #ffead5
    200: "var(--color-orange-200)", // #fddcab
    300: "var(--color-orange-300)", // #feb273
    400: "var(--color-orange-400)", // #fd853a
    500: "var(--color-orange-500)", // #fb6514
    600: "var(--color-orange-600)", // #ec4a0a
    700: "var(--color-orange-700)", // #c4320a
    800: "var(--color-orange-800)", // #9c2a10
    900: "var(--color-orange-900)", // #7e2410
    950: "var(--color-orange-950)", // #511c10
  },
} as const;

// ---------------------------------------------------------------------------
// Semantic Color Tokens
// Use these in components — they respect light/dark mode via CSS variables.
// ---------------------------------------------------------------------------

export const semanticColors = {
  /** Main interactive / brand color */
  primary: "var(--wp-color-primary)",
  primaryHover: "var(--wp-color-primary-hover)",
  primarySubtle: "var(--wp-color-primary-subtle)",
  primaryText: "var(--wp-color-primary-text)",

  /** Page & surface backgrounds */
  bgBase: "var(--wp-color-bg-base)",
  bgSurface: "var(--wp-color-bg-surface)",
  bgMuted: "var(--wp-color-bg-muted)",
  bgInverse: "var(--wp-color-bg-inverse)",

  /** Text hierarchy */
  textPrimary: "var(--wp-color-text-primary)",
  textSecondary: "var(--wp-color-text-secondary)",
  textDisabled: "var(--wp-color-text-disabled)",
  textInverse: "var(--wp-color-text-inverse)",
  textLink: "var(--wp-color-text-link)",

  /** Border */
  borderDefault: "var(--wp-color-border-default)",
  borderStrong: "var(--wp-color-border-strong)",
  borderFocus: "var(--wp-color-border-focus)",

  /** Status */
  success: "var(--wp-color-success)",
  successSubtle: "var(--wp-color-success-subtle)",
  successText: "var(--wp-color-success-text)",

  warning: "var(--wp-color-warning)",
  warningSubtle: "var(--wp-color-warning-subtle)",
  warningText: "var(--wp-color-warning-text)",

  danger: "var(--wp-color-danger)",
  dangerSubtle: "var(--wp-color-danger-subtle)",
  dangerText: "var(--wp-color-danger-text)",

  info: "var(--wp-color-info)",
  infoSubtle: "var(--wp-color-info-subtle)",
  infoText: "var(--wp-color-info-text)",
} as const;

// ---------------------------------------------------------------------------
// Spacing  — 4px grid expressed in rem (base: 16px)
// ---------------------------------------------------------------------------

export const spacing = {
  0: "0", // 0px
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontSize = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
} as const;

export const lineHeight = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
  /** Paired with xs/sm: 18px equivalent */
  sm: "1.125rem", // 18px
  /** Paired with base/lg: 24px equivalent */
  md: "1.5rem", // 24px
  /** Paired with xl/2xl: 30px equivalent */
  lg: "1.875rem", // 30px
  /** Paired with 3xl+: 38px equivalent */
  xl: "2.375rem", // 38px
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const fontFamily = {
  sans: "Outfit, sans-serif",
  mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999rem",
} as const;

// ---------------------------------------------------------------------------
// Shadows (expressed as CSS variable references — pixel values inside CSS)
// ---------------------------------------------------------------------------

export const shadow = {
  xs: "var(--shadow-theme-xs)",
  sm: "var(--shadow-theme-sm)",
  md: "var(--shadow-theme-md)",
  lg: "var(--shadow-theme-lg)",
  xl: "var(--shadow-theme-xl)",
  focusRing: "var(--shadow-focus-ring)",
} as const;

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const transition = {
  /** 150ms — hover states, toggles */
  fast: "150ms ease-in-out",
  /** 250ms — panels, dropdowns */
  normal: "250ms ease-in-out",
  /** 350ms — modals, page transitions */
  slow: "350ms ease-in-out",
} as const;

// ---------------------------------------------------------------------------
// Breakpoints — in rem (base: 16px)
// ---------------------------------------------------------------------------

export const breakpoints = {
  sm: "40rem", // 640px
  md: "48rem", // 768px
  lg: "64rem", // 1024px
  xl: "80rem", // 1280px
  "2xl": "96rem", // 1536px
} as const;

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------

export const zIndex = {
  dropdown: 10,
  sticky: 20,
  modal: 30,
  toast: 40,
  tooltip: 50,
} as const;
