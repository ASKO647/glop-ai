// Mirrors the floating tab bar's own geometry (app/(tabs)/_layout.tsx) — the single source of
// truth for both the bar itself and every scrolling screen that needs to clear it, so the two
// can never drift out of sync again.
export const TAB_BAR_HEIGHT = 68;
export const TAB_BAR_BOTTOM_MARGIN_MIN = 24;
const TAB_BAR_BREATHING_ROOM = 24;

/**
 * Minimum `paddingBottom` any scrollable content behind the floating tab bar needs, so its last
 * item never sits underneath the bar — bar height + its minimum bottom margin + extra breathing
 * room. Devices with a larger bottom safe-area inset push the bar even higher than this, so this
 * constant is a safe floor, not a device-exact measurement.
 */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN_MIN + TAB_BAR_BREATHING_ROOM;
