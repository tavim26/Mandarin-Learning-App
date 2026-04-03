// Sursa unica de adevar pentru toate valorile vizuale ale aplicatiei.
// Orice valoare care apare de mai mult de o data in cod este definita aici.

// --- Culori principale ---
export const colors = {
  primary:        '#e85d04',
  primaryHover:   '#c94f03',
  background:     '#f8f7f5',
  card:           '#ffffff',
  error:          '#c1121f',
  teacherAccent:  '#0369a1',
  studentAccent:  '#15803d',
} as const;

// --- Culori per nivel HSK ---
export const hskColors: Record<number, string> = {
  1: '#15803d',
  2: '#0369a1',
  3: '#7c3aed',
  4: '#c2410c',
  5: '#b45309',
  6: '#be123c',
};

// Culoare fallback pentru tokeni fara nivel HSK
export const hskUnknownColor = '#6b7280';

// --- Culori categorii SM-2 ---
export const sm2CategoryColors = {
  new:      '#6b7280',
  learning: '#d97706',
  mature:   '#15803d',
  due:      '#c1121f',
} as const;

// --- Tipografie ---
export const fonts = {
  display: "'Outfit', sans-serif",
  body:    "'DM Sans', sans-serif",
} as const;

export const fontSizes = {
  xs:   '12px',
  sm:   '14px',
  base: '16px',
  lg:   '18px',
  xl:   '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

// --- Spacing (multipli de 4px) ---
export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
} as const;

// --- Border radius ---
export const borderRadius = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  full: '9999px',
} as const;

// --- Tranzitii ---
export const transitions = {
  fast:   'all 0.15s ease',
  normal: 'all 0.2s ease',
  slow:   'all 0.3s ease',
} as const;

// --- Breakpoints ---
export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
} as const;

// --- Shadows ---
export const shadows = {
  card:  '0 4px 6px -1px rgba(0,0,0,0.07)',
  modal: '0 20px 60px rgba(0,0,0,0.15)',
} as const;