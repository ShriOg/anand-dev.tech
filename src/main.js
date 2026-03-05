import { getSlug } from './config.js';
import { fetchMenu } from './api/menu.js';
import { searchFilter, groupByCategory, calculateStats, detectVegStatus, vegStatusEmoji, specialFilter, vegFilter, underPriceFilter } from './utils/filters.js';
import { createCategoryBar } from './components/categories.js';
import { renderMenuSections } from './components/menu.js';

const slug = getSlug();
const app = document.getElementById('app');
const searchInput = document.getElementById('search');
const categoryBarEl = document.getElementById('category-bar');
const menuContainer = document.getElementById('menu-container');
const vegStatusEl = document.getElementById('veg-status');
const statsEl = document.getElementById('menu-stats');
const quickFiltersEl = document.getElementById('quick-filters');
const restaurantNameEl = document.getElementById('restaurant-name');

let menuItems = [];
let currentCategories = [];

async function init(){
  try{
    restaurantNameEl.textContent = decodeURIComponent(slug || 'Menu');
    menuItems = await fetchMenu(slug);
  }catch(e){
    console.error(e);
    menuItems = [];
  }

  renderAll(menuItems);
  attachHandlers();
}

function renderAll(items){
  // Stats and veg status
  const stats = calculateStats(items);
  statsEl.textContent = `${stats.total} Items • ${stats.specials} Specials • Avg ₹${stats.avg}`;
  const vs = detectVegStatus(items);
  vegStatusEl.textContent = vegStatusEmoji(vs);

  // Categories
  const categories = [...new Set(items.map(i => i.category || 'Uncategorized'))];
  currentCategories = categories;
  categoryBarEl.innerHTML = '';
  const bar = createCategoryBar(categories, scrollToCategory);
  bar.classList.add('category-wrap');
  categoryBarEl.appendChild(bar);

  // Group and render
  const grouped = groupByCategory(items);
  renderMenuSections(grouped, menuContainer);

  // Setup observer for active category
  setupActiveCategoryObserver(categories);
  renderQuickFilters();
}

function attachHandlers(){
  searchInput.addEventListener('input', onSearch);
}

function onSearch(e){
  const q = e.target.value;
  const filtered = searchFilter(menuItems, q);
  renderAll(filtered);
}

function scrollToCategory(cat){
  const id = (cat || '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
}

function setupActiveCategoryObserver(categories){
  const options = { root: null, rootMargin: '0px 0px -60% 0px', threshold: [0,0.1,0.5] };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting){
        const id = en.target.id;
        setActiveChip(id);
      }
    });
  }, options);

  // observe each section
  categories.forEach(cat => {
    const id = (cat || '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function setActiveChip(id){
  const chips = document.querySelectorAll('.category-chip');
  chips.forEach(c => c.classList.toggle('active', c.dataset.cat && c.dataset.cat.replace(/[^a-z0-9_-]/gi,'-').toLowerCase() === id));
}

function renderQuickFilters(){
  quickFiltersEl.innerHTML = '';
  const filters = [
    {label:'All',fn:()=>renderAll(menuItems)},
    {label:'🔥 Special',fn:()=>renderAll(specialFilter(menuItems))},
    {label:'🟢 Veg',fn:()=>renderAll(vegFilter(menuItems))},
    {label:'Under ₹50',fn:()=>renderAll(underPriceFilter(menuItems,50))},
    {label:'Under ₹100',fn:()=>renderAll(underPriceFilter(menuItems,100))}
  ];
  filters.forEach(f=>{
    const b = document.createElement('button');
    b.textContent = f.label;
    b.addEventListener('click', () => f.fn());
    quickFiltersEl.appendChild(b);
  });
}

init();
