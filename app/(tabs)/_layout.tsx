import { Tabs } from 'expo-router';
import { Camera, Home, MessageCircle, TrendingUp, User, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../constants/theme';
import { ProfileProvider } from '../../context/ProfileContext';

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon color={focused ? colors.background : colors.textTertiary} size={22} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <ProfileProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }}
        />
        <Tabs.Screen
          name="coach"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} focused={focused} /> }}
        />
        <Tabs.Screen
          name="scanner"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Camera} focused={focused} /> }}
        />
        <Tabs.Screen
          name="progression"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={TrendingUp} focused={focused} /> }}
        />
        <Tabs.Screen
          name="profil"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} /> }}
        />
        <Tabs.Screen name="meals" options={{ href: null }} />
      </Tabs>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    height: 64,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
});
