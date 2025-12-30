/**
 * RENDERER
 * Generates HTML from data using template patterns
 * Pure JS templating - no external dependencies
 */

const Renderer = (function() {
  'use strict';

  /**
   * Sanitize HTML to prevent XSS (basic)
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Allow specific HTML tags in content
   */
  function sanitizeContent(html) {
    if (!html) return '';
    // Allow basic formatting tags
    return html;
  }

  /**
   * Generate project card HTML
   */
  function renderProjectCard(project, options = {}) {
    const { isFromPages = false, showArrow = true } = options;
    const basePath = isFromPages ? '../' : './';
    
    const liveUrlHtml = project.liveUrl 
      ? `<a href="${basePath}${project.liveUrl.replace(/^\//, '')}" target="_blank" rel="noopener" class="action-btn action-btn--primary">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>
          View Live
        </a>`
      : `<a href="#" class="action-btn action-btn--primary action-btn--disabled" aria-disabled="true" tabindex="-1">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>
          View Live
        </a>`;

    const sourceUrlHtml = project.sourceUrl
      ? `<a href="${project.sourceUrl}" target="_blank" rel="noopener noreferrer" class="action-btn action-btn--external">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></span>
          View Source
        </a>`
      : '';

    const arrowHtml = showArrow ? '<div class="focus-card__arrow">→</div>' : '';

    return `
      <article class="focus-card reveal" id="${project.id}" data-focus-id="${project.id}" data-project-id="${project.id}">
        <div class="focus-card__preview">
          <div class="focus-card__preview-visual">
            <canvas data-preview="${project.previewType || 'grid'}"></canvas>
          </div>
        </div>
        <div class="focus-card__body">
          <span class="focus-card__tag">${escapeHtml(project.techStackShort)}</span>
          <h2 class="focus-card__title">${escapeHtml(project.title)}</h2>
          <p class="focus-card__description">${escapeHtml(project.shortDescription)}</p>
          <div class="focus-card__meta">
            <span class="focus-card__meta-item">Timeline: <span>${escapeHtml(project.timeline)}</span></span>
            <span class="focus-card__meta-item">Role: <span>${escapeHtml(project.role)}</span></span>
          </div>
          <div class="focus-card__actions">
            ${liveUrlHtml}
            ${sourceUrlHtml}
          </div>
        </div>
        ${arrowHtml}
        ${renderProjectContentTemplate(project, isFromPages)}
      </article>
    `;
  }

  /**
   * Generate hidden content template for overlay
   */
  function renderProjectContentTemplate(project, isFromPages = false) {
    const basePath = isFromPages ? '../' : './';
    
    const liveUrlHtml = project.liveUrl 
      ? `<a href="${basePath}${project.liveUrl.replace(/^\//, '')}" target="_blank" rel="noopener" class="action-btn action-btn--primary action-btn--large">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>
          View Live Demo
        </a>`
      : `<a href="#" class="action-btn action-btn--primary action-btn--large action-btn--disabled" aria-disabled="true" tabindex="-1">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>
          View Live Demo
        </a>`;

    const sourceUrlHtml = project.sourceUrl
      ? `<a href="${project.sourceUrl}" target="_blank" rel="noopener noreferrer" class="action-btn action-btn--external action-btn--large">
          <span class="action-btn__icon"><svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></span>
          View Source on GitHub
        </a>`
      : '';

    const sectionsHtml = (project.sections || []).map(section => renderSection(section)).join('');

    const techStackHtml = (project.techStack || [])
      .map(tech => `<span class="tech-stack__item">${escapeHtml(tech)}</span>`)
      .join('');

    return `
      <template class="focus-card__content-template">
        <header class="focus-overlay__header">
          <div class="focus-overlay__meta">
            <div class="focus-overlay__meta-item">
              <span class="focus-overlay__meta-label">Timeline</span>
              <span class="focus-overlay__meta-value">${escapeHtml(project.timeline)}</span>
            </div>
            <div class="focus-overlay__meta-item">
              <span class="focus-overlay__meta-label">Role</span>
              <span class="focus-overlay__meta-value">${escapeHtml(project.role)}</span>
            </div>
            <div class="focus-overlay__meta-item">
              <span class="focus-overlay__meta-label">Stack</span>
              <span class="focus-overlay__meta-value">${escapeHtml(project.techStackShort)}</span>
            </div>
          </div>
          <h2 class="focus-overlay__title">${escapeHtml(project.title)}</h2>
          <p class="focus-overlay__summary">${sanitizeContent(project.longDescription)}</p>
          <div class="focus-overlay__actions">
            ${liveUrlHtml}
            ${sourceUrlHtml}
          </div>
        </header>
        ${sectionsHtml}
        <div class="focus-overlay__tech-stack">
          ${techStackHtml}
        </div>
      </template>
    `;
  }

  /**
   * Render a single section
   */
  function renderSection(section) {
    let contentHtml = '';

    switch (section.type) {
      case 'list':
        contentHtml = `<ul>${(section.content || []).map(item => `<li>${sanitizeContent(item)}</li>`).join('')}</ul>`;
        if (section.additionalContent) {
          contentHtml += section.additionalContent.map(p => `<p>${sanitizeContent(p)}</p>`).join('');
        }
        break;

      case 'diagram':
        contentHtml = `
          <div class="architecture-diagram">
            <div class="architecture-diagram__title">${escapeHtml(section.diagramTitle || 'Diagram')}</div>
            <div class="architecture-diagram__content">${escapeHtml(section.diagram)}</div>
          </div>
          ${(section.content || []).map(p => `<p>${sanitizeContent(p)}</p>`).join('')}
        `;
        break;

      case 'table':
        const headersHtml = (section.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('');
        const rowsHtml = (section.rows || []).map(row => 
          `<tr>${row.map(cell => `<td>${sanitizeContent(cell)}</td>`).join('')}</tr>`
        ).join('');
        contentHtml = `
          <table class="tradeoff-table">
            <thead><tr>${headersHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
        break;

      default:
        contentHtml = (section.content || []).map(p => `<p>${sanitizeContent(p)}</p>`).join('');
        if (section.listContent) {
          contentHtml += `<ul>${section.listContent.map(item => `<li>${sanitizeContent(item)}</li>`).join('')}</ul>`;
        }
    }

    return `
      <section class="focus-overlay__section">
        <h3 class="focus-overlay__section-title">${escapeHtml(section.title)}</h3>
        <div class="focus-overlay__section-content">
          ${contentHtml}
        </div>
      </section>
    `;
  }

  /**
   * Render all project cards into a container
   */
  function renderProjectCards(projects, container, options = {}) {
    if (!container) return;
    
    const html = projects.map(project => renderProjectCard(project, options)).join('');
    container.innerHTML = html;

    // Initialize preview canvases
    initializePreviewCanvases(container);
    
    // Trigger reveal animations
    requestAnimationFrame(() => {
      container.querySelectorAll('.focus-card').forEach((card, index) => {
        card.classList.add('reveal');
        if (index > 0) {
          card.classList.add(`reveal--delay-${Math.min(index, 3)}`);
        }
      });
    });
  }

  /**
   * Initialize canvas preview animations
   */
  function initializePreviewCanvases(container) {
    container.querySelectorAll('[data-preview]').forEach(canvas => {
      if (typeof initProjectPreview === 'function') {
        initProjectPreview(canvas, canvas.dataset.preview);
      }
    });
  }

  /**
   * Render navigation
   */
  function renderNavigation(config, currentPage = '') {
    const isFromPages = window.location.pathname.includes('/pages/');
    const basePath = isFromPages ? '../' : './';
    
    const linksHtml = config.navigation.links.map(link => {
      const href = link.href.startsWith('http') ? link.href : basePath + link.href;
      const isActive = currentPage === link.id || 
        (link.href === 'index.html' && (currentPage === 'home' || currentPage === ''));
      
      return `<a href="${href}" class="nav__link ${isActive ? 'nav__link--active' : ''}">${escapeHtml(link.label)}</a>`;
    }).join('');

    return `
      <nav class="nav">
        <div class="nav__inner">
          <a href="${basePath}index.html" class="nav__logo">${config.navigation.logo.text}<span>${config.navigation.logo.highlight}</span>${config.navigation.logo.suffix}</a>
          <button class="nav__toggle" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="nav__links">
            ${linksHtml}
          </div>
        </div>
      </nav>
    `;
  }

  /**
   * Render footer
   */
  function renderFooter(config) {
    const linksHtml = config.footer.links.map(link => {
      const target = link.external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${link.href}" class="footer__link"${target}>${escapeHtml(link.label)}</a>`;
    }).join('');

    return `
      <footer class="footer">
        <div class="container">
          <div class="footer__inner">
            <div class="footer__links">
              ${linksHtml}
            </div>
            <p class="footer__copyright">${escapeHtml(config.footer.copyright)}</p>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Render project page header section
   */
  function renderProjectsPageHeader(config) {
    const sections = config.sections.projects;
    return `
      <header class="section-header reveal">
        <span class="section-header__eyebrow">${escapeHtml(sections.eyebrow)}</span>
        <h1 class="section-header__title">${escapeHtml(sections.title)}</h1>
        <p class="section-header__description">${sanitizeContent(sections.description)}</p>
      </header>
    `;
  }

  /**
   * Render featured projects header
   */
  function renderFeaturedHeader(config) {
    const sections = config.sections.featuredProjects;
    return `
      <div class="featured-projects__header reveal">
        <span class="featured-projects__eyebrow">${escapeHtml(sections.eyebrow)}</span>
        <h2 class="featured-projects__title">${escapeHtml(sections.title)}</h2>
      </div>
    `;
  }

  // Public API
  return {
    renderProjectCard,
    renderProjectCards,
    renderProjectContentTemplate,
    renderSection,
    renderNavigation,
    renderFooter,
    renderProjectsPageHeader,
    renderFeaturedHeader,
    escapeHtml,
    sanitizeContent
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
