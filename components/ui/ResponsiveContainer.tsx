import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const MAX_WIDTH = 1200;
const SIDE_MARGIN = 32;

type ResponsiveContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Caps content width on desktop so it doesn't stretch edge-to-edge on wide screens — centered,
 * 1200px max, 32px side margins. A no-op below the desktop breakpoint: mobile/tablet render
 * exactly as if this wrapper weren't there.
 */
export default function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    paddingHorizontal: SIDE_MARGIN,
  },
});
