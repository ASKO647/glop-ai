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

   `is_subscribed` gates the paywall (see below) — without the update policy, the paywall's CTA can't flip it and the RLS update silently fails. The delete policy backs `deleteAccount()` (`context/AuthContext.tsx`), used by the "Supprimer mon compte" flow on `profil.tsx`.

   `code_parrainage` and `parraine_par` (added below, alongside the referral system) also live on this table.

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
                              dans un cercle plein #c6ff3a de 44px)
    index.tsx                Dashboard : logo "GLOWUP AI" en tête, header (avatar → profil, cloche →
                              notifications), semaine, carte calories (+ CTA "Continuer" → scanner),
                              missions du jour, repas du jour (ou état vide → scanner), catégories de
                              séances, séances recommandées (→ workout/[id]), stats rapides (→
                              progression), astuce — poids/repas rechargés via `useFocusEffect` à
                              chaque retour sur l'onglet
    meals.tsx                 Historique complet des repas, groupé par jour avec total kcal
                              (onglet caché — `href: null`, atteint via "Voir tout"/carte repas)
    coach.tsx                  Conversation avec le coach IA (Anthropic) — historique persisté
                              (50 derniers messages), suggestions en pilules au premier lancement,
                              bulle système en cas d'erreur réseau
    scanner.tsx                Scan photo d'un repas (Anthropic vision) — aperçu, analyse, carte
                              résultat (kcal/macros/aliments), enregistrement dans `meals`
    progression.tsx            Poids (carte + stepper sans clavier + courbe SVG), 4 stats, régularité
                              30 jours (`daily_missions`), photos avant/après (`progress_photos`
                              + bucket Storage privé)
    profil.tsx                 En-tête (avatar/badge/stats) + abonnement + parrainage + tous les
                              anciens "Paramètres" (objectifs, compte, notifications, préférences,
                              à propos, mes données, zone de danger) — voir "Écran Profil"
  workout/
    [id].tsx                  Détail d'une séance (titre, muscles, durée, kcal, liste d'exercices
                              séries/reps, CTA "Commencer la séance" → workout/session/[id]) — écran
                              racine (hors tabs)
    session/
      [id].tsx                 Suivi de séance en direct : exercice courant, "Série X sur Y", objectif
                              de reps, minuteur de repos (60s ±15s), barre de progression globale,
                              navigation Précédent/Suivant, CTA "Terminer" sur le dernier exercice
                              (marque la mission "workout" du jour comme accomplie)
  notifications.tsx           Liste des notifications, état vide propre — écran racine (hors tabs)
  legal/
    terms.tsx                  Conditions d'utilisation — texte placeholder
    privacy.tsx                 Politique de confidentialité — texte placeholder

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
    Logo.tsx                     Texte "GLOWUP AI" (GLOWUP blanc, AI accent) — affiché en tête du
                              dashboard (`(tabs)/index.tsx`)
    ProgressBar.tsx
    TextField.tsx               Champ de formulaire avec label + message d'erreur
    NumberStepperModal.tsx       Stepper numérique sans clavier (±step, appui long pour défiler,
                              pilules de raccourci optionnelles) — partagé par le poids du jour
                              (Progression) et le poids objectif (Profil)
    index.ts
  profil/
    ProfileHeader.tsx           Avatar (initiale) + email + badge Premium/Gratuit + 3 stats
                              (jour du programme, kg perdus, streak)
    SubscriptionCard.tsx         Carte "Mon abonnement" — rendu complètement différent abonné
                              vs. non-abonné plutôt qu'un seul composant à branches internes
  settings/
    SettingsSection.tsx          Titre de section + carte #101410 avec séparateurs entre les lignes
    SettingsRow.tsx               Icône carrée 36px + libellé + contenu à droite (switch, valeur
                              + chevron, ou libre) ; exporte aussi SettingsValue et SettingsSwitch
    ChoiceModal.tsx               Modale à choix unique générique (Objectif principal, Vitesse,
                              Entraînements par semaine)
    TimePickerModal.tsx           Stepper heure/minute maison pour les rappels matin/soir
    ReferralCard.tsx              Carte de parrainage (code, copie, partage, nombre de filleuls)
    ReferralCodeModal.tsx         Saisie d'un code de parrainage à rédimer
    DeleteAccountModal.tsx        Confirmation par saisie du mot "SUPPRIMER"

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
  anthropic.ts                    URL, modèle (`claude-sonnet-4-5-20250929`), en-têtes et mapping
                              d'erreurs (401/402/429/400) partagés par coach.ts et foodScanner.ts
  coach.ts                        sendMessage(history, profile) — appelle l'API Anthropic
                              (max_tokens 1000) en `fetch` direct sur
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

Le bouton "Supprimer mon compte" (`profil.tsx`, zone de danger) appelle `deleteAccount()` (`AuthContext`), qui supprime les lignes de l'utilisateur dans toutes les tables applicatives puis le déconnecte, mais **ne supprime pas le compte Supabase Auth lui-même** — ça nécessite une Edge Function avec la clé `service_role`, qui n'existe pas encore. Le compte auth existera donc toujours après "suppression" (voir "Écran Profil" plus bas pour le détail des tables concernées).

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

`workout/[id].tsx`, `workout/session/[id].tsx` et `notifications.tsx` sont enregistrés comme écrans racine (`app/_layout.tsx`, dans le même `Stack.Protected` que `(tabs)`) plutôt que dans le groupe `(tabs)` : ce sont des écrans "poussés" par-dessus les tabs, pas des onglets. `meals.tsx` est lui un `Tabs.Screen` avec `href: null` — il vit dans `(tabs)` (chemin `/meals`) mais n'apparaît pas comme 6ᵉ icône dans la barre.

Le poids affiché dans "Poids actuel"/"Écart restant" (dashboard) vient de la dernière ligne de `weight_logs` (via `useWeightLogs`), pas de `profiles.poids_actuel` — même logique que `progression.tsx` (`logs[logs.length - 1].poids`, avec repli sur `profiles.poids_actuel` tant qu'aucune pesée n'existe). `profiles.poids_actuel` reste la valeur de référence au moment de l'onboarding, mais n'est jamais mis à jour ensuite : s'y fier directement sur le dashboard le rendrait périmé dès la première pesée dans Progression. Le dashboard recharge `weight_logs` et `meals` via `useFocusEffect` (`expo-router`) à chaque fois que l'onglet reprend le focus, pour que les repas scannés ou la pesée du jour, enregistrés depuis un autre écran, apparaissent sans reload manuel.

### Suivi de séance en direct

Le bouton "Commencer la séance" (`workout/[id].tsx`) pousse vers `workout/session/[id].tsx`, qui fait défiler les exercices de la séance un par un : nom de l'exercice, "Série X sur Y", objectif de reps (parsé depuis le champ `reps`, qui est une chaîne — `"15"` devient "15 répétitions", `"40s"` reste tel quel), et une barre de progression globale (séries complétées / total sur toute la séance). Un bouton "Série terminée" avance le compteur de séries et, si ce n'était pas la dernière série de l'exercice, démarre un minuteur de repos (60s par défaut, boutons ±15s, "Passer le repos" pour l'écourter) avant de passer à la série suivante. "Précédent"/"Suivant" navigue librement entre exercices ; sur le dernier exercice, "Suivant" devient "Terminer" et marque la mission du jour `workout` comme accomplie (`useDailyMissions`'s `incrementMission`) avant de renvoyer au dashboard (`router.replace('/')`). Cet écran est un state local pur : rien n'est persisté série par série, seule la complétion finale de la mission l'est.

### Consulter un jour passé

`(tabs)/index.tsx` garde la date consultée dans un state écran (`selectedDate`, initialisé à aujourd'hui) qu'il transmet à `useDailyMissions` et `useMeals`. Taper un jour du bandeau de semaine :

- **aujourd'hui ou un jour passé** → change `selectedDate` ; missions, repas, calories et macros se rechargent pour cette date (aucune requête ne mélange les dates : `useMeals` vide son état `meals` dès que `date` change, avant même que la nouvelle requête réponde, pour ne jamais afficher les totaux de l'ancienne date pendant le chargement)
- **un jour futur** → non tapable (`Pressable disabled`), opacité réduite

Quand `selectedDate` diffère d'aujourd'hui, une bannière discrète ("Tu consultes le [date]" + lien "Revenir à aujourd'hui", `PastDateBanner.tsx`) apparaît sous le bandeau de semaine, et les cartes mission passent en lecture seule (`MissionCard`'s prop `disabled`) — `incrementMission` refuse aussi silencieusement toute mutation si `date` n'est pas aujourd'hui, en garde-fou côté hook. `useDailyMissions` ne crée les 4 missions par défaut que pour aujourd'hui : consulter un jour passé où l'app n'a jamais été ouverte affiche "Aucune mission enregistrée ce jour-là" plutôt que d'insérer rétroactivement des lignes.

Le calcul du streak et les 4 états du bandeau de semaine (complété/manqué/futur/aujourd'hui) restent toujours calculés par rapport à la vraie date du jour, indépendamment de `selectedDate` — seuls les totaux calories/macros et la liste de missions/repas affichés suivent la date consultée.

## Coach IA

`(tabs)/coach.tsx` affiche une conversation avec le coach IA "GlowUp" (`claude-sonnet-4-5-20250929` via `lib/coach.ts`). Au montage, il charge les 50 derniers messages de l'utilisateur depuis `messages` (Supabase) ; chaque message envoyé et chaque réponse sont persistés dans la foulée.

`lib/coach.ts` garantit une alternance stricte `user`/`assistant` avant d'envoyer la requête (`mergeConsecutiveRoles`) — nécessaire car une réponse échouée laisse un tour "user" sans réponse, et le message suivant de l'utilisateur redevient alors un second tour "user" consécutif du point de vue de l'API. `hooks/useCoachMessages.ts` retire aussi les bulles d'erreur locales (role `system`, jamais persistées) de l'historique envoyé à l'API plutôt que de les traiter comme des messages `user` — les deux étaient nécessaires : la bulle d'erreur passée en tant que "user" créait exactement ce problème d'alternance, en plus de polluer le contexte envoyé au modèle avec du texte d'erreur.

Le prompt système (construit dans `buildSystemPrompt`, `lib/coach.ts`) fixe la personnalité (tutoiement, français, 2-4 phrases courtes, ton motivant mais direct) et injecte les données de profil disponibles : objectif, poids actuel, poids cible, niveau d'activité, restrictions alimentaires. Les champs absents du profil sont simplement omis du prompt plutôt que d'y figurer vides.

**Pas de SDK Anthropic dans ce projet — jamais.** `@anthropic-ai/sdk` est un package Node : il importe `node:fs` au chargement, et React Native n'a pas la bibliothèque standard de Node, donc `npx expo export` / le bundle iOS-Android cassent dès qu'il est importé (même indirectement). `lib/coach.ts` appelle l'API Anthropic en `fetch` brut sur `https://api.anthropic.com/v1/messages`, avec les headers `content-type`, `x-api-key`, `anthropic-version: 2023-06-01` et `anthropic-dangerous-direct-browser-access: true` (l'équivalent fetch de `dangerouslyAllowBrowser`). **Tout futur appel à l'API Anthropic dans cette app (le scanner de repas, par exemple) doit suivre exactement ce même pattern `fetch` — n'installe jamais `@anthropic-ai/sdk` ou un équivalent basé sur Node.**

**Clé API côté client, en connaissance de cause.** L'app n'a pas de backend, donc `EXPO_PUBLIC_ANTHROPIC_API_KEY` est lue directement dans le bundle et envoyée en clair dans l'en-tête `x-api-key` de chaque requête. La clé est donc visible par quiconque inspecte le bundle web/mobile — acceptable pour ce prototype, mais à remplacer par un proxy serveur (Edge Function Supabase, par exemple) avant toute mise en production.

Si `sendMessage` échoue (réseau, clé manquante, erreur API), le message d'erreur en français n'est pas jeté comme une exception silencieuse : il est ajouté à la conversation comme une bulle "système" (fond neutre, texte `colors.danger`), visible dans le fil, mais **non persistée** en base — un rechargement de l'historique la fait disparaître, contrairement aux vrais tours de conversation. Ce message distingue 401 (clé invalide), 402 (crédit insuffisant), 429 (trop de requêtes) et 400 (requête invalide) plutôt que d'afficher un texte générique — `lib/anthropic.ts` construit ce message et journalise systématiquement le corps complet de la réponse en erreur avec `console.error` avant de le renvoyer : le message d'erreur d'Anthropic dit précisément quel champ ou quelle règle a été violée, un simple code de statut ne le dit pas.

Au premier lancement (aucun message en base), l'écran affiche 3 suggestions en pilules qui envoient directement le message correspondant au tap plutôt que de pré-remplir le champ de saisie.

## Scanner de repas

`(tabs)/scanner.tsx` analyse une photo de repas avec `claude-sonnet-4-5-20250929` (vision) et enregistre le résultat dans `meals`. Quatre états s'enchaînent sur un seul écran : état initial (icône + les deux boutons "Prendre une photo" / "Choisir dans la galerie"), aperçu de la photo pendant l'analyse (indicateur + "Analyse en cours..."), carte de résultat (plat, kcal, barres de macros, liste d'aliments identifiés) et état d'erreur (message en français + "Réessayer"). "Recommencer" réinitialise l'écran depuis n'importe quel état.

`expo-image-picker` (`~17.0.11`) fournit la prise de photo et la sélection en galerie ; les permissions caméra/photos sont redemandées à la volée si elles n'ont pas déjà été accordées, avec un message d'erreur explicatif en français si l'utilisateur refuse. Les chaînes `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` sont déclarées dans `app.json` (à la fois via le plugin `expo-image-picker` et dans `ios.infoPlist`).

`lib/foodScanner.ts` fait tout le travail :
- `compressImage(uri, originalWidth)` redimensionne à 1024px de large maximum (sans jamais agrandir une image plus petite) et ré-encode en JPEG qualité 0.5 via `expo-image-manipulator` (`~14.0.8`, nouvelle API contextuelle `ImageManipulator.manipulate(uri).resize(...).renderAsync()` — `manipulateAsync` est dépréciée depuis la v14).
- `analyzeMeal(base64Image, mimeType)` suit exactement le même pattern `fetch` brut que `lib/coach.ts` (voir section Coach IA ci-dessus — toujours pas de SDK Anthropic), avec un message contenant un bloc `image` (base64) suivi d'un bloc `text` donnant la consigne d'analyse. La réponse attendue est un JSON strict (`{"nom","kcal","proteines","glucides","lipides","aliments"}` ou `{"erreur":"Aucun aliment détecté"}`) ; d'éventuelles balises ```` ```json ```` autour sont retirées avant le `JSON.parse`, le tout dans un try/catch.
- Le cas "aucun aliment détecté" est un résultat normal (union `MealAnalysis | MealAnalysisError`), distinct des vraies erreurs (réseau, HTTP, JSON illisible) qui sont levées comme des `Error` avec un message en français — c'est ce qui déclenche l'état d'erreur avec bouton "Réessayer" dans l'écran.

"Enregistrer ce repas" insère une ligne dans `meals` avec `date: todayISODate()`, affiche une confirmation puis redirige vers le dashboard (`router.replace('/')`).

## Écran Progression

`(tabs)/progression.tsx` empile six sections en défilement vertical : carte de poids actuel, modale de saisie, graphique d'évolution, grille de 4 statistiques, série de régularité (30 jours) et photos de progression.

Le poids "actuel" est la dernière ligne de `weight_logs` (repli sur `profile.poids_actuel` s'il n'y a encore aucune pesée) ; le poids "de départ" est `profile.poids_actuel` tel que renseigné à l'onboarding, qui ne change plus ensuite — c'est ce qui rend l'écart "depuis le départ" et le pourcentage de progression stables même si l'utilisateur modifie sa pesée du jour. `hooks/useWeightLogs.ts` (sur le modèle de `useDailyMissions`) lit jusqu'à 90 jours d'historique et expose `saveTodayWeight`, qui met à jour la ligne du jour si elle existe déjà plutôt que d'en créer une seconde. La table attendue :

```sql
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  poids numeric not null,
  created_at timestamptz not null default now()
);

alter table weight_logs enable row level security;

create policy "Users can insert their own weight logs"
  on weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own weight logs"
  on weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can update their own weight logs"
  on weight_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own weight logs"
  on weight_logs for delete
  using (auth.uid() = user_id);
```

Le graphique (`components/progression/WeightChart.tsx`) est tracé à la main avec `react-native-svg` (même bibliothèque que `CalorieRing` sur le dashboard) plutôt qu'avec une lib de charts : ligne + points + dégradé sous la courbe + ligne pointillée au niveau de l'objectif, avec un domaine vertical qui s'étend toujours pour inclure l'objectif même s'il est loin des mesures récentes. En dessous de deux mesures sur la période sélectionnée, l'écran affiche un état vide plutôt qu'un graphique vide ou une erreur.

**Saisie du poids sans clavier.** `components/progression/WeightEntryModal.tsx` n'utilise aucun `TextInput` : le poids se règle avec deux boutons ronds (±0,1 kg par tap, appui long pour défiler — `onPressIn`/`onPressOut` + un `setTimeout` de 400 ms avant de démarrer un `setInterval` de répétition, pattern classique de "hold to repeat") et quatre pilules de raccourci (±0,5 / ±1 kg). La valeur initiale est le dernier poids connu (`weight_logs` le plus récent, ou `profile.poids_actuel` à défaut) — jamais la ligne du jour spécifiquement, pour que la modale s'ouvre toujours sur une valeur pertinente même si l'utilisateur n'a encore rien saisi aujourd'hui.

**Deux lignes de comparaison** sur la carte de poids (`components/progression/WeightCard.tsx`, logique dans `computeWeightTrend`, `constants/progression.ts`) : l'écart avec l'avant-dernière pesée (`weight_logs[length-2]`, masqué s'il n'y a qu'une seule pesée) et l'écart avec `profile.poids_actuel`. La flèche (haut/bas) suit le sens réel du changement ; sa couleur dépend de `profile.objectif` — "bonne" direction si le poids baisse, sauf pour "Prise de muscle" où la logique s'inverse. Le fond de la carte étant déjà l'accent lime, une flèche "verte" y serait invisible : la direction "bonne" reste donc en noir (comme le reste du texte de la carte) et seule la direction "à surveiller" prend une couleur dédiée (`colors.warning`, nouveau token orange dans `constants/theme.ts`) pour rester lisible et se démarquer.

**Régularité, expliquée.** La grille affiche désormais une légende (`Toutes les missions` / `Partiellement` / `Aucune`), un texte d'intro, un compteur "X / 30 jours actifs", et un appui long sur un carré affiche une info-bulle avec la date et le détail (`hooks/useMissionStreak.ts` expose maintenant `countsByDate` en plus de `statusByDate` pour ça). Cette grille réutilise `daily_missions` (déjà utilisée par le dashboard) via `hooks/useMissionStreak.ts` — une lecture seule sur 30 jours, volontairement séparée de `useDailyMissions` qui, lui, insère les missions par défaut du jour : la page Progression ne doit jamais créer de lignes en arrière-plan simplement parce qu'on l'a consultée.

**Photos de progression — trois emplacements fixes.** `hooks/useProgressPhotos.ts` gère la table `progress_photos` et le bucket Storage privé `progress-photos`, avec exactement trois emplacements nommés par utilisateur (`avant` / `milieu` / `apres`, `PHOTO_SLOTS` et `SLOT_LABELS` exportés par le hook) plutôt qu'une photo par jour illimitée. Chaque photo est compressée avec `expo-image-manipulator` (largeur max 1024px, JPEG qualité 0.6, sortie `base64: true`) puis envoyée via `lib/storageUpload.ts` (voir "Upload vers Supabase Storage : toujours en `ArrayBuffer`" ci-dessous) vers `{user_id}/{slot}.jpg` avec `upsert: true` : remplacer la photo d'un emplacement écrase la précédente plutôt que d'empiler des doublons, aussi bien côté Storage que côté ligne `progress_photos` (update si une ligne existe déjà pour ce `slot`, insert sinon). La ligne n'est écrite qu'une fois le fichier confirmé présent dans le bucket — jamais avant. Le bucket étant privé, l'affichage passe systématiquement par `createSignedUrl` (URLs valables 24h). Comme le chemin de stockage est fixe par emplacement (`{user_id}/avant.jpg` reste `{user_id}/avant.jpg` d'une photo à l'autre), chaque signature ajoute un paramètre `&t=${Date.now()}` à l'URL — sans ça, remplacer une photo laisserait RN réafficher l'ancienne via son cache d'image, l'URL signée étant sinon quasi identique à la précédente (même chemin, même bucket). La génération d'URL signée (`createSignedUrl`) et le chargement de l'image côté `<Image onError>` (`components/progression/PhotosCard.tsx`) journalisent aussi leur erreur avec `console.error` ; côté écran, `addPhoto` renvoie `{ ok, error? }` et `(tabs)/progression.tsx` affiche `error` dans une alerte plutôt que d'échouer silencieusement avec un cadre resté noir.

**Upload vers Supabase Storage : toujours en `ArrayBuffer`.** `supabase-js` ne gère pas fiablement les objets `File`/`Blob`/URI locales sur React Native — un upload peut répondre avec succès tout en laissant le fichier absent ou vide dans le bucket, ce qui produisait un cadre noir silencieux pour les photos de progression. `lib/storageUpload.ts` (`uploadBase64Image(bucket, path, base64, contentType)`) est le seul chemin d'upload d'image de l'app : décode le base64 en `ArrayBuffer` avec `base64-arraybuffer` (`decode()`), l'envoie via `storage.upload(path, arrayBuffer, { contentType, upsert: true })`, journalise systématiquement le résultat (`console.log` avec le chemin si succès, `console.error` avec l'erreur complète sinon), puis **revérifie** avec `storage.list(dossier, { search: nomDeFichier })` que l'objet est bien listé avant de rendre la main — si l'upload répond "succès" mais que le fichier n'apparaît pas dans le listing, la fonction renvoie une erreur explicite en français plutôt qu'un faux positif. Toute nouvelle fonctionnalité qui téléverse une image vers Storage (photos de progression, avatar, et toute future fonctionnalité similaire) doit passer par cette fonction plutôt que ré-implémenter l'upload.

Affichage (`components/progression/PhotosCard.tsx`) : trois cadres côte à côte (ratio 3:4, rayon 12px), chacun étiqueté "Avant"/"Milieu"/"Après" au-dessus. Cadre vide : fond `colors.surface`, bordure pointillée `colors.border`, icône plus + texte "Ajouter". Cadre rempli : la photo en plein cadre, avec un bandeau semi-transparent en bas affichant la date et le poids du jour où la photo a été prise. Un tap sur un cadre — vide ou rempli — ouvre toujours le sélecteur de photos et remplace celle de cet emplacement ; un appui long sur un cadre rempli propose sa suppression (`showConfirm`). La suppression retire l'objet du bucket puis la ligne en base ; un échec côté Storage (objet déjà absent, par exemple) n'empêche pas de retirer la ligne, pour ne jamais laisser une photo supprimée réapparaître dans l'app.

Table et bucket à créer dans Supabase :

```sql
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  date date not null,
  storage_path text not null,
  poids numeric,
  created_at timestamptz not null default now(),
  constraint progress_photos_slot_check check (slot in ('avant', 'milieu', 'apres')),
  constraint progress_photos_user_slot_key unique (user_id, slot)
);

alter table progress_photos enable row level security;

create policy "Users can insert their own progress photos"
  on progress_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own progress photos"
  on progress_photos for select
  using (auth.uid() = user_id);

create policy "Users can update their own progress photos"
  on progress_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own progress photos"
  on progress_photos for delete
  using (auth.uid() = user_id);
```

If `progress_photos` already exists from before the 3-slot redesign (one row per day, no `slot` column), the old rows don't map to a slot — clear them first, then add the new column and constraints:

```sql
delete from storage.objects where bucket_id = 'progress-photos';
truncate table progress_photos;

alter table progress_photos add column slot text not null;
alter table progress_photos add constraint progress_photos_slot_check check (slot in ('avant', 'milieu', 'apres'));
alter table progress_photos add constraint progress_photos_user_slot_key unique (user_id, slot);
```

Puis, dans le dashboard Supabase (Storage → New bucket), crée un bucket **privé** nommé `progress-photos` (case "Public bucket" décochée), et ajoute ses policies (Storage → Policies, ou en SQL — les objets sont préfixés `{user_id}/...`, donc la policy compare `(storage.foldername(name))[1]` au `uid()` courant) :

```sql
create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own folder"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own folder"
  on storage.objects for update
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own folder"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Le bucket restant privé, `getPublicUrl` ne fonctionnerait pas — c'est pour ça que l'app utilise `createSignedUrl` partout où une photo doit s'afficher.

**Analyse IA de la progression.** Sous les trois cadres, `components/progression/ProgressAnalysisCard.tsx` affiche un bouton "Analyser ma progression", actif uniquement si au moins deux des trois emplacements ont une photo. `lib/progressAnalysis.ts` suit exactement le même pattern `fetch` brut que `lib/coach.ts`/`lib/foodScanner.ts` (toujours pas de SDK Anthropic — voir la section Coach IA) : pour chaque photo présente, un bloc texte ("Photo \"Avant\" — mardi 28 juillet, poids : 82,0 kg") suivi d'un bloc image, dans un seul message envoyé à `claude-sonnet-4-5-20250929`. Comme les photos vivent dans Storage (pas forcément une URI locale fraîche — l'utilisateur a pu les ajouter des jours ou des semaines plus tôt), `fetchImageAsBase64` télécharge chaque URL signée et la convertit en base64 via `FileReader.readAsDataURL` avant de l'envoyer, contrairement au scanner de repas qui a directement l'URI locale sortie de l'appareil photo.

Le prompt système (`buildSystemPrompt`) injecte l'objectif de l'utilisateur et ses poids de départ/actuel/objectif quand disponibles, et pose trois règles non négociables : ne commenter que des changements physiques visibles et objectifs, ne jamais faire de remarque dévalorisante sur l'apparence (même formulée comme "axe de travail"), et ne donner aucun conseil médical, nutritionnel ou d'entraînement présenté comme un diagnostic. La consigne utilisateur demande une réponse strictement JSON (pas de balises markdown), au format `{"resume":"...","points_positifs":["..."],"axes_travail":["..."],"score":0}` — `stripJsonFences` (déplacée dans `lib/anthropic.ts` et maintenant partagée avec `lib/foodScanner.ts`) retire d'éventuelles balises ```` ```json ```` avant le `JSON.parse`.

Le résultat s'affiche dans une carte : le score dans un anneau SVG (`components/progression/ScoreRing.tsx`, même construction que `CalorieRing`/`ProgressRing` — piste `colors.border`, arc `colors.accent`), le résumé à côté, puis deux listes à puces ("Points positifs" en puces accent, "Axes de travail" en puces `colors.warning`). Un bouton "Réanalyser" relance le même appel. Les erreurs (réseau, clé manquante, réponse Anthropic en échec) utilisent `describeAnthropicError` pour un message en français adapté au code de statut, affiché au-dessus du bouton plutôt que de bloquer l'écran.

## Écran Profil

`(tabs)/profil.tsx` fusionne l'ancien écran Paramètres (`app/settings.tsx`, supprimé) directement dans l'onglet Profil — plus d'icône engrenage, plus d'écran séparé, plus de route `/settings`. `ProfileProvider` était déjà remonté de `(tabs)/_layout.tsx` vers `app/_layout.tsx` pour cet ancien écran racine ; il reste à cet endroit (inutile de le redescendre) même si tout son contenu vit maintenant dans `(tabs)/` — ça n'a aucun effet visible, `useProfile()` fonctionne pareil dans les deux cas.

Neuf sections empilées, dans l'ordre : en-tête (avatar, email, badge d'abonnement, stats), Mon abonnement, carte de parrainage, Mes objectifs, Compte, Notifications, Préférences, À propos, Mes données, Zone de danger.

**En-tête** (`components/profil/ProfileHeader.tsx`) : cercle 72px avec l'initiale (dérivée de l'email via `getDisplayName`, comme sur le dashboard) ou la photo de profil si `profile.avatar_path` est renseigné, badge Premium/Gratuit, puis trois stats séparées par des traits verticaux — "Jour X / 90" (`getProgramDay`, `profile.created_at`), "X kg perdus" (`profile.poids_actuel` de l'onboarding moins la dernière entrée de `weight_logs`, jamais négatif), "X jours d'affilée" (`useMissionStreak`). Les deux dernières stats affichent "…" tant que `useWeightLogs`/`useMissionStreak` chargent, plutôt que de flasher "0" avant la vraie valeur.

**Photo de profil.** Le cercle d'avatar est tapable (badge appareil photo en bas à droite) et ouvre toujours `expo-image-picker` (galerie, même demande de permission que les photos de progression), qu'une photo existe déjà ou non — remplacer l'avatar est juste un nouveau tap. `hooks/useAvatar.ts` reprend exactement le pattern de `useProgressPhotos.ts` : compression `expo-image-manipulator` (512px max, JPEG qualité 0.7, `base64: true`), upload vers le bucket privé `avatars` sous `{user_id}/avatar.jpg` via `lib/storageUpload.ts` (`upsert: true` — une nouvelle photo écrase toujours l'ancienne, fichier revérifié par `.list()` avant d'écrire quoi que ce soit), chemin enregistré dans la nouvelle colonne `profiles.avatar_path`, puis affichage via `createSignedUrl` (24h). Le hook ne gère que le stockage/la colonne — c'est l'écran qui appelle `refreshProfile()` après un upload ou une suppression réussis, comme pour tout autre champ de `profiles` modifié depuis cet onglet (`updateProfileField`). Un appui long sur l'avatar (uniquement quand une photo existe) propose de la supprimer (`showConfirm`) ; `uploadAvatar` renvoie `{ ok, error? }` et l'écran affiche `error` dans une alerte en cas d'échec, même pattern que les photos de progression.

Comme le chemin de stockage de l'avatar est fixe (`{user_id}/avatar.jpg`, jamais `{user_id}/{date}.jpg`), remplacer la photo ne change jamais `profiles.avatar_path` — la valeur est identique avant et après. `useAvatar` extrait donc sa logique de signature dans une fonction `sign(path)` réutilisable et l'appelle explicitement à la fin de `uploadAvatar()`, plutôt que de compter uniquement sur l'effet `useEffect(() => sign(avatarPath), [avatarPath])` : avec `avatarPath` inchangé, cet effet ne se redéclencherait jamais tout seul après un remplacement, et l'ancienne photo resterait affichée indéfiniment. Chaque signature ajoute aussi un paramètre `&t=${Date.now()}` à l'URL retournée, pour que RN traite l'URL comme une ressource différente et recharge l'image plutôt que de réutiliser ce qu'il a déjà en cache pour ce chemin.

**Mon abonnement** (`components/profil/SubscriptionCard.tsx`) a deux rendus complètement différents plutôt qu'un seul composant avec des branches internes lourdes : une carte accent lime "Passe à Premium" → paywall si `!isSubscribed`, ou une carte neutre avec Formule / Prochain renouvellement / Gérer mon abonnement / Changer de formule si abonné. "Formule" et "Prochain renouvellement" sont pour l'instant une valeur fixe ("Mensuel") et une date calculée localement (`// TODO: lire la formule et la date de renouvellement depuis RevenueCat` — ce sera branché une fois le paiement réel en place). "Gérer mon abonnement" et "Changer de formule" ouvrent tous les deux les réglages d'abonnement natifs du store (`Linking.openURL`, URL différente selon `Platform.OS`) — il n'existe pas d'API pour changer de formule autrement que depuis ces réglages, donc les deux lignes pointent vers le même endroit.

Chaque changement s'écrit immédiatement en base : `hooks/useSettings.ts` (sur le modèle de `useWeightLogs`/`useDailyMissions`) lit `user_settings`, crée une ligne par défaut si elle n'existe pas encore, et applique chaque `update()` de façon optimiste (revert local si l'écriture échoue). Les notifications ne sont pas branchées : le switch et les rappels enregistrent la préférence sans déclencher quoi que ce soit (`// TODO: brancher expo-notifications`). Les modales de sélection à choix unique (Objectif principal, Vitesse, Entraînements par semaine) réutilisent directement les options de `constants/questionnaire.ts` via `components/settings/ChoiceModal.tsx`. La modale "Poids objectif" réutilise le stepper sans clavier de l'écran Progression (`components/ui/NumberStepperModal.tsx`, extrait pour être partagé avec `components/progression/WeightEntryModal.tsx`). "Rappel du matin"/"Rappel du soir" utilisent un stepper heure/minute maison (`components/settings/TimePickerModal.tsx`) plutôt qu'un date-picker natif — pas de nouvelle dépendance, et ça reste testable sur web.

**Parrainage.** À l'inscription (`app/(onboarding)/signup.tsx`), `lib/referral.ts` génère un code de 8 caractères dérivé de l'email (ex. `LUCAS4K2` — jusqu'à 5 lettres/chiffres de la partie locale de l'email + un suffixe aléatoire complétant à 8 caractères), en vérifiant l'unicité en base avant de l'utiliser (jusqu'à 10 tentatives, puis repli sur un code entièrement aléatoire). `hooks/useReferral.ts` lit le nombre de filleuls (`referrals` où `parrain_id` = l'utilisateur) et regénère un code au vol si un profil plus ancien n'en a pas ; `redeemCode()` refuse le propre code de l'utilisateur et refuse un second parrainage (`profiles.parraine_par` déjà renseigné) avant d'insérer la ligne dans `referrals` et de mettre à jour `parraine_par`. Le bouton copie (`expo-clipboard`) et le bouton partage (`Share` de React Native) sont sur `components/settings/ReferralCard.tsx`.

**Mes données.** "Exporter mes données" réunit `profile` et toutes les lignes de l'utilisateur (`weight_logs`, `daily_missions`, `meals`, `progress_photos` — métadonnées seulement, pas les fichiers Storage eux-mêmes —, `messages`, `user_settings`, `referrals`) dans un objet JSON, partagé via `Share.share()` (pas de fichier généré, le JSON est envoyé directement comme texte). "Réinitialiser ma progression" efface `weight_logs`, `daily_missions`, `meals` et `progress_photos` (+ leurs fichiers Storage) mais garde `profiles`/`messages`/`user_settings` intacts — double confirmation (deux `showConfirm` imbriqués) avant d'exécuter, contrairement à la suppression de compte qui exige de taper un mot précis ; c'est une action moins grave puisque le compte survit. `hooks/useWeightLogs.ts` et `hooks/useMissionStreak.ts` exposent maintenant un `refetch()` (leur fonction de chargement, extraite en `useCallback`) uniquement pour que l'en-tête se mette à jour juste après une réinitialisation — sans ça, "X kg perdus" et "X jours d'affilée" resteraient affichées avec les anciennes valeurs jusqu'au prochain montage de l'écran.

**Suppression de compte**, en deux étapes : une alerte de confirmation classique, puis une modale qui exige de taper "SUPPRIMER" mot pour mot avant d'activer le bouton final. `deleteAccount()` (`context/AuthContext.tsx`) supprime les lignes de l'utilisateur dans toutes les tables (`messages`, `meals`, `daily_missions`, `weight_logs`, `progress_photos` — et les fichiers Storage associés, supprimés avant leur seule trace en base —, `user_settings`, `referrals` des deux côtés de la relation, puis `profiles`) et déconnecte. Supprimer le compte Supabase Auth lui-même demande la clé `service_role` (impossible côté client) : ce sera une Edge Function plus tard, comme déjà noté pour ce même problème sur les tables au tout début de ce README.

Tables à créer :

```sql
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_actives boolean not null default true,
  rappel_matin text not null default '08:00',
  rappel_soir text not null default '20:00',
  unite_poids text not null default 'kg',
  langue text not null default 'Français',
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own settings"
  on user_settings for delete
  using (auth.uid() = user_id);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  parrain_id uuid not null references auth.users(id) on delete cascade,
  filleul_id uuid not null references auth.users(id) on delete cascade,
  code_utilise text not null,
  created_at timestamptz not null default now(),
  unique (filleul_id) -- one redeemed code per account, enforced at the DB level too
);

alter table referrals enable row level security;

create policy "Users can insert referrals they're part of"
  on referrals for insert
  with check (auth.uid() = filleul_id or auth.uid() = parrain_id);

create policy "Users can read referrals they're part of"
  on referrals for select
  using (auth.uid() = filleul_id or auth.uid() = parrain_id);

create policy "Users can delete referrals they're part of"
  on referrals for delete
  using (auth.uid() = filleul_id or auth.uid() = parrain_id);

alter table profiles add column code_parrainage text unique;
alter table profiles add column parraine_par uuid references auth.users(id);
alter table profiles add column avatar_path text;
```

Puis, comme pour `progress-photos`, crée un bucket **privé** nommé `avatars` (Storage → New bucket, "Public bucket" décochée) et ses policies (objets préfixés `{user_id}/...`) :

```sql
create policy "Users can upload to their own avatar folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own avatar folder"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Visuels

`app.json` référence `./assets/icon.png`, `./assets/splash-icon.png` (splash, `resizeMode: "contain"`, fond `#0a0d0c`) et `./assets/adaptive-icon.png` (icône adaptative Android, même fond).

**`components/ui/AppImage.tsx` — le bug d'affichage corrigé.** Les photos de `assets/images/` avaient été retirées de l'app suite à un bug non résolu : le `View` conteneur d'`AppImage` avait un fond `colors.surface` permanent avec `overflow: 'hidden'`, appliqué qu'importe si l'image en dessous avait fini de charger — selon l'ordre de rendu (fond au-dessus de l'`<Image>` dans certains cas), le fond de repli pouvait rester visible par-dessus une image pourtant bien chargée. Le composant suit maintenant un état `loaded` (mis à `true` dans `onLoad`) : le fond `colors.surface` ne s'applique que si `!loaded || failed`, jamais une fois l'image affichée. L'`<Image>` reste en `StyleSheet.absoluteFill`, le voile `overlay` (0 à 1, assombrit pour la lisibilité du texte) par-dessus, et `onError` journalise systématiquement l'échec avec `console.error` (chemin de la source + erreur native) avant de basculer sur le fond de repli. `AppImage` accepte aussi des `children`, rendus par-dessus l'image et le voile — utilisé par l'état initial du scanner (icône + texte sur la photo de fond).

Toutes les photos de `assets/images/` sont maintenant utilisées quelque part dans l'app :

- **Logo** (`components/ui/Logo.tsx`) : `logo-mark.png` (le "G" lumineux) à gauche du texte "GLOWUP AI", hauteur paramétrable (`height`, 20px par défaut) — le texte et l'icône partagent la même taille.
- **Welcome** (`(onboarding)/welcome.tsx`) : `welcome-bg.jpg` en fond plein écran (`resizeMode="cover"`), avec un `LinearGradient` par-dessus (`expo-linear-gradient`, déjà une dépendance) allant de `rgba(10,13,12,0.25)` en haut à `colors.background` (opaque) en bas, avec un point intermédiaire à 60% de la hauteur — la photo reste visible sur les deux tiers supérieurs, le texte/CTA en bas restent sur fond plein.
- **Plan** (`(onboarding)/plan.tsx`) et **onglet Séance** (`(tabs)/workout.tsx`) : `plan-hero.jpg` en bandeau horizontal (180px sur l'écran plan, 140px sur l'onglet Séance ; rayon 16px ; voile 0.45 et 0.5 respectivement).
- **Questionnaire, question objectif** (`components/onboarding/OptionCard.tsx` via `components/onboarding/QuestionInput.tsx`) : vignette 56px (rayon 12px, voile 0.35) à gauche de chaque option, uniquement pour `question.id === 'goal'` — `goal-weightloss.jpg`, `goal-muscle.jpg`, `goal-glowup.jpg`, `goal-discipline.jpg` mappées par id d'option.
- **Paywall** (`components/onboarding/BenefitRow.tsx`) : vignette 44px (rayon 10px, voile 0.35) à la place de la pastille verte + coche, une par ligne de bénéfice — `benefit-coach.jpg`, `benefit-scanner.jpg`, `benefit-workout.jpg`, `benefit-progress.jpg`.
- **Dashboard** (`components/dashboard/WorkoutCard.tsx`) : vignette 56px (rayon 12px, voile 0.4) à gauche de chaque carte de séance recommandée, choisie selon `session.category` (`WORKOUT_CATEGORY_IMAGES` dans `constants/dashboard.ts` — `full_body`/`upper` retombent sur `exercise-dumbbells.jpg` faute d'assets dédiés, `lower` → `exercise-squat.jpg`, `cardio` → `exercise-cardio.jpg`).
- **Onglet Séance** : même bandeau `plan-hero.jpg` que l'écran Plan (140px) en tête, et chaque exercice listé reçoit une vignette 48px (`getExerciseThumbnail` dans `constants/dashboard.ts` — classification par mots-clés dans le nom de l'exercice : squat/fente/soulevé/mollet/hip thrust/jambe → `exercise-squat.jpg`, jumping/burpee/mountain/corde/sauté/dynamique → `exercise-cardio.jpg`, tout le reste → `exercise-dumbbells.jpg`).
- **Scanner** (`(tabs)/scanner.tsx`), état initial : `meal-example.jpg` en fond de la zone centrale (rayon 16px, voile 0.6), icône appareil photo + texte affichés par-dessus via les `children` d'`AppImage`.
- **Historique des repas** (`(tabs)/meals.tsx`) : chaque repas sans photo propre affiche une vignette générique 48px choisie selon l'heure de `created_at` (`getMealTimeThumbnail`) — `meal-breakfast.jpg` avant 11h, `meal-lunch.jpg` avant 17h, `meal-dinner.jpg` ensuite.

**À savoir : certaines photos sources sont très sombres.** `welcome-bg.jpg`, `plan-hero.jpg` et `exercise-dumbbells.jpg` (ainsi que plusieurs `benefit-*.jpg`) sont des photos de stock au ton volontairement sombre/dramatique (fond quasi noir, sujet faiblement éclairé). `AppImage` les charge et les affiche correctement avec le voile demandé — le rendu qui en résulte reste néanmoins très sombre, voire quasi indiscernable sur de petites vignettes (48-56px) ou avec le voile le plus fort (0.5-0.6). Ce n'est pas un bug de chargement (aucune erreur, `onLoad` se déclenche normalement) mais une caractéristique des photos choisies : à remplacer par des photos plus claires si un rendu plus visible est souhaité sur ces emplacements précis.

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

- Étendre les photos de progression à la prise de vue directe (`expo-image-picker` — galerie uniquement pour l'instant, caméra à ajouter si besoin).
- Déplacer les appels Anthropic (coach, scanner) derrière un backend (Edge Function) pour ne plus exposer `EXPO_PUBLIC_ANTHROPIC_API_KEY` côté client.
- Remplacer le CTA du paywall par un vrai flux d'achat (RevenueCat).
- Implémenter Sign in with Apple / Google Sign-In (development build requis).
- Ajouter une Edge Function pour la suppression complète du compte Supabase Auth.
- Brancher `expo-notifications` sur les préférences de `profil.tsx` (switch + rappels matin/soir) — pour l'instant elles s'enregistrent sans déclencher aucune notification.
- Brancher RevenueCat pour que "Formule" et "Prochain renouvellement" (`components/profil/SubscriptionCard.tsx`) affichent de vraies données plutôt que des valeurs provisoires.
- Décider si/où réutiliser `AppImage.tsx`.
