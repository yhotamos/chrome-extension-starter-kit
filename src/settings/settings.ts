export type Theme = 'system' | 'light' | 'dark';

export type Settings = {
  [key: string]: any;
  theme: Theme;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
};
