/**
 * Sistema de autenticação e Dashboard de gestão de projetos
 */
import Utils from './utils.js';

const Dashboard = {
  CREDENTIALS: {
    user: 'admin',
    pass: 'solracleafar1504'
  },
  projects: [],
  currentEditId: null,

  /**
   * Inicializar
   */
  init() {
    this.bindLogin();
    this.bindTabs();
    this.bindLogout();
    this.bindAddProjectForm();
    this.bindZipUpload();
    this.bindImportFile();
  },

  /* =============================================
     AUTENTICAÇÃO
     ============================================= */
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
      alert.textContent = 'Credenciais inválidas. Tenta novamente.';
    }
  },

  logout() {
    sessionStorage.removeItem('dash_auth');
    document.getElementById('loginPage').style.display = '';
    document.getElementById('dashboardPage').style.display = 'none';
  },

  bindLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', () => this.logout());
  },

  showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = '';
    this.loadProjects();
  },

  checkAuth() {
    if (sessionStorage.getItem('dash_auth') !== '1') {
      document.getElementById('loginPage').style.display = '';
      document.getElementById('dashboardPage').style.display = 'none';
      return false;
    }
    this.showDashboard();
    return true;
  },

  /* =============================================
     TABS
     ============================================= */
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

  /* =============================================
     PROJETOS — LISTAR / CARREGAR
     ============================================= */
  async loadProjects() {
    try {
      // Tenta carregar do projects.json
      const res = await fetch('src/data/projects.json?t=' + Date.now());
      if (res.ok) {
        this.projects = await res.json();
      } else {
        throw new Error('fetch failed');
      }
    } catch {
      // fallback para localStorage
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
          <p>Nenhum projeto. Adiciona o primeiro!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.projects.map(p => `
      <div class="dash-project-card">
        <div class="info">
          <h3>${Utils.escapeHTML(p.title)}</h3>
          <p>${Utils.escapeHTML(p.subtitle || p.id)} · ${Utils.getCategoryLabel(p.category)}</p>
        </div>
        <div class="actions">
          <button class="dash-btn dash-btn--ghost" onclick="Dashboard.editProject('${Utils.escapeHTML(p.id)}')">✏️</button>
          <button class="dash-btn dash-btn--danger" onclick="Dashboard.deleteProject('${Utils.escapeHTML(p.id)}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  /* =============================================
     ADICIONAR / EDITAR PROJETO (FORMULÁRIO)
     ============================================= */
  bindAddProjectForm() {
    const form = document.getElementById('addProjectForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProjectFromForm();
      });
    }
  },

  openAddModal() {
    this.currentEditId = null;
    document.getElementById('addProjectForm').reset();
    document.getElementById('downloadsContainer').innerHTML = '';
    this.addDownloadField(); // campo vazio por defeito
    this.switchTab('add');
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

    // Downloads
    const dc = document.getElementById('downloadsContainer');
    dc.innerHTML = '';
    (project.downloads || []).forEach(dl => this.addDownloadField(dl));

    // Features
    document.getElementById('projFeatures').value = (project.features || []).join('\n');

    this.switchTab('add');
  },

  deleteProject(id) {
    if (!confirm(`Eliminar projeto "${id}"?`)) return;
    this.projects = this.projects.filter(p => p.id !== id);
    this.persist();
    this.renderProjectsList();
  },

  saveProjectFromForm() {
    const raw = {
      id: document.getElementById('projId').value.trim(),
      title: document.getElementById('projTitle').value.trim(),
      subtitle: document.getElementById('projSubtitle').value.trim(),
      category: document.getElementById('projCategory').value,
      date: document.getElementById('projDate').value || new Date().toISOString().split('T')[0],
      tags: document.getElementById('projTags').value.split(',').map(t => t.trim()).filter(Boolean),
      links: {
        demo: document.getElementById('projLinkDemo').value.trim(),
        source: document.getElementById('projLinkSource').value.trim(),
        video: document.getElementById('projLinkVideo').value.trim()
      },
      downloads: this.collectDownloads(),
      features: document.getElementById('projFeatures').value.split('\n').map(l => l.trim()).filter(Boolean),
      description: document.getElementById('projDesc').value.trim(),
      longDescription: document.getElementById('projDesc').value.trim()
    };

    if (!raw.id || !raw.title) {
      alert('ID e Título são obrigatórios.');
      return;
    }

    if (this.currentEditId) {
      const idx = this.projects.findIndex(p => p.id === this.currentEditId);
      if (idx >= 0) {
        // Manter thumbnail existente se não for substituído
        raw.thumbnail = this.projects[idx].thumbnail;
        raw.status = this.projects[idx].status || 'active';
        this.projects[idx] = { ...this.projects[idx], ...raw };
      }
    } else {
      raw.thumbnail = '';
      raw.status = 'active';
      if (this.projects.some(p => p.id === raw.id)) {
        alert(`Já existe um projeto com o ID "${raw.id}". Usa outro ID.`);
        return;
      }
      this.projects.push(raw);
    }

    this.persist();
    this.renderProjectsList();
    document.getElementById('addProjectForm').reset();
    document.getElementById('downloadsContainer').innerHTML = '';
    this.addDownloadField();
    this.switchTab('projects');
  },

  addDownloadField(data = null) {
    const container = document.getElementById('downloadsContainer');
    const div = document.createElement('div');
    div.className = 'dash-row';
    div.style.marginBottom = '0.5rem';
    div.innerHTML = `
      <input type="text" placeholder="Label (ex: APK)" value="${data?.label || ''}" class="dl-label" style="flex:1;background:var(--dash-bg);border:1px solid var(--dash-border);border-radius:0.375rem;padding:0.5rem;color:var(--dash-text);">
      <input type="text" placeholder="URL (ex: /downloads/apps/file.apk)" value="${data?.url || ''}" class="dl-url" style="flex:2;background:var(--dash-bg);border:1px solid var(--dash-border);border-radius:0.375rem;padding:0.5rem;color:var(--dash-text);">
      <input type="text" placeholder="Tamanho (ex: 4.2 MB)" value="${data?.size || ''}" class="dl-size" style="flex:1;background:var(--dash-bg);border:1px solid var(--dash-border);border-radius:0.375rem;padding:0.5rem;color:var(--dash-text);">
      <button type="button" class="dash-btn dash-btn--danger" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
  },

  collectDownloads() {
    const rows = document.querySelectorAll('#downloadsContainer .dash-row');
    const downloads = [];
    rows.forEach(row => {
      const label = row.querySelector('.dl-label')?.value.trim();
      const url = row.querySelector('.dl-url')?.value.trim();
      const size = row.querySelector('.dl-size')?.value.trim();
      if (label && url) {
        downloads.push({ label, url, size: size || undefined });
      }
    });
    return downloads;
  },

  /* =============================================
     PERSISTÊNCIA (localStorage + download JSON)
     ============================================= */
  persist() {
    localStorage.setItem('dash_projects', JSON.stringify(this.projects));
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(this.projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
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
          if (!Array.isArray(data)) throw new Error('Formato inválido');
          this.projects = data;
          this.persist();
          this.renderProjectsList();
          alert(`Importados ${data.length} projetos com sucesso!`);
        } catch (err) {
          alert('Erro ao importar: ' + err.message);
        }
        input.value = '';
      });
    }
  },

  /* =============================================
     IMPORTAR ZIP
     ============================================= */
  bindZipUpload() {
    const zone = document.getElementById('zipDropZone');
    const input = document.getElementById('zipFileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.processZip(file);
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.processZip(file);
      input.value = '';
    });
  },

  async processZip(file) {
    const progress = document.getElementById('zipProgress');
    const result = document.getElementById('zipResult');
    progress.style.display = '';
    result.innerHTML = '';

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await this.unzip(arrayBuffer);

      let imported = 0;
      for (const [name, content] of Object.entries(zip.files)) {
        // Ignora pastas vazias e ficheiros ocultos
        if (name.endsWith('/') || name.startsWith('.') || name.endsWith('.DS_Store')) continue;

        const parts = name.split('/');
        const projectDir = parts[1]; // ex: "meu-app/thumbnail.png"
        if (!projectDir || parts.length < 3) continue;

        const projectId = projectDir;
        let project = this.projects.find(p => p.id === projectId);

        const fileName = parts[parts.length - 1];

        if (!project) {
          // Verifica se existe info.json
          const infoKey = Object.keys(zip.files).find(k =>
            k.split('/').slice(0, 2).join('/') === `${parts[0]}/${projectDir}` &&
            k.endsWith('info.json')
          );

          if (infoKey) {
            try {
              const infoText = await zip.files[infoKey].async('text');
              const info = JSON.parse(infoText);
              project = {
                id: info.id || projectId,
                title: info.title || projectId,
                subtitle: info.subtitle || '',
                category: info.category || 'other',
                tags: info.tags || [],
                status: info.status || 'active',
                links: info.links || {},
                downloads: info.downloads || [],
                features: info.features || [],
                description: info.description || '',
                longDescription: info.longDescription || '',
                date: info.date || new Date().toISOString().split('T')[0]
              };
            } catch {
              project = this.createPlaceholderProject(projectId, fileName);
            }
          } else {
            project = this.createPlaceholderProject(projectId, fileName);
          }

          this.projects.push(project);
        }

        // Se for thumbnail dentro da pasta do projecto, guardar referência
        if (fileName === 'thumbnail.png' || fileName === 'thumbnail.jpg' || fileName === 'thumbnail.jpeg') {
          project.thumbnail = `public/images/projects/${projectId}-${fileName}`;
        }

        imported++;
      }

      this.persist();
      this.renderProjectsList();
      result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Importados ${imported} ficheiros de ${file.name}. Verifica os projetos na lista.</p>`;
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ Erro: ${err.message}</p>`;
    } finally {
      progress.style.display = 'none';
    }
  },

  async unzip(arrayBuffer) {
    // Parser ZIP simples usando a biblioteca integrada no browser (minimal)
    // Como não temos biblioteca externa, usamos um parser mínimo
    // Para produção, seria melhor usar JSZip via CDN, mas aqui fazemos fetch dinâmico

    // Carrega JSZip do CDN se não estiver disponível
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const zip = await window.JSZip.loadAsync(arrayBuffer);
    return { files: zip.files };
  },

  createPlaceholderProject(id, hintFile) {
    return {
      id,
      title: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subtitle: `Importado de ${hintFile || 'ZIP'}`,
      category: 'other',
      tags: ['importado'],
      date: new Date().toISOString().split('T')[0],
      links: {},
      downloads: [],
      features: [],
      description: '',
      longDescription: '',
      status: 'active'
    };
  },

  /* =============================================
     IMPORTAR DE URL (JSON)
     ============================================= */
  async importFromUrl() {
    const url = document.getElementById('importJsonUrl').value.trim();
    const result = document.getElementById('importResult');
    if (!url) { alert('Cola a URL do JSON'); return; }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let projects = [];
      if (Array.isArray(data)) {
        projects = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        projects = data.projects;
      } else {
        projects = [data];
      }

      // Validar e adicionar
      const valid = projects.filter(p => p.id && p.title);
      if (valid.length === 0) throw new Error('Nenhum projecto válido encontrado no JSON');

      valid.forEach(p => {
        if (!this.projects.some(ep => ep.id === p.id)) {
          p.status = p.status || 'active';
          this.projects.push(p);
        }
      });

      this.persist();
      this.renderProjectsList();
      result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Importados ${valid.length} projetos!</p>`;
      document.getElementById('importJsonUrl').value = '';
      this.switchTab('projects');
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ ${err.message}</p>`;
    }
  },

  /* =============================================
     IMPORTAR DE REPO GITHUB (README/info)
     ============================================= */
  async importFromGithub() {
    const url = document.getElementById('importGithubUrl').value.trim();
    const result = document.getElementById('importResult');
    if (!url) { alert('Cola a URL do repositório GitHub'); return; }

    try {
      const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!repoMatch) throw new Error('URL de repositório inválida');
      const [, owner, repo] = repoMatch;

      // Tentar buscar README.md
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      let description = '';

      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        const readmeText = atob(readmeData.content.replace(/\n/g, ''));
        description = readmeText.slice(0, 3000);
      }

      const project = {
        id: repo.replace(/\./g, '-').toLowerCase(),
        title: repo,
        subtitle: `Repo de ${owner}`,
        category: 'other',
        tags: [`github`, owner],
        date: new Date().toISOString().split('T')[0],
        links: {
          source: url
        },
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
        result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Repositório "${repo}" importado! Edita no separador Projetos.</p>`;
        this.switchTab('projects');
      } else {
        result.innerHTML = `<p class="dash-alert dash-alert--error">⚠️ Projeto "${repo}" já existe.</p>`;
      }

      document.getElementById('importGithubUrl').value = '';
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ ${err.message}</p>`;
    }
  },

  /* =============================================
     GITHUB API — COMMIT DIRECTO
     ============================================= */
  async publishToGithub() {
    const token = document.getElementById('githubToken').value.trim();
    const result = document.getElementById('githubResult');

    if (!token) { alert('Introduz o GitHub PAT token'); return; }

    const url = 'https://api.github.com/repos/mozuraa/LazyStudios/contents/meu-portfolio-site/src/data/projects.json';

    // Buscar SHA actual do ficheiro
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch { /* ficheiro novo */ }

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
        result.innerHTML = `<p class="dash-alert dash-alert--success">✅ Commit feito com sucesso! <a href="${respData.content.html_url}" target="_blank">Ver no GitHub</a></p>`;
      } else {
        throw new Error(respData.message || 'Erro no commit');
      }
    } catch (err) {
      result.innerHTML = `<p class="dash-alert dash-alert--error">❌ ${err.message}</p>`;
    }
  },

  /* =============================================
     HELPERS
     ============================================= */
  switchTab(tabName) {
    document.querySelectorAll('.dash-tab').forEach(t => {
      t.classList.toggle('dash-tab--active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const el = document.getElementById('tab-' + tabName);
    if (el) el.style.display = '';
  }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
  // Verifica auth se já havia sessão
  if (sessionStorage.getItem('dash_auth') === '1') {
    Dashboard.checkAuth();
  }
});

export default Dashboard;