// App shell: sidebar (desktop ≥992px), top bar + bottom nav (mobile).
// Each page calls renderLayout('<page id>').
import { el, link } from './dom.js';
import { icon } from './icons.js';
import { isMockMode } from '../core/services/scanService.js';

const PAGES = [
  { id: 'dashboard', href: 'index.html', label: 'Dashboard', short: 'Home', icon: 'layout-dashboard' },
  { id: 'planner', href: 'planner.html', label: 'Meal Plan', short: 'Plan', icon: 'calendar-days' },
  { id: 'recipes', href: 'recipes.html', label: 'Recipes', short: 'Recipes', icon: 'book-open' },
  { id: 'pantry', href: 'pantry.html', label: 'Pantry & Scan', short: 'Pantry', icon: 'refrigerator' },
  { id: 'grocery', href: 'grocery.html', label: 'Grocery List', short: 'Grocery', icon: 'shopping-cart' },
  { id: 'settings', href: 'settings.html', label: 'Settings', short: 'Settings', icon: 'settings' }
];

function brand() {
  return el('a', { className: 'brand', href: link('index.html'), 'aria-label': 'TipidUlam home' }, [
    el('span', { className: 'brand-mark' }, icon('chef-hat', { size: 20 })),
    el('span', { className: 'brand-name' }, ['Tipid', el('span', { textContent: 'Ulam' })])
  ]);
}

export function renderLayout(active) {
  const mock = isMockMode();
  const current = (p) => (p.id === active ? { className: 'active', 'aria-current': 'page' } : {});

  const sidebar = el('nav', { className: 'sidebar', 'aria-label': 'Main' }, [
    brand(),
    ...PAGES.map((p) => {
      const a = el('a', { className: `side-link${p.id === active ? ' active' : ''}`, href: link(p.href) },
        [icon(p.icon), el('span', { textContent: p.label })]);
      if (p.id === active) a.setAttribute('aria-current', 'page');
      return a;
    }),
    el('div', { className: 'side-foot' }, [
      mock ? el('span', { className: 'demo-pill d-inline-block mb-2', textContent: 'Demo mode' }) : null,
      el('div', { textContent: 'Philippine meal & grocery budget planner' })
    ])
  ]);

  const topbar = el('div', { className: 'topbar' }, [
    brand(),
    mock ? el('span', { className: 'demo-pill', textContent: 'Demo' }) : null,
    el('a', {
      className: `btn btn-ghost btn-icon ms-auto${active === 'settings' ? ' active' : ''}`,
      href: link('settings.html'), 'aria-label': 'Settings'
    }, icon('settings'))
  ]);

  const bottom = el('nav', { className: 'bottom-nav', 'aria-label': 'Main' }, PAGES.filter((p) => p.id !== 'settings').map((p) => {
    const a = el('a', { href: link(p.href), ...current(p) }, [
      el('span', { className: 'nav-ico' }, icon(p.icon, { size: 22 })),
      el('span', { textContent: p.short })
    ]);
    return a;
  }));

  document.getElementById('app-nav').replaceChildren(sidebar, topbar);
  document.body.append(bottom);

  const container = document.querySelector('.app-container');
  container?.append(el('footer', { className: 'app-footer' },
    'TipidUlam · Prices are estimates. Update them in Settings to match your palengke.'));

  for (const a of document.querySelectorAll('a[data-link]')) a.href = link(a.getAttribute('href'));
  // <span data-icon="camera" data-size="20"></span> → inline SVG
  for (const s of document.querySelectorAll('[data-icon]')) {
    s.replaceWith(icon(s.dataset.icon, { size: Number(s.dataset.size) || 18, className: s.className }));
  }
}

/** Empty state block with an icon. */
export function emptyBlock(iconName, title, text, action) {
  return el('div', { className: 'empty' }, [
    el('span', { className: 'chip-icon' }, icon(iconName, { size: 24 })),
    title ? el('strong', { textContent: title }) : null,
    text ? el('span', { className: 'small', textContent: text }) : null,
    action || null
  ]);
}
