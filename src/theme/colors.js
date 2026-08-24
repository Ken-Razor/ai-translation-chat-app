// Latest Stitch Design System Theme (Plum & Modern Light Theme)
export const STITCH_LIGHT_THEME = {
  mode: 'light',
  bg: '#f8f9fa',
  surface: '#f8f9fa',
  card: '#ffffff',
  cardHigh: '#f3f4f5',
  cardHighest: '#edeeef',
  cardSecondary: '#ffd7f3',
  text: '#191c1d',
  subtext: '#4f434c',
  border: '#e1e3e4',
  borderSecondary: '#d2c2cd',
  primary: '#320034',           // Deep Royal Plum
  primaryLight: '#ffd7f3',
  primaryText: '#ffffff',
  secondary: '#8b4482',         // Magenta Orchid
  tertiary: '#fda8ed',          // Rose Accent
  accentPink: '#fda8ed',
  tealText: '#320034',
  inputBg: '#ffffff',
  headerBg: '#f8f9fa',
  statusBar: 'dark-content',
};

export const DARK_THEME = STITCH_LIGHT_THEME;
export const LIGHT_THEME = STITCH_LIGHT_THEME;

export function getTheme() {
  return STITCH_LIGHT_THEME;
}
