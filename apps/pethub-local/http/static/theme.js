/* PetHub Local — theme toggle and toast helpers.
 * The data-theme attribute on <html> is set inline in <head> before this file
 * loads to prevent a flash of incorrect colours; this script wires the toggle
 * button and reacts to OS preference changes.
 */
/* eslint-env browser */
(function () {
  var STORAGE_KEY = 'pethub-theme';
  var docEl = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      /* localStorage may be unavailable; ignore */
    }
  }

  function applyTheme(theme) {
    docEl.setAttribute('data-theme', theme);
    var toggles = document.querySelectorAll('[data-test="theme-toggle"]');
    toggles.forEach(function (toggle) {
      toggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      toggle.setAttribute('data-current-theme', theme);
      var label = toggle.querySelector('[data-test="theme-toggle-label"]');
      if (label) {
        label.textContent = theme === 'light' ? 'Light mode' : 'Dark mode';
      }
    });
  }

  function currentTheme() {
    return docEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  /* Re-apply on script load in case markup arrived before the inline init. */
  applyTheme(currentTheme());

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    var toggle = target.closest('[data-test="theme-toggle"]');
    if (!toggle) {
      return;
    }
    event.preventDefault();
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    persistTheme(next);
    applyTheme(next);
  });

  var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', function () {
      if (!getStoredTheme()) {
        applyTheme(getSystemTheme());
      }
    });
  }

  /* Auto-dismiss toast elements that were rendered server-side. */
  document.querySelectorAll('.toast').forEach(function (toast) {
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4500);
  });
})();
