(function initGlobalFooter() {
  'use strict';

  function revealFadeSections() {
    const fadeElements = document.querySelectorAll('.fade-section');
    if (!fadeElements.length) return;

    if (!('IntersectionObserver' in window)) {
      fadeElements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    fadeElements.forEach((el) => observer.observe(el));
  }

  function launchTinyConfetti(x, y) {
    const safeX = Math.min(Math.max(x, 8), window.innerWidth - 8);
    const safeY = Math.min(Math.max(y, 8), window.innerHeight - 8);

    for (let index = 0; index < 12; index += 1) {
      const confettiPiece = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const distance = 24 + Math.random() * 42;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      confettiPiece.className = 'tiny-confetti';
      confettiPiece.style.left = safeX + 'px';
      confettiPiece.style.top = safeY + 'px';
      confettiPiece.style.setProperty('--tx', tx.toFixed(2) + 'px');
      confettiPiece.style.setProperty('--ty', ty.toFixed(2) + 'px');

      document.body.appendChild(confettiPiece);
      setTimeout(() => confettiPiece.remove(), 800);
    }
  }

  function bindMadeByConfetti() {
    const madeByElements = document.querySelectorAll('.made-by');
    madeByElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        launchTinyConfetti(event.clientX, event.clientY);
      });
    });
  }

  function bindInstallPrompt() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn || installBtn.dataset.installEnabled !== 'true') return;

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      installBtn.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.classList.add('hidden');
    });

    window.addEventListener('appinstalled', () => {
      installBtn.classList.add('hidden');
    });
  }

  revealFadeSections();
  bindMadeByConfetti();
  bindInstallPrompt();
})();
