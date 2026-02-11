/**
 * CONTENT LOADER
 * Single source of truth content injection system
 * Reads content.json and populates DOM via data-attributes
 * 
 * Architecture:
 * - content.json is the ONLY editable content file
 * - HTML files are structure-only (no hardcoded text)
 * - This loader bridges data to DOM
 */

const ContentLoader = (function() {
  'use strict';

  let content = null;
  let basePath = './';
  let isInitialized = false;

  /**
   * Detect base path based on current URL depth
   */
  function detectBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\/pages\//g) || []).length;
    if (depth > 0 || path.includes('/pages/')) {
      return '../../';
    }
    return './';
  }

  /**
   * Fetch and cache content.json
   */
  async function loadContent(forceRefresh = false) {
    if (content && !forceRefresh) {
      return content;
    }

    basePath = detectBasePath();
    
    try {
      const response = await fetch(`${basePath}assets/content.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      content = await response.json();
      return content;
    } catch (error) {
      console.error('[ContentLoader] Failed to load content.json:', error);
      return null;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Resolve relative URLs based on current page depth
   */
  function resolveUrl(href) {
    if (!href) return '#';
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      return href;
    }
    // Convert absolute paths to relative
    const cleanHref = href.replace(/^\//, '');
    return basePath + cleanHref;
  }

  /**
   * Inject text content into element by data-content attribute
   */
  function injectText(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.textContent = text;
    });
  }

  /**
   * Inject HTML content into element
   */
  function injectHtml(selector, html) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.innerHTML = html;
    });
  }

  /**
   * Render navigation links
   */
  function renderNavigation() {
    if (!content?.navigation) return;

    const navContainer = document.querySelector('[data-content="nav-links"]');
    if (!navContainer) return;

    const currentPath = window.location.pathname;
    
    // Filter out hidden navigation items
    const visibleLinks = content.navigation.filter(link => link.status !== 'hidden');
    
    const html = visibleLinks.map(link => {
      const href = resolveUrl(link.href);
      const isActive = currentPath.includes(link.id) || 
                       (link.id === 'home' && (currentPath === '/' || currentPath.endsWith('index.html') || currentPath === basePath));
      const activeClass = isActive ? ' nav__link--active' : '';
      return `<a href="${href}" class="nav__link${activeClass}" data-nav="${link.id}">${escapeHtml(link.label)}</a>`;
    }).join('');

    navContainer.innerHTML = html;
  }

  /**
   * Render logo
   */
  function renderLogo() {
    if (!content?.site?.logo) return;

    const logoElements = document.querySelectorAll('[data-content="logo"]');
    logoElements.forEach(el => {
      const href = el.getAttribute('href') || resolveUrl('/');
      el.href = href;
      el.innerHTML = `${escapeHtml(content.site.logo.text)}<span>${content.site.logo.highlight}</span>${content.site.logo.suffix}`;
    });
  }

  /**
   * Render hero section
   */
  function renderHero() {
    if (!content?.hero) return;

    injectText('[data-content="hero-eyebrow"]', content.hero.eyebrow);
    injectText('[data-content="hero-title"]', content.hero.title);
    injectText('[data-content="hero-subtitle"]', content.hero.subtitle);
    injectText('[data-content="hero-philosophy"]', content.hero.philosophy);

    // CTA buttons
    const primaryCta = document.querySelector('[data-content="hero-cta-primary"]');
    const secondaryCta = document.querySelector('[data-content="hero-cta-secondary"]');

    if (primaryCta && content.hero.cta?.primary) {
      primaryCta.href = resolveUrl(content.hero.cta.primary.href);
      primaryCta.textContent = content.hero.cta.primary.label;
    }

    if (secondaryCta && content.hero.cta?.secondary) {
      secondaryCta.href = resolveUrl(content.hero.cta.secondary.href);
      secondaryCta.textContent = content.hero.cta.secondary.label;
    }
  }

  /**
   * Render featured projects section header
   */
  function renderFeaturedHeader() {
    if (!content?.sections?.featuredProjects) return;

    injectText('[data-content="featured-eyebrow"]', content.sections.featuredProjects.eyebrow);
    injectText('[data-content="featured-title"]', content.sections.featuredProjects.title);
  }

  /**
   * Render projects page header
   */
  function renderProjectsHeader() {
    if (!content?.sections?.projects) return;

    injectText('[data-content="projects-eyebrow"]', content.sections.projects.eyebrow);
    injectText('[data-content="projects-title"]', content.sections.projects.title);
    injectText('[data-content="projects-description"]', content.sections.projects.description);
  }

  /**
   * Render skills section
   */
  function renderSkills() {
    if (!content?.sections?.skills?.categories) return;

    const container = document.querySelector('[data-content="skills-grid"]');
    if (!container) return;

    const html = content.sections.skills.categories.map((category, index) => {
      const delayClass = index > 0 ? ` reveal--delay-${index}` : '';
      const skillTags = category.items.map(item => 
        `<span class="skill-tag">${escapeHtml(item)}</span>`
      ).join('');

      return `
        <div class="skill-category reveal${delayClass}">
          <h3 class="skill-category__title">${escapeHtml(category.title)}</h3>
          <div class="skill-category__list">${skillTags}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render footer
   */
  function renderFooter() {
    if (!content?.footer) return;

    const linksContainer = document.querySelector('[data-content="footer-links"]');
    if (linksContainer) {
      const html = content.footer.links.map(link => {
        const external = link.external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${link.href}" class="footer__link"${external}>${escapeHtml(link.label)}</a>`;
      }).join('');
      linksContainer.innerHTML = html;
    }

    injectText('[data-content="footer-copyright"]', content.footer.copyright);
  }

  /**
   * Get filtered projects (excludes hidden)
   */
  function getVisibleProjects() {
    if (!content?.projects) return [];
    return content.projects
      .filter(p => p.status !== 'hidden')
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * Get featured projects only
   */
  function getFeaturedProjects() {
    return getVisibleProjects().filter(p => p.featured);
  }

  /**
   * Render project card HTML
   */
  function renderProjectCard(project, options = {}) {
    const { showArrow = true, isFromPages = false } = options;
    const icons = content?.icons || {};
    
    const liveUrlHtml = project.liveUrl 
      ? `<a href="${resolveUrl(project.liveUrl)}" target="_blank" rel="noopener" class="action-btn action-btn--primary">
          <span class="action-btn__icon">${icons.play || ''}</span>
          View Live
        </a>`
      : `<a href="#" class="action-btn action-btn--primary action-btn--disabled" aria-disabled="true" tabindex="-1">
          <span class="action-btn__icon">${icons.play || ''}</span>
          View Live
        </a>`;

    const sourceUrlHtml = project.sourceUrl
      ? `<a href="${project.sourceUrl}" target="_blank" rel="noopener noreferrer" class="action-btn action-btn--external">
          <span class="action-btn__icon">${icons.github || ''}</span>
          View Source
        </a>`
      : '';

    const arrowHtml = showArrow ? `<div class="focus-card__arrow">${icons.arrow || '→'}</div>` : '';
    const statusClass = project.status === 'experimental' ? ' focus-card--experimental' : '';

    return `
      <article class="focus-card reveal${statusClass}" id="${project.id}" data-focus-id="${project.id}" data-project-id="${project.id}" data-status="${project.status}">
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
        ${renderProjectContentTemplate(project)}
      </article>
    `;
  }

  /**
   * Render project section content
   */
  function renderSection(section) {
    let contentHtml = '';

    switch (section.type) {
      case 'list':
        contentHtml = `<ul>${(section.content || []).map(item => `<li>${item}</li>`).join('')}</ul>`;
        if (section.additionalContent) {
          contentHtml += section.additionalContent.map(p => `<p>${p}</p>`).join('');
        }
        break;

      case 'diagram':
        contentHtml = `
          <div class="architecture-diagram">
            <div class="architecture-diagram__title">${escapeHtml(section.diagramTitle || 'Diagram')}</div>
            <div class="architecture-diagram__content">${escapeHtml(section.diagram)}</div>
          </div>
          ${(section.content || []).map(p => `<p>${p}</p>`).join('')}
        `;
        break;

      case 'table':
        const headersHtml = (section.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('');
        const rowsHtml = (section.rows || []).map(row => 
          `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
        contentHtml = `
          <table class="tradeoff-table">
            <thead><tr>${headersHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
        break;

      default:
        contentHtml = (section.content || []).map(p => `<p>${p}</p>`).join('');
        if (section.listContent) {
          contentHtml += `<ul>${section.listContent.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
    }

    return `
      <section class="focus-overlay__section">
        <h3 class="focus-overlay__section-title">${escapeHtml(section.title)}</h3>
        <div class="focus-overlay__section-content">${contentHtml}</div>
      </section>
    `;
  }

  /**
   * Render hidden content template for overlay
   */
  function renderProjectContentTemplate(project) {
    const icons = content?.icons || {};
    
    const liveUrlHtml = project.liveUrl 
      ? `<a href="${resolveUrl(project.liveUrl)}" target="_blank" rel="noopener" class="action-btn action-btn--primary action-btn--large">
          <span class="action-btn__icon">${icons.play || ''}</span>
          View Live Demo
        </a>`
      : `<a href="#" class="action-btn action-btn--primary action-btn--large action-btn--disabled" aria-disabled="true" tabindex="-1">
          <span class="action-btn__icon">${icons.play || ''}</span>
          View Live Demo
        </a>`;

    const sourceUrlHtml = project.sourceUrl
      ? `<a href="${project.sourceUrl}" target="_blank" rel="noopener noreferrer" class="action-btn action-btn--external action-btn--large">
          <span class="action-btn__icon">${icons.github || ''}</span>
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
          <p class="focus-overlay__summary">${project.longDescription}</p>
          <div class="focus-overlay__actions">
            ${liveUrlHtml}
            ${sourceUrlHtml}
          </div>
        </header>
        ${sectionsHtml}
        <div class="focus-overlay__tech-stack">${techStackHtml}</div>
      </template>
    `;
  }

  /**
   * Render projects into a container
   */
  function renderProjects(container, options = {}) {
    if (!container) return;

    const { featuredOnly = false } = options;
    const projects = featuredOnly ? getFeaturedProjects() : getVisibleProjects();
    
    const html = projects.map(project => renderProjectCard(project, options)).join('');
    container.innerHTML = html;

    // Re-observe for reveal animations
    initializeRevealObserver(container);
  }

  /**
   * Initialize reveal observer for dynamically added elements
   */
  function initializeRevealObserver(container) {
    const revealElements = container.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  /**
   * Update page meta tags
   */
  function updateMeta() {
    if (!content?.meta) return;

    // Update title if not already set
    if (document.querySelector('[data-content="page-title"]')) {
      document.title = content.meta.title;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && content.meta.description) {
      metaDesc.setAttribute('content', content.meta.description);
    }
  }

  /**
   * Initialize all content injection
   */
  async function init() {
    if (isInitialized) return content;

    await loadContent();
    if (!content) {
      console.error('[ContentLoader] Content not loaded');
      return null;
    }

    // Render all sections
    renderLogo();
    renderNavigation();
    renderHero();
    renderFeaturedHeader();
    renderProjectsHeader();
    renderSkills();
    renderFooter();
    updateMeta();

    // Render featured projects on homepage
    const featuredGrid = document.querySelector('[data-content="featured-projects"]');
    if (featuredGrid) {
      renderProjects(featuredGrid, { featuredOnly: true });
    }

    // Render all projects on projects page
    const projectsGrid = document.querySelector('[data-content="all-projects"]');
    if (projectsGrid) {
      renderProjects(projectsGrid, { featuredOnly: false });
    }

    isInitialized = true;

    // Dispatch event for other scripts to know content is ready
    window.dispatchEvent(new CustomEvent('contentLoaded', { detail: content }));

    return content;
  }

  // Public API
  return {
    init,
    loadContent,
    getContent: () => content,
    getVisibleProjects,
    getFeaturedProjects,
    renderProjects,
    renderProjectCard,
    resolveUrl,
    escapeHtml
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContentLoader.init());
} else {
  ContentLoader.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentLoader;
}
