import { useRouter } from 'expo-router';
import { ArrowLeft, BellOff } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Colors } from '../constants/theme';
import { radii, spacing, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.centered}>
        <BellOff color={colors.textTertiary} size={32} />
        <Text style={styles.emptyTitle}>Aucune notification</Text>
        <Text style={styles.emptyText}>Tu seras prévenu ici dès qu'il y aura du nouveau.</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    headerTitle: {
      ...typography.heading,
      color: colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
