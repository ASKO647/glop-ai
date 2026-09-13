import { useState } from 'react';

/**
 * Hover state via `onHoverIn`/`onHoverOut` — supported cross-platform by RN's `Pressable` typings,
 * but only ever fires from a mouse (web, effectively), so this is a no-op everywhere else. Spread
 * `hoverProps` onto a `Pressable` and read `hovered` to drive a web-only hover style.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);

  return {
    hovered,
    hoverProps: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    },
  };
}
