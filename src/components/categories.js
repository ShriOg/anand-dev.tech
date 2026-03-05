export function createCategoryBar(categories, onClick) {
  const nav = document.createElement('div');
  nav.className = 'category-wrap';

  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'category-chip';
    chip.textContent = capitalize(cat);
    chip.dataset.cat = cat;
    chip.addEventListener('click', () => onClick(cat));
    nav.appendChild(chip);
  });

  return nav;
}

function capitalize(s){
  return s && s[0].toUpperCase() + s.slice(1);
}
