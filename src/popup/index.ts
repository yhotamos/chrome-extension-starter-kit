import './popup.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { applyTheme, getTheme } from './components/theme';
import { PopupManager } from './manager';

try {
  // フラッシュ防止のため先にテーマを適用
  const theme = getTheme();
  applyTheme(theme);
} catch (e) {
  // ignore
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());