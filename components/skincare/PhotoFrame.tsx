import { Camera } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type PhotoFrameProps = {
  label: string;
  addPhotoLabel: string;
  date: string | null;
  signedUrl: string | null;
  uploading?: boolean;
  onPress: () => void;
};

/** 3:4 "Avant"/"Maintenant" frame — dashed placeholder with a camera icon when empty, the photo + its date once set. */
export default function PhotoFrame({ label, addPhotoLabel, date, signedUrl, uploading, onPress }: PhotoFrameProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={signedUrl ? label : addPhotoLabel}
        onPress={onPress}
        disabled={uploading}
        style={({ pressed }) => [styles.frame, !signedUrl && styles.frameEmpty, pressed && !uploading && styles.pressed]}
      >
        {signedUrl ? (
          <Image source={{ uri: signedUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <>
            <Camera color={colors.textTertiary} size={26} />
            <Text style={styles.addLabel}>{addPhotoLabel}</Text>
          </>
        )}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#ffffff" />
          </View>
        )}
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.date}>{date ?? '—'}</Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    frame: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      gap: spacing.xs,
    },
    frameEmpty: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 13, 12, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    date: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
