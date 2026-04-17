// Supabase configuration
const SUPABASE_URL = 'https://hqitmgdieygglffauycj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaXRtZ2RpZXlnZ2xmZmF1eWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjE0MTYsImV4cCI6MjA5MTczNzQxNn0.R5pdU-MgoovORhQK717e0OMAv4lUSNt5CrPlxejImRI';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default skills for new people
const DEFAULT_SKILLS = [
  'Leadership', 'Réactivité', 'Proactivité', 'Informatique',
  'Organisation', 'Gestion du Stress', 'Gestion des Conflits',
  'Prise de Parole', 'Esprit d\'Équipe', 'Confiance en Soi', 'Communication'
];

// Color palette for people
const PERSON_COLORS = [
  '#BA7517', '#3D6ECC', '#2D7A4F', '#8B3A8B',
  '#C0392B', '#16758A', '#E07B39', '#5B6BA9',
  '#7B8C3A', '#A03060'
];

// Format date to French
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Compute initials from name
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Toast notifications
function toast(msg, type = '') {
  const c = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Focus trap for accessible modals
function trapFocus(overlayEl) {
  const focusable = Array.from(overlayEl.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  ));
  if (!focusable.length) return;
  overlayEl._prevFocus = document.activeElement;
  overlayEl._trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  overlayEl.addEventListener('keydown', overlayEl._trapHandler);
  setTimeout(() => focusable[0].focus(), 50);
}

function releaseFocus(overlayEl) {
  if (overlayEl._trapHandler) {
    overlayEl.removeEventListener('keydown', overlayEl._trapHandler);
    overlayEl._trapHandler = null;
  }
  if (overlayEl._prevFocus) overlayEl._prevFocus.focus();
}

// Lighten color for background
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
