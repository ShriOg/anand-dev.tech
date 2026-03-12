(function () {
  'use strict';

  const introScreen = document.getElementById('intro-screen');
  const chatScreen = document.getElementById('chat-screen');
  const openButton = document.getElementById('open-chat');
  const introLines = Array.from(document.querySelectorAll('.intro-line'));
  const chatBody = document.getElementById('chat-body');
  const finalLine = document.getElementById('final-line');
  const heartsLayer = document.getElementById('floating-hearts');
  const confettiLayer = document.getElementById('confetti-layer');
  const bgm = document.getElementById('bgm');

  const MESSAGE_FLOW = [
    { type: 'message', text: 'Hey Abhilasha' },
    { type: 'message', text: 'I wanted to wish you in a special way today' },
    { type: 'message', text: 'A normal message felt too ordinary' },
    { type: 'message', text: 'So I made this little page instead' },
    { type: 'message', text: 'Just to say...' },
    { type: 'pause', duration: 1400 },
    { type: 'message', text: 'Happy Birthday 🎂' },
    { type: 'pause', duration: 1050 },
    { type: 'message', text: 'I hope today brings you lots of smiles' },
    { type: 'message', text: 'Because you deserve a really beautiful year' },
    { type: 'pause', duration: 1350 },
    { type: 'message', text: 'And honestly...' },
    { type: 'pause', duration: 980 },
    { type: 'message', text: 'Your name always makes me smile' },
    { type: 'photo', caption: 'This moment deserved a little picture too' },
    { type: 'message', text: 'I hope this year gives you countless reasons to smile' },
    { type: 'message', text: '— Anand' },
    { type: 'ending' }
  ];

  let hasStarted = false;
  let ambientHeartTimer = null;

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function revealIntro() {
    introLines.forEach((line, index) => {
      window.setTimeout(() => {
        line.classList.add('is-visible');
      }, 550 + (index * 980));
    });

    window.setTimeout(() => {
      openButton.classList.add('is-visible');
    }, 4500);
  }

  function ensureAudioSource() {
    if (!bgm) {
      return;
    }

    bgm.volume = 0;

    bgm.addEventListener('error', () => {
      bgm.src = 'assets/music.mp3';
      bgm.load();
    }, { once: true });
  }

  async function fadeInMusic() {
    if (!bgm) {
      return;
    }

    try {
      await bgm.play();
      const target = 0.34;
      const step = 0.02;
      const interval = window.setInterval(() => {
        if (bgm.volume >= target) {
          bgm.volume = target;
          window.clearInterval(interval);
          return;
        }
        bgm.volume = Math.min(target, bgm.volume + step);
      }, 120);
    } catch (error) {
      // Autoplay policies may block playback if user gesture context is lost.
      console.warn('Music playback was blocked:', error);
    }
  }

  function createTypingBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'message message--system';
    bubble.innerHTML = '<span class="typing" aria-label="typing"><span></span><span></span><span></span></span>';
    chatBody.appendChild(bubble);
    smoothScrollToEnd();
    return bubble;
  }

  async function typeMessage(text) {
    const typingBubble = createTypingBubble();
    const previewDelay = Math.min(1800, Math.max(700, text.length * 28));
    await wait(previewDelay);
    typingBubble.remove();

    const bubble = document.createElement('div');
    bubble.className = 'message message--anand';
    const content = document.createElement('span');
    bubble.appendChild(content);
    chatBody.appendChild(bubble);

    for (let index = 0; index < text.length; index += 1) {
      content.textContent += text.charAt(index);
      smoothScrollToEnd();
      await wait(26);
    }

    smoothScrollToEnd();
    await wait(420);
  }

  async function showPhotoBubble(caption) {
    await typeMessage(caption);

    const typingBubble = createTypingBubble();
    await wait(900);
    typingBubble.remove();

    const bubble = document.createElement('div');
    bubble.className = 'message message--system message--photo';

    const image = document.createElement('img');
    image.src = 'assets/photo.jpg';
    image.alt = 'A special memory';
    image.className = 'message__photo';

    image.addEventListener('error', () => {
      image.replaceWith(createPhotoFallback());
    }, { once: true });

    bubble.appendChild(image);
    chatBody.appendChild(bubble);
    smoothScrollToEnd();

    await wait(800);
  }

  function createPhotoFallback() {
    const fallback = document.createElement('div');
    fallback.className = 'message__fallback';
    fallback.textContent = 'Add assets/photo.jpg to show your memory photo here.';
    return fallback;
  }

  function smoothScrollToEnd() {
    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: 'smooth'
    });
  }

  function spawnHeart(strongMode) {
    const heart = document.createElement('div');
    heart.className = strongMode ? 'heart heart--strong' : 'heart';
    heart.textContent = '❤';

    const x = Math.random() * 100;
    const size = strongMode ? (16 + Math.random() * 18) : (10 + Math.random() * 12);
    const duration = strongMode ? (3.8 + Math.random() * 2.8) : (8 + Math.random() * 4.2);

    heart.style.left = x + '%';
    heart.style.fontSize = size + 'px';
    heart.style.animationDuration = duration + 's';
    heart.style.opacity = strongMode ? (0.52 + Math.random() * 0.4).toFixed(2) : (0.2 + Math.random() * 0.3).toFixed(2);

    heartsLayer.appendChild(heart);

    window.setTimeout(() => {
      heart.remove();
    }, duration * 1000 + 120);
  }

  function startAmbientHearts() {
    if (ambientHeartTimer) {
      return;
    }

    ambientHeartTimer = window.setInterval(() => {
      spawnHeart(false);
    }, 980);
  }

  function launchConfetti() {
    const colors = ['#ff9db8', '#ffcdac', '#e2b5ff', '#ffe5f4', '#ffd9ea'];

    for (let i = 0; i < 70; i += 1) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (2.7 + Math.random() * 1.8) + 's';
      confetti.style.opacity = (0.56 + Math.random() * 0.42).toFixed(2);
      confetti.style.setProperty('--drift', ((Math.random() * 140) - 70) + 'px');
      confetti.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');

      confettiLayer.appendChild(confetti);

      window.setTimeout(() => {
        confetti.remove();
      }, 4700);
    }
  }

  async function playEndingSequence() {
    document.body.classList.add('ending');

    for (let i = 0; i < 28; i += 1) {
      window.setTimeout(() => spawnHeart(true), i * 130);
    }

    launchConfetti();
    await wait(900);
    finalLine.classList.add('is-visible');
  }

  async function runMessageFlow() {
    for (const item of MESSAGE_FLOW) {
      if (item.type === 'pause') {
        await wait(item.duration);
      }

      if (item.type === 'message') {
        await typeMessage(item.text);
      }

      if (item.type === 'photo') {
        await showPhotoBubble(item.caption);
      }

      if (item.type === 'ending') {
        await playEndingSequence();
      }
    }
  }

  async function openBirthdayChat() {
    if (hasStarted) {
      return;
    }
    hasStarted = true;

    introScreen.classList.add('is-hidden');
    await wait(420);
    chatScreen.classList.add('is-visible');

    startAmbientHearts();
    await fadeInMusic();
    await wait(550);
    runMessageFlow();
  }

  openButton.addEventListener('click', openBirthdayChat);

  ensureAudioSource();
  revealIntro();
})();
