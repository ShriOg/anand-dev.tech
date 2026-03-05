export function createCard(item) {
  const el = document.createElement('article');
  el.className = 'card';

  const badge = document.createElement('div');
  badge.className = 'card-badge';
  badge.textContent = item.veg ? '🟢 Veg' : '🔴 Non Veg';
  el.appendChild(badge);

  if (item.special) {
    const sp = document.createElement('div');
    sp.className = 'card-special';
    sp.textContent = '🔥 Special';
    el.appendChild(sp);
  }

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.name;
  el.appendChild(title);

  if (item.desc) {
    const d = document.createElement('p');
    d.className = 'card-desc';
    d.textContent = item.desc;
    el.appendChild(d);
  }

  const prices = document.createElement('div');
  prices.className = 'card-prices';
  (item.prices || []).forEach(p => {
    const row = document.createElement('div');
    row.className = 'price-row';
    const label = document.createElement('span');
    label.className = 'price-label';
    label.textContent = p.label;
    const val = document.createElement('span');
    val.className = 'price-value';
    val.textContent = `₹${p.value}`;
    row.appendChild(label);
    row.appendChild(val);
    prices.appendChild(row);
  });
  el.appendChild(prices);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add';
  addBtn.textContent = 'Add';
  actions.appendChild(addBtn);
  el.appendChild(actions);

  return el;
}
