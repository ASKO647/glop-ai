// Contournement temporaire : les images JPEG locales (`assets/images/*.jpg`) ne se chargent
// pas dans Expo Go malgré un `metro.config.js` correct et des fichiers valides. En attendant,
// tous les fichiers de `assets/images/` ont été téléversés dans le bucket public Supabase
// `app-images` sous les mêmes noms, et sont servis depuis là via `appImage(name)`. À réévaluer
// une fois l'app passée en development build (les `require()` locaux redeviennent alors l'option
// normale) — ne pas laisser ce contournement s'installer durablement.

const BASE = 'https://qzmntduiztddspskrqqc.supabase.co/storage/v1/object/public/app-images';

export function appImage(name: string): { uri: string } {
  return { uri: `${BASE}/${name}` };
}
