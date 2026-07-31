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

3. Crée les tables `daily_missions` et `meals` (dashboard) :

   ```sql
   create table daily_missions (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     date date not null,
     mission_key text not null,
     label text not null,
     target numeric not null,
     current numeric not null default 0,
     completed boolean not null default false
   );

   alter table daily_missions enable row level security;

   create policy "Users can insert their own missions"
     on daily_missions for insert
     with check (auth.uid() = user_id);

   create policy "Users can read their own missions"
     on daily_missions for select
     using (auth.uid() = user_id);

   create policy "Users can update their own missions"
     on daily_missions for update
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Users can delete their own missions"
     on daily_missions for delete
     using (auth.uid() = user_id);

   create table meals (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     date date not null,
     name text not null,
     kcal int not null,
     proteines int not null default 0,
     glucides int not null default 0,
     lipides int not null default 0,
     created_at timestamptz not null default now()
   );

   alter table meals enable row level security;

   create policy "Users can insert their own meals"
     on meals for insert
     with check (auth.uid() = user_id);

   create policy "Users can read their own meals"
     on meals for select
     using (auth.uid() = user_id);

   create policy "Users can update their own meals"
     on meals for update
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Users can delete their own meals"
     on meals for delete
     using (auth.uid() = user_id);
   ```

   `daily_missions` a une ligne par jour et par mission (`date` + `mission_key`) — le dashboard en insère 4 par défaut (eau, pas, séance, skincare) dès qu'aucune ligne n'existe encore pour la date du jour, donc les missions se "réinitialisent" naturellement chaque jour sans job planifié. `meals` alimente à la fois le récapitulatif calorique du dashboard (repas du jour) et l'historique complet (`meals.tsx`, groupé par `date`).

4. Crée la table `messages` (historique du coach IA) et ajoute ta clé Anthropic :

   ```sql
   create table messages (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     role text not null check (role in ('user', 'assistant')),
     content text not null,
     created_at timestamptz not null default now()
   );

   alter table messages enable row level security;

   create policy "Users can insert their own messages"
     on messages for insert
     with check (auth.uid() = user_id);

   create policy "Users can read their own messages"
     on messages for select
     using (auth.uid() = user_id);

   create policy "Users can update their own messages"
     on messages for update
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Users can delete their own messages"
     on messages for delete
     using (auth.uid() = user_id);
   ```

   Ajoute ensuite ta clé API Anthropic (console.anthropic.com) à `.env` :

   ```bash
   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
   ```

   **Attention** : cette clé est embarquée côté client (préfixe `EXPO_PUBLIC_`), donc visible dans le bundle — acceptable pour ce prototype sans backend, mais à déplacer derrière une Edge Function avant toute mise en production.

5. Installe les dépendances et lance le serveur web :

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

Sans `.env` valide (Supabase), l'app refuse de démarrer (`lib/supabase.ts` lève une erreur explicite plutôt que de tourner avec un client mal configuré). `EXPO_PUBLIC_ANTHROPIC_API_KEY` est différent : son absence ne bloque pas le démarrage, seul l'onglet Coach affiche une bulle d'erreur au premier message envoyé.

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
    _layout.tsx             Barre de tabs flottante (pilule #101410, icônes seules, icône active
                              dans un cercle plein #c6ff3a de 44px) — enveloppé dans ProfileProvider
    index.tsx                Dashboard : header (avatar → profil, cloche → notifications), semaine,
                              carte calories (+ CTA "Continuer" → scanner), missions du jour, repas
                              du jour (ou état vide → scanner), catégories de séances, séances
                              recommandées (→ workout/[id]), stats rapides (→ progression), astuce
    meals.tsx                 Historique complet des repas, groupé par jour avec total kcal
                              (onglet caché — `href: null`, atteint via "Voir tout"/carte repas)
    coach.tsx                  Conversation avec le coach IA (Anthropic) — historique persisté
                              (50 derniers messages), suggestions en pilules au premier lancement,
                              bulle système en cas d'erreur réseau
    scanner.tsx
    progression.tsx
    profil.tsx                 Email, statut d'abonnement, déconnexion, suppression de compte
                              (voir caveat plus bas), liens Conditions/Confidentialité
  workout/
    [id].tsx                  Détail d'une séance (titre, muscles, durée, kcal, liste d'exercices
                              séries/reps, CTA "Commencer la séance") — écran racine (hors tabs)
  notifications.tsx           Liste des notifications, état vide propre — écran racine (hors tabs)

components/
  ScreenPlaceholder.tsx      Écran placeholder générique (tabs)
  OnboardingStep.tsx         Écran placeholder générique (onboarding, avec bouton "Continuer")
  dashboard/
    DashboardHeader.tsx        Avatar + salutation (→ profil), pastille streak (→ profil), cloche (→ notifications)
    WeekStrip.tsx                7 cercles L-D, tapables (aujourd'hui + passé) pour changer la date
                              consultée ; états : sélectionné / aujourd'hui (non sélectionné) / passé
                              complété / passé manqué / futur (non tapable, opacité réduite)
    PastDateBanner.tsx             "Tu consultes le [date]" + lien "Revenir à aujourd'hui", affiché
                              uniquement quand `selectedDate` ≠ aujourd'hui
    CalorieCard.tsx               Carte héro calories restantes + CalorieRing + 3 MacroBar + CTA "Continuer"
    CalorieRing.tsx                 Anneau de progression SVG (react-native-svg)
    MacroBar.tsx                    Barre fine par macro (Protéines/Glucides/Lipides)
    MissionCard.tsx                Carte mission tapable (incrémente en place), état complété distinct
    MealRow.tsx                     Ligne de repas (→ meals)
    CategoryChip.tsx                Filtre catégorie de séance (scroll horizontal)
    WorkoutCard.tsx                  Carte séance recommandée (→ workout/[id])
    StatCard.tsx                      Carte stat rapide (poids actuel / objectif / écart) (→ progression)
    TipCard.tsx                        Astuce du jour, non tapable
  coach/
    MessageBubble.tsx             Bulle coach (gauche, #101410) / utilisateur (droite, #c6ff3a) / système (erreur)
    TypingIndicator.tsx             3 points animés (Animated.loop déphasé) pendant la réponse
    ChatInput.tsx                     Champ arrondi + bouton d'envoi rond, désactivé si vide
    SuggestionChip.tsx                 Pilule de suggestion (état vide)
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
  dashboard.ts                 Logique/données pures du dashboard : nom d'affichage (dérivé de
                              l'email, pas de champ prénom en base), jour du programme (90j),
                              missions par défaut (cibles adaptées à `frequence_entrainement` et
                              `objectif`), cibles calories/macros (Mifflin-St Jeor + multiplicateur
                              d'activité + ajustement objectif/vitesse), catégories et séances de
                              sport (données statiques), calcul de série (streak), semaine courante,
                              astuce du jour

context/
  OnboardingContext.tsx       State React des réponses du questionnaire (pas de persistance)
  AuthContext.tsx              session / user / loading / isSubscribed + signUp / signIn /
                              signOut / signInWithApple / signInWithGoogle (stubs, alerte
                              "Bientôt disponible") / refreshSubscription (Supabase)
  ProfileContext.tsx            Ligne `profiles` de l'utilisateur courant + refreshProfile()
                              (utilisé par le dashboard et la barre de tabs)

hooks/
  useDailyMissions.ts          Charge les missions de la date consultée (`date` en paramètre) — ne
                              crée les 4 missions par défaut que si `date` est aujourd'hui et
                              qu'aucune ligne n'existe encore ; l'historique 30 jours (semaine +
                              streak) reste toujours ancré sur aujourd'hui, indépendamment de
                              `date` ; `incrementMission` est un no-op si `date` n'est pas aujourd'hui
  useMeals.ts                    Charge les repas de la date consultée (`date` en paramètre) +
                              leurs totaux (kcal/macros) — tout à 0 si `meals` est vide pour cette
                              date, aucune donnée de démonstration
  useCoachMessages.ts             Charge les 50 derniers messages, persiste chaque échange dans
                              `messages`, appelle `lib/coach.ts` et ajoute une bulle système
                              (non persistée) si l'appel échoue

lib/
  supabase.ts                 Client Supabase (AsyncStorage, autoRefreshToken, persistSession)
  authErrors.ts                 Traduit les erreurs Supabase en français, par champ de formulaire
  alert.ts                        showAlert / showConfirm — contournement du no-op de
                              `Alert.alert()` sur react-native-web (fallback window.alert/confirm)
  color.ts                        hexToRgba() partagé (évite la duplication entre composants)
  coach.ts                        sendMessage(history, profile) — appelle l'API Anthropic
                              (`claude-sonnet-4-6`, max_tokens 1000) en `fetch` direct sur
                              `https://api.anthropic.com/v1/messages`, **sans SDK** (voir caveat
                              ci-dessous). Le prompt système injecte objectif / poids actuel /
                              poids cible / niveau d'activité / restrictions alimentaires du profil
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

## Dashboard & navigation

Le dashboard (`(tabs)/index.tsx`) affiche un écran de chargement tant que `ProfileContext` charge la ligne `profiles`, puis un état vide propre si aucun profil n'est trouvé (pas de crash, pas d'écran blanc).

Comme `profiles` n'a pas de champ prénom, la salutation ("Salut, X") dérive un nom depuis la partie locale de l'email (`getDisplayName` dans `constants/dashboard.ts`) — à remplacer si un vrai champ nom est ajouté un jour.

Aucune table de streak dédiée : le streak et les 7 cercles de la semaine sont tous les deux dérivés du même historique `daily_missions` sur 30 jours (un jour compte comme "complété" si toutes les missions de ce jour-là le sont).

Tous les éléments cliquables du dashboard sont des `Pressable` avec un retour visuel (opacité 0.7) et mènent à un écran existant :

| Élément | Destination |
|---|---|
| Avatar / salutation, pastille streak | `profil` |
| Cloche | `notifications` |
| CTA "Continuer" (carte calories) | `scanner` |
| Carte mission | incrémente en place (pas de navigation) — désactivée en consultation passée |
| Jour du bandeau de semaine (aujourd'hui ou passé) | change la date consultée (pas de navigation) |
| "Voir tout" / carte repas | `meals` |
| Bouton "Scanner" (état vide repas) | `scanner` |
| Carte séance recommandée | `workout/[id]` |
| Carte stat (poids actuel / objectif / écart) | `progression` |
| Carte astuce du jour | non cliquable |

`workout/[id].tsx` et `notifications.tsx` sont enregistrés comme écrans racine (`app/_layout.tsx`, dans le même `Stack.Protected` que `(tabs)`) plutôt que dans le groupe `(tabs)` : ce sont des écrans "poussés" par-dessus les tabs, pas des onglets. `meals.tsx` est lui un `Tabs.Screen` avec `href: null` — il vit dans `(tabs)` (chemin `/meals`) mais n'apparaît pas comme 6ᵉ icône dans la barre.

Le bouton "Commencer la séance" (`workout/[id].tsx`) affiche pour l'instant une alerte "Bientôt disponible" (même pattern que `signInWithApple`/`signInWithGoogle`) — le suivi de séance en direct n'est pas encore implémenté.

### Consulter un jour passé

`(tabs)/index.tsx` garde la date consultée dans un state écran (`selectedDate`, initialisé à aujourd'hui) qu'il transmet à `useDailyMissions` et `useMeals`. Taper un jour du bandeau de semaine :

- **aujourd'hui ou un jour passé** → change `selectedDate` ; missions, repas, calories et macros se rechargent pour cette date (aucune requête ne mélange les dates : `useMeals` vide son état `meals` dès que `date` change, avant même que la nouvelle requête réponde, pour ne jamais afficher les totaux de l'ancienne date pendant le chargement)
- **un jour futur** → non tapable (`Pressable disabled`), opacité réduite

Quand `selectedDate` diffère d'aujourd'hui, une bannière discrète ("Tu consultes le [date]" + lien "Revenir à aujourd'hui", `PastDateBanner.tsx`) apparaît sous le bandeau de semaine, et les cartes mission passent en lecture seule (`MissionCard`'s prop `disabled`) — `incrementMission` refuse aussi silencieusement toute mutation si `date` n'est pas aujourd'hui, en garde-fou côté hook. `useDailyMissions` ne crée les 4 missions par défaut que pour aujourd'hui : consulter un jour passé où l'app n'a jamais été ouverte affiche "Aucune mission enregistrée ce jour-là" plutôt que d'insérer rétroactivement des lignes.

Le calcul du streak et les 4 états du bandeau de semaine (complété/manqué/futur/aujourd'hui) restent toujours calculés par rapport à la vraie date du jour, indépendamment de `selectedDate` — seuls les totaux calories/macros et la liste de missions/repas affichés suivent la date consultée.

## Coach IA

`(tabs)/coach.tsx` affiche une conversation avec le coach IA "GlowUp" (`claude-sonnet-4-6` via `lib/coach.ts`). Au montage, il charge les 50 derniers messages de l'utilisateur depuis `messages` (Supabase) ; chaque message envoyé et chaque réponse sont persistés dans la foulée.

Le prompt système (construit dans `buildSystemPrompt`, `lib/coach.ts`) fixe la personnalité (tutoiement, français, 2-4 phrases courtes, ton motivant mais direct) et injecte les données de profil disponibles : objectif, poids actuel, poids cible, niveau d'activité, restrictions alimentaires. Les champs absents du profil sont simplement omis du prompt plutôt que d'y figurer vides.

**Pas de SDK Anthropic dans ce projet — jamais.** `@anthropic-ai/sdk` est un package Node : il importe `node:fs` au chargement, et React Native n'a pas la bibliothèque standard de Node, donc `npx expo export` / le bundle iOS-Android cassent dès qu'il est importé (même indirectement). `lib/coach.ts` appelle l'API Anthropic en `fetch` brut sur `https://api.anthropic.com/v1/messages`, avec les headers `content-type`, `x-api-key`, `anthropic-version: 2023-06-01` et `anthropic-dangerous-direct-browser-access: true` (l'équivalent fetch de `dangerouslyAllowBrowser`). **Tout futur appel à l'API Anthropic dans cette app (le scanner de repas, par exemple) doit suivre exactement ce même pattern `fetch` — n'installe jamais `@anthropic-ai/sdk` ou un équivalent basé sur Node.**

**Clé API côté client, en connaissance de cause.** L'app n'a pas de backend, donc `EXPO_PUBLIC_ANTHROPIC_API_KEY` est lue directement dans le bundle et envoyée en clair dans l'en-tête `x-api-key` de chaque requête. La clé est donc visible par quiconque inspecte le bundle web/mobile — acceptable pour ce prototype, mais à remplacer par un proxy serveur (Edge Function Supabase, par exemple) avant toute mise en production.

Si `sendMessage` échoue (réseau, clé manquante, erreur API), le message d'erreur en français n'est pas jeté comme une exception silencieuse : il est ajouté à la conversation comme une bulle "système" (fond neutre, texte `colors.danger`), visible dans le fil, mais **non persistée** en base — un rechargement de l'historique la fait disparaître, contrairement aux vrais tours de conversation.

Au premier lancement (aucun message en base), l'écran affiche 3 suggestions en pilules qui envoient directement le message correspondant au tap plutôt que de pré-remplir le champ de saisie.

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

- Brancher les écrans restants (scanner, progression) sur de vraies données — les photos `exercise-*`/`meal-*` sont déjà dans `assets/images/` pour ça.
- Déplacer l'appel Anthropic du coach derrière un backend (Edge Function) pour ne plus exposer `EXPO_PUBLIC_ANTHROPIC_API_KEY` côté client.
- Remplacer le CTA du paywall par un vrai flux d'achat (RevenueCat).
- Implémenter Sign in with Apple / Google Sign-In (development build requis).
- Ajouter une Edge Function pour la suppression complète du compte Supabase Auth.
- Décider si/où réutiliser `AppImage.tsx` et `Logo.tsx`.
