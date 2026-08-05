import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function OnboardingLayout() {
  const { isSubscribed } = useAuth();
  const { colors } = useTheme();
  // A session with isSubscribed === false only happens once the root layout has
  // already resolved loading, so this can only be true when there IS a session.
  const initialRouteName = isSubscribed === false ? 'paywall' : 'welcome';

  return (
    <OnboardingProvider>
      <Stack
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="q/[step]" options={{ animation: 'none' }} />
        <Stack.Screen name="analyse" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="paywall" />
      </Stack>
    </OnboardingProvider>
  );
}
