export const renderStatCard = (label: string, value: number): string =>
  `<div class="card"><div class="muted">${label}</div><div style="font-size: 28px; font-weight: bold;">${value}</div></div>`;

/* Inline script applied before the stylesheet to set the initial theme without a flash. */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('pethub-theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export const renderHead = (title: string): string =>
  `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script>${THEME_INIT_SCRIPT}</script>
  <link rel="stylesheet" href="/static/theme.css" />
  <script src="/static/theme.js" defer></script>
</head>`;

export const renderThemeToggle = (): string =>
  `<button type="button" class="theme-toggle" data-test="theme-toggle" aria-pressed="false" aria-label="Toggle light or dark theme">
    <span class="icon icon-moon" aria-hidden="true">🌙</span>
    <span class="icon icon-sun" aria-hidden="true">☀️</span>
    <span data-test="theme-toggle-label">Dark mode</span>
  </button>`;

/** The primary, mutually linked surfaces of the PetHub Local app. */
export type PrimaryApp = 'admin' | 'shop' | 'ops' | 'clinic' | 'lab';

const PRIMARY_APPS: { id: PrimaryApp; href: string; label: string }[] = [
  { id: 'admin', href: '/', label: 'Admin' },
  { id: 'shop', href: '/shop', label: 'Storefront' },
  { id: 'ops', href: '/ops', label: 'Operations' },
  { id: 'clinic', href: '/clinic', label: 'Clinic' },
  { id: 'lab', href: '/lab', label: 'Test Lab' },
];

/**
 * Renders cross-app navigation links to every primary surface except the one
 * currently being viewed, so each surface is reachable from any other. Each
 * link carries a stable `data-test="app-nav-<id>"` hook.
 */
export const renderPrimaryNavLinks = (current: PrimaryApp): string =>
  PRIMARY_APPS.filter((app) => app.id !== current)
    .map((app) => `<a href="${app.href}" data-test="app-nav-${app.id}">${app.label}</a>`)
    .join('\n      ');

export const renderToast = (message: string | undefined, variant: 'success' | 'error' = 'success'): string => {
  if (!message) {
    return '';
  }
  const safe = String(message).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
  return `<div class="toast ${variant}" role="status" data-test="toast">${safe}</div>`;
};
