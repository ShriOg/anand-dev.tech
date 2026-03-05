export function searchFilter(items, query) {
  if (!query) return items;
  const q = query.trim().toLowerCase();
  return items.filter(i => (i.name || '').toLowerCase().includes(q) || (i.desc || '').toLowerCase().includes(q));
}

export function specialFilter(items) {
  return items.filter(i => i.special === true);
}

export function vegFilter(items) {
  return items.filter(i => i.veg === true);
}

export function underPriceFilter(items, limit) {
  return items.filter(i => {
    const min = Math.min(...(i.prices || []).map(p => p.value || Infinity));
    return min < limit;
  });
}

export function groupByCategory(items) {
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  return grouped;
}

export function calculateStats(items) {
  const total = items.length;
  const specials = items.filter(i => i.special).length;
  const prices = items.flatMap(i => (i.prices || []).map(p => p.value || 0));
  const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
  return { total, specials, avg };
}

export function detectVegStatus(items) {
  if (!items.length) return 'mixed';
  const allVeg = items.every(i => i.veg === true);
  const allNonVeg = items.every(i => i.veg === false);
  if (allVeg) return 'pure';
  if (allNonVeg) return 'nonveg';
  return 'mixed';
}

export function vegStatusEmoji(status) {
  switch(status){
    case 'pure': return '🌱 100% Pure Veg';
    case 'nonveg': return '🔴 Non-Veg';
    default: return '🟢 Veg & 🔴 Non-Veg';
  }
}
