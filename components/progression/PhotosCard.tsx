import { Camera } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate } from '../../constants/dashboard';
import { formatSignedWeight, formatWeight } from '../../constants/progression';
import { colors, radii, spacing } from '../../constants/theme';
import type { ProgressPhoto } from '../../hooks/useProgressPhotos';
import { showConfirm } from '../../lib/alert';

type PhotosCardProps = {
  photos: ProgressPhoto[];
  loading: boolean;
  uploading: boolean;
  onDelete: (photo: ProgressPhoto) => void;
};

function PhotoMeta({ label, photo }: { label: string; photo: ProgressPhoto }) {
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaDate}>{formatDisplayDate(photo.date)}</Text>
      {photo.poids != null && <Text style={styles.metaWeight}>{formatWeight(photo.poids)} kg</Text>}
    </View>
  );
}

export default function PhotosCard({ photos, loading, uploading, onDelete }: PhotosCardProps) {
  const [afterId, setAfterId] = useState<string | null>(null);

  useEffect(() => {
    if (photos.length === 0) {
      setAfterId(null);
      return;
    }
    if (!afterId || !photos.some((photo) => photo.id === afterId)) {
      setAfterId(photos[photos.length - 1].id);
    }
  }, [photos, afterId]);

  const confirmDelete = (photo: ProgressPhoto) => {
    showConfirm(
      'Supprimer cette photo ?',
      `La photo du ${formatDisplayDate(photo.date)} sera définitivement supprimée.`,
      'Supprimer',
      () => onDelete(photo)
    );
  };

  if (loading || uploading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={colors.accent} />
        {uploading && <Text style={styles.stateText}>Envoi en cours...</Text>}
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Camera color={colors.textTertiary} size={28} />
        <Text style={styles.emptyTitle}>Ajoute ta première photo</Text>
      </View>
    );
  }

  if (photos.length === 1) {
    const photo = photos[0];
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Photo du ${formatDisplayDate(photo.date)} — appui long pour supprimer`}
          onLongPress={() => confirmDelete(photo)}
          style={styles.singlePhotoWrap}
        >
          {photo.signedUrl && (
            <Image
              source={{ uri: photo.signedUrl }}
              style={styles.singlePhoto}
              resizeMode="cover"
              onError={(e) => console.error(`Failed to load progress photo (${photo.signedUrl}):`, e.nativeEvent.error)}
            />
          )}
        </Pressable>
        <PhotoMeta label="Aujourd'hui" photo={photo} />
      </View>
    );
  }

  const before = photos[0];
  const after = photos.find((photo) => photo.id === afterId) ?? photos[photos.length - 1];
  const weightDiff = before.poids != null && after.poids != null ? after.poids - before.poids : null;

  return (
    <View>
      <View style={styles.comparatorRow}>
        <View style={styles.comparatorColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Photo "Avant" du ${formatDisplayDate(before.date)} — appui long pour supprimer`}
            onLongPress={() => confirmDelete(before)}
            style={styles.comparatorPhotoWrap}
          >
            {before.signedUrl && (
              <Image
                source={{ uri: before.signedUrl }}
                style={styles.comparatorPhoto}
                resizeMode="cover"
                onError={(e) => console.error(`Failed to load "avant" photo (${before.signedUrl}):`, e.nativeEvent.error)}
              />
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Avant</Text>
            </View>
          </Pressable>
          <PhotoMeta label="Avant" photo={before} />
        </View>

        <View style={styles.comparatorColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Photo "Après" du ${formatDisplayDate(after.date)} — appui long pour supprimer`}
            onLongPress={() => confirmDelete(after)}
            style={styles.comparatorPhotoWrap}
          >
            {after.signedUrl && (
              <Image
                source={{ uri: after.signedUrl }}
                style={styles.comparatorPhoto}
                resizeMode="cover"
                onError={(e) => console.error(`Failed to load "après" photo (${after.signedUrl}):`, e.nativeEvent.error)}
              />
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Après</Text>
            </View>
          </Pressable>
          <PhotoMeta label="Après" photo={after} />
        </View>
      </View>

      {weightDiff != null && (
        <Text style={styles.diffText}>{formatSignedWeight(weightDiff)} entre les deux dates</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
        {photos.map((photo) => (
          <Pressable
            key={photo.id}
            accessibilityRole="button"
            accessibilityLabel={`Vignette du ${formatDisplayDate(photo.date)} — tap pour l'afficher en "Après", appui long pour supprimer`}
            onPress={() => setAfterId(photo.id)}
            onLongPress={() => confirmDelete(photo)}
            style={[styles.thumbWrap, photo.id === afterId && styles.thumbWrapActive]}
          >
            {photo.signedUrl && (
              <Image
                source={{ uri: photo.signedUrl }}
                style={styles.thumb}
                resizeMode="cover"
                onError={(e) => console.error(`Failed to load thumbnail (${photo.signedUrl}):`, e.nativeEvent.error)}
              />
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const PHOTO_HEIGHT = 180;
const THUMB_SIZE = 60;

const styles = StyleSheet.create({
  stateCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  singlePhotoWrap: {
    width: '100%',
    height: PHOTO_HEIGHT * 1.3,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  singlePhoto: {
    width: '100%',
    height: '100%',
  },
  comparatorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  comparatorColumn: {
    flex: 1,
    gap: 6,
  },
  comparatorPhotoWrap: {
    width: '100%',
    height: PHOTO_HEIGHT,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  comparatorPhoto: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(10, 13, 12, 0.75)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaBlock: {
    gap: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  metaDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  metaWeight: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  diffText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  thumbRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: {
    borderColor: colors.accent,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
