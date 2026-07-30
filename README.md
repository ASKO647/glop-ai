# GlowUp AI

App mobile de coaching fitness et transformation physique par IA — React Native + Expo Router + TypeScript.

Cette base ne contient que la **structure de navigation** et des **écrans vides** (titre + placeholder). Aucune logique métier, aucun appel API, aucune base de données pour l'instant.

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
    _layout.tsx             Stack d'onboarding
    welcome.tsx
    signup.tsx
    questionnaire.tsx
    analyse.tsx
    plan.tsx
    paywall.tsx
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
  ui/
    Button.tsx
    Card.tsx
    ProgressBar.tsx
    index.ts

constants/
  theme.ts                   Couleurs, rayons, espacements, typographie — source unique de vérité
```

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
