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

    // Animate stats counters
    this.animateStats();

    // Setup scroll reveal animations
    this.setupScrollReveal();

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
   * Animate stats counters when they come into view
   */
  animateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    if (!statCards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const target = parseInt(card.dataset.target) || 0;
          const suffix = card.dataset.suffix || '';
          const valueEl = card.querySelector('.stat-card__value');

          // Animate from 0 to target
          let current = 0;
          const duration = 1500;
          const steps = 60;
          const increment = target / steps;
          const stepTime = duration / steps;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            valueEl.textContent = Math.floor(current) + suffix;
          }, stepTime);

          observer.unobserve(card);
        }
      });
    }, { threshold: 0.5 });

    statCards.forEach(card => observer.observe(card));
  },

  /**
   * Setup scroll-triggered reveal animations
   */
  setupScrollReveal() {
    const sections = document.querySelectorAll('.projects, .stats, .filters');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(section);
    });

    // Immediately show hero section
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.style.opacity = '1';
      hero.style.transform = 'translateY(0)';
    }
  },

  /**
   * Interactive mouse-following dots background
   */
  initBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let mouse = { x: null, y: null };
    const dots = [];
    const DOT_COUNT = 50;
    const CONNECTION_DIST = 150;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Create dots
    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw dots
      dots.forEach(dot => {
        // Move dot
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Bounce off edges
        if (dot.x < 0 || dot.x > width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > height) dot.vy *= -1;

        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            dot.x -= dx * 0.02;
            dot.y -= dy * 0.02;
          }
        }

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';
        ctx.globalAlpha = 0.5;
        ctx.fill();
      });

      // Draw connections between nearby dots
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';
      ctx.lineWidth = 1;

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            ctx.globalAlpha = 0.15 * (1 - dist / CONNECTION_DIST);
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
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
