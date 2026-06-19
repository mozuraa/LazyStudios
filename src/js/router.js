/**
 * Simple hash-based router - gets the job done without the bloat
 */
const Router = {
  routes: {},
  currentRoute: null,

  /**
   * Register a route
   * @param {string} pattern - Route pattern (ex: 'project/:id')
   * @param {Function} handler - Function to call when route matches
   */
  register(pattern, handler) {
    // Converter padrão para regex (ex: 'project/:id' -> /^project\/([^/]+)$/)
    const regexStr = pattern
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^/]+)');
    const regex = new RegExp(`^${regexStr}$`);

    this.routes[pattern] = { regex, handler, pattern };
  },

  /**
   * Start the router (listen for hash changes)
   */
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  },

  /**
   * Resolve the current route
   */
  resolve() {
    const hash = window.location.hash.replace('#', '') || '/';
    const parts = hash.split('/').filter(Boolean);

    for (const key in this.routes) {
      const { regex, handler } = this.routes[key];
      const match = hash.match(regex);

      if (match) {
        // Extract parameters (ex: { id: 'lazy-notes' })
        const paramNames = [];
        const paramPattern = /:(\w+)/g;
        let p;
        while ((p = paramPattern.exec(key)) !== null) {
          paramNames.push(p[1]);
        }

        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        this.currentRoute = { pattern: key, params, hash };
        handler(params);
        return;
      }
    }

    // Route not found -> home
    if (this.routes['/']) {
      this.currentRoute = { pattern: '/', params: {}, hash: '/' };
      this.routes['/'].handler({});
    }
  },

  /**
   * Navigate to a route
   */
  navigate(path) {
    window.location.hash = path;
  },

  /**
   * Get the current route info
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
};

export default Router;