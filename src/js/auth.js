/**
 * Authentication + project management dashboard
 * Simple and clean — because less is more
 */
import Utils from './utils.js';

const Dashboard = {
  CREDENTIALS: {
    user: 'admin',
    pass: 'solracleafar1504'
  },
  projects: [],
  currentEditId: null,
  autoSaveTimer: null,

  init() {
    this.bindLogin();
    this.bindTabs();
    this.bindLogout();
    this.bindFormFields();
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

  bindFormFields() {
    const fields = ['projTitle', 'projSubtitle', 'projCategory', 'projDesc', 
                    'projThumbnail', 'projLinkDemo', 'projLinkSource'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      
      el.addEventListener('input', () => {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.autoSave();
        }, 800);
      });
    });
  },

  autoSave() {
    const title = document.getElementById('projTitle').value.trim();
    if (!title) return;

    const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const raw = {
      id,
      title,
      subtitle: document.getElementById('projSubtitle').value.trim(),
      category: document.getElementById('projCategory').value,
      description: document.getElementById('projDesc').value.trim(),
      longDescription: document.getElementById('projDesc').value.trim(),
      thumbnail: document.getElementById('projThumbnail').value.trim(),
      links: {
        demo: document.getElementById('projLinkDemo').value.trim(),
        source: document.getElementById('projLinkSource').value.trim()
      },
      tags: [],
      downloads: [],
      features: [],
      status: 'active',
      date: new Date().toISOString().split('T')[0]
    };

    if (this.currentEditId) {
      const idx = this.projects.findIndex(p => p.id === this.currentEditId);
      if (idx >= 0) {
        if (!raw.thumbnail) raw.thumbnail = this.projects[idx].thumbnail || '';
        this.projects[idx] = { ...this.projects[idx], ...raw };
      }
    } else {
      raw.thumbnail = raw.thumbnail || '';
      if (this.projects.some(p => p.id === raw.id)) return;
      this.projects.push(raw);
      this.currentEditId = raw.id;
    }

    this.persist();
    this.renderProjectsList();
    
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
    const projIdEl = document.getElementById('projId');
    if (projIdEl) projIdEl.value = project.id || '';
    
    document.getElementById('projTitle').value = project.title || '';
    document.getElementById('projSubtitle').value = project.subtitle || '';
    document.getElementById('projCategory').value = project.category || 'other';
    document.getElementById('projDesc').value = project.longDescription || project.description || '';
    document.getElementById('projThumbnail').value = project.thumbnail || '';
    document.getElementById('projLinkDemo').value = project.links?.demo || '';
    document.getElementById('projLinkSource').value = project.links?.source || '';

    this.switchTab('add');
  },

  openAddModal() {
    this.currentEditId = null;
    const form = document.getElementById('addProjectForm');
    if (form) form.reset();
    
    const projIdEl = document.getElementById('projId');
    if (projIdEl) projIdEl.value = '';
    
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

  async publishToGithub() {
    const token = document.getElementById('githubToken').value.trim();
    const result = document.getElementById('githubResult');

    if (!token) { this.showToast('error', 'Enter your GitHub PAT token'); return; }

    const url = 'https://api.github.com/repos/mozuraa/LazyStudios/contents/meu-portfolio-site/src/data/projects.json';

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