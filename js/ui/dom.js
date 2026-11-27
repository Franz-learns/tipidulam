// Tiny DOM helpers. Text always goes in via textContent (never innerHTML),
// so names typed by users or returned by the AI can't inject HTML.

export function el(tag, props = {}, children = []) {
  const { dataset, style, ...rest } = props;
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(rest)) {
    if (k.includes('-')) node.setAttribute(k, v);   // aria-label, aria-current…
    else node[k] = v;
  }
  if (dataset) Object.assign(node.dataset, dataset);
  if (style) node.setAttribute('style', style);
  for (const c of [].concat(children)) if (c != null && c !== false) node.append(c);
  return node;
}

export const $ = (id) => document.getElementById(id);

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const money = (n) => peso.format(Number(n) || 0);

export const fmtQty = (q) => {
  const n = Number(q) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

export const fmtDate = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', opts);

export const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

export function select(options, value, className = 'form-select form-select-sm') {
  const s = el('select', { className });
  for (const o of options) {
    const [val, label] = Array.isArray(o) ? o : [o, o];
    s.append(el('option', { value: val, textContent: label, selected: val === value }));
  }
  return s;
}

export function toast(message, variant = 'success') {
  let box = $('toastBox');
  if (!box) {
    box = el('div', { id: 'toastBox', className: 'toast-container position-fixed bottom-0 end-0 p-3' });
    document.body.append(box);
  }
  const t = el('div', { className: `toast align-items-center text-bg-${variant} border-0`, role: 'status' },
    el('div', { className: 'd-flex' }, [
      el('div', { className: 'toast-body', textContent: message }),
      el('button', { type: 'button', className: 'btn-close btn-close-white me-2 m-auto', 'aria-label': 'Close', onclick: () => t.remove() })
    ]));
  box.append(t);
  if (window.bootstrap?.Toast) {
    new window.bootstrap.Toast(t, { delay: 3500 }).show();
    t.addEventListener('hidden.bs.toast', () => t.remove());
  } else {
    t.classList.add('show');
    setTimeout(() => t.remove(), 3500);
  }
}

/** Keep ?mock=1 on internal links so demo mode survives navigation. */
export function link(href) {
  const mock = new URLSearchParams(location.search).has('mock');
  if (!mock) return href;
  return href + (href.includes('?') ? '&' : '?') + 'mock=1';
}

export function emptyState(text) {
  return el('p', { className: 'text-secondary small mb-0', textContent: text });
}
