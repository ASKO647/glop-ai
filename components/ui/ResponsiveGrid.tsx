import type { ReactNode } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Slightly under `100 / columns` so two cards plus the row gap never wrap to the next line.
const COLUMN_WIDTH: Record<number, DimensionValue> = {
  2: '48%',
  3: '31%',
  4: '23%',
};

type ResponsiveGridProps = {
  children: ReactNode[];
  desktopColumns: 2 | 3 | 4;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Wraps a list of cards into an N-column grid on desktop only. Below the desktop breakpoint this
 * renders the exact same single-column stack as before this component existed — same gap, same
 * children, no wrapper around each item.
 */
export default function ResponsiveGrid({ children, desktopColumns, gap = spacing.sm, style }: ResponsiveGridProps) {
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    return <View style={[{ gap }, style]}>{children}</View>;
  }

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {children.map((child, index) => (
        <View key={index} style={{ width: COLUMN_WIDTH[desktopColumns] }}>
          {child}
        </View>
      ))}
    </View>
  );
}
