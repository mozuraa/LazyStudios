/**
 * Router simples baseado em hash (#)
 */
const Router = {
  routes: {},
  currentRoute: null,

  /**
   * Registar uma rota
   * @param {string} pattern - Padrão da rota (ex: 'project/:id')
   * @param {Function} handler - Função a executar quando a rota corresponde
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
   * Iniciar o router (escutar mudanças de hash)
   */
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  },

  /**
   * Resolver a rota atual
   */
  resolve() {
    const hash = window.location.hash.replace('#', '') || '/';
    const parts = hash.split('/').filter(Boolean);

    for (const key in this.routes) {
      const { regex, handler } = this.routes[key];
      const match = hash.match(regex);

      if (match) {
        // Extrair parâmetros (ex: { id: 'lazy-notes' })
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

    // Rota não encontrada -> home
    if (this.routes['/']) {
      this.currentRoute = { pattern: '/', params: {}, hash: '/' };
      this.routes['/'].handler({});
    }
  },

  /**
   * Navegar para uma rota
   */
  navigate(path) {
    window.location.hash = path;
  },

  /**
   * Obter a rota atual
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
};

export default Router;