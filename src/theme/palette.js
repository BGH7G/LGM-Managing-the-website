export const lightPalette = {
  primary: '#2D3A8C',
  secondary: '#5BA6A6',
  accent: '#E9ECF5',
  success: '#2E9C6A',
  warning: '#F2A93B',
  error: '#D64550',
  info: '#3BA7D6',
  background: '#F6F8FB',
  surface: '#FFFFFF',
  'on-background': '#0F172A',
  'on-surface': '#1F2937',
  border: '#E5E7EB',
  muted: '#475467',
};

export const darkPalette = {
  primary: '#9FB4FF',
  secondary: '#7CD4C1',
  accent: '#1F2335',
  success: '#4CD6A1',
  warning: '#F2C94C',
  error: '#F199A1',
  info: '#79C8F2',
  background: '#0C1220',
  surface: '#111827',
  'on-background': '#E5E7EB',
  'on-surface': '#E5E7EB',
  border: '#374151',
  muted: '#9CA3AF',
};

export const vuetifyThemes = {
  brandLight: {
    dark: false,
    colors: lightPalette,
  },
  brandDark: {
    dark: true,
    colors: darkPalette,
  },
};
