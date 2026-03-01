import { DocItem } from '../types';
import { escapeHtml } from '../../utils/html';
import version010 from '../../../docs/versions/v0.1.0.md';
import version020 from '../../../docs/versions/v0.2.0.md';

const MARKDOWN_CLASS_MAP: Record<string, string> = {
  h1: 'fs-6 mb-2',
  h2: 'fs-6 mb-2',
  h3: 'fs-6 mb-2',
  h4: 'fs-6 mb-2',
  h5: 'fs-6 mb-2',
  h6: 'fs-6 mb-2',
  p: 'small mb-2',
  ul: 'small mb-2 ps-3',
  ol: 'small mb-2 ps-3',
  li: 'mb-1',
};

/**
 * バージョンタブをセットアップする
 */
export function setupVersionTab(currentVersion: string): void {
  const versionTab = document.getElementById('version');
  if (!versionTab) return;

  const allVersions: DocItem[] = [version020, version010].sort((a, b) => b.metadata.order - a.metadata.order);
  const visibleVersions = allVersions.filter(item => item.metadata.visible !== false);

  if (visibleVersions.length === 0) {
    versionTab.innerHTML = '<p class="text-center text-muted mt-5">更新履歴がありません</p>';
    return;
  }

  versionTab.innerHTML = createVersionListHTML(visibleVersions, currentVersion);
}

function createVersionListHTML(items: DocItem[], currentVersion: string): string {
  const entries = items.map((item, index) => {
    const version = String(item.metadata.id || item.metadata.title || '');
    const title = escapeHtml(item.metadata.title || version || 'Version');
    const displayDate = formatReleaseDate(item.metadata.date);
    const badge = createBadgeHTML(version, currentVersion, index === 0);
    const content = applyMarkdownClassMap(item.content);

    return `
      <li class="list-group-item">
        <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
          <strong>${title}</strong>
          ${badge}
        </div>
        ${displayDate ? `<p class="small text-muted mb-2">${escapeHtml(displayDate)}</p>` : ''}
        <div class="version-body">
          ${content}
        </div>
      </li>
    `;
  }).join('');

  return `
    <ul class="list-group list-group-flush">
      <h5 class="pt-3 ps-2 mb-2">更新履歴</h5>
      ${entries}
    </ul>
  `;
}

function formatReleaseDate(dateValue?: string): string {
  if (!dateValue?.trim()) return '';

  const raw = dateValue.trim();

  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
}

function createBadgeHTML(version: string, currentVersion: string, isFirst: boolean): string {
  if (version === currentVersion) {
    return '<span class="badge bg-success">現在使用中</span>';
  }

  if (isFirst) {
    return '<span class="badge bg-primary">最新</span>';
  }

  return '';
}

function applyMarkdownClassMap(html: string): string {
  return Object.entries(MARKDOWN_CLASS_MAP).reduce((result, [tag, className]) => {
    const openTag = `<${tag}>`;
    const openTagWithClass = `<${tag} class="${className}">`;
    return result.replace(new RegExp(openTag, 'g'), openTagWithClass);
  }, html);
}
