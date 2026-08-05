import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type PastDateBannerProps = {
  label: string;
  onReset: () => void;
};

export default function PastDateBanner({ label, onReset }: PastDateBannerProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.text} numberOfLines={1}>
        {t('dashboard.pastDate.viewing', { date: label })}
      </Text>
      <Pressable accessibilityRole="button" onPress={onReset} hitSlop={8}>
        {({ pressed }) => (
          <Text style={[styles.link, pressed && styles.linkPressed]}>{t('dashboard.pastDate.reset')}</Text>
        )}
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    text: {
      flexShrink: 1,
      fontSize: 12,
      color: colors.textSecondary,
    },
    link: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    linkPressed: {
      opacity: 0.7,
    },
  });
}
