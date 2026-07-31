import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors } from '../../constants/theme';
import AppImage from '../ui/AppImage';

type BenefitRowProps = {
  label: string;
  thumbnail: ImageSourcePropType;
};

export default function BenefitRow({ label, thumbnail }: BenefitRowProps) {
  return (
    <View style={styles.row}>
      <AppImage source={thumbnail} style={styles.thumbnail} overlay={0.35} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  label: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
