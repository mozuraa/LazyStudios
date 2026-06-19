/**
 * Application entry point
 */
import Utils from './utils.js';
import Theme from './theme.js';
import Renderer from './renderer.js';
import Filters from './filters.js';
import Router from './router.js';

const App = {
  projects: [],
  projectsGrid: null,
  projectsCount: null,
  searchInput: null,
  categoriesContainer: null,
  tagsContainer: null,
  mainContent: null,
  detailContainer: null,

  /**
   * Inicializar aplicação
   */
  async init() {
    // Referências DOM
    this.projectsGrid = document.getElementById('projectsGrid');
    this.projectsCount = document.getElementById('projectsCount');
    this.searchInput = document.getElementById('searchInput');
    this.categoriesContainer = document.getElementById('categoriesContainer');
    this.tagsContainer = document.getElementById('tagsContainer');
    this.mainContent = document.getElementById('mainContent');
    this.detailContainer = document.getElementById('detailContainer');

    // Inicializar tema
    Theme.init();

    // Carregar dados
    await this.loadProjects();

    // Inicializar router
    this.initRouter();

    // Setup dos event listeners
    this.setupEventListeners();

    // Iniciar router (resolve a rota atual)
    Router.init();
  },

  /**
   * Carregar projetos do JSON
   */
  async loadProjects() {
    try {
      this.projects = await Utils.fetchJSON('src/data/projects.json');
      Filters.init(this.projects);

      // Renderizar filtros de categorias e tags
      this.renderCategoryFilters();
      this.renderTagFilters();

      // Atualizar quando os filtros mudarem
      Filters.onChange((filtered) => {
        this.renderFilteredProjects(filtered);
      });

    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.projectsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__text">Erro ao carregar projetos</div>
          <div class="empty-state__sub">${error.message}</div>
        </div>
      `;
    }
  },

  /**
   * Inicializar rotas
   */
  initRouter() {
    // Rota home
    Router.register('/', () => {
      this.showHome();
    });

    // Rota de detalhes do projeto
    Router.register('project/:id', (params) => {
      this.showProjectDetail(params.id);
    });
  },

  /**
   * Mostrar página inicial (grid de projetos)
   */
  showHome() {
    this.mainContent.classList.remove('hidden');
    this.detailContainer.innerHTML = '';
    this.renderFilteredProjects(Filters.filteredProjects);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Mostrar página de detalhes de um projeto
   */
  showProjectDetail(id) {
    const project = this.projects.find(p => p.id === id);

    if (!project) {
      Router.navigate('/');
      return;
    }

    this.mainContent.classList.add('hidden');
    this.detailContainer.innerHTML = Renderer.renderDetail(project);

    // Evento do botão "Voltar"
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.navigate('/');
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Renderizar filtros de categoria
   */
  renderCategoryFilters() {
    const counts = Filters.getCategoryCounts();
    const categories = [
      { id: 'all', label: `Todos (${counts.all})` },
      { id: 'app', label: `📱 Apps (${counts.app})` },
      { id: 'web', label: `🌐 Web (${counts.web})` },
      { id: 'file', label: `📄 Ficheiros (${counts.file})` },
      { id: 'other', label: `📁 Outro (${counts.other})` }
    ];

    this.categoriesContainer.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === 'all' ? 'filter-btn--active' : ''}"
              data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join('');
  },

  /**
   * Renderizar filtros de tags
   */
  renderTagFilters() {
    const allTags = Filters.getAllTags();

    if (allTags.length === 0) {
      this.tagsContainer.innerHTML = '';
      return;
    }

    this.tagsContainer.innerHTML = allTags.map(tag => `
      <button class="tag-btn" data-tag="${Utils.escapeHTML(tag)}">
        ${Utils.escapeHTML(tag)}
      </button>
    `).join('');
  },

  /**
   * Renderizar projetos filtrados
   */
  renderFilteredProjects(projects) {
    Renderer.renderProjects(projects, this.projectsGrid);
    Renderer.renderCount(projects.length, this.projects.length, this.projectsCount);

    // Adicionar eventos de clique nos cards
    this.projectsGrid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        Router.navigate(`project/${id}`);
      });
    });
  },

  /**
   * Setup de event listeners
   */
  setupEventListeners() {
    // Toggle tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => Theme.toggle());
    }

    // Pesquisa (com debounce)
    if (this.searchInput) {
      const debouncedSearch = Utils.debounce((e) => {
        Filters.setSearch(e.target.value);

        // Atualizar o estado ativo dos botões de filtro (manter coerência)
        this.updateFilterButtons();
      }, 250);

      this.searchInput.addEventListener('input', debouncedSearch);
    }

    // Categoria filters (delegated)
    this.categoriesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      const category = btn.dataset.category;
      Filters.setCategory(category);

      // Atualizar UI
      this.categoriesContainer.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('filter-btn--active', b.dataset.category === category);
      });
    });

    // Tag filters (delegated)
    this.tagsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-btn');
      if (!btn) return;

      const tag = btn.dataset.tag;
      Filters.toggleTag(tag);
      btn.classList.toggle('tag-btn--active');
    });
  },

  /**
   * Atualizar estado visual dos botões de filtro
   */
  updateFilterButtons() {
    // Manter o botão de categoria ativo consistente
    this.categoriesContainer.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('filter-btn--active', b.dataset.category === Filters.activeCategory);
    });

    // Manter tags ativas consistentes
    this.tagsContainer.querySelectorAll('.tag-btn').forEach(b => {
      b.classList.toggle('tag-btn--active', Filters.activeTags.includes(b.dataset.tag));
    });
  }
};

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});