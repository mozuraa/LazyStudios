/**
 * Lógica de pesquisa e filtros
 */
const Filters = {
  projects: [],
  filteredProjects: [],
  activeCategory: 'all',
  activeTags: [],
  searchQuery: '',
  callbacks: [],

  /**
   * Inicializar com os dados dos projetos
   */
  init(projects) {
    this.projects = projects;
    this.filteredProjects = [...projects];
  },

  /**
   * Registar callback para quando os filtros mudam
   */
  onChange(callback) {
    this.callbacks.push(callback);
  },

  /**
   * Notificar listeners
   */
  notify() {
    this.callbacks.forEach(cb => cb(this.filteredProjects));
  },

  /**
   * Obter lista única de todas as tags
   */
  getAllTags() {
    const tagSet = new Set();
    this.projects.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },

  /**
   * Obter contagem de projetos por categoria
   */
  getCategoryCounts() {
    const counts = { all: this.projects.length, app: 0, web: 0, file: 0, other: 0 };
    this.projects.forEach(p => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  },

  /**
   * Definir categoria ativa
   */
  setCategory(category) {
    this.activeCategory = category;
    this.applyFilters();
  },

  /**
   * Alternar tag nos filtros
   */
  toggleTag(tag) {
    const index = this.activeTags.indexOf(tag);
    if (index >= 0) {
      this.activeTags.splice(index, 1);
    } else {
      this.activeTags.push(tag);
    }
    this.applyFilters();
  },

  /**
   * Definir query de pesquisa
   */
  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.applyFilters();
  },

  /**
   * Aplicar todos os filtros ativos
   */
  applyFilters() {
    const query = this.searchQuery;
    const category = this.activeCategory;
    const tags = this.activeTags;

    this.filteredProjects = this.projects.filter(project => {
      // Filtro por categoria
      if (category !== 'all' && project.category !== category) {
        return false;
      }

      // Filtro por tags (AND - todas as tags selecionadas devem estar presentes)
      if (tags.length > 0) {
        const projectTags = project.tags.map(t => t.toLowerCase());
        const hasAllTags = tags.every(tag => projectTags.includes(tag.toLowerCase()));
        if (!hasAllTags) {
          return false;
        }
      }

      // Filtro por pesquisa (título, descrição, tags)
      if (query) {
        const searchable = [
          project.title,
          project.subtitle,
          project.description,
          ...project.tags
        ].join(' ').toLowerCase();
        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });

    this.notify();
  },

  /**
   * Limpar todos os filtros
   */
  reset() {
    this.activeCategory = 'all';
    this.activeTags = [];
    this.searchQuery = '';
    this.applyFilters();
  }
};

export default Filters;