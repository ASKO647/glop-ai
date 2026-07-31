# GlowUp AI

App mobile de coaching fitness et transformation physique par IA — React Native + Expo Router + TypeScript.

Cette base contient la **structure de navigation**, des **écrans vides** (titre + placeholder), et un onboarding fonctionnel de bout en bout : **questionnaire** (15 questions), **analyse** (progression animée), **plan** (résultat calculé depuis les réponses) et **paywall** (2 plans sélectionnables). Pas d'appel API, de base de données, ni de paiement réel pour l'instant.

## Lancer le projet

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

## Structure du projet

```
app/
  _layout.tsx              Root layout : redirige vers l'onboarding si non connecté
                            (Stack.Protected sur `isAuthenticated`, actuellement figé à false)
  (onboarding)/
    _layout.tsx             Stack d'onboarding, enveloppé dans OnboardingProvider
    welcome.tsx
    questionnaire.tsx        Écran complet : 15 questions, une par écran
    analyse.tsx               Cercle de progression animé (0→87%, ~4s) + checklist, redirige vers plan
    plan.tsx                   Résultat calculé depuis OnboardingContext (objectif, écart de poids, axes)
    signup.tsx
    paywall.tsx               2 cartes de plan sélectionnables (annuel / mensuel), aucun paiement déclenché
  (tabs)/
    _layout.tsx             Barre de tabs (fond #101410, icônes lucide-react-native, actif #c6ff3a)
    index.tsx                Dashboard
    coach.tsx
    scanner.tsx
    progression.tsx
    profil.tsx

components/
  ScreenPlaceholder.tsx      Écran placeholder générique (tabs)
  OnboardingStep.tsx         Écran placeholder générique (onboarding, avec bouton "Continuer")
  onboarding/
    QuestionInput.tsx         Dispatcher par type de question (single / multiple / numeric)
    OptionCard.tsx             Carte de réponse (bordure + fond accent quand sélectionnée)
    NumericStepper.tsx         Sélecteur numérique (âge, taille, poids)
    ProgressRing.tsx           Cercle de progression SVG animé (écran analyse)
    AnalysisStepRow.tsx        Étape de checklist (gris → accent + coche) (écran analyse)
    BenefitRow.tsx              Ligne de bénéfice avec pastille + coche (écran paywall)
    PlanCard.tsx                Carte de plan sélectionnable (écran paywall)
    RadioDot.tsx                 Bouton radio (vide / rempli) (écran paywall)
  ui/
    Button.tsx
    Card.tsx
    ProgressBar.tsx
    index.ts

constants/
  theme.ts                   Couleurs, rayons, espacements, typographie — source unique de vérité
  questionnaire.ts            Les 15 questions (id, type, options)

context/
  OnboardingContext.tsx       State React des réponses du questionnaire (pas de persistance)
```

## Flow d'onboarding

`welcome` → `questionnaire` (15 questions) → `analyse` → `plan` → `signup` → `paywall` → `(tabs)`

Le bouton "J'ai déjà un compte" sur l'écran `welcome` va directement à `signup`, en court-circuitant le questionnaire.

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

- Remplacer `isAuthenticated` (codé en dur dans `app/_layout.tsx`) par un vrai état de session.
- Implémenter chaque écran un par un (formulaires, appels API, persistance).
