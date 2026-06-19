/**
 * Utilitários gerais
 */
const Utils = {
  /**
   * Fetch e parse de JSON
   */
  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Formatar data ISO para dd/mm/aaaa
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
   * Escapar HTML para prevenir XSS
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Debounce para pesquisa
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Mapear categoria para ícone Font Awesome
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
   * Mapear categoria para label em português
   */
  getCategoryLabel(category) {
    const labels = {
      app: 'App',
      web: 'Web',
      file: 'Ficheiro',
      other: 'Outro'
    };
    return labels[category] || 'Outro';
  },

  /**
   * Mapear status para label
   */
  getStatusLabel(status) {
    const labels = {
      active: 'Ativo',
      archived: 'Arquivado',
      wip: 'Em desenvolvimento'
    };
    return labels[status] || status;
  }
};

export default Utils;