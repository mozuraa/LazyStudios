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
    // DOM references
    this.projectsGrid = document.getElementById('projectsGrid');
    this.projectsCount = document.getElementById('projectsCount');
    this.searchInput = document.getElementById('searchInput');
    this.categoriesContainer = document.getElementById('categoriesContainer');
    this.tagsContainer = document.getElementById('tagsContainer');
    this.mainContent = document.getElementById('mainContent');
    this.detailContainer = document.getElementById('detailContainer');

    // Initialize theme
    Theme.init();

    // Load data
    await this.loadProjects();

    // Initialize router
    this.initRouter();

    // Setup event listeners
    this.setupEventListeners();

    // Initialize interactive background
    this.initBackground();

    // Initialize router (resolve current route)
    Router.init();
  },

  /**
   * Carregar projetos do JSON
   */
  async loadProjects() {
    try {
      this.projects = await Utils.fetchJSON('src/data/projects.json');
      Filters.init(this.projects);

    // Render category filters
    this.renderCategoryFilters();

    // Re-render when filters change
    Filters.onChange((filtered) => {
      this.renderFilteredProjects(filtered);
    });

    } catch (error) {
      console.error('Failed to load projects:', error);
      this.projectsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__text">Failed to load projects</div>
          <div class="empty-state__sub">${error.message}</div>
        </div>
      `;
    }
  },

  /**
   * Inicializar rotas
   */
  initRouter() {
    // Home route
    Router.register('/', () => {
      this.showHome();
    });

    // Project detail route
    Router.register('project/:id', (params) => {
      this.showProjectDetail(params.id);
    });
  },

  /**
   * Show home page (projects grid)
   */
  showHome() {
    this.mainContent.classList.remove('hidden');
    this.detailContainer.innerHTML = '';
    this.renderFilteredProjects(Filters.filteredProjects);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Show project detail page
   */
  showProjectDetail(id) {
    const project = this.projects.find(p => p.id === id);

    if (!project) {
      Router.navigate('/');
      return;
    }

    this.mainContent.classList.add('hidden');
    this.detailContainer.innerHTML = Renderer.renderDetail(project);

    // Back button event
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.navigate('/');
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Render category filters
   */
  renderCategoryFilters() {
    const counts = Filters.getCategoryCounts();
    const categories = [
      { id: 'all', label: `All (${counts.all})` },
      { id: 'app', label: `📱 Apps (${counts.app})` },
      { id: 'web', label: `🌐 Web (${counts.web})` },
      { id: 'file', label: `📄 Files (${counts.file})` },
      { id: 'other', label: `📁 Other (${counts.other})` }
    ];

    this.categoriesContainer.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === 'all' ? 'filter-btn--active' : ''}"
              data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join('');
  },

  /**
   * Tag filters removed for cleaner UI
   */
  renderTagFilters() {
    // Tags hidden to reduce noise — keep only category filters
    this.tagsContainer.innerHTML = '';
  },

  /**
   * Render filtered projects
   */
  renderFilteredProjects(projects) {
    Renderer.renderProjects(projects, this.projectsGrid);
    Renderer.renderCount(projects.length, this.projects.length, this.projectsCount);

    // Add click events to cards
    this.projectsGrid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        Router.navigate(`project/${id}`);
      });
    });
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => Theme.toggle());
    }

    // Search (with debounce)
    if (this.searchInput) {
      const debouncedSearch = Utils.debounce((e) => {
        Filters.setSearch(e.target.value);

        // Keep filter buttons in sync with search
        this.updateFilterButtons();
      }, 250);

      this.searchInput.addEventListener('input', debouncedSearch);
    }

    // Category filters (delegated)
    this.categoriesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      const category = btn.dataset.category;
      Filters.setCategory(category);

      // Update UI
      this.categoriesContainer.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('filter-btn--active', b.dataset.category === category);
      });
    });

    // Tag filters removed
  },

  /**
   * Interactive background with cursor reveal
   * Dots appear only within a circular radius around the mouse
   */
  initBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let mouse = { x: null, y: null };
    const dots = [];
    const GRID_SIZE = 40;
    const REVEAL_RADIUS = 180;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dotColor = isDark ? '129, 140, 248' : '99, 102, 241';

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dots.length = 0;
      const cols = Math.ceil(width / GRID_SIZE);
      const rows = Math.ceil(height / GRID_SIZE);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: i * GRID_SIZE + GRID_SIZE / 2,
            y: j * GRID_SIZE + GRID_SIZE / 2,
            baseX: i * GRID_SIZE + GRID_SIZE / 2,
            baseY: j * GRID_SIZE + GRID_SIZE / 2,
            radius: Math.random() * 2 + 1,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Track mouse
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      dots.forEach(dot => {
        // Gentle floating animation
        const floatX = Math.sin(time + dot.phase) * 3;
        const floatY = Math.cos(time + dot.phase) * 3;
        dot.x = dot.baseX + floatX;
        dot.y = dot.baseY + floatY;

        // Calculate distance to mouse
        let alpha = 0;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REVEAL_RADIUS) {
            alpha = 1 - (dist / REVEAL_RADIUS);
            // Subtle attraction to mouse
            dot.x += dx * 0.03 * alpha;
            dot.y += dy * 0.03 * alpha;
          }
        }

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${alpha * 0.7})`;
        ctx.fill();

        // Draw connections only for nearby dots (within reveal radius)
        if (alpha > 0.3) {
          ctx.strokeStyle = `rgba(${dotColor}, ${alpha * 0.2})`;
          ctx.lineWidth = 1;
          
          // Connect to mouse if close
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - dot.x;
            const dy = mouse.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < REVEAL_RADIUS * 0.8) {
              ctx.beginPath();
              ctx.moveTo(dot.x, dot.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }
      });

      // Draw cursor glow
      if (mouse.x !== null && mouse.y !== null) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, REVEAL_RADIUS);
        gradient.addColorStop(0, `rgba(${dotColor}, 0.05)`);
        gradient.addColorStop(1, `rgba(${dotColor}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      requestAnimationFrame(animate);
    };

    animate();
  },

  /**
   * Update visual state of filter buttons
   */
  updateFilterButtons() {
    // Keep active category button consistent
    this.categoriesContainer.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('filter-btn--active', b.dataset.category === Filters.activeCategory);
    });

    // Tags removed from UI
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
