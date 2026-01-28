import './popup.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from '../popup/panel';
import { dateTime } from '../utils/date';
import { clickURL } from '../utils/dom';
import { getSiteAccessText } from '../utils/permissions';
import meta from '../../public/manifest.meta.json';

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;
  private manifestMetadata: { [key: string]: any } = (meta as any) || {};

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();
    this.manifestMetadata = (meta as any) || {};

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings', 'enabled'], (data) => {
      if (this.enabledElement) {
        this.enabled = data.enabled || false;
        this.enabledElement.checked = this.enabled;
      }
      this.showMessage(`${this.manifestData.short_name} が起動しました`);

      const settings = data.settings || {};
      const theme = settings.theme || 'system';
      this.applyTheme(theme);
    });
  }

  private addEventListeners(): void {
    if (this.enabledElement) {
      this.enabledElement.addEventListener('change', (event) => {
        this.enabled = (event.target as HTMLInputElement).checked;
        chrome.storage.local.set({ enabled: this.enabled }, () => {
          this.showMessage(this.enabled ? `${this.manifestData.short_name} は有効になっています` : `${this.manifestData.short_name} は無効になっています`);
        });
      });
    }

    this.setupSettingsListeners();
    this.initializeUI();
  }

  private setupSettingsListeners(): void {
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
        btn.addEventListener('click', (ev) => {
          const value = (ev.currentTarget as HTMLButtonElement).dataset.theme || 'system';
          this.applyTheme(value);
          // 保存
          chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            settings.theme = value;
            chrome.storage.local.set({ settings }, () => {
              this.showMessage(`テーマを「${value}」に変更しました`);
            });
          });
          // メニューを閉じる
          themeMenu.classList.add('d-none');
        });
      });
      // メニュー外クリックで閉じる
      document.addEventListener('click', () => themeMenu.classList.add('d-none'));
    }

    // 他の設定項目のイベントリスナー例
    //
    // セレクトボックスの例:
    // const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    // if (themeSelect) {
    //   themeSelect.addEventListener('change', (event) => {
    //     const value = (event.target as HTMLSelectElement).value;
    //     this.saveSetting('theme', value, `テーマを「${value}」に変更しました`);
    //   });
    // }
    //
    // チェックボックスの例:
    // const notificationToggle = document.getElementById('enable-notifications') as HTMLInputElement;
    // if (notificationToggle) {
    //   notificationToggle.addEventListener('change', (event) => {
    //     const checked = (event.target as HTMLInputElement).checked;
    //     this.saveSetting('notifications', checked, `通知を${checked ? '有効' : '無効'}にしました`);
    //   });
    // }
    //
    // スライダーの例:
    // const fontSizeRange = document.getElementById('font-size') as HTMLInputElement;
    // if (fontSizeRange) {
    //   fontSizeRange.addEventListener('change', (event) => {
    //     const value = (event.target as HTMLInputElement).value;
    //     this.saveSetting('fontSize', value, `フォントサイズを${value}pxに変更しました`);
    //   });
    // }
  }

  private applyTheme(theme: string): void {
    // 簡素化: system は一度だけ判定し、常時リスナーは使わない
    let themeColor = theme;
    document.body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'system') {
      // OS の好みを一度だけ参照し、その結果を適用する
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

    // 選択中のオプションをハイライト
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
    if (issuesLink) {
      issuesLink.href = this.manifestMetadata.issues_url;
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
    const language = document.getElementById('language') as HTMLElement;
    const languages = this.manifestMetadata.languages;
    language.textContent = languages.map((lang: string) => languageMap[lang]).join(', ');

    const publisherName = document.getElementById('publisher-name') as HTMLElement;
    const publisher = this.manifestMetadata.publisher || '不明';
    publisherName.textContent = publisher;

    const developerName = document.getElementById('developer-name') as HTMLElement;
    const developer = this.manifestMetadata.developer || '不明';
    developerName.textContent = developer;

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    githubLink.href = this.manifestMetadata.github_url;
    githubLink.textContent = this.manifestMetadata.github_url;
    if (githubLink) clickURL(githubLink);
  }

  private showMessage(message: string, timestamp: string = dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());