// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's own defaults already include jpg/jpeg, but this project has hit a corrupted
// @expo/metro-config install before (missing from node_modules/@expo/ at the project
// root), which makes the effective asset extension list depend on exactly which nested
// copy of that package happens to resolve. Asserting the list explicitly here removes
// that ambiguity — local JPEGs (and other common image types) load regardless of what
// state node_modules is in.
const REQUIRED_ASSET_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, ...REQUIRED_ASSET_EXTS]));

// Any of these listed as source extensions would make Metro try to parse the binary
// file as JS/TS instead of bundling it as a static asset.
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => !REQUIRED_ASSET_EXTS.includes(ext));

module.exports = config;
