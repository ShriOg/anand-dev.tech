/**
 * ═══════════════════════════════════════════════════════════
 * PROFESSIONAL SPACE - AI ASSISTANT MODULE
 * Portfolio optimization, recruiter-focused AI tools
 * ═══════════════════════════════════════════════════════════
 */

const AIAssistant = {
  isOpen: false,
  currentProject: null,
  activeTab: 'analyze',
  
  // AI Provider - Uses Gemini API (free tier)
  API_KEY_STORAGE: 'pro_ai_api_key',
  apiKey: null,
  
  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  init() {
    this.loadApiKey();
    this.bindEvents();
    this.injectPanelHTML();
  },
  
  loadApiKey() {
    this.apiKey = localStorage.getItem(this.API_KEY_STORAGE) || null;
  },
  
  saveApiKey(key) {
    this.apiKey = key;
    localStorage.setItem(this.API_KEY_STORAGE, key);
  },
  
  // ═══════════════════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════════════════
  bindEvents() {
    // AI Panel toggle
    document.getElementById('aiPanelToggle')?.addEventListener('click', () => this.togglePanel());
    document.getElementById('aiPanelClose')?.addEventListener('click', () => this.closePanel());
    
    // Tab switching
    document.querySelectorAll('.ai-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // API Key setup
    document.getElementById('aiSaveApiKey')?.addEventListener('click', () => this.handleSaveApiKey());
  },
  
  // ═══════════════════════════════════════════════════════════
  // PANEL MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  injectPanelHTML() {
    // Panel is already in HTML
  },
  
  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  },
  
  openPanel() {
    this.isOpen = true;
    document.getElementById('aiPanel')?.classList.add('open');
    document.querySelector('.pro-main')?.classList.add('ai-panel-open');
    
    if (!this.apiKey) {
      this.showApiKeySetup();
    } else {
      this.loadPanelContent();
    }
  },
  
  closePanel() {
    this.isOpen = false;
    document.getElementById('aiPanel')?.classList.remove('open');
    document.querySelector('.pro-main')?.classList.remove('ai-panel-open');
  },
  
  switchTab(tabName) {
    this.activeTab = tabName;
    
    document.querySelectorAll('.ai-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.ai-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `ai-content-${tabName}`);
    });
    
    this.loadTabContent(tabName);
  },
  
  // ═══════════════════════════════════════════════════════════
  // API KEY MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  showApiKeySetup() {
    document.getElementById('aiSetupView').style.display = 'block';
    document.getElementById('aiMainView').style.display = 'none';
  },
  
  hideApiKeySetup() {
    document.getElementById('aiSetupView').style.display = 'none';
    document.getElementById('aiMainView').style.display = 'block';
  },
  
  handleSaveApiKey() {
    const input = document.getElementById('aiApiKeyInput');
    const key = input?.value.trim();
    
    if (key && key.length > 10) {
      this.saveApiKey(key);
      this.hideApiKeySetup();
      this.loadPanelContent();
      this.toast('API key saved');
    } else {
      this.toast('Invalid API key', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // CONTENT LOADING
  // ═══════════════════════════════════════════════════════════
  loadPanelContent() {
    this.hideApiKeySetup();
    this.loadTabContent(this.activeTab);
  },
  
  loadTabContent(tab) {
    switch(tab) {
      case 'analyze':
        this.loadPortfolioAnalysis();
        break;
      case 'seo':
        this.loadSEOAnalysis();
        break;
      case 'recruiter':
        this.loadRecruiterView();
        break;
      case 'skills':
        this.loadSkillsMap();
        break;
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // PORTFOLIO ANALYSIS
  // ═══════════════════════════════════════════════════════════
  async loadPortfolioAnalysis() {
    const container = document.getElementById('ai-content-analyze');
    if (!container) return;
    
    const projects = ProApp.projects || [];
    
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="ai-empty">
          <p>No projects to analyze</p>
          <span>Add projects to get AI insights</span>
        </div>
      `;
      return;
    }
    
    // Calculate portfolio metrics
    const metrics = this.calculatePortfolioMetrics(projects);
    
    container.innerHTML = `
      <div class="ai-metrics-grid">
        <div class="ai-metric">
          <span class="ai-metric-value">${projects.length}</span>
          <span class="ai-metric-label">Total Projects</span>
        </div>
        <div class="ai-metric">
          <span class="ai-metric-value">${metrics.published}</span>
          <span class="ai-metric-label">Published</span>
        </div>
        <div class="ai-metric">
          <span class="ai-metric-value">${metrics.avgScore}</span>
          <span class="ai-metric-label">Avg Impact</span>
        </div>
        <div class="ai-metric">
          <span class="ai-metric-value">${metrics.techCount}</span>
          <span class="ai-metric-label">Technologies</span>
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Project Impact Scores</h4>
        <div class="ai-project-scores">
          ${projects.map(p => this.renderProjectScore(p)).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Recommendations</h4>
        <div class="ai-recommendations">
          ${this.generateRecommendations(projects, metrics)}
        </div>
      </div>
      
      <div class="ai-actions">
        <button class="ai-btn ai-btn-primary" onclick="AIAssistant.analyzeAllProjects()">
          Run Full Analysis
        </button>
      </div>
    `;
  },
  
  calculatePortfolioMetrics(projects) {
    const published = projects.filter(p => p.status === 'published').length;
    const techSet = new Set();
    projects.forEach(p => (p.tech || []).forEach(t => techSet.add(t)));
    
    const scores = projects.map(p => this.calculateImpactScore(p));
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    return { published, techCount: techSet.size, avgScore, techSet: Array.from(techSet) };
  },
  
  calculateImpactScore(project) {
    let score = 50; // Base score
    
    // Technical depth (has tech stack)
    if (project.tech && project.tech.length > 0) score += project.tech.length * 3;
    
    // Description quality
    const desc = project.description || '';
    if (desc.length > 50) score += 10;
    if (desc.length > 150) score += 10;
    
    // Has URLs
    if (project.liveUrl) score += 10;
    if (project.githubUrl) score += 10;
    
    // Status
    if (project.status === 'published') score += 10;
    
    return Math.min(100, score);
  },
  
  renderProjectScore(project) {
    const score = this.calculateImpactScore(project);
    const scoreClass = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
    
    return `
      <div class="ai-project-score-item">
        <div class="ai-project-score-info">
          <span class="ai-project-score-title">${this.escapeHtml(project.title || 'Untitled')}</span>
          <span class="ai-project-score-status ${project.status || 'draft'}">${project.status || 'draft'}</span>
        </div>
        <div class="ai-project-score-bar">
          <div class="ai-project-score-fill ${scoreClass}" style="width: ${score}%"></div>
        </div>
        <span class="ai-project-score-value ${scoreClass}">${score}</span>
        <button class="ai-btn-icon" onclick="AIAssistant.openProjectAI('${project.id}')" title="AI Tools">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </button>
      </div>
    `;
  },
  
  generateRecommendations(projects, metrics) {
    const recs = [];
    
    if (metrics.published < projects.length / 2) {
      recs.push({ type: 'warning', text: 'Consider publishing more projects to showcase your work' });
    }
    
    if (metrics.techCount < 5) {
      recs.push({ type: 'info', text: 'Add more technologies to demonstrate versatility' });
    }
    
    if (metrics.avgScore < 60) {
      recs.push({ type: 'warning', text: 'Improve project descriptions for better impact scores' });
    }
    
    const lowScoreProjects = projects.filter(p => this.calculateImpactScore(p) < 50);
    if (lowScoreProjects.length > 0) {
      recs.push({ type: 'action', text: `${lowScoreProjects.length} project(s) need improvement` });
    }
    
    if (recs.length === 0) {
      recs.push({ type: 'success', text: 'Portfolio is well-optimized' });
    }
    
    return recs.map(r => `
      <div class="ai-recommendation ${r.type}">
        <span class="ai-rec-indicator"></span>
        <span>${r.text}</span>
      </div>
    `).join('');
  },
  
  // ═══════════════════════════════════════════════════════════
  // SEO ANALYSIS
  // ═══════════════════════════════════════════════════════════
  async loadSEOAnalysis() {
    const container = document.getElementById('ai-content-seo');
    if (!container) return;
    
    const projects = ProApp.projects || [];
    
    if (projects.length === 0) {
      container.innerHTML = `<div class="ai-empty"><p>No projects to analyze</p></div>`;
      return;
    }
    
    const seoData = this.analyzeSEO(projects);
    
    container.innerHTML = `
      <div class="ai-section">
        <h4 class="ai-section-title">Keyword Density</h4>
        <div class="ai-keyword-list">
          ${seoData.keywords.slice(0, 10).map(k => `
            <div class="ai-keyword-item">
              <span class="ai-keyword-text">${k.word}</span>
              <span class="ai-keyword-count">${k.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Readability Scores</h4>
        <div class="ai-readability-list">
          ${projects.map(p => {
            const readability = this.calculateReadability(p.description || '');
            return `
              <div class="ai-readability-item">
                <span>${this.escapeHtml(p.title || 'Untitled')}</span>
                <span class="ai-readability-score ${readability.level}">${readability.score}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Missing Keywords</h4>
        <div class="ai-suggestions">
          ${seoData.missingKeywords.map(k => `<span class="ai-tag">${k}</span>`).join('')}
        </div>
        <p class="ai-hint">Consider adding these terms to improve discoverability</p>
      </div>
      
      <div class="ai-actions">
        <button class="ai-btn ai-btn-primary" onclick="AIAssistant.runSEOOptimization()">
          Generate SEO Suggestions
        </button>
      </div>
    `;
  },
  
  analyzeSEO(projects) {
    const wordCounts = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'as', 'was', 'that', 'this', 'from']);
    
    projects.forEach(p => {
      const text = `${p.title || ''} ${p.description || ''} ${(p.tech || []).join(' ')}`.toLowerCase();
      const words = text.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    const keywords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
    
    const techKeywords = ['python', 'javascript', 'react', 'node', 'api', 'database', 'machine', 'learning', 'cloud', 'aws', 'docker', 'kubernetes'];
    const presentKeywords = new Set(keywords.map(k => k.word));
    const missingKeywords = techKeywords.filter(k => !presentKeywords.has(k));
    
    return { keywords, missingKeywords };
  },
  
  calculateReadability(text) {
    if (!text || text.length < 10) return { score: 0, level: 'low' };
    
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length || 1;
    const avgWordsPerSentence = words / sentences;
    
    let score = 100;
    if (avgWordsPerSentence > 25) score -= 30;
    else if (avgWordsPerSentence > 20) score -= 15;
    
    if (words < 20) score -= 20;
    if (words > 200) score -= 10;
    
    score = Math.max(0, Math.min(100, score));
    const level = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
    
    return { score, level };
  },
  
  // ═══════════════════════════════════════════════════════════
  // RECRUITER VIEW
  // ═══════════════════════════════════════════════════════════
  async loadRecruiterView() {
    const container = document.getElementById('ai-content-recruiter');
    if (!container) return;
    
    const projects = ProApp.projects || [];
    
    if (projects.length === 0) {
      container.innerHTML = `<div class="ai-empty"><p>No projects to analyze</p></div>`;
      return;
    }
    
    container.innerHTML = `
      <div class="ai-section">
        <h4 class="ai-section-title">First Impression Analysis</h4>
        <p class="ai-description">Simulating a 30-second recruiter skim-pass</p>
        
        <div class="ai-recruiter-analysis">
          ${projects.slice(0, 5).map(p => this.renderRecruiterView(p)).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Suggested Order</h4>
        <p class="ai-description">Optimal project display order for recruiter engagement</p>
        <div class="ai-order-list">
          ${this.getSuggestedOrder(projects).map((p, i) => `
            <div class="ai-order-item">
              <span class="ai-order-num">${i + 1}</span>
              <span class="ai-order-title">${this.escapeHtml(p.title || 'Untitled')}</span>
              <span class="ai-order-reason">${p.reason}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="ai-actions">
        <button class="ai-btn ai-btn-primary" onclick="AIAssistant.runRecruiterAnalysis()">
          Run Deep Analysis
        </button>
      </div>
    `;
  },
  
  renderRecruiterView(project) {
    const insights = this.getRecruiterInsights(project);
    
    return `
      <div class="ai-recruiter-project">
        <div class="ai-recruiter-header">
          <span class="ai-recruiter-title">${this.escapeHtml(project.title || 'Untitled')}</span>
          <span class="ai-recruiter-clarity ${insights.clarity}">${insights.clarityLabel}</span>
        </div>
        <div class="ai-recruiter-insights">
          ${insights.willRead.length ? `<p class="ai-insight-read">Will read: ${insights.willRead.join(', ')}</p>` : ''}
          ${insights.willSkip.length ? `<p class="ai-insight-skip">May skip: ${insights.willSkip.join(', ')}</p>` : ''}
        </div>
        ${insights.suggestion ? `<p class="ai-insight-suggestion">${insights.suggestion}</p>` : ''}
      </div>
    `;
  },
  
  getRecruiterInsights(project) {
    const willRead = [];
    const willSkip = [];
    let suggestion = '';
    let clarity = 'medium';
    
    if (project.title && project.title.length < 30) willRead.push('Title');
    else willSkip.push('Long title');
    
    if (project.tech && project.tech.length > 0) willRead.push('Tech stack');
    else willSkip.push('Missing tech');
    
    const desc = project.description || '';
    if (desc.length > 50 && desc.length < 200) willRead.push('Description');
    else if (desc.length >= 200) willSkip.push('Long description');
    else willSkip.push('Short description');
    
    if (project.liveUrl) willRead.push('Live demo');
    if (project.githubUrl) willRead.push('Source code');
    
    if (willRead.length >= 4) clarity = 'high';
    else if (willRead.length <= 2) clarity = 'low';
    
    if (willSkip.includes('Missing tech')) {
      suggestion = 'Add technology stack to show technical skills';
    } else if (willSkip.includes('Long description')) {
      suggestion = 'Consider shortening description to key points';
    } else if (willSkip.includes('Short description')) {
      suggestion = 'Expand description to highlight impact';
    }
    
    const clarityLabel = clarity === 'high' ? 'Clear' : clarity === 'medium' ? 'Moderate' : 'Needs Work';
    
    return { willRead, willSkip, suggestion, clarity, clarityLabel };
  },
  
  getSuggestedOrder(projects) {
    return projects
      .map(p => ({
        ...p,
        score: this.calculateImpactScore(p),
        reason: this.getOrderReason(p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },
  
  getOrderReason(project) {
    const score = this.calculateImpactScore(project);
    if (score >= 80) return 'High impact';
    if (project.liveUrl) return 'Has demo';
    if (project.tech && project.tech.length >= 3) return 'Strong tech';
    return 'Needs improvement';
  },
  
  // ═══════════════════════════════════════════════════════════
  // SKILLS MAP
  // ═══════════════════════════════════════════════════════════
  async loadSkillsMap() {
    const container = document.getElementById('ai-content-skills');
    if (!container) return;
    
    const projects = ProApp.projects || [];
    const skills = this.extractSkills(projects);
    
    container.innerHTML = `
      <div class="ai-section">
        <h4 class="ai-section-title">Extracted Skills</h4>
        <div class="ai-skills-cloud">
          ${skills.extracted.map(s => `
            <span class="ai-skill-tag" data-count="${s.count}">${s.name}</span>
          `).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Skill Categories</h4>
        <div class="ai-skill-categories">
          ${Object.entries(skills.categories).map(([cat, items]) => `
            <div class="ai-skill-category">
              <span class="ai-skill-cat-name">${cat}</span>
              <span class="ai-skill-cat-count">${items.length}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Missing Skills to Consider</h4>
        <div class="ai-suggestions">
          ${skills.suggestions.map(s => `<span class="ai-tag suggestion">${s}</span>`).join('')}
        </div>
      </div>
      
      <div class="ai-section">
        <h4 class="ai-section-title">Resume Export</h4>
        <p class="ai-description">Copy-ready skills for resume</p>
        <div class="ai-resume-box" id="aiResumeSkills">
          ${skills.extracted.slice(0, 15).map(s => s.name).join(' | ')}
        </div>
        <button class="ai-btn ai-btn-secondary" onclick="AIAssistant.copyResumeSkills()">
          Copy to Clipboard
        </button>
      </div>
    `;
  },
  
  extractSkills(projects) {
    const skillCounts = {};
    const categories = {
      'Languages': [],
      'Frameworks': [],
      'Tools': [],
      'Concepts': []
    };
    
    const languageKeywords = ['python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql'];
    const frameworkKeywords = ['react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring', 'rails', 'next', 'nuxt'];
    const toolKeywords = ['git', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'mongodb', 'postgresql', 'redis', 'jenkins', 'terraform'];
    
    projects.forEach(p => {
      (p.tech || []).forEach(tech => {
        const normalized = tech.toLowerCase().trim();
        skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
        
        if (languageKeywords.some(l => normalized.includes(l))) {
          if (!categories['Languages'].includes(tech)) categories['Languages'].push(tech);
        } else if (frameworkKeywords.some(f => normalized.includes(f))) {
          if (!categories['Frameworks'].includes(tech)) categories['Frameworks'].push(tech);
        } else if (toolKeywords.some(t => normalized.includes(t))) {
          if (!categories['Tools'].includes(tech)) categories['Tools'].push(tech);
        } else {
          if (!categories['Concepts'].includes(tech)) categories['Concepts'].push(tech);
        }
      });
    });
    
    const extracted = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    const presentSkills = new Set(extracted.map(s => s.name.toLowerCase()));
    const allKeywords = [...languageKeywords, ...frameworkKeywords, ...toolKeywords];
    const suggestions = allKeywords.filter(k => !presentSkills.has(k)).slice(0, 8);
    
    return { extracted, categories, suggestions };
  },
  
  copyResumeSkills() {
    const box = document.getElementById('aiResumeSkills');
    if (box) {
      navigator.clipboard.writeText(box.textContent).then(() => {
        this.toast('Copied to clipboard');
      });
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECT-LEVEL AI
  // ═══════════════════════════════════════════════════════════
  openProjectAI(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.currentProject = project;
    this.showProjectAIModal(project);
  },
  
  showProjectAIModal(project) {
    const score = this.calculateImpactScore(project);
    const insights = this.getRecruiterInsights(project);
    
    document.getElementById('modalTitle').textContent = 'AI Project Tools';
    document.getElementById('modalBody').innerHTML = `
      <div class="ai-project-modal">
        <div class="ai-project-modal-header">
          <h4>${this.escapeHtml(project.title || 'Untitled')}</h4>
          <span class="ai-project-modal-score ${score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low'}">
            Impact: ${score}
          </span>
        </div>
        
        <div class="ai-project-modal-section">
          <h5>Quick Actions</h5>
          <div class="ai-quick-actions">
            <button class="ai-action-btn" onclick="AIAssistant.improveDescription('${project.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Improve Description
            </button>
            <button class="ai-action-btn" onclick="AIAssistant.generateBullets('${project.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Convert to Bullets
            </button>
            <button class="ai-action-btn" onclick="AIAssistant.suggestTitle('${project.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h16v3"/>
                <path d="M9 20h6"/>
                <path d="M12 4v16"/>
              </svg>
              Suggest Title
            </button>
            <button class="ai-action-btn" onclick="AIAssistant.suggestTech('${project.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Suggest Tech
            </button>
          </div>
        </div>
        
        <div class="ai-project-modal-section">
          <h5>Drafts Generator</h5>
          <div class="ai-draft-types">
            <button class="ai-draft-btn" onclick="AIAssistant.generateDraft('${project.id}', 'recruiter')">
              Recruiter Description
            </button>
            <button class="ai-draft-btn" onclick="AIAssistant.generateDraft('${project.id}', 'resume')">
              Resume Bullet Points
            </button>
            <button class="ai-draft-btn" onclick="AIAssistant.generateDraft('${project.id}', 'casestudy')">
              Case Study Intro
            </button>
            <button class="ai-draft-btn" onclick="AIAssistant.generateDraft('${project.id}', 'elevator')">
              Elevator Pitch
            </button>
          </div>
        </div>
        
        <div class="ai-project-modal-section">
          <h5>One-Click Optimization</h5>
          <button class="ai-btn ai-btn-primary ai-btn-full" onclick="AIAssistant.makeRecruiterReady('${project.id}')">
            Make Recruiter-Ready
          </button>
          <p class="ai-hint">AI will analyze and suggest improvements. You approve each change.</p>
        </div>
        
        <div id="aiProjectOutput" class="ai-project-output" style="display: none;">
          <div class="ai-output-header">
            <h5>AI Suggestion</h5>
            <span class="ai-output-type" id="aiOutputType"></span>
          </div>
          <div class="ai-output-compare">
            <div class="ai-output-original">
              <span class="ai-output-label">Original</span>
              <div class="ai-output-content" id="aiOriginalContent"></div>
            </div>
            <div class="ai-output-suggested">
              <span class="ai-output-label">Suggested</span>
              <div class="ai-output-content" id="aiSuggestedContent"></div>
            </div>
          </div>
          <div class="ai-output-actions">
            <button class="ai-btn ai-btn-secondary" onclick="AIAssistant.discardSuggestion()">Discard</button>
            <button class="ai-btn ai-btn-primary" onclick="AIAssistant.applySuggestion()">Apply</button>
          </div>
        </div>
      </div>
    `;
    
    ProApp.openModal();
  },
  
  // ═══════════════════════════════════════════════════════════
  // AI GENERATION FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  pendingSuggestion: null,
  
  async improveDescription(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.showLoading('Improving description...');
    
    const original = project.description || '';
    const improved = await this.callAI('improve_description', {
      title: project.title,
      description: original,
      tech: project.tech
    });
    
    this.showSuggestion('Description', original, improved, {
      type: 'description',
      projectId,
      field: 'description'
    });
  },
  
  async generateBullets(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.showLoading('Converting to bullets...');
    
    const original = project.description || '';
    const bullets = await this.callAI('convert_bullets', {
      title: project.title,
      description: original
    });
    
    this.showSuggestion('Bullet Points', original, bullets, {
      type: 'description',
      projectId,
      field: 'description'
    });
  },
  
  async suggestTitle(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.showLoading('Suggesting title...');
    
    const original = project.title || '';
    const suggested = await this.callAI('suggest_title', {
      title: original,
      description: project.description,
      tech: project.tech
    });
    
    this.showSuggestion('Title', original, suggested, {
      type: 'title',
      projectId,
      field: 'title'
    });
  },
  
  async suggestTech(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.showLoading('Analyzing tech stack...');
    
    const original = (project.tech || []).join(', ');
    const suggested = await this.callAI('suggest_tech', {
      title: project.title,
      description: project.description,
      currentTech: project.tech
    });
    
    this.showSuggestion('Tech Stack', original, suggested, {
      type: 'tech',
      projectId,
      field: 'tech'
    });
  },
  
  async generateDraft(projectId, draftType) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const labels = {
      recruiter: 'Recruiter Description',
      resume: 'Resume Bullets',
      casestudy: 'Case Study Intro',
      elevator: 'Elevator Pitch'
    };
    
    this.showLoading(`Generating ${labels[draftType]}...`);
    
    const draft = await this.callAI(`draft_${draftType}`, {
      title: project.title,
      description: project.description,
      tech: project.tech
    });
    
    this.showSuggestion(labels[draftType], project.description || 'No current description', draft, {
      type: 'description',
      projectId,
      field: 'description'
    });
  },
  
  async makeRecruiterReady(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.showLoading('Running full optimization...');
    
    const optimized = await this.callAI('recruiter_ready', {
      title: project.title,
      description: project.description,
      tech: project.tech
    });
    
    this.showSuggestion('Recruiter-Ready Version', project.description || '', optimized, {
      type: 'description',
      projectId,
      field: 'description'
    });
  },
  
  // ═══════════════════════════════════════════════════════════
  // AI API CALL
  // ═══════════════════════════════════════════════════════════
  async callAI(action, data) {
    // If no API key, use local heuristics
    if (!this.apiKey) {
      return this.localAIFallback(action, data);
    }
    
    try {
      const prompt = this.buildPrompt(action, data);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || this.localAIFallback(action, data);
    } catch (e) {
      console.warn('AI API error:', e);
      return this.localAIFallback(action, data);
    }
  },
  
  buildPrompt(action, data) {
    const prompts = {
      improve_description: `Improve this project description for a technical portfolio. Make it clear, concise, and recruiter-friendly. Keep technical accuracy.

Title: ${data.title}
Current Description: ${data.description}
Tech Stack: ${(data.tech || []).join(', ')}

Respond with ONLY the improved description, no explanations.`,

      convert_bullets: `Convert this project description into clear bullet points for a portfolio. Focus on impact and technical achievements.

Title: ${data.title}
Description: ${data.description}

Respond with ONLY bullet points (using - prefix), no explanations.`,

      suggest_title: `Suggest a better, more professional project title. Keep it concise (3-6 words).

Current Title: ${data.title}
Description: ${data.description}

Respond with ONLY the suggested title, no explanations.`,

      suggest_tech: `Suggest additional relevant technologies for this project based on the description.

Title: ${data.title}
Description: ${data.description}
Current Tech: ${(data.currentTech || []).join(', ')}

Respond with ONLY a comma-separated list of technologies, no explanations.`,

      draft_recruiter: `Write a recruiter-focused description for this project. Emphasize impact, skills demonstrated, and technical complexity. 2-3 sentences max.

Title: ${data.title}
Current Description: ${data.description}
Tech Stack: ${(data.tech || []).join(', ')}

Respond with ONLY the description, no explanations.`,

      draft_resume: `Convert this project into resume-ready bullet points. Use action verbs, quantify where possible, focus on impact.

Title: ${data.title}
Description: ${data.description}
Tech Stack: ${(data.tech || []).join(', ')}

Respond with ONLY 3-4 bullet points (using - prefix), no explanations.`,

      draft_casestudy: `Write a brief case study introduction for this project. 2-3 sentences covering the problem and solution.

Title: ${data.title}
Description: ${data.description}

Respond with ONLY the intro paragraph, no explanations.`,

      draft_elevator: `Write a one-sentence elevator pitch for this project. Make it memorable and impactful.

Title: ${data.title}
Description: ${data.description}
Tech Stack: ${(data.tech || []).join(', ')}

Respond with ONLY one sentence, no explanations.`,

      recruiter_ready: `Optimize this project description to be recruiter-ready. Clean up clarity, normalize tone, improve structure, align keywords, remove redundancy.

Title: ${data.title}
Current Description: ${data.description}
Tech Stack: ${(data.tech || []).join(', ')}

Respond with ONLY the optimized description, no explanations.`
    };
    
    return prompts[action] || prompts.improve_description;
  },
  
  localAIFallback(action, data) {
    // Simple heuristic-based improvements when API is unavailable
    const desc = data.description || '';
    const title = data.title || 'Project';
    const tech = data.tech || [];
    
    switch(action) {
      case 'improve_description':
        if (desc.length < 50) {
          return `${title} - A ${tech.length > 0 ? tech.slice(0, 2).join(' and ') + ' ' : ''}project demonstrating technical problem-solving and implementation skills.`;
        }
        return desc.replace(/\s+/g, ' ').trim();
        
      case 'convert_bullets':
        const sentences = desc.split(/[.!?]+/).filter(s => s.trim());
        return sentences.map(s => `- ${s.trim()}`).join('\n');
        
      case 'suggest_title':
        if (tech.length > 0) {
          return `${tech[0]} ${title.includes('Project') ? '' : 'Project'}`.trim();
        }
        return title;
        
      case 'suggest_tech':
        const common = ['Git', 'Docker', 'REST API', 'CI/CD'];
        const missing = common.filter(c => !tech.some(t => t.toLowerCase().includes(c.toLowerCase())));
        return [...tech, ...missing.slice(0, 2)].join(', ');
        
      case 'draft_recruiter':
        return `Built ${title.toLowerCase()} using ${tech.slice(0, 3).join(', ')}. ${desc.slice(0, 150)}${desc.length > 150 ? '...' : ''}`;
        
      case 'draft_resume':
        return `- Developed ${title} using ${tech.slice(0, 2).join(' and ')}\n- Implemented core functionality demonstrating technical proficiency\n- Delivered working solution with clean, maintainable code`;
        
      case 'draft_casestudy':
        return `This project addresses ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''} The solution leverages ${tech.slice(0, 2).join(' and ')} to create an effective implementation.`;
        
      case 'draft_elevator':
        return `${title} is a ${tech[0] || 'software'} project that ${desc.slice(0, 80)}${desc.length > 80 ? '...' : ''}`;
        
      case 'recruiter_ready':
        return `${title}: ${desc.replace(/\s+/g, ' ').trim().slice(0, 200)}${desc.length > 200 ? '...' : ''} Built with ${tech.join(', ')}.`;
        
      default:
        return desc;
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // SUGGESTION DISPLAY
  // ═══════════════════════════════════════════════════════════
  showLoading(message) {
    const output = document.getElementById('aiProjectOutput');
    if (output) {
      output.style.display = 'block';
      output.innerHTML = `
        <div class="ai-loading">
          <div class="ai-loading-spinner"></div>
          <span>${message}</span>
        </div>
      `;
    }
  },
  
  showSuggestion(type, original, suggested, meta) {
    this.pendingSuggestion = { type, original, suggested, meta };
    
    const output = document.getElementById('aiProjectOutput');
    if (!output) return;
    
    output.style.display = 'block';
    output.innerHTML = `
      <div class="ai-output-header">
        <h5>AI Suggestion</h5>
        <span class="ai-output-type">${type}</span>
      </div>
      <div class="ai-output-compare">
        <div class="ai-output-original">
          <span class="ai-output-label">Original</span>
          <div class="ai-output-content">${this.escapeHtml(original) || '<em>Empty</em>'}</div>
        </div>
        <div class="ai-output-suggested">
          <span class="ai-output-label">Suggested</span>
          <div class="ai-output-content">${this.escapeHtml(suggested)}</div>
        </div>
      </div>
      <div class="ai-output-actions">
        <button class="ai-btn ai-btn-secondary" onclick="AIAssistant.discardSuggestion()">Discard</button>
        <button class="ai-btn ai-btn-primary" onclick="AIAssistant.applySuggestion()">Apply</button>
      </div>
    `;
  },
  
  discardSuggestion() {
    this.pendingSuggestion = null;
    const output = document.getElementById('aiProjectOutput');
    if (output) output.style.display = 'none';
    this.toast('Suggestion discarded');
  },
  
  async applySuggestion() {
    if (!this.pendingSuggestion) return;
    
    const { meta, suggested } = this.pendingSuggestion;
    const project = ProApp.projects.find(p => p.id === meta.projectId);
    
    if (!project) {
      this.toast('Project not found', 'error');
      return;
    }
    
    // Apply the change
    if (meta.field === 'tech') {
      project.tech = suggested.split(',').map(t => t.trim()).filter(Boolean);
    } else {
      project[meta.field] = suggested;
    }
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      this.toast('Change applied');
      this.pendingSuggestion = null;
      
      const output = document.getElementById('aiProjectOutput');
      if (output) output.style.display = 'none';
    } catch (e) {
      this.toast('Failed to apply change', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // GLOBAL ACTIONS
  // ═══════════════════════════════════════════════════════════
  async analyzeAllProjects() {
    this.toast('Running full portfolio analysis...');
    setTimeout(() => {
      this.loadPortfolioAnalysis();
      this.toast('Analysis complete');
    }, 1000);
  },
  
  async runSEOOptimization() {
    if (!this.apiKey) {
      this.toast('Add API key for AI suggestions', 'error');
      return;
    }
    this.toast('SEO optimization running...');
    setTimeout(() => {
      this.loadSEOAnalysis();
      this.toast('SEO analysis updated');
    }, 1500);
  },
  
  async runRecruiterAnalysis() {
    this.toast('Running recruiter analysis...');
    setTimeout(() => {
      this.loadRecruiterView();
      this.toast('Recruiter analysis complete');
    }, 1000);
  },
  
  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  toast(message, type = 'info') {
    if (typeof ProApp !== 'undefined' && ProApp.toast) {
      ProApp.toast(message, type);
    } else {
      console.log(`[AI] ${message}`);
    }
  },
  
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for ProApp to initialize
  setTimeout(() => AIAssistant.init(), 500);
});
