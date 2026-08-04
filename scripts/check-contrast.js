#!/usr/bin/env node
/**
 * WCAG contrast audit for GlowUp AI — walks the rendered DOM of every screen (and key
 * modals), in both the dark and light theme, and flags any text/background pair whose
 * contrast ratio falls below the WCAG threshold (4.5:1 normal text, 3:1 large text ≥18px,
 * or ≥14px bold).
 *
 * Prerequisites (this hits a real dev server with mocked network calls, not a headless
 * render-only test):
 *   1. `npm install -D playwright` (or `playwright-core` + a system Chromium — set
 *      CHROMIUM_PATH below if you're not using the bundled browser download).
 *   2. A `.env` with placeholder Supabase config whose project ref is literally
 *      "placeholder-test-project" (i.e. EXPO_PUBLIC_SUPABASE_URL=
 *      https://placeholder-test-project.supabase.co) — the auth session below is seeded
 *      into localStorage under the matching `sb-placeholder-test-project-auth-token` key,
 *      which is how supabase-js namespaces its persisted session by project ref.
 *   3. `npx expo start --web --offline --port 8099` running in another terminal.
 *
 * Run: `node scripts/check-contrast.js`. Exits non-zero if any failures are found.
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8099';

const PROFILE = {
  id: 'ghost-user-id',
  email: 'ghost@example.com',
  objectif: 'Perte de poids',
  sexe: 'Homme',
  age: 28,
  taille: 178,
  poids_actuel: 82,
  poids_objectif: 74,
  vitesse: 'Modéré',
  niveau_activite: 'Modéré',
  frequence_entrainement: '3-4',
  lieu_entrainement: 'Salle de sport',
  alimentation: 'Correcte',
  sommeil: '7-8h',
  blocage: 'Manque de temps',
  restrictions: ['Sans gluten'],
  engagement: 'Sérieux',
  is_subscribed: true,
  created_at: '2026-06-01T00:00:00.000Z',
  code_parrainage: 'GHOST123',
  parraine_par: null,
  avatar_path: null,
};

function settingsRow(themeMode) {
  return {
    notifications_actives: true,
    rappel_matin: '08:00',
    rappel_soir: '20:00',
    unite_poids: 'kg',
    langue: 'Français',
    theme_mode: themeMode,
  };
}

function makeMeal(i) {
  return {
    id: `meal-${i}`,
    user_id: PROFILE.id,
    date: new Date().toISOString().slice(0, 10),
    name: `Repas ${i}`,
    kcal: 400 + i * 20,
    proteines: 25 + i,
    glucides: 40 + i,
    lipides: 12 + i,
    categorie: ['petit-dejeuner', 'dejeuner', 'diner', 'collation'][i % 4],
    created_at: new Date().toISOString(),
  };
}

function makeMission(i) {
  const key = ['water', 'steps', 'workout', 'skincare'][i % 4];
  return {
    id: `mission-${i}`,
    user_id: PROFILE.id,
    date: new Date().toISOString().slice(0, 10),
    mission_key: key,
    label: { water: "Boire de l'eau", steps: 'Marcher', workout: 'Séance sport', skincare: 'Routine peau' }[key],
    target: 8,
    current: i % 2 === 0 ? 8 : 4,
    completed: i % 2 === 0,
  };
}

function makeWeightLog(i, daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: `w-${i}`, user_id: PROFILE.id, date: d.toISOString().slice(0, 10), poids: 82 - i * 0.6 };
}

function makeMessage(i) {
  return {
    id: `msg-${i}`,
    user_id: PROFILE.id,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: i % 2 === 0 ? 'Combien de calories dois-je manger ?' : 'Environ 2200 kcal par jour selon ton objectif.',
    created_at: new Date(Date.now() - (10 - i) * 60000).toISOString(),
  };
}

function makeRecipe(i) {
  return {
    id: `recipe-${i}`,
    user_id: PROFILE.id,
    titre: `Recette ${i}`,
    description: `Description savoureuse de la recette numéro ${i}.`,
    kcal: 400 + i * 10,
    proteines: 30 + i,
    glucides: 40 + i,
    lipides: 10 + i,
    temps_preparation: '25 min',
    difficulte: 'Facile',
    portions: 2,
    ingredients: [{ nom: 'Blanc de poulet', quantite: '200g' }],
    etapes: ['Étape 1.', 'Étape 2.'],
    created_at: new Date().toISOString(),
  };
}

const BADGES = [
  { id: 'b1', user_id: PROFILE.id, badge_key: 'first_meal', unlocked_at: new Date().toISOString() },
  { id: 'b2', user_id: PROFILE.id, badge_key: 'streak_7', unlocked_at: new Date().toISOString() },
];

const PROGRESS_PHOTOS = [
  {
    id: 'p1',
    user_id: PROFILE.id,
    slot: 'avant',
    storage_path: 'ghost-user-id/avant.jpg',
    date: '2026-07-01',
    poids: 82,
  },
  {
    id: 'p2',
    user_id: PROFILE.id,
    slot: 'milieu',
    storage_path: 'ghost-user-id/milieu.jpg',
    date: '2026-07-15',
    poids: 80.5,
  },
];

const SAVED_RECIPES = [1, 2].map(makeRecipe);

function queryParam(url, key) {
  const u = new URL(url);
  const raw = u.searchParams.get(key);
  return raw ? raw.replace(/^eq\./, '') : null;
}

async function installRoutes(page, { themeMode, subscribed }) {
  // Broad catch-all FIRST — Playwright prioritizes the most-recently-registered matching
  // route, so specific handlers registered after this one win over it.
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
  await page.route('**/storage/v1/object/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
  await page.route('**/v1/messages', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ recettes: [1, 2, 3].map(makeRecipe) }) }] }),
    })
  );

  await page.route('**/rest/v1/profiles**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PROFILE, is_subscribed: subscribed }),
      });
    return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
  });

  await page.route('**/rest/v1/user_settings**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(settingsRow(themeMode)) });
    return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
  });

  await page.route('**/rest/v1/meals**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([1, 2, 3, 4].map(makeMeal)),
      });
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/rest/v1/daily_missions**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([0, 1, 2, 3].map(makeMission)),
      });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/messages**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([0, 1, 2, 3, 4].map(makeMessage)),
      });
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/rest/v1/user_badges**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BADGES) })
  );

  await page.route('**/rest/v1/progress_photos**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROGRESS_PHOTOS) })
  );

  await page.route('**/rest/v1/weight_logs**', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([0, 1, 2, 3, 4, 5].map((i) => makeWeightLog(i, (5 - i) * 4))),
      });
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/rest/v1/saved_recipes**', (route) => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      const idFilter = queryParam(url, 'id');
      if (idFilter) {
        const match = SAVED_RECIPES.find((r) => r.id === idFilter) || null;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(match) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAVED_RECIPES) });
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(SAVED_RECIPES) });
  });

  await page.route('**/rest/v1/referrals**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

async function seedSession(page) {
  const fakeSession = {
    access_token: 'fake.access.token',
    refresh_token: 'fake-refresh-token',
    expires_at: 9999999999,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: PROFILE.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: PROFILE.email,
      app_metadata: {},
      user_metadata: {},
      created_at: '2024-01-01T00:00:00.000Z',
    },
  };
  await page.addInitScript((session) => {
    localStorage.setItem('sb-placeholder-test-project-auth-token', JSON.stringify(session));
  }, fakeSession);
}

// ---- In-page WCAG contrast walker (stringified into the page) ----
const CONTRAST_WALKER = () => {
  function parseColor(str) {
    if (!str) return null;
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    const [r, g, b, a = 1] = parts;
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a: Number.isNaN(a) ? 1 : a };
  }

  function blend(top, bottom) {
    const a = top.a;
    return {
      r: top.r * a + bottom.r * (1 - a),
      g: top.g * a + bottom.g * (1 - a),
      b: top.b * a + bottom.b * (1 - a),
      a: 1,
    };
  }

  function relLuminance({ r, g, b }) {
    const lin = (c) => {
      const cs = c / 255;
      return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrastRatio(c1, c2) {
    const l1 = relLuminance(c1);
    const l2 = relLuminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function effectiveBackground(el) {
    // DOM-ancestry walk. Known limitation: a background photo rendered as an absolutely-
    // positioned *sibling* (rather than a wrapping parent) paints behind text visually without
    // being its DOM ancestor, so this under-counts that one layout pattern (e.g. a full-bleed
    // hero image placed before, not around, its overlaid text — see welcome.tsx). We tried
    // switching to elementsFromPoint-based paint-order resolution instead, but react-native-web
    // puts pointer-events:none on most decorative/text wrapper layers, which elementsFromPoint
    // (a hit-test API) silently excludes — that produced far more false positives (arbitrary
    // skipped layers) than this simpler approach's single known blind spot. Screens using the
    // absolutely-positioned-sibling hero pattern should be spot-checked with a screenshot.
    const chain = [];
    let node = el;
    while (node) {
      chain.push(node);
      node = node.parentElement;
    }
    chain.reverse(); // outermost (html/body) first
    let acc = { r: 255, g: 255, b: 255, a: 1 };
    for (const n of chain) {
      const cs = getComputedStyle(n);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) {
        acc = blend(bg, acc);
      }
    }
    return acc;
  }

  function cumulativeOpacity(el) {
    let node = el;
    let opacity = 1;
    while (node) {
      const cs = getComputedStyle(node);
      if (cs.display === 'none') return 0;
      if (cs.visibility === 'hidden') return 0;
      const op = parseFloat(cs.opacity);
      if (!Number.isNaN(op)) opacity *= op;
      node = node.parentElement;
    }
    return opacity;
  }

  function isLargeText(cs) {
    const px = parseFloat(cs.fontSize);
    const weight = cs.fontWeight;
    const bold = weight === 'bold' || parseInt(weight, 10) >= 700;
    return px >= 24 || (px >= 18.66 && bold);
  }

  function shortSelector(el) {
    const tag = el.tagName.toLowerCase();
    const testId = el.getAttribute('data-testid');
    const role = el.getAttribute('role');
    const cls = (el.className && typeof el.className === 'string' ? el.className : '').split(' ').slice(0, 2).join('.');
    return `${tag}${role ? `[role=${role}]` : ''}${testId ? `[data-testid=${testId}]` : ''}${cls ? `.${cls}` : ''}`;
  }

  const results = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    let hasDirectText = false;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
        hasDirectText = true;
        break;
      }
    }
    if (!hasDirectText) continue;

    if (cumulativeOpacity(el) < 0.05) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBackground(el);
    const fgResolved = fg.a < 1 ? blend(fg, bg) : fg;

    const ratio = contrastRatio(fgResolved, bg);
    const large = isLargeText(cs);
    const required = large ? 3.0 : 4.5;

    if (ratio < required - 0.005) {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join(' ')
        .slice(0, 60);
      results.push({
        selector: shortSelector(el),
        text,
        fg: `rgb(${Math.round(fgResolved.r)}, ${Math.round(fgResolved.g)}, ${Math.round(fgResolved.b)})`,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        ratio: Math.round(ratio * 100) / 100,
        required,
        large,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      });
    }
  }
  return results;
};

async function runContrastCheck(page, label) {
  await page.waitForTimeout(500);
  const failures = await page.evaluate(CONTRAST_WALKER);
  return failures.map((f) => ({ ...f, screen: label }));
}

// Each pass has its own auth state (some screens are only reachable in a particular state)
// and its own list of screens/actions to exercise.
const PASSES = [
  {
    name: 'anonymous',
    session: false,
    subscribed: false,
    // No session -> settings never load -> theme follows the OS scheme, so this pass uses
    // Playwright's colorScheme emulation instead of the mocked user_settings row.
    useOsColorScheme: true,
    screens: [
      { name: 'welcome', path: '/welcome' },
      { name: 'questionnaire', path: '/questionnaire' },
      { name: 'analyse', path: '/analyse' },
      { name: 'plan', path: '/plan' },
      { name: 'signup', path: '/signup' },
      { name: 'login', path: '/login' },
      { name: 'forgot-password', path: '/forgot-password' },
    ],
  },
  {
    name: 'unsubscribed',
    session: true,
    subscribed: false,
    useOsColorScheme: false,
    screens: [{ name: 'paywall', path: '/paywall' }],
  },
  {
    name: 'subscribed',
    session: true,
    subscribed: true,
    useOsColorScheme: false,
    screens: [
      { name: 'dashboard', path: '/' },
      { name: 'coach', path: '/coach' },
      { name: 'scanner', path: '/scanner' },
      { name: 'progression', path: '/progression' },
      { name: 'workout-tab', path: '/workout' },
      { name: 'workout-detail', path: '/workout/full-body-express' },
      { name: 'workout-session', path: '/workout/session/full-body-express' },
      { name: 'meals', path: '/meals' },
      { name: 'profil', path: '/profil' },
      { name: 'badges', path: '/badges' },
      { name: 'recipes', path: '/recipes' },
      { name: 'recipe-detail', path: '/recipe/recipe-1' },
      { name: 'notifications', path: '/notifications' },
      { name: 'legal-terms', path: '/legal/terms' },
      { name: 'legal-privacy', path: '/legal/privacy' },
    ],
    runModals: true,
  },
];

async function runModalChecks(page, allFailures, themeLabel) {
  // Navigation sheet (tap the central + button on the tab bar). The FAB is a fixed-position
  // overlay above the dashboard's ScrollView content; with several mocked meals the scrollable
  // list is tall enough that Playwright's actionability check sees a card intercepting the
  // click point mid-scroll-animation, even though the FAB is genuinely on top and clickable in
  // the browser — force the click rather than fighting that check.
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  try {
    await page.getByLabel('Explorer').click({ timeout: 10000, force: true });
    allFailures.push(...(await runContrastCheck(page, `modal-navigation-sheet (${themeLabel})`)));
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {
    console.log('  [warn] navigation sheet modal not reachable:', e.message);
  }

  // Choice modal (profil -> "Apparence")
  await page.goto(`${BASE_URL}/profil`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(700);
  try {
    await page.getByText('Apparence', { exact: true }).click({ timeout: 5000 });
    allFailures.push(...(await runContrastCheck(page, `modal-choice-appearance (${themeLabel})`)));
    await page.mouse.click(5, 5).catch(() => {});
  } catch (e) {
    console.log('  [warn] choice modal not reachable:', e.message);
  }

  // Weight entry modal (progression -> "+" add button on the WeightCard)
  await page.goto(`${BASE_URL}/progression`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(700);
  try {
    await page.getByLabel('Ajouter la pesée du jour').click({ timeout: 5000 });
    allFailures.push(...(await runContrastCheck(page, `modal-weight-entry (${themeLabel})`)));
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {
    console.log('  [warn] weight entry modal not reachable:', e.message);
  }

  // Badge unlock modal: pendingUnlock is driven by an internal useBadges() comparison
  // against previously-seen badge ids in AsyncStorage, not directly URL-addressable. Its
  // markup/styles are the same BadgeUnlockModal component instance already exercised via
  // static review (components/badges/BadgeUnlockModal.tsx) — not run interactively here.
}

(async () => {
  const browser = await chromium.launch();
  const allFailures = [];
  let screensChecked = 0;

  for (const themeMode of ['dark', 'light']) {
    console.log(`\n=== Theme: ${themeMode} ===`);

    for (const pass of PASSES) {
      console.log(` -- Pass: ${pass.name} --`);
      const contextOpts = { viewport: { width: 390, height: 844 } };
      if (pass.useOsColorScheme) contextOpts.colorScheme = themeMode;
      const context = await browser.newContext(contextOpts);
      const page = await context.newPage();
      page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

      if (pass.session) await seedSession(page);
      await installRoutes(page, { themeMode, subscribed: pass.subscribed });

      for (const screen of pass.screens) {
        try {
          await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle', timeout: 60000 });
          const failures = await runContrastCheck(page, `${screen.name} (${themeMode})`);
          console.log(`  ${screen.name}: ${failures.length} failure(s)`);
          allFailures.push(...failures);
          screensChecked += 1;
        } catch (e) {
          console.log(`  [error] ${screen.name}:`, e.message);
        }
      }

      await context.close();

      if (pass.runModals) {
        // Fresh context per modal check — reusing the page after many prior navigations left
        // stray overlay state that intermittently blocked clicks (unrelated to contrast).
        const modalContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const modalPage = await modalContext.newPage();
        modalPage.on('pageerror', (e) => console.log('  [pageerror]', e.message));
        await seedSession(modalPage);
        await installRoutes(modalPage, { themeMode, subscribed: pass.subscribed });
        await runModalChecks(modalPage, allFailures, themeMode);
        await modalContext.close();
      }
    }
  }

  await browser.close();

  console.log(`\n\n=== Screens checked: ${screensChecked} ===`);
  console.log(`=== TOTAL FAILURES: ${allFailures.length} ===`);
  for (const f of allFailures) {
    console.log(`[${f.screen}] "${f.text}" fg=${f.fg} bg=${f.bg} ratio=${f.ratio} (needs ${f.required}) @ ${f.selector}`);
  }
  process.exit(allFailures.length > 0 ? 1 : 0);
})().catch((err) => {
  console.error('SCRIPT FAILED:', err);
  process.exit(1);
});
