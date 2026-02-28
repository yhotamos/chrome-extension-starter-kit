import { LogEntry, LogLevel } from '../../utils/logger';

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: 'text-body',
  warn: 'text-warning',
  error: 'text-danger',
};

const SOURCE_LABEL: Record<string, string> = {
  popup: 'Popup',
  background: 'BG',
  content: 'Content',
};

export class PopupPanel {
  private header: HTMLElement;
  private tabMenu: HTMLElement;
  private maximizeButton: HTMLButtonElement;
  private minimizeButton: HTMLButtonElement;
  private closeButton: HTMLButtonElement;
  private panelButton: HTMLButtonElement;
  private resizer: HTMLElement;
  private panel: HTMLElement;
  private messageDiv: HTMLElement;
  private clearButton: HTMLButtonElement;

  private onClearCallback: (() => void) | null = null;

  private startY: number = 0;
  private tmpPanelHeight: number = 0;
  private startHeightTop: number = 0;
  private emdHeight: number = 150;
  private isDragging: boolean = false;

  constructor() {
    this.header = document.querySelector('#header')!;
    this.tabMenu = document.querySelector('#tab-menu')!;
    this.maximizeButton = document.querySelector("#maximize-button")!;
    this.minimizeButton = document.querySelector("#minimize-button")!;
    this.closeButton = document.querySelector("#close-button")!;
    this.panelButton = document.querySelector("#panel-button")!;
    this.resizer = document.getElementById('resizer')!;
    this.panel = document.getElementById('panel')!;
    this.messageDiv = document.getElementById('message')!;
    this.clearButton = document.querySelector('#clear-button')!;

    this.initializePanel();
    this.addEventListeners();
  }

  private initializePanel(): void {
    this.panel.style.height = '0px';
    this.closeButton.classList.add('d-none');
    this.switchMinMaxButtons();
  }

  private getPanelHeight(): number {
    return document.documentElement.clientHeight - this.tabMenu.offsetHeight - this.resizer.offsetHeight;
  }

  private togglePanel(isOpen: boolean): void {
    if (!this.isDragging) {
      this.panel.style.height = isOpen ? `${this.emdHeight}px` : '0px';
    }

    const panelHeight = parseFloat(this.panel.style.height);
    const isPanelVisible = panelHeight > 50 && isOpen;

    this.closeButton.classList.toggle('d-none', !isPanelVisible);
    this.panelButton.classList.toggle('d-none', isPanelVisible);

    if (isOpen && (this.panel.offsetHeight === this.getPanelHeight())) {
      this.maximizeButton.classList.add('d-none');
      this.minimizeButton.classList.remove('d-none');
    }
  }

  private switchMinMaxButtons(): void {
    const panelHeight = parseFloat(this.panel.style.height);
    const isMaximized = panelHeight > this.getPanelHeight() - 20;
    this.maximizeButton.classList.toggle('d-none', isMaximized);
    this.minimizeButton.classList.toggle('d-none', !isMaximized);
  }

  private addEventListeners(): void {
    this.panelButton.addEventListener('click', () => {
      this.togglePanel(true);
      this.switchMinMaxButtons();
    });

    this.closeButton.addEventListener('click', () => {
      this.togglePanel(false);
      this.switchMinMaxButtons();
      this.emdHeight = this.panel.offsetHeight > this.getPanelHeight() - 20 ? 150 : this.panel.offsetHeight;
    });

    this.resizer.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.panel.classList.add('no-transition');
      this.resizer.style.backgroundColor = '#4688F1';
      this.startY = e.clientY;
      this.startHeightTop = this.panel.offsetHeight;
      this.tmpPanelHeight = (this.panel.offsetHeight === 0 || this.panel.offsetHeight === this.getPanelHeight() || parseFloat(this.panel.style.height) > this.getPanelHeight() - 15) ? 150 : this.panel.offsetHeight;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        document.body.style.userSelect = 'none';
        if (this.header.offsetHeight >= e.clientY - 20) {
          this.panel.style.height = `${this.getPanelHeight()}px`;
          return;
        }
        const dy = e.clientY - this.startY;
        const newHeightTop = this.startHeightTop - dy;
        this.panel.style.height = `${newHeightTop}px`;
        this.togglePanel(true);
        this.switchMinMaxButtons();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.userSelect = '';
        this.panel.classList.remove('no-transition');
        this.resizer.style.backgroundColor = '';
        this.emdHeight = this.panel.offsetHeight;
        const panelHeights = this.panel.offsetHeight;
        if (panelHeights < 50) {
          this.emdHeight = 150;
          this.togglePanel(false);
        }
        if (panelHeights > this.getPanelHeight() - 20) {
          this.emdHeight = 150;
          this.panel.style.height = `${this.getPanelHeight()}px`;
        }
        this.switchMinMaxButtons();
      }
    });

    this.maximizeButton.addEventListener('click', () => {
      this.tmpPanelHeight = (this.panel.offsetHeight === 0 || this.panel.offsetHeight === this.getPanelHeight() || parseFloat(this.panel.style.height) > this.getPanelHeight() - 20) ? 150 : this.panel.offsetHeight;
      this.togglePanel(true);
      this.panel.style.height = `${this.getPanelHeight()}px`;
      this.switchMinMaxButtons();
    });

    this.minimizeButton.addEventListener('click', () => {
      this.togglePanel(true);
      this.panel.style.height = `${this.tmpPanelHeight}px`;
      this.switchMinMaxButtons();
    });

    window.addEventListener('resize', () => {
      const currentHeight = parseFloat(this.panel.style.height);
      const maxHeight = this.getPanelHeight();
      this.panel.style.height = `${Math.min(currentHeight, maxHeight)}px`;
      if (this.minimizeButton.style.display === 'block') {
        this.panel.style.height = `${maxHeight}px`;
      }
    });

    this.clearButton.addEventListener('click', () => {
      this.clearMessage();
      this.onClearCallback?.();
    });
  }

  public setClearCallback(callback: () => void): void {
    this.onClearCallback = callback;
  }

  public messageOutput(
    message: string,
    datetime: string,
    level: LogLevel = 'info',
    source: string = 'popup',
    issuesUrl?: string,
  ): void {
    if (this.messageDiv) {
      const p = document.createElement('p');
      const levelClass = LEVEL_CLASS[level] ?? 'text-body';
      p.className = `m-0 small ${levelClass}`;

      const sourceLabel = SOURCE_LABEL[source] ?? source;
      const meta = document.createElement('span');
      meta.className = 'opacity-50';
      meta.textContent = `[${datetime}][${sourceLabel}] `;

      const text = document.createElement('span');
      text.textContent = message;

      p.appendChild(meta);
      p.appendChild(text);

      if (level === 'error' && issuesUrl) {
        const sep = document.createElement('span');
        sep.textContent = ' — ';
        const link = document.createElement('a');
        link.href = issuesUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '問題を報告する';
        link.className = 'text-danger';
        p.appendChild(sep);
        p.appendChild(link);
      }

      this.messageDiv.appendChild(p);
      this.messageDiv.scrollTop = this.messageDiv.scrollHeight;
    }
  }

  public loadLogs(entries: LogEntry[], issuesUrl?: string): void {
    this.clearMessage();
    for (const entry of entries) {
      if (entry.hidden) continue;
      this.messageOutput(entry.message, entry.timestamp, entry.level, entry.source, issuesUrl);
    }
  }

  public clearMessage(): void {
    if (this.messageDiv) {
      this.messageDiv.innerHTML = '';
    }
  }
}

