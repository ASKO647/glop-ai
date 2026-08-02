import { useMemo } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import AppImage from '../ui/AppImage';

type BenefitRowProps = {
  label: string;
  image: ImageSourcePropType;
};

export default function BenefitRow({ label, image }: BenefitRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <AppImage source={image} style={styles.thumbnail} overlay={0.35} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
}
