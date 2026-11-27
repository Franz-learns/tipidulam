// Shared navbar + footer. Each page calls renderLayout('<page id>').
import { el, link } from './dom.js';
import { isMockMode } from '../core/services/scanService.js';

const PAGES = [
  ['dashboard', 'index.html', 'Dashboard'],
  ['planner', 'planner.html', 'Meal Plan'],
  ['recipes', 'recipes.html', 'Recipes'],
  ['pantry', 'pantry.html', 'Pantry & Scan'],
  ['grocery', 'grocery.html', 'Grocery List'],
  ['settings', 'settings.html', 'Settings']
];

export function renderLayout(active) {
  const header = document.getElementById('app-nav');
  const collapseId = 'mainNav';
  const nav = el('nav', { className: 'navbar navbar-expand-lg navbar-dark bg-tipid' },
    el('div', { className: 'container' }, [
      el('a', { className: 'navbar-brand fw-bold', href: link('index.html'), textContent: 'TipidUlam' }),
      isMockMode() ? el('span', { className: 'badge text-bg-warning me-auto', textContent: 'Demo mode' }) : null,
      el('button', {
        className: 'navbar-toggler', type: 'button', 'aria-label': 'Toggle navigation',
        dataset: { bsToggle: 'collapse', bsTarget: `#${collapseId}` }
      }, el('span', { className: 'navbar-toggler-icon' })),
      el('div', { className: 'collapse navbar-collapse', id: collapseId },
        el('ul', { className: 'navbar-nav ms-auto' }, PAGES.map(([id, href, label]) =>
          el('li', { className: 'nav-item' },
            el('a', {
              className: `nav-link${id === active ? ' active fw-semibold' : ''}`,
              href: link(href), textContent: label,
              ...(id === active ? { 'aria-current': 'page' } : {})
            })))))
    ]));
  header.replaceChildren(nav);
  for (const a of document.querySelectorAll('a[data-link]')) a.href = link(a.getAttribute('href'));

  document.body.append(el('footer', { className: 'text-center text-secondary small py-4' },
    'TipidUlam · Philippine Meal & Grocery Budget Planner · Prices are estimates — update them in Settings.'));
}
