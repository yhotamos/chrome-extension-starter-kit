import './popup.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from '../popup/panel';
import { dateTime } from '../utils/date';
import { clickURL } from '../utils/dom';
import { getSiteAccessText } from '../utils/permissions';
import { DEFAULT_SETTINGS, Settings, Theme } from '../settings/settings';
import { getSettings, setSettings, isEnabled, setEnabled } from '../settings/storage';
import meta from '../../public/manifest.meta.json';

type ManifestMetadata = {
  issues_url?: string;
  languages?: string[];
  publisher?: string;
  developer?: string;
  github_url?: string;
  [key: string]: any;
};

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private settings: Settings = DEFAULT_SETTINGS;
  private manifestData: chrome.runtime.Manifest;
  private manifestMetadata: ManifestMetadata;
  private enabledElement: HTMLInputElement | null;
  // private notificationToggle: HTMLInputElement | null;
  // private fontSizeRange: HTMLInputElement | null;

  constructor() {
    this.panel = new PopupPanel();
    this.manifestData = chrome.runtime.getManifest();
    this.manifestMetadata = meta || {};
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement | null;
    // this.notificationToggle = document.getElementById('notification-toggle') as HTMLInputElement | null;
    // this.fontSizeRange = document.getElementById('font-size') as HTMLInputElement | null;

    this.loadInitialState();
    this.addEventListeners();
    this.initializeUI();
  }

  private async loadInitialState(): Promise<void> {
    try {
      this.settings = await getSettings();
      this.enabled = await isEnabled();
      if (this.enabledElement) this.enabledElement.checked = this.enabled;

      const theme = this.settings.theme || DEFAULT_SETTINGS.theme;
      this.applyTheme(theme);

      this.showMessage(`${this.manifestData.short_name} が起動しました`);
    } catch (err) {
      console.error('loadInitialState error', err);
      this.showMessage('設定の読み込みに失敗しました');
      this.applyTheme(DEFAULT_SETTINGS.theme);
    }
  }

  private addEventListeners(): void {
    this.enabledElement?.addEventListener('change', async (event) => {
      this.enabled = (event.target as HTMLInputElement).checked;
      try {
        await setEnabled(this.enabled);
        this.showMessage(this.enabled ? `${this.manifestData.short_name} は有効になりました` : `${this.manifestData.short_name} は無効になりました`);
      } catch (err) {
        console.error('failed to save enabled state', err);
        this.showMessage('有効状態の保存に失敗しました');
      }
    });

    // テーマアイコンメニューのイベントリスナー
    const themeButton = document.getElementById('theme-button');
    const themeMenu = document.getElementById('theme-menu');
    if (themeButton && themeMenu) {
      themeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('d-none');
      });

      // テーマオプションのクリックイベント
      const options = Array.from(themeMenu.querySelectorAll('.theme-option')) as HTMLButtonElement[];
      options.forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          let value = (ev.currentTarget as HTMLButtonElement).dataset.theme as Theme | undefined;
          if (!value || (value !== 'system' && value !== 'light' && value !== 'dark')) value = 'system';
          this.settings = { ...this.settings, theme: value };
          this.applyTheme(value);
          this.updateSettings(this.settings, `テーマを「${value}」に変更しました`, 'テーマ設定の保存に失敗しました');
          // メニューを閉じる
          themeMenu.classList.add('d-none');
        });
      });
      // メニュー外クリックで閉じる
      document.addEventListener('click', () => themeMenu.classList.add('d-none'));
    }

    // 他の設定項目のイベントリスナー例

    // チェックボックスの例:
    // this.notificationToggle?.addEventListener('change', (event) => {
    //   const checked = (event.target as HTMLInputElement).checked;
    //   this.updateSettings({ notifications: checked }, `通知を${checked ? '有効' : '無効'}にしました`, '通知の保存に失敗しました');
    // });

    // スライダーの例:
    // this.fontSizeRange?.addEventListener('change', (event) => {
    //   const fontSize = (event.target as HTMLInputElement).value;
    //   this.updateSettings({ fontSize: Number(fontSize) }, 'フォントサイズを保存しました', 'フォントサイズの保存に失敗しました');
    // });
  }

  private async updateSettings(patch: Partial<Settings>, successMessage?: string, failedMessage?: string): Promise<void> {
    try {
      this.settings = { ...this.settings, ...patch };
      await setSettings(this.settings);
      if (successMessage) this.showMessage(successMessage);
    } catch (err) {
      console.error('failed to save settings', err);
      this.showMessage(failedMessage || '設定の保存に失敗しました');
    }
  }

  private applyTheme(theme: Theme): void {
    let themeColor = theme;
    document.body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'system') {
      // OSのカラースキームに合わせる
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeColor = isSystemDark ? 'dark' : 'light';
      document.body.classList.add(`theme-${themeColor}`);
      document.documentElement.setAttribute('data-bs-theme', themeColor);
    } else if (theme === 'light') {
      themeColor = 'light';
      document.body.classList.add('theme-light');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    } else {
      themeColor = 'dark';
      document.body.classList.add('theme-dark');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    }

    const options = Array.from(document.querySelectorAll('#theme-menu .theme-option')) as HTMLButtonElement[];
    options.forEach((b) => {
      if ((b.dataset.theme || 'system') === (theme || 'system')) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  private initializeUI(): void {
    const short_name = this.manifestData.short_name || this.manifestData.name;
    const title = document.getElementById('title');
    if (title) {
      title.textContent = short_name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = short_name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${short_name} を有効にする`;
    }
    const newTabButton = document.getElementById('new-tab-button');
    if (newTabButton) {
      newTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
      });
    }

    this.setupInfoTab();
  }

  private setupInfoTab(): void {
    const storeLink = document.getElementById('store-link') as HTMLAnchorElement;
    if (storeLink) {
      storeLink.href = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`;
      clickURL(storeLink);
    }

    const extensionLink = document.getElementById('extension-link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      clickURL(extensionLink);
    }

    const issuesLink = document.getElementById('issues-link') as HTMLAnchorElement;
    const issuesHref = this.manifestMetadata.issues_url;
    if (issuesLink && issuesHref) {
      issuesLink.href = issuesHref;
      clickURL(issuesLink);
    }

    const extensionId = document.getElementById('extension-id');
    if (extensionId) extensionId.textContent = chrome.runtime.id;

    const extensionName = document.getElementById('extension-name');
    if (extensionName) extensionName.textContent = this.manifestData.name;

    const extensionVersion = document.getElementById('extension-version');
    if (extensionVersion) extensionVersion.textContent = this.manifestData.version;

    const extensionDescription = document.getElementById('extension-description');
    if (extensionDescription) extensionDescription.textContent = this.manifestData.description ?? '';

    chrome.permissions.getAll((result) => {
      const permissionInfo = document.getElementById('permission-info');
      if (permissionInfo && result.permissions) {
        permissionInfo.textContent = result.permissions.join(', ');
      }

      const siteAccess = getSiteAccessText(result.origins);
      const siteAccessElement = document.getElementById('site-access');
      if (siteAccessElement) siteAccessElement.innerHTML = siteAccess;
    });

    chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
      const incognitoEnabled = document.getElementById('incognito-enabled');
      if (incognitoEnabled) incognitoEnabled.textContent = isAllowedAccess ? '有効' : '無効';
    });

    const languageMap: { [key: string]: string } = { 'en': '英語', 'ja': '日本語' };
    const language = document.getElementById('language') as HTMLElement | null;
    const languages = this.manifestMetadata.languages || [];
    if (language) language.textContent = languages.map((lang: string) => languageMap[lang]).join(', ');

    const publisherName = document.getElementById('publisher-name') as HTMLElement | null;
    const publisher = this.manifestMetadata.publisher || '不明';
    if (publisherName) publisherName.textContent = publisher;

    const developerName = document.getElementById('developer-name') as HTMLElement | null;
    const developer = this.manifestMetadata.developer || '不明';
    if (developerName) developerName.textContent = developer;

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    const githubHref = this.manifestMetadata.github_url;
    if (githubLink && githubHref) {
      githubLink.href = githubHref;
      githubLink.textContent = githubHref;
      clickURL(githubLink);
    }
  }

  private showMessage(message: string, timestamp: string = dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());