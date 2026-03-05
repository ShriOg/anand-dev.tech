import { createCard } from './card.js';

export function renderMenuSections(grouped, container) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  Object.keys(grouped).forEach(cat => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    section.id = sanitizeId(cat);

    const header = document.createElement('h2');
    header.className = 'section-title';
    header.textContent = capitalize(cat);
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'section-list';

    grouped[cat].forEach(item => {
      const card = createCard(item);
      list.appendChild(card);
    });

    section.appendChild(list);
    frag.appendChild(section);
  });

  container.appendChild(frag);
}

function sanitizeId(s){
  return s.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
}

function capitalize(s){
  return s && s[0].toUpperCase() + s.slice(1);
}
