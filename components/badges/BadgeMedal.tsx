import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

type BadgeMedalProps = {
  Icon: LucideIcon;
  unlocked: boolean;
  size: number;
  iconSize: number;
};

/** The circular icon medallion shared by the badges grid, the dashboard strip, and the unlock modal. */
export default function BadgeMedal({ Icon, unlocked, size, iconSize }: BadgeMedalProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        unlocked ? styles.circleUnlocked : styles.circleLocked,
      ]}
    >
      <Icon color={unlocked ? colors.background : colors.borderMuted} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleUnlocked: {
    backgroundColor: colors.accent,
  },
  circleLocked: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
