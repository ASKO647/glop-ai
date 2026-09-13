import { useWindowDimensions } from 'react-native';

export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1024;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type BreakpointInfo = {
  breakpoint: Breakpoint;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

/**
 * Reactive breakpoint info based on `useWindowDimensions` (unlike `Dimensions.get`, this
 * re-renders on window resize on web). Mobile stays the default in every dimension of the
 * app — every desktop/tablet-only behavior must be additive and gated by `isDesktop`/`isTablet`
 * from this hook, never the other way around.
 */
export function useBreakpoint(): BreakpointInfo {
  const { width } = useWindowDimensions();

  let breakpoint: Breakpoint = 'mobile';
  if (width >= BREAKPOINT_DESKTOP) breakpoint = 'desktop';
  else if (width >= BREAKPOINT_TABLET) breakpoint = 'tablet';

  return {
    breakpoint,
    width,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  };
}
