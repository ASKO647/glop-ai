import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type SettingsRowProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  right?: ReactNode;
};

export default function SettingsRow({ icon: Icon, label, onPress, disabled = false, danger = false, right }: SettingsRowProps) {
  const content = (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.iconBox}>
        <Icon color={danger ? colors.warning : colors.textSecondary} size={20} />
      </View>
      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>
      {right}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && !disabled && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function SettingsValue({ value }: { value: string }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueText} numberOfLines={1}>
        {value}
      </Text>
      <ChevronRight color={colors.textTertiary} size={18} />
    </View>
  );
}

export function SettingsSwitch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.accent }}
      thumbColor={colors.textPrimary}
    />
  );
}

export function SettingsRowSpinner() {
  return <ActivityIndicator color={colors.accent} size="small" />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  labelDanger: {
    color: colors.warning,
  },
  pressed: {
    opacity: 0.7,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: 160,
  },
  valueText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
