import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type StatTileProps = {
  Icon: LucideIcon;
  value: string;
  label: string;
};

export default function StatTile({ Icon, value, label }: StatTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.tile}>
      <Icon color={colors.accent} size={18} />
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    tile: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: 6,
    },
    value: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.accent,
    },
    label: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
