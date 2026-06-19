/**
 * Theme management - dark mode, light mode, you know the drill
 */
const Theme = {
  STORAGE_KEY: 'portfolio-theme',

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme = savedTheme;
    if (!theme) {
      theme = prefersDark ? 'dark' : 'light';
    }

    this.set(theme);
    this.renderToggle();
  },

  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.set(next);
    this.renderToggle();
  },

  getCurrent() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  renderToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const isDark = this.getCurrent() === 'dark';
    toggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i><span class="theme-toggle__label">Light</span>'
      : '<i class="fa-solid fa-moon"></i><span class="theme-toggle__label">Dark</span>';
  }
};

export default Theme;