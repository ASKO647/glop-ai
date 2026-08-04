import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type BadgeMedalProps = {
  Icon: LucideIcon;
  unlocked: boolean;
  size: number;
  iconSize: number;
};

/** The circular icon medallion shared by the badges grid, the dashboard strip, and the unlock modal. */
export default function BadgeMedal({ Icon, unlocked, size, iconSize }: BadgeMedalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        unlocked ? styles.circleUnlocked : styles.circleLocked,
      ]}
    >
      <Icon color={unlocked ? colors.onAccent : colors.textTertiary} size={iconSize} />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
}
