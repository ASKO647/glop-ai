import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Camera, Home, Plus, TrendingUp, User, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NavigationSheet from '../../components/ui/NavigationSheet';
import { colors, radii } from '../../constants/theme';

const TAB_BAR_MARGIN = 20;
const TAB_BAR_BOTTOM_MIN = 24;
const TAB_BAR_HEIGHT = 68;

// Reserved empty space at the bar's horizontal center for the floating + button —
// applied as margin on the two tabs adjacent to it so their icon/label never sit under it.
const CENTER_GAP_HALF = 32;

const FAB_SIZE = 56;
// How far the button's top edge pokes up above the bar's own top edge.
const FAB_PROTRUSION = 16;

function TabIcon({ Icon, label, focused }: { Icon: LucideIcon; label: string; focused: boolean }) {
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
function TabBarButton({ style, ...rest }: BottomTabBarButtonProps) {
  return <PlatformPressable {...rest} style={[style, styles.tabButton]} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // On devices with a home indicator, keep the bar (and its bottom-right tab)
  // clear of the safe-area/system-gesture zone instead of sitting at a fixed
  // 24px from the raw screen edge.
  const tabBarBottom = Math.max(TAB_BAR_BOTTOM_MIN, insets.bottom + 12);
  const fabBottom = tabBarBottom + TAB_BAR_HEIGHT - (FAB_SIZE - FAB_PROTRUSION);

  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarStyle: [styles.tabBar, { bottom: tabBarBottom }],
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Accueil" focused={focused} /> }}
        />
        <Tabs.Screen
          name="progression"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon Icon={TrendingUp} label="Progression" focused={focused} />,
            tabBarItemStyle: [styles.tabBarItem, styles.tabBarItemBeforeGap],
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon Icon={Camera} label="Scanner" focused={focused} />,
            tabBarItemStyle: [styles.tabBarItem, styles.tabBarItemAfterGap],
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Profil" focused={focused} /> }}
        />
        {/* Reachable only from the + button's sheet — no longer a tab of their own. */}
        <Tabs.Screen name="coach" options={{ href: null }} />
        <Tabs.Screen name="workout" options={{ href: null }} />
        <Tabs.Screen name="meals" options={{ href: null }} />
      </Tabs>

      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: fabBottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explorer"
          onPress={() => setSheetVisible(true)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Plus color={colors.background} size={26} strokeWidth={2.75} />
        </Pressable>
      </View>

      <NavigationSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabBarItem: {
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarItemBeforeGap: {
    marginRight: CENTER_GAP_HALF,
  },
  tabBarItemAfterGap: {
    marginLeft: CENTER_GAP_HALF,
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
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  fabPressed: {
    opacity: 0.85,
  },
});
