// Auth utilities — include after config.js

async function signInWithGoogle() {
  const btn = document.getElementById('google-btn');
  const errEl = document.getElementById('error-msg');
  if (btn) { btn.disabled = true; btn.textContent = 'Connexion en cours…'; }
  if (errEl) errEl.classList.remove('show');

  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Managers arrivent sur dashboard → requireAuth redirige les stagiaires vers leur profil
      redirectTo: window.location.origin + '/dashboard.html'
    }
  });

  if (error) {
    if (errEl) { errEl.textContent = 'Erreur Google : ' + error.message; errEl.classList.add('show'); }
    if (btn) { btn.disabled = false; btn.innerHTML = btn.innerHTML.replace('Connexion en cours…', 'Se connecter avec Google'); }
  }
  // Si pas d'erreur, le navigateur redirige vers Google — pas de return ici
}

// Returns { user, profile } or redirects to login
async function requireAuth(requiredRole = null) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    await db.auth.signOut();
    window.location.href = 'login.html';
    return null;
  }

  // Guard: stagiaire without person_id is in an inconsistent state — sign out
  if (profile.role === 'stagiaire' && !profile.person_id) {
    console.error('Stagiaire account has no person_id linked. Signing out.');
    await db.auth.signOut();
    window.location.href = 'login.html?error=no_person';
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    // Stagiaire trying to access manager page → redirect to their profile
    if (profile.role === 'stagiaire' && profile.person_id) {
      window.location.href = `person.html?id=${profile.person_id}`;
    } else {
      window.location.href = 'dashboard.html';
    }
    return null;
  }

  return { user: session.user, profile };
}

// Redirect logged-in users away from login page
async function redirectIfAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return;

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return;

  if (profile.role === 'manager') {
    window.location.href = 'dashboard.html';
  } else if (profile.person_id) {
    window.location.href = `person.html?id=${profile.person_id}`;
  }
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}

// Render the user chip in navbar
function renderNavUser(user, profile) {
  const chip = document.getElementById('nav-user');
  if (!chip) return;
  const initials = user.email.split('@')[0].slice(0, 2).toUpperCase();
  chip.innerHTML = `
    <span class="avatar-xs" style="background:var(--accent)">${initials}</span>
    <span>${user.email}</span>
  `;
}
