import { Stack, useRouter, usePathname } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function AuthLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      user &&
      // LITERALLY TWEAKING WHY IS IT THAT AFTER ROUTER PUSHES TO QUESTIONNAIRE, THE PATH IS STILL SIGNUP?!
      !["/auth/questionnaire", "/auth/RenterForm", "/auth/signup"].includes(
        pathname
      )
    ) {
      router.replace("/(tabs)");
    }
  }, [user, pathname]);

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
    </Stack>
  );
}
