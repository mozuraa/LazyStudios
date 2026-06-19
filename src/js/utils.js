/**
 * General utilities - the stuff I reach for in every project
 */
const Utils = {
  /**
   * Fetch and parse JSON - because JSON is everywhere
   */
  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Format ISO date to a human-readable format
   */
  formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Escape HTML strings to prevent XSS attacks
   * Never trust user input, kids
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Debounce function to avoid spamming requests on every keystroke
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Map category to a Font Awesome icon
   */
  getCategoryIcon(category) {
    const icons = {
      app: 'fa-mobile-screen',
      web: 'fa-globe',
      file: 'fa-file',
      other: 'fa-folder'
    };
    return icons[category] || 'fa-folder';
  },

  /**
   * Map category to a human-readable label
   */
  getCategoryLabel(category) {
    const labels = {
      app: 'App',
      web: 'Web',
      file: 'File',
      other: 'Other'
    };
    return labels[category] || 'Other';
  },

  /**
   * Map project status to a display label
   */
  getStatusLabel(status) {
    const labels = {
      active: 'Active',
      archived: 'Archived',
      wip: 'In Progress'
    };
    return labels[status] || status;
  }
};

export default Utils;