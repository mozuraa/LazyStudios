/**
 * Search and filter logic - because finding stuff shouldn't be hard
 */
const Filters = {
  projects: [],
  filteredProjects: [],
  activeCategory: 'all',
  activeTags: [],
  searchQuery: '',
  callbacks: [],

  /**
   * Initialize with project data
   */
  init(projects) {
    this.projects = projects;
    this.filteredProjects = [...projects];
  },

  /**
   * Register callback for when filters change
   */
  onChange(callback) {
    this.callbacks.push(callback);
  },

  /**
   * Notify all listeners
   */
  notify() {
    this.callbacks.forEach(cb => cb(this.filteredProjects));
  },

  /**
   * Get unique list of all tags
   */
  getAllTags() {
    const tagSet = new Set();
    this.projects.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },

  /**
   * Get project count by category
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
   * Set active category
   */
  setCategory(category) {
    this.activeCategory = category;
    this.applyFilters();
  },

  /**
   * Toggle tag filter
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
   * Set search query
   */
  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.applyFilters();
  },

  /**
   * Apply all active filters
   */
  applyFilters() {
    const query = this.searchQuery;
    const category = this.activeCategory;
    const tags = this.activeTags;

    this.filteredProjects = this.projects.filter(project => {
      // Category filter
      if (category !== 'all' && project.category !== category) {
        return false;
      }

      // Tag filter (AND logic - all selected tags must be present)
      if (tags.length > 0) {
        const projectTags = project.tags.map(t => t.toLowerCase());
        const hasAllTags = tags.every(tag => projectTags.includes(tag.toLowerCase()));
        if (!hasAllTags) {
          return false;
        }
      }

      // Search filter (title, description, tags)
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
   * Reset all filters
   */
  reset() {
    this.activeCategory = 'all';
    this.activeTags = [];
    this.searchQuery = '';
    this.applyFilters();
  }
};

export default Filters;