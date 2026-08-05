import { Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate } from '../../constants/dashboard';
import { formatWeight } from '../../constants/progression';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { PHOTO_SLOTS, slotLabel, type PhotoSlot, type ProgressPhoto } from '../../hooks/useProgressPhotos';
import { showConfirm } from '../../lib/alert';

type PhotosCardProps = {
  photosBySlot: Record<PhotoSlot, ProgressPhoto | null>;
  loading: boolean;
  uploadingSlot: PhotoSlot | null;
  onPressSlot: (slot: PhotoSlot) => void;
  onDeleteSlot: (slot: PhotoSlot) => void;
};

export default function PhotosCard({ photosBySlot, loading, uploadingSlot, onPressSlot, onDeleteSlot }: PhotosCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const confirmDelete = (slot: PhotoSlot) => {
    showConfirm(
      t('progression.photos.deleteTitle'),
      t('progression.photos.deleteMessage', { slot: slotLabel(t, slot) }),
      t('progression.photos.deleteConfirmLabel'),
      () => onDeleteSlot(slot)
    );
  };

  return (
    <View style={styles.row}>
      {PHOTO_SLOTS.map((slot) => {
        const photo = photosBySlot[slot];
        const isUploading = uploadingSlot === slot;

        return (
          <View key={slot} style={styles.column}>
            <Text style={styles.label}>{slotLabel(t, slot)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                photo
                  ? t('progression.photos.replaceAccessibility', { slot: slotLabel(t, slot) })
                  : t('progression.photos.addAccessibility', { slot: slotLabel(t, slot) })
              }
              onPress={() => onPressSlot(slot)}
              onLongPress={photo ? () => confirmDelete(slot) : undefined}
              style={({ pressed }) => [styles.frame, !photo && styles.frameEmpty, pressed && styles.pressed]}
            >
              {photo ? (
                <>
                  {photo.signedUrl && (
                    <Image
                      source={{ uri: photo.signedUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                      onError={(e) =>
                        console.error(`Failed to load "${slot}" progress photo (${photo.signedUrl}):`, e.nativeEvent.error)
                      }
                    />
                  )}
                  <View style={styles.overlay}>
                    <Text style={styles.overlayDate} numberOfLines={1}>
                      {formatDisplayDate(photo.date)}
                    </Text>
                    {photo.poids != null && (
                      <Text style={styles.overlayWeight}>{formatWeight(photo.poids, locale)} kg</Text>
                    )}
                  </View>
                </>
              ) : (
                !isUploading && (
                  <View style={styles.emptyContent}>
                    <Plus color={colors.textTertiary} size={22} />
                    <Text style={styles.emptyText}>{t('progression.photos.add')}</Text>
                  </View>
                )
              )}
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  {/* Drawn over the fixed black photo scrim (uploadingOverlay) — needs a fixed
                      light color, not theme-reactive colors.accent (illegible in light mode's
                      dark-green accent). */}
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    stateCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    column: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
    frame: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: radii.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frameEmpty: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
    },
    emptyContent: {
      alignItems: 'center',
      gap: 4,
    },
    emptyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    photo: {
      ...StyleSheet.absoluteFillObject,
    },
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 13, 12, 0.75)',
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 1,
    },
    // Drawn over the fixed black photo scrim (overlay) — needs fixed light colors, not
    // theme-reactive colors.textPrimary/textSecondary (illegible in light mode against the
    // always-dark scrim).
    overlayDate: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
      textTransform: 'capitalize',
    },
    overlayWeight: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
      opacity: 0.75,
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 13, 12, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
