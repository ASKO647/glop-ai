import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';

function RootNavigator() {
  const { session, isSubscribed, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // No session → onboarding (starts at welcome). Session but not subscribed → onboarding,
  // (onboarding)/_layout.tsx opens straight to paywall in that case. Session + subscribed → tabs.
  const showTabs = !!session && !!isSubscribed;

  return (
    // Wraps the whole navigator (not just (tabs)) so screens declared as siblings —
    // legal/* — can also read the profile via useProfile().
    <ProfileProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!showTabs}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={showTabs}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="legal/terms" />
          <Stack.Screen name="legal/privacy" />
        </Stack.Protected>
      </Stack>
    </ProfileProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
