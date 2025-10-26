import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from './components/popup-panel';
import { dateTime } from './utils/date';
import { clickURL } from './utils/dom';
import { getSiteAccessText } from './utils/permissions';

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings', 'enabled'], (data) => {
      if (this.enabledElement) {
        this.enabled = data.enabled || false;
        this.enabledElement.checked = this.enabled;
      }
      this.showMessage(this.enabled ? `${this.manifestData.name} は有効になっています` : `${this.manifestData.name} は無効になっています`);
    });
  }

  private addEventListeners(): void {
    if (this.enabledElement) {
      this.enabledElement.addEventListener('change', (event) => {
        this.enabled = (event.target as HTMLInputElement).checked;
        chrome.storage.local.set({ enabled: this.enabled }, () => {
          this.showMessage(this.enabled ? `${this.manifestData.name} は有効になっています` : `${this.manifestData.name} は無効になっています`);
        });
      });
    }

    this.initializeUI();
  }

  private initializeUI(): void {
    const title = document.getElementById('title');
    if (title) {
      title.textContent = this.manifestData.name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = this.manifestData.name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${this.manifestData.name} を有効にする`;
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
    const extensionLink = document.getElementById('extension_link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      clickURL(extensionLink);
    }

    clickURL(document.getElementById('issue-link'));
    clickURL(document.getElementById('store_link'));
    clickURL(document.getElementById('github-link'));

    const extensionId = document.getElementById('extension-id');
    if (extensionId) {
      extensionId.textContent = chrome.runtime.id;
    }
    const extensionName = document.getElementById('extension-name');
    if (extensionName) {
      extensionName.textContent = this.manifestData.name;
    }
    const extensionVersion = document.getElementById('extension-version');
    if (extensionVersion) {
      extensionVersion.textContent = this.manifestData.version;
    }
    const extensionDescription = document.getElementById('extension-description');
    if (extensionDescription) {
      extensionDescription.textContent = this.manifestData.description ?? '';
    }

    chrome.permissions.getAll((result) => {
      const permissionInfo = document.getElementById('permission-info');
      const permissions = result.permissions;
      if (permissionInfo && permissions) {
        permissionInfo.textContent = permissions.join(', ');
      }

      const siteAccess = getSiteAccessText(result.origins);
      const siteAccessElement = document.getElementById('site-access');
      if (siteAccessElement) {
        siteAccessElement.innerHTML = siteAccess;
      }
    });

    chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
      const incognitoEnabled = document.getElementById('incognito-enabled');
      if (incognitoEnabled) {
        incognitoEnabled.textContent = isAllowedAccess ? '有効' : '無効';
      }
    });
  }

  private saveSettings(datetime: string, message: string, value: any): void {
    const settings = {
      sampleValue: value,
    };
    chrome.storage.local.set({ settings: settings }, () => {
      this.showMessage(message, datetime);
    });
  }

  private showMessage(message: string, timestamp: string = dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());