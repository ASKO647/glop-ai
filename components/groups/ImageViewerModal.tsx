import { X } from 'lucide-react-native';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LocaleContext';

type ImageViewerModalProps = {
  uri: string | null;
  onClose: () => void;
};

export default function ImageViewerModal({ uri, onClose }: ImageViewerModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onClose} />
        {uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          hitSlop={12}
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
        >
          <X color={colors.textPrimary} size={20} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
