# GlowUp AI

App mobile de coaching fitness et transformation physique par IA — React Native + Expo Router + TypeScript.

Cette base contient la **structure de navigation**, des **écrans vides** (titre + placeholder), un onboarding fonctionnel de bout en bout (**questionnaire**, **analyse**, **plan**, **paywall**) et une **authentification Supabase réelle** (inscription, connexion, session persistée). Pas d'appel API métier ni de paiement réel pour l'instant.

## Lancer le projet

1. Copie `.env.example` vers `.env` et renseigne ton URL de projet Supabase et ta clé `anon public` (Settings → API dans le dashboard Supabase). Ne mets jamais la clé `service_role` dans ce fichier.

   ```bash
   cp .env.example .env
   ```

2. Crée la table `profiles` dans Supabase (SQL editor) :

   ```sql
   create table profiles (
     id uuid primary key references auth.users(id) on delete cascade,
     email text,
     objectif text,
     sexe text,
     age int,
     taille int,
     poids_actuel int,
     poids_objectif int,
     vitesse text,
     niveau_activite text,
     frequence_entrainement text,
     lieu_entrainement text,
     alimentation text,
     sommeil text,
     blocage text,
     restrictions text[],
     engagement text,
     is_subscribed boolean not null default false,
     created_at timestamptz default now()
   );

   alter table profiles enable row level security;

   create policy "Users can insert their own profile"
     on profiles for insert
     with check (auth.uid() = id);

   create policy "Users can read their own profile"
     on profiles for select
     using (auth.uid() = id);

   create policy "Users can update their own profile"
     on profiles for update
     using (auth.uid() = id)
     with check (auth.uid() = id);

   create policy "Users can delete their own profile"
     on profiles for delete
     using (auth.uid() = id);
   ```

   `is_subscribed` gates the paywall (see below) — without the update policy, the paywall's CTA can't flip it and the RLS update silently fails. The delete policy backs the "Supprimer mon compte" button on `profil.tsx`.

3. Installe les dépendances et lance le serveur web :

   ```bash
   npm install
   npm run web
   ```

`npm run web` ouvre l'app dans le navigateur sur `http://localhost:8081` (Expo choisit automatiquement un port libre si celui-ci est occupé).

Autres commandes disponibles :

```bash
npm start      # ouvre le menu Expo (web / iOS / Android / QR code pour Expo Go)
npm run ios    # simulateur iOS (macOS uniquement)
npm run android
```

Sans `.env` valide, l'app refuse de démarrer (`lib/supabase.ts` lève une erreur explicite plutôt que de tourner avec un client mal configuré).

## Structure du projet

```
app/
  _layout.tsx              Root layout : AuthProvider + écran de chargement, puis redirige
                            selon session + isSubscribed (voir "Flow d'onboarding")
  (onboarding)/
    _layout.tsx             Stack d'onboarding, enveloppé dans OnboardingProvider — s'ouvre sur
                            `paywall` (session sans abonnement) ou `welcome` sinon
    welcome.tsx
    questionnaire.tsx        Écran complet : 15 questions, une par écran
    analyse.tsx               Cercle de progression animé (0→87%, ~4s) + checklist, redirige vers plan
    plan.tsx                   Résultat calculé depuis OnboardingContext (objectif, écart de poids, axes)
    signup.tsx                 Apple / Google (stubs) + email/mot de passe (Supabase signUp + insert profiles)
    login.tsx                   Idem signup, + lien "Mot de passe oublié ?"
    forgot-password.tsx         Fonctionnel : supabase.auth.resetPasswordForEmail()
    paywall.tsx               2 cartes de plan sélectionnables, CTA passe is_subscribed à true,
                              croix de fermeture déconnecte (pas d'accès gratuit à l'app)
  (tabs)/
    _layout.tsx             Barre de tabs (fond #101410, icônes lucide-react-native, actif #c6ff3a)
    index.tsx                Dashboard
    coach.tsx
    scanner.tsx
    progression.tsx
    profil.tsx                 Email, statut d'abonnement, déconnexion, suppression de compte
                              (voir caveat plus bas), liens Conditions/Confidentialité

components/
  ScreenPlaceholder.tsx      Écran placeholder générique (tabs)
  OnboardingStep.tsx         Écran placeholder générique (onboarding, avec bouton "Continuer")
  onboarding/
    QuestionInput.tsx         Dispatcher par type de question (single / multiple / numeric)
    OptionCard.tsx             Carte de réponse (bordure + fond accent quand sélectionnée)
    NumericStepper.tsx         Sélecteur numérique (âge, taille, poids)
    ProgressRing.tsx           Cercle de progression SVG animé (écran analyse)
    AnalysisStepRow.tsx        Étape de checklist (gris → accent + coche) (écran analyse)
    BenefitRow.tsx              Ligne de bénéfice, pastille verte + coche (écran paywall)
    PlanCard.tsx                Carte de plan sélectionnable (écran paywall)
    RadioDot.tsx                 Bouton radio (vide / rempli) (écran paywall)
    SocialButton.tsx             Bouton Apple (fond blanc) / Google (fond surface, bordure)
    GoogleIcon.tsx                Logo "G" multicolore (react-native-svg)
  ui/
    AppImage.tsx                Image avec fond #101410 pendant le chargement / en cas d'échec,
                              et voile noir optionnel (`overlay`, 0 à 1) — pas utilisé actuellement,
                              gardé pour un usage futur
    Button.tsx                  variants: primary / secondary / ghost / danger
    Card.tsx
    Logo.tsx                     Texte "GLOWUP AI" (GLOWUP blanc, AI accent) — pas utilisé
                              actuellement, gardé pour un usage futur
    ProgressBar.tsx
    TextField.tsx               Champ de formulaire avec label + message d'erreur
    index.ts

constants/
  theme.ts                   Couleurs, rayons, espacements, typographie — source unique de vérité
  questionnaire.ts            Les 15 questions (id, type, options)

context/
  OnboardingContext.tsx       State React des réponses du questionnaire (pas de persistance)
  AuthContext.tsx              session / user / loading / isSubscribed + signUp / signIn /
                              signOut / signInWithApple / signInWithGoogle (stubs, alerte
                              "Bientôt disponible") / refreshSubscription (Supabase)

lib/
  supabase.ts                 Client Supabase (AsyncStorage, autoRefreshToken, persistSession)
  authErrors.ts                 Traduit les erreurs Supabase en français, par champ de formulaire
```

## Flow d'onboarding

`welcome` → `questionnaire` (15 questions) → `analyse` → `plan` → `signup` → `paywall` → `(tabs)`

Le bouton "J'ai déjà un compte" sur l'écran `welcome` va directement à `login`, en court-circuitant le questionnaire. Depuis `signup`, le lien "J'ai déjà un compte" mène aussi à `login`.

Ni `signup.tsx` ni `login.tsx` ne naviguent explicitement après une authentification réussie — `app/_layout.tsx` réagit à la session (et à `isSubscribed` une fois chargé) et route lui-même vers `(tabs)` ou `(onboarding)`. Ça évite toute course entre une navigation manuelle et la redirection automatique.

**Règle de redirection** (`app/_layout.tsx`), écran de chargement affiché tant que l'un de ces états n'est pas connu :

- pas de session → `(onboarding)`, ouvert sur `welcome`
- session mais pas abonné (`is_subscribed` faux) → `(onboarding)`, ouvert directement sur `paywall`
- session et abonné → `(tabs)`

Le paywall est donc infranchissable sans mettre `is_subscribed` à `true` : sa croix de fermeture déconnecte l'utilisateur au lieu de le laisser accéder à l'app. Le CTA du paywall pose actuellement `is_subscribed = true` directement en base (`// TODO: remplacer par RevenueCat` dans `paywall.tsx`) — à remplacer par un vrai flux d'achat.

Au démarrage, `AuthContext` ne fait pas confiance à la session mise en cache localement (AsyncStorage) : elle est revalidée par un appel serveur (`supabase.auth.getUser()`). Si ce compte a été supprimé côté Supabase — ou si le jeton n'est plus valide pour toute autre raison — l'app déconnecte l'utilisateur et vide le cache local au lieu de le laisser passer. De même, `isSubscribed` n'est jamais laissé indéterminé : une ligne `profiles` manquante ou une erreur réseau sur cette requête donnent toutes les deux `false`, jamais `true` ni un état incertain.

`signInWithApple` et `signInWithGoogle` (`AuthContext`) sont des stubs qui affichent juste une alerte "Bientôt disponible" — l'implémentation native (Sign in with Apple / Google Sign-In) nécessite un development build, pas Expo Go.

Le bouton "Supprimer mon compte" (`profil.tsx`) supprime la ligne `profiles` de l'utilisateur puis le déconnecte, mais **ne supprime pas le compte Supabase Auth lui-même** — ça nécessite une Edge Function avec la clé `service_role`, qui n'existe pas encore (`// TODO` dans `profil.tsx`). Le compte auth existera donc toujours après "suppression".

## Visuels

`app.json` référence `./assets/icon.png`, `./assets/splash-icon.png` (splash, `resizeMode: "contain"`, fond `#0a0d0c`) et `./assets/adaptive-icon.png` (icône adaptative Android, même fond).

Aucun écran de navigation n'affiche plus de photo pour l'instant — `welcome`, `plan`, `questionnaire` et `paywall` sont tous en fond uni `colors.background` (paywall a ses pastilles vertes). `components/ui/AppImage.tsx` et `components/ui/Logo.tsx` restent dans le code, prêts à être réutilisés, mais rien ne les importe actuellement. Les photos elles-mêmes sont toujours dans `assets/images/` (`welcome-bg.jpg`, `plan-hero.jpg`, `logo-mark.png`, `goal-*.jpg`, `benefit-*.jpg`, `exercise-*.jpg`, `meal-*.jpg`), inutilisées pour le moment.

## Design system (`constants/theme.ts`)

| Rôle | Valeur |
|---|---|
| Fond principal | `#0a0d0c` |
| Surfaces / cartes | `#101410` |
| Bordures | `#232a25` |
| Accent | `#c6ff3a` |
| Texte principal | `#ffffff` |
| Texte secondaire | `#8a9691` |
| Texte tertiaire | `#5e6a63` |

Toutes les couleurs sont importées depuis `constants/theme.ts` — aucune couleur n'est codée en dur dans les composants ou écrans.

## Prochaines étapes

- Brancher les écrans restants (coach, scanner, progression) sur de vraies données — les photos `exercise-*`/`meal-*` sont déjà dans `assets/images/` pour ça.
- Remplacer le CTA du paywall par un vrai flux d'achat (RevenueCat).
- Implémenter Sign in with Apple / Google Sign-In (development build requis).
- Ajouter une Edge Function pour la suppression complète du compte Supabase Auth.
- Décider si/où réutiliser `AppImage.tsx` et `Logo.tsx`.
