/**
 * HTML rendering components
 */
import Utils from './utils.js';

const Renderer = {
  renderProjects(projects, container) {
    if (!container) return;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state fade-in">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__text">No projects found</div>
          <div class="empty-state__sub">Try changing the filters or search query</div>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => this.renderCard(project)).join('');
  },

  renderCard(project) {
    const catIcon = Utils.getCategoryIcon(project.category);
    const catLabel = Utils.getCategoryLabel(project.category);
    const statusClass = `project-card__status--${project.status}`;
    const statusLabel = Utils.getStatusLabel(project.status);

    const thumbnail = project.thumbnail
      ? `<img src="${Utils.escapeHTML(project.thumbnail)}" alt="${Utils.escapeHTML(project.title)}" loading="lazy">`
      : `<div class="project-card__placeholder">${project.title.charAt(0).toUpperCase()}</div>`;

    const tagsHtml = project.tags && project.tags.length > 0
      ? project.tags.map(tag => `<span class="project-card__tag">${Utils.escapeHTML(tag)}</span>`).join('')
      : '';

    return `
      <article class="project-card fade-in" data-id="${Utils.escapeHTML(project.id)}">
        <div class="project-card__image">
          ${thumbnail}
        </div>
        <div class="project-card__body">
          <div class="project-card__category">
            <i class="fa-solid ${catIcon}"></i>
            ${catLabel}
          </div>
          <h3 class="project-card__title">${Utils.escapeHTML(project.title)}</h3>
          <p class="project-card__subtitle">${Utils.escapeHTML(project.subtitle)}</p>
          <div class="project-card__tags">${tagsHtml}</div>
          <div class="project-card__footer">
            <span class="project-card__status ${statusClass}">${statusLabel}</span>
            <span class="project-card__date">${Utils.formatDate(project.date)}</span>
          </div>
        </div>
      </article>
    `;
  },

  renderDetail(project) {
    const catIcon = Utils.getCategoryIcon(project.category);
    const catLabel = Utils.getCategoryLabel(project.category);
    const statusLabel = Utils.getStatusLabel(project.status);

    const thumbnail = project.thumbnail
      ? `<img src="${Utils.escapeHTML(project.thumbnail)}" alt="${Utils.escapeHTML(project.title)}" class="project-detail__image">`
      : '';

    const tagsHtml = project.tags && project.tags.length > 0
      ? project.tags.map(tag => `<span class="project-card__tag">${Utils.escapeHTML(tag)}</span>`).join('')
      : '';

    const descHtml = this.parseMarkdown(project.longDescription || project.description);

    let actionsHtml = '';
    if (project.links.demo) {
      actionsHtml += `<a href="${Utils.escapeHTML(project.links.demo)}" target="_blank" rel="noopener" class="btn btn--primary"><i class="fa-solid fa-rocket"></i> Open Demo</a>`;
    }
    if (project.links.source) {
      actionsHtml += `<a href="${Utils.escapeHTML(project.links.source)}" target="_blank" rel="noopener" class="btn btn--secondary"><i class="fa-brands fa-github"></i> Source Code</a>`;
    }
    if (project.links.video) {
      actionsHtml += `<a href="${Utils.escapeHTML(project.links.video)}" target="_blank" rel="noopener" class="btn btn--secondary"><i class="fa-brands fa-youtube"></i> Watch Video</a>`;
    }

    let downloadsHtml = '';
    if (project.downloads && project.downloads.length > 0) {
      downloadsHtml = `
        <div class="project-detail__section">
          <h4 class="project-detail__section-title"><i class="fa-solid fa-download"></i> Downloads</h4>
          <div class="downloads-list">
            ${project.downloads.map(dl => `
              <div class="download-item">
                <div class="download-item__icon"><i class="fa-solid ${dl.icon ? 'fa-' + dl.icon : 'fa-file'}"></i></div>
                <div class="download-item__info">
                  <span class="download-item__label">${Utils.escapeHTML(dl.label)}</span>
                  ${dl.size ? `<span class="download-item__size">${Utils.escapeHTML(dl.size)}</span>` : ''}
                </div>
                <a href="${Utils.escapeHTML(dl.url)}" class="download-item__link" download><i class="fa-solid fa-download"></i></a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let featuresHtml = '';
    if (project.features && project.features.length > 0) {
      featuresHtml = `
        <div class="project-detail__section">
          <h4 class="project-detail__section-title"><i class="fa-solid fa-star"></i> Features</h4>
          <ul class="features-list">
            ${project.features.map(f => `<li>${Utils.escapeHTML(f)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let tagsSidebarHtml = '';
    if (project.tags && project.tags.length > 0) {
      tagsSidebarHtml = `
        <div class="project-detail__section">
          <h4 class="project-detail__section-title"><i class="fa-solid fa-tags"></i> Technologies</h4>
          <div class="project-card__tags">${tagsHtml}</div>
        </div>
      `;
    }

    return `
      <div class="project-detail project-detail--visible fade-in">
        <button class="project-detail__back" id="backBtn">
          <i class="fa-solid fa-arrow-left"></i> Back
        </button>

        <div class="project-detail__header">
          <div class="project-detail__category">
            <i class="fa-solid ${catIcon}"></i>
            ${catLabel} · <span class="project-card__status project-card__status--${project.status}">${statusLabel}</span>
          </div>
          <h1 class="project-detail__title">${Utils.escapeHTML(project.title)}</h1>
          <p class="project-detail__subtitle">${Utils.escapeHTML(project.subtitle)}</p>
        </div>

        ${thumbnail}

        <div class="project-detail__content">
          <div class="project-detail__description">
            ${descHtml}
          </div>
          <div class="project-detail__sidebar">
            <div class="project-detail__section">
              <h4 class="project-detail__section-title"><i class="fa-solid fa-link"></i> Actions</h4>
              <div class="project-actions">
                ${actionsHtml || '<p style="color: var(--text-muted); font-size: 0.9rem;">No links available</p>'}
              </div>
            </div>
            ${downloadsHtml}
            ${featuresHtml}
            ${tagsSidebarHtml}
            <div class="project-detail__section">
              <h4 class="project-detail__section-title"><i class="fa-solid fa-calendar"></i> Date</h4>
              <p style="font-size: 0.9rem;">${Utils.formatDate(project.date)}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  parseMarkdown(text) {
    if (!text) return '';

    let html = text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  },

  renderCount(count, total, container) {
    if (!container) return;
    container.textContent = `${count} of ${total} projects`;
  }
};

export default Renderer;