/**
 * Authentication + project management dashboard
 * Minimal and clean — because less is more
 */
import Utils from './utils.js';

const Dashboard = {
  CREDENTIALS: {
    user: 'admin',
    pass: 'solracleafar1504'
  },
  // TODO: move credentials to backend eventually
  projects: [],
  currentEditId: null,
  autoSaveTimer: null,

  init() {
    this.bindLogin();
    this.bindTabs();
    this.bindLogout();
    this.bindFormFields(); // auto-save on input
    this.showToast('ready', 'Dashboard ready');
  },

  bindLogin() {
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.login();
      });
    }
  },

  login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const alert = document.getElementById('loginAlert');

    if (user === this.CREDENTIALS.user && pass === this.CREDENTIALS.pass) {
      sessionStorage.setItem('dash_auth', '1');
      this.showDashboard();
    } else {
      alert.className = 'dash-alert dash-alert--error';
      alert.textContent = 'Invalid credentials. Try again.';
    }
  },

  logout() {
    sessionStorage.removeItem('dash_auth');
    this.showLogin();
  },

  bindLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', () => {
      this.showToast('info', 'Logged out');
      this.logout();
    });
  },

  showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = '';
    this.loadProjects();
  },

  showLogin() {
    document.getElementById('loginPage').style.display = '';
    document.getElementById('dashboardPage').style.display = 'none';
  },

  checkAuth() {
    if (sessionStorage.getItem('dash_auth') !== '1') {
      this.showLogin();
      return false;
    }
    this.showDashboard();
    return true;
  },

  bindTabs() {
    document.querySelectorAll('.dash-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('dash-tab--active'));
        tab.classList.add('dash-tab--active');
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const el = document.getElementById('tab-' + target);
        if (el) el.style.display = '';
      });
    });
  },

  async loadProjects() {
    try {
      const res = await fetch('src/data/projects.json?t=' + Date.now());
      if (res.ok) {
        this.projects = await res.json();
      } else {
        throw new Error('fetch failed');
      }
    } catch {
      const saved = localStorage.getItem('dash_projects');
      this.projects = saved ? JSON.parse(saved) : [];
    }
    this.renderProjectsList();
  },

  renderProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (this.projects.length === 0) {
      container.innerHTML = `
        <div class="dash-empty">
          <div class="icon">📭</div>
          <p>No projects yet. Add your first one!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.projects.map(p => `
      <div class="dash-project-card">
        <div class="info">
          <h3>${Utils.escapeHTML(p.title || p.id)}</h3>
          <p>${Utils.escapeHTML(p.subtitle || p.id)} · ${Utils.getCategoryLabel(p.category)}</p>
        </div>
        <div class="actions">
          <button class="dash-btn dash-btn--ghost" onclick="Dashboard.editProject('${Utils.escapeHTML(p.id)}')" title="Edit">✏️</button>
          <button class="dash-btn dash-btn--danger" onclick="Dashboard.deleteProject('${Utils.escapeHTML(p.id)}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  deleteProject(id) {
    if (!confirm(`Delete project "${id}"? This cannot be undone.`)) return;
    this.projects = this.projects.filter(p => p.id !== id);
    this.persist();
    this.renderProjectsList();
    this.showToast('success', `Deleted "${id}"`);
  },

  // Auto-save on every input change
  bindFormFields() {
    const fields = ['projId', 'projTitle', 'projSubtitle', 'projCategory', 'projDate', 
                    'projTags', 'projDesc', 'projLinkDemo', 'projLinkSource', 'projLinkVideo', 'projThumbnail'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      
      el.addEventListener('input', () => {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.autoSave();
        }, 800);
      });
    });
  },

  autoSave() {
    const id = document.getElementById('projId').value.trim();
    const title = document.getElementById('projTitle').value.trim();

    if (!id || !title) return; // don't save incomplete forms

    const raw = {
      id,
      title,
      subtitle: document.getElementById('projSubtitle').value.trim(),
      category: document.getElementById('projCategory').value,
      date: document.getElementById('projDate').value || new Date().toISOString().split('T')[0],
      tags: document.getElementById('projTags').value.split(',').map(t => t.trim()).filter(Boolean),
      description: document.getElementById('projDesc').value.trim(),
      longDescription: document.getElementById('projDesc').value.trim(),
      links: {
        demo: document.getElementById('projLinkDemo').value.trim(),
        source: document.getElementById('projLinkSource').value.trim(),
        video: document.getElementById('projLinkVideo').value.trim()
      },
      thumbnail: document.getElementById('projThumbnail').value.trim(),
      downloads: [],
      features: [],
      status: 'active'
    };

    if (this.currentEditId) {
      const idx = this.projects.findIndex(p => p.id === this.currentEditId);
      if (idx >= 0) {
        // Keep thumbnail if not changed
        if (!raw.thumbnail) {
          raw.thumbnail = this.projects[idx].thumbnail || '';
        }
        this.projects[idx] = { ...this.projects[idx], ...raw };
      }
    } else {
      raw.thumbnail = raw.thumbnail || '';
      if (this.projects.some(p => p.id === raw.id)) {
        return; // don't overwrite existing
      }
      this.projects.push(raw);
    }

    this.persist();
    this.renderProjectsList();
    
    // Show subtle save indicator
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
      indicator.textContent = '💾 Saved';
      indicator.style.opacity = '1';
      setTimeout(() => {
        indicator.style.opacity = '0';
      }, 1500);
    }
  },

  editProject(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;

    this.currentEditId = id;
    document.getElementById('projId').value = project.id || '';
    document.getElementById('projTitle').value = project.title || '';
    document.getElementById('projSubtitle').value = project.subtitle || '';
    document.getElementById('projCategory').value = project.category || 'other';
    document.getElementById('projDate').value = project.date || '';
    document.getElementById('projTags').value = (project.tags || []).join(', ');
    document.getElementById('projDesc').value = project.longDescription || project.description || '';
    document.getElementById('projLinkDemo').value = project.links?.demo || '';
    document.getElementById('projLinkSource').value = project.links?.source || '';
    document.getElementById('projLinkVideo').value = project.links?.video || '';
    document.getElementById('projThumbnail').value = project.thumbnail || '';

    this.switchTab('add');
  },

  openAddModal() {
    this.currentEditId = null;
    document.getElementById('addProjectForm').reset();
    this.switchTab('add');
  },

  persist() {
    localStorage.setItem('dash_projects', JSON.stringify(this.projects));
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(this.projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('success', 'Exported');
  },

  async bindImportFile() {
    const input = document.getElementById('importFileInput');
    if (input) {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error('Invalid format');
          this.projects = data;
          this.persist();
          this.renderProjectsList();
          alert(`Imported ${data.length} projects!`);
        } catch (err) {
          alert('Import error: ' + err.message);
        }
        input.value = '';
      });
    }
  },

  async importFromGithub() {
    const url = document.getElementById('importGithubUrl').value.trim();
    const result = document.getElementById('importResult');
    if (!url) { this.showToast('error', 'Paste a GitHub repository URL'); return; }

    try {
      const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!repoMatch) throw new Error('Invalid repository URL');
      const [, owner, repo] = repoMatch;

      // Try fetching README.md
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      let description = '';
      let title = repo;

      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        const readmeText = atob(readmeData.content.replace(/\n/g, ''));
        // Extract first H1 or first line as title
        const titleMatch = readmeText.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
        description = readmeText.slice(0, 3000);
      }

      const project = {
        id: repo.replace(/\./g, '-').toLowerCase(),
        title: title,
        subtitle: `GitHub repository by ${owner}`,
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        links: { source: url },
        thumbnail: '',
        tags: ['github', owner],
        downloads: [],
        features: [],
        description: description,
        longDescription: description,
        status: 'active'
      };

      if (!this.projects.some(p => p.id === project.id)) {
        this.projects.push(project);
        this.persist();
        this.renderProjectsList();
        result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Repository imported! Edit it below.</p>`;
        this.switchTab('add');
        this.editProject(project.id);
      } else {
        result.innerHTML = `<p class="dash-alert dash-alert--error">⚠️ Project already exists.</p>`;
      }

      document.getElementById('importGithubUrl').value = '';
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ ${err.message}</p>`;
    }
  },

  async publishToGithub() {
    const token = document.getElementById('githubToken').value.trim();
    const result = document.getElementById('githubResult');

    if (!token) { this.showToast('error', 'Enter your GitHub PAT token'); return; }

    const url = 'https://api.github.com/repos/mozuraa/LazyStudios/contents/meu-portfolio-site/src/data/projects.json';

    // Get current file SHA
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch { /* new file */ }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(this.projects, null, 2))));
    const body = {
      message: 'chore: update projects.json via dashboard',
      content,
      ...(sha ? { sha } : {})
    };

    try {
      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const respData = await putRes.json();
      if (putRes.ok) {
        result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Commit successful! <a href="${respData.content.html_url}" target="_blank">View on GitHub</a></p>`;
        this.showToast('success', 'Changes committed to GitHub');
      } else {
        throw new Error(respData.message || 'Commit failed');
      }
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ ${err.message}</p>`;
      this.showToast('error', 'GitHub commit failed');
    }
  },

  showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `dash-toast dash-toast--${type}`;
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  switchTab(tabName) {
    document.querySelectorAll('.dash-tab').forEach(t => {
      t.classList.toggle('dash-tab--active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const el = document.getElementById('tab-' + tabName);
    if (el) el.style.display = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
  if (sessionStorage.getItem('dash_auth') === '1') {
    Dashboard.checkAuth();
  }
});

export default Dashboard;