import { Children, Fragment, isValidElement, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {row}
            {index < rows.length - 1 && <View style={styles.separator} />}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.labelMuted,
      paddingHorizontal: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 36 + spacing.md + spacing.sm,
    },
  });
}
