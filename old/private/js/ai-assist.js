/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - AI ASSIST (Project Editing)
 * AI-Powered Content Enhancement
 * ═══════════════════════════════════════════════════════════
 */

const AIAssist = {
  currentContent: '',
  currentType: '',
  onApplyCallback: null,
  generatedContent: '',
  
  open(options) {
    this.currentContent = options.content || '';
    this.currentType = options.type || 'text';
    this.onApplyCallback = options.onApply || null;
    this.generatedContent = '';
    
    const modal = document.getElementById('aiAssistModal');
    document.getElementById('aiAssistOriginal').value = this.currentContent;
    document.getElementById('aiAssistGenerated').value = '';
    document.getElementById('aiAssistTone').value = 'professional';
    document.getElementById('aiAssistLength').value = 'medium';
    
    modal.classList.add('active');
  },
  
  close() {
    document.getElementById('aiAssistModal')?.classList.remove('active');
    this.currentContent = '';
    this.onApplyCallback = null;
  },
  
  async generate() {
    const tone = document.getElementById('aiAssistTone').value;
    const length = document.getElementById('aiAssistLength').value;
    const action = document.getElementById('aiAssistAction').value;
    
    const btn = document.getElementById('aiAssistGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Generating...
    `;
    
    try {
      this.generatedContent = await this.generateContent(this.currentContent, {
        tone,
        length,
        action,
        type: this.currentType
      });
      
      document.getElementById('aiAssistGenerated').value = this.generatedContent;
    } catch (error) {
      Toast.show('Failed to generate content', 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      Generate
    `;
  },
  
  async generateContent(content, options) {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const { tone, length, action } = options;
    
    // Demo: Transform content based on options
    let result = content;
    
    switch (action) {
      case 'rewrite':
        result = this.rewriteContent(content, tone, length);
        break;
      case 'improve':
        result = this.improveContent(content, tone);
        break;
      case 'bullets':
        result = this.toBullets(content);
        break;
      case 'summarize':
        result = this.summarize(content);
        break;
      case 'expand':
        result = this.expand(content);
        break;
      default:
        result = this.rewriteContent(content, tone, length);
    }
    
    return result;
  },
  
  rewriteContent(content, tone, length) {
    // Demo rewriting based on tone
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    const toneModifiers = {
      professional: {
        prefix: '',
        style: 'clear and concise'
      },
      casual: {
        prefix: '',
        style: 'friendly and approachable'
      },
      technical: {
        prefix: '',
        style: 'precise and detailed'
      },
      storytelling: {
        prefix: '',
        style: 'engaging and narrative'
      }
    };
    
    const modifier = toneModifiers[tone] || toneModifiers.professional;
    
    // Simulate different output lengths
    let outputSentences = sentences;
    if (length === 'short') {
      outputSentences = sentences.slice(0, Math.ceil(sentences.length / 2));
    } else if (length === 'long') {
      outputSentences = [...sentences, ...sentences.slice(0, Math.floor(sentences.length / 2))];
    }
    
    return outputSentences.map(s => s.trim()).filter(Boolean).join('. ') + '.';
  },
  
  improveContent(content, tone) {
    // Simulate grammar and clarity improvements
    return content
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwont\b/gi, "won't")
      .trim();
  },
  
  toBullets(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    return sentences.map(s => `• ${s.trim()}`).join('\n');
  },
  
  summarize(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const keyPoints = sentences.slice(0, Math.min(3, sentences.length));
    return keyPoints.map(s => s.trim()).join('. ') + '.';
  },
  
  expand(content) {
    return content + '\n\nThis includes additional details and context to provide a more comprehensive understanding of the topic at hand. The implementation focuses on delivering value while maintaining clarity and precision.';
  },
  
  apply() {
    if (this.generatedContent && this.onApplyCallback) {
      this.onApplyCallback(this.generatedContent);
      Toast.show('Content applied', 'success');
      this.close();
    }
  },
  
  discard() {
    this.close();
  },
  
  swap() {
    const original = document.getElementById('aiAssistOriginal');
    const generated = document.getElementById('aiAssistGenerated');
    
    const temp = original.value;
    original.value = generated.value;
    generated.value = temp;
    
    this.currentContent = original.value;
    this.generatedContent = generated.value;
  }
};

window.AIAssist = AIAssist;
