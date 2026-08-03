import { Camera } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatWeight } from '../../constants/progression';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type ProfileHeaderProps = {
  initial: string;
  email: string;
  isSubscribed: boolean;
  programDay: number;
  programLength: number;
  /** null while unknown (no start weight / no logs yet). */
  weightLost: number | null;
  streak: number;
  statsLoading: boolean;
  avatarUrl: string | null;
  avatarUploading: boolean;
  onPressAvatar: () => void;
  onLongPressAvatar: () => void;
};

export default function ProfileHeader({
  initial,
  email,
  isSubscribed,
  programDay,
  programLength,
  weightLost,
  streak,
  statsLoading,
  avatarUrl,
  avatarUploading,
  onPressAvatar,
  onLongPressAvatar,
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          avatarUrl ? 'Photo de profil — appui long pour la supprimer' : 'Ajouter une photo de profil'
        }
        onPress={onPressAvatar}
        onLongPress={avatarUrl ? onLongPressAvatar : undefined}
        style={styles.avatarWrap}
      >
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              onError={(e) => console.error(`Failed to load avatar (${avatarUrl}):`, e.nativeEvent.error)}
            />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
          {avatarUploading && (
            <View style={styles.avatarOverlay}>
              {/* Drawn over the fixed black photo scrim (avatarOverlay) — needs a fixed light
                  color, not theme-reactive colors.accent (illegible in light mode's dark-green accent). */}
              <ActivityIndicator color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.cameraBadge}>
          {/* Icon on an accent-filled badge circle — onAccent, not colors.background. */}
          <Camera color={colors.onAccent} size={13} />
        </View>
      </Pressable>

      <Text style={styles.email} numberOfLines={1}>
        {email}
      </Text>

      <View style={[styles.badge, isSubscribed ? styles.badgePremium : styles.badgeFree]}>
        <Text style={[styles.badgeText, isSubscribed ? styles.badgeTextPremium : styles.badgeTextFree]}>
          {isSubscribed ? 'Premium' : 'Gratuit'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{`Jour ${programDay} / ${programLength}`}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {statsLoading ? '…' : weightLost != null ? `${formatWeight(weightLost)} kg perdus` : '—'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {statsLoading ? '…' : `${streak} jour${streak > 1 ? 's' : ''} d'affilée`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatarWrap: {
      width: 72,
      height: 72,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 13, 12, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.accent,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    email: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    badge: {
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
    },
    badgePremium: {
      backgroundColor: colors.accent,
    },
    badgeFree: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    // Text on an accent-filled badge — onAccent, not colors.background.
    badgeTextPremium: {
      color: colors.onAccent,
    },
    badgeTextFree: {
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    stat: {
      paddingHorizontal: spacing.sm,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
    },
  });
}
