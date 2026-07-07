

export const colors = {
  primary:       '#e85d04',
  primaryHover:  '#c94f03',
  background:    '#f8f7f5',
  card:          '#ffffff',
  error:         '#c1121f',
  teacherAccent: '#0369a1',
  studentAccent: '#15803d',
  mutedFg:       '#6b7280',
} as const;


export const hskColors: Record<number, string> = {
  1: '#15803d',
  2: '#0369a1',
  3: '#7c3aed',
  4: '#c2410c',
  5: '#b45309',
  6: '#be123c',
};

export const hskUnknownColor = '#6b7280';

export const sm2CategoryColors = {
  new:      '#6b7280',
  learning: '#d97706',
  mature:   '#15803d',
  due:      '#c1121f',
} as const;

export const shadows = {
  card:       '0 4px 6px -1px rgba(0,0,0,0.07)',
  cardHover:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
  modal:      '0 20px 60px rgba(0,0,0,0.15)',
  focus:      '0 0 0 3px rgba(232, 93, 4, 0.12)',
} as const;