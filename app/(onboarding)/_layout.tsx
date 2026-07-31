import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { OnboardingProvider } from '../../context/OnboardingContext';

export default function OnboardingLayout() {
  const { isSubscribed } = useAuth();
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
        <Stack.Screen name="questionnaire" />
        <Stack.Screen name="analyse" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="paywall" />
      </Stack>
    </OnboardingProvider>
  );
}
