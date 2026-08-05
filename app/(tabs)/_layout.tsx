import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Camera, Home, MessageCircle, Plus, User, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NavigationSheet from '../../components/ui/NavigationSheet';
import { TAB_BAR_BOTTOM_MARGIN_MIN, TAB_BAR_HEIGHT } from '../../constants/layout';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

const TAB_BAR_MARGIN = 20;

// The + button sits outside the pill, to its right, same height as the bar —
// diameter equal to TAB_BAR_HEIGHT so both share the exact same top/bottom edges.
const FAB_SIZE = TAB_BAR_HEIGHT;
const FAB_GAP = 12;

// Same shadow on both the pill and the button, so they read as one row.
const BAR_SHADOW = {
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
} as const;

function TabIcon({
  Icon,
  label,
  focused,
  colors,
  styles,
}: {
  Icon: LucideIcon;
  label: string;
  focused: boolean;
  colors: Colors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.iconWrap}>
      <Icon color={focused ? colors.accent : colors.textTertiary} size={22} />
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// Bypasses React Navigation's default tab button, whose built-in style
// (`tabVerticalUiKit`) top-aligns content instead of centering it — no amount
// of tabBarItemStyle/tabBarIconStyle can reach that inner style, so the icon
// only centers reliably if we own the pressable ourselves.
function TabBarButton({
  style,
  styles,
  ...rest
}: BottomTabBarButtonProps & { styles: ReturnType<typeof makeStyles> }) {
  return <PlatformPressable {...rest} style={[style, styles.tabButton]} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // On devices with a home indicator, keep the bar (and the + button) clear of
  // the safe-area/system-gesture zone instead of sitting at a fixed 24px from
  // the raw screen edge.
  const barBottom = Math.max(TAB_BAR_BOTTOM_MARGIN_MIN, insets.bottom + 12);

  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarButton: (props) => <TabBarButton {...props} styles={styles} />,
          // `end` (not `right`) leaves room for the + button (its width + the gap) outside the
          // pill. React Navigation's own default tab bar style sets `start`/`end` (logical,
          // writing-direction-aware), and Yoga resolves those ahead of physical `left`/`right`
          // when both are present on native — a `right` override here is silently ignored there
          // (though it works on react-native-web, which doesn't hit the same Yoga precedence),
          // making the pill render full-width with the button floating on top of its end. Using
          // the exact same keys the library sets guarantees our values win instead of theirs.
          tabBarStyle: [styles.tabBar, { bottom: barBottom, end: TAB_BAR_MARGIN + FAB_SIZE + FAB_GAP }],
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={Home} label={t('common.tabs.home')} focused={focused} colors={colors} styles={styles} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={MessageCircle} label={t('common.tabs.coach')} focused={focused} colors={colors} styles={styles} />
            ),
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={Camera} label={t('common.tabs.scanner')} focused={focused} colors={colors} styles={styles} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={User} label={t('common.tabs.profile')} focused={focused} colors={colors} styles={styles} />
            ),
          }}
        />
        {/* Reachable only from the + button's sheet — no longer tabs of their own. */}
        <Tabs.Screen name="progression" options={{ href: null }} />
        <Tabs.Screen name="workout" options={{ href: null }} />
        <Tabs.Screen name="meals" options={{ href: null }} />
      </Tabs>

      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: barBottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.explore')}
          onPress={() => setSheetVisible(true)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          {/* onAccent, not background: this icon sits on the accent-colored FAB surface. */}
          <Plus color={colors.onAccent} size={32} strokeWidth={2.75} />
        </Pressable>
      </View>

      <NavigationSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    tabBar: {
      position: 'absolute',
      // `start`, not `left` — see the comment above `tabBarStyle` in TabsLayout.
      start: TAB_BAR_MARGIN,
      height: TAB_BAR_HEIGHT,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      ...BAR_SHADOW,
    },
    tabBarItem: {
      height: TAB_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0,
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    labelActive: {
      color: colors.accent,
    },
    fabWrap: {
      position: 'absolute',
      right: TAB_BAR_MARGIN,
    },
    fab: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...BAR_SHADOW,
    },
    fabPressed: {
      opacity: 0.85,
    },
  });
}
