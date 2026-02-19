export type Theme = 'system' | 'light' | 'dark';

export type SharePlatform = 'twitter' | 'facebook' | 'copy';

export interface ShareConfig {
  title: string;
  url: string;
  text?: string;
}

export type ManifestMetadata = {
  issues_url?: string;
  languages?: string[];
  publisher?: string;
  developer?: string;
  github_url?: string;
  [key: string]: any;
};


