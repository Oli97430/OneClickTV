import { useEffect, useRef } from 'react';

const FOCUSABLE = ['button:not([disabled])', 'input:not([disabled])', 'select', 'a[href]', '[tabindex]']
  .map((s) => `${s}:not([tabindex="-1"])`).join(', ');
const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const EDGE_TOLERANCE = 8;

function isNavigable(el) {
  if (el.closest('[inert], [aria-hidden="true"]')) return false;
  // Les boutons internes d'une carte ne sont pas des cibles : la carte l'est
  if (!el.matches('[data-card]') && el.parentElement?.closest('[data-card]')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0;
}

/** Modale ouverte (data-nav-scope) → la navigation reste dedans */
function getScope() {
  const scopes = document.querySelectorAll('[data-nav-scope]');
  return scopes.length ? scopes[scopes.length - 1] : document;
}

function inDirection(dir, from, to) {
  switch (dir) {
    case 'down':  return to.top >= from.bottom - EDGE_TOLERANCE;
    case 'up':    return to.bottom <= from.top + EDGE_TOLERANCE;
    case 'right': return to.left >= from.right - EDGE_TOLERANCE;
    case 'left':  return to.right <= from.left + EDGE_TOLERANCE;
  }
}

/** Distance dans l'axe + décalage perpendiculaire (nul si les éléments se chevauchent) */
function score(dir, from, to) {
  const vertical = dir === 'up' || dir === 'down';
  const main = vertical
    ? Math.max(0, dir === 'down' ? to.top - from.bottom : from.top - to.bottom)
    : Math.max(0, dir === 'right' ? to.left - from.right : from.left - to.right);
  const [a1, a2, b1, b2] = vertical
    ? [from.left, from.right, to.left, to.right]
    : [from.top, from.bottom, to.top, to.bottom];
  const overlap = Math.min(a2, b2) - Math.max(a1, b1);
  const cross = overlap > 0 ? 0 : Math.abs((a1 + a2) / 2 - (b1 + b2) / 2);
  return main + cross * 3;
}

export function focusElement(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: el.matches('[data-card]') ? 'center' : 'nearest', inline: 'nearest', behavior: 'smooth' });
}

/**
 * Navigation spatiale télécommande / D-pad : les flèches déplacent le focus
 * vers l'élément le plus proche dans la direction, partout dans l'app.
 * Les composants qui gèrent eux-mêmes une flèche appellent preventDefault().
 */
export function useSpatialNavigation({ enabled = true, onEdge, onNoFocus } = {}) {
  const cbRef = useRef({ onEdge, onNoFocus });
  cbRef.current = { onEdge, onNoFocus };

  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      const dir = DIRS[e.key];
      if (!dir || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;

      const current = document.activeElement;
      if (!current || current === document.body) {
        e.preventDefault();
        cbRef.current.onNoFocus?.();
        return;
      }

      // Champ texte : gauche/droite déplacent le curseur tant qu'il y a du texte
      if (current.tagName === 'INPUT' && current.value && (dir === 'left' || dir === 'right')) {
        const atStart = current.selectionStart === 0 && current.selectionEnd === 0;
        const atEnd = current.selectionStart === current.value.length;
        if ((dir === 'left' && !atStart) || (dir === 'right' && !atEnd)) return;
      }

      e.preventDefault();
      const from = current.getBoundingClientRect();
      let best = null;
      let bestScore = Infinity;
      for (const el of getScope().querySelectorAll(FOCUSABLE)) {
        if (el === current || !isNavigable(el)) continue;
        const to = el.getBoundingClientRect();
        if (!inDirection(dir, from, to)) continue;
        const s = score(dir, from, to);
        if (s < bestScore) { bestScore = s; best = el; }
      }

      // En entrant dans un groupe (menu), on arrive sur l'élément actif
      const group = best?.closest('[data-nav-group]');
      if (group && !group.contains(current)) best = group.querySelector('[data-active]') || best;

      if (best) focusElement(best);
      else cbRef.current.onEdge?.(dir, current);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
