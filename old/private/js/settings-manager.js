/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - GLOBAL SETTINGS MANAGER
 * Website-wide Configuration
 * ═══════════════════════════════════════════════════════════
 */

const SettingsManager = {
  settings: {},
  
  defaults: {
    siteName: 'Anand Dev',
    siteTagline: 'Developer & Designer',
    siteDescription: 'Personal portfolio and creative space',
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      email: ''
    },
    appearance: {
      accentColor: '#6366f1',
      fontFamily: 'system-ui',
      animationsEnabled: true
    },
    seo: {
      defaultMetaTitle: '',
      defaultMetaDescription: '',
      ogImage: ''
    },
    maintenance: {
      enabled: false,
      message: 'Site under maintenance. Please check back soon.'
    }
  },
  
  async init() {
    await Database.init();
    await this.loadSettings();
    this.bindEvents();
    this.render();
  },
  
  async loadSettings() {
    const stored = await Database.get(DB_STORES.SETTINGS, 'global');
    this.settings = { ...this.defaults, ...(stored?.value || {}) };
  },
  
  async saveSettings() {
    await Database.put(DB_STORES.SETTINGS, {
      key: 'global',
      value: this.settings
    });
    
    this.syncToPublicSite();
    Toast.show('Settings saved', 'success');
  },
  
  bindEvents() {
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.collectAndSave();
    });
    
    document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
      this.resetToDefaults();
    });
  },
  
  render() {
    // Site Identity
    this.setInputValue('settingSiteName', this.settings.siteName);
    this.setInputValue('settingSiteTagline', this.settings.siteTagline);
    this.setInputValue('settingSiteDescription', this.settings.siteDescription);
    
    // Social Links
    this.setInputValue('settingGithub', this.settings.socialLinks?.github);
    this.setInputValue('settingLinkedin', this.settings.socialLinks?.linkedin);
    this.setInputValue('settingTwitter', this.settings.socialLinks?.twitter);
    this.setInputValue('settingInstagram', this.settings.socialLinks?.instagram);
    this.setInputValue('settingEmail', this.settings.socialLinks?.email);
    
    // Appearance
    this.setInputValue('settingAccentColor', this.settings.appearance?.accentColor);
    this.setInputValue('settingFontFamily', this.settings.appearance?.fontFamily);
    this.setCheckbox('settingAnimations', this.settings.appearance?.animationsEnabled);
    
    // SEO
    this.setInputValue('settingMetaTitle', this.settings.seo?.defaultMetaTitle);
    this.setInputValue('settingMetaDescription', this.settings.seo?.defaultMetaDescription);
    this.setInputValue('settingOgImage', this.settings.seo?.ogImage);
    
    // Maintenance
    this.setCheckbox('settingMaintenance', this.settings.maintenance?.enabled);
    this.setInputValue('settingMaintenanceMsg', this.settings.maintenance?.message);
  },
  
  setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  },
  
  setCheckbox(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
  },
  
  collectAndSave() {
    this.settings = {
      siteName: document.getElementById('settingSiteName')?.value || this.defaults.siteName,
      siteTagline: document.getElementById('settingSiteTagline')?.value || '',
      siteDescription: document.getElementById('settingSiteDescription')?.value || '',
      socialLinks: {
        github: document.getElementById('settingGithub')?.value || '',
        linkedin: document.getElementById('settingLinkedin')?.value || '',
        twitter: document.getElementById('settingTwitter')?.value || '',
        instagram: document.getElementById('settingInstagram')?.value || '',
        email: document.getElementById('settingEmail')?.value || ''
      },
      appearance: {
        accentColor: document.getElementById('settingAccentColor')?.value || '#6366f1',
        fontFamily: document.getElementById('settingFontFamily')?.value || 'system-ui',
        animationsEnabled: document.getElementById('settingAnimations')?.checked ?? true
      },
      seo: {
        defaultMetaTitle: document.getElementById('settingMetaTitle')?.value || '',
        defaultMetaDescription: document.getElementById('settingMetaDescription')?.value || '',
        ogImage: document.getElementById('settingOgImage')?.value || ''
      },
      maintenance: {
        enabled: document.getElementById('settingMaintenance')?.checked || false,
        message: document.getElementById('settingMaintenanceMsg')?.value || this.defaults.maintenance.message
      }
    };
    
    this.saveSettings();
  },
  
  async resetToDefaults() {
    if (!confirm('Reset all settings to defaults?')) return;
    
    this.settings = { ...this.defaults };
    await this.saveSettings();
    this.render();
    Toast.show('Settings reset to defaults', 'info');
  },
  
  syncToPublicSite() {
    localStorage.setItem('ps_global_settings', JSON.stringify(this.settings));
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: this.settings }));
  }
};

window.SettingsManager = SettingsManager;
