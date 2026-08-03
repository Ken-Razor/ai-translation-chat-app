import { useColorScheme } from 'react-native';

export const LIGHT_THEME = {
  mode: 'light',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#E6F4F1', // Mint Teal
  text: '#0F172A',
  subtext: '#64748B',
  border: '#E2E8F0',
  borderSecondary: '#B2ECE1',
  primary: '#8B5CF6',
  primaryLight: '#F3E8FF',
  tealText: '#0F766E',
  inputBg: '#FFFFFF',
  headerBg: '#F8FAFC', // Harmonized 100% with bg
  statusBar: 'dark-content',
};

export const DARK_THEME = {
  mode: 'dark',
  bg: '#0B0F19',
  card: '#1E293B',
  cardSecondary: 'rgba(20, 184, 166, 0.15)',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  border: '#334155',
  borderSecondary: 'rgba(20, 184, 166, 0.3)',
  primary: '#A855F7',
  primaryLight: 'rgba(168, 85, 247, 0.2)',
  tealText: '#2DD4BF',
  inputBg: '#131C2E',
  headerBg: '#0B0F19', // Harmonized 100% with bg
  statusBar: 'light-content',
};

export function getTheme(preference = 'system', systemColorScheme = 'light') {
  if (preference === 'system') {
    return systemColorScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
  }
  return preference === 'dark' ? DARK_THEME : LIGHT_THEME;
}
