# Pilotes Academy — Skill Tracker

Outil interne de suivi des compétences pour Les Pilotes. Permet de visualiser la progression des stagiaires et alternants sous forme de radar et de courbes d'évolution.

## Stack
- HTML / CSS / JavaScript vanilla
- [Supabase](https://supabase.com) — Auth + base de données
- [Chart.js](https://www.chartjs.org) — Graphiques radar et temporels
- [Resend](https://resend.com) — Envoi d'emails

---

## Lancer en local

```bash
# Cloner le repo
git clone https://github.com/Les-Pilotes/skill-tracker.git
cd skill-tracker

# Copier l'exemple de variables d'env
cp .env.example .env
# Remplir .env avec vos vraies clés

# Ouvrir l'app
open app/login.html
# ou servir via un serveur local :
npx serve app
```

> Note : le fichier `app/js/config.js` contient les clés Supabase directement (anon key uniquement — la clé publique, sûre à exposer côté client). La service role key ne doit **jamais** être dans le frontend.

---

## Connecter Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer dans **Settings > API** :
   - `Project URL`
   - `anon public` key
   - `service_role` key (pour les Edge Functions uniquement)
3. Mettre à jour `app/js/config.js` avec l'URL et la anon key
4. Exécuter le fichier de migration :
   - Aller dans **SQL Editor** dans le dashboard Supabase
   - Coller et exécuter `supabase/migrations/001_schema.sql`

---

## Créer les comptes managers

Après avoir exécuté la migration :

1. Aller dans **Authentication > Users** dans Supabase
2. Cliquer **Add user** — créer un compte pour Amadou (`amadou@les-pilotes.fr`)
3. Copier l'UUID de l'utilisateur créé
4. Dans le **SQL Editor**, exécuter :
   ```sql
   INSERT INTO profiles (id, role) VALUES ('<uuid-amadou>', 'manager');
   ```
5. Répéter pour le second manager

---

## Déployer les Edge Functions

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lier au projet
supabase link --project-ref hqitmgdieygglffauycj

# Déployer les fonctions
supabase functions deploy send-evaluation
supabase functions deploy create-stagiaire

# Définir les secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Déployer le frontend (nginx sur VPS)

```bash
# Copier les fichiers dans le dossier nginx
cp -r app/* /var/www/skill-tracker/

# Config nginx (voir docs/nginx.conf)
# Activer HTTPS via Certbot
```

---

## Structure du projet

```
skill-tracker/
├── app/
│   ├── login.html              # Page de connexion
│   ├── dashboard.html          # Vue manager : grille des membres
│   ├── person.html             # Profil d'un membre (radar, timeline, évals)
│   ├── evaluation-new.html     # Formulaire nouvelle évaluation
│   ├── admin.html              # Gestion des membres
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── config.js           # Init Supabase + utilitaires
│       └── auth.js             # Gestion auth + rôles
├── supabase/
│   ├── migrations/
│   │   └── 001_schema.sql      # Tables + RLS policies
│   └── functions/
│       ├── send-evaluation/    # Envoie le bilan par email (Resend)
│       └── create-stagiaire/   # Crée un compte auth pour un stagiaire
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

---

## Variables d'environnement (Edge Functions)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (admin) |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails |
