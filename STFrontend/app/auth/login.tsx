import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/lib/api";
import Input from "@/components/ui/Input";

interface LoginData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleLogin = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const loginData: LoginData = { email, password };
      const user = await apiPost("/login", loginData);
      await signIn(user);
      router.replace("/(tabs)");
    } catch (error) {
      let errorMessage = "An error occurred";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "detail" in error) {
        errorMessage = (error as any).detail;
      } else if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && typeof parsed === "object" && "detail" in parsed) {
            errorMessage = parsed.detail;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      // Show error at the top (global error)
      setErrors((prev) => ({ ...prev, global: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const goToSignup = () => {
    router.push("/auth/signup");
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-8 pt-8">
            {/* Header */}
            <View className="mb-8">
              <TouchableOpacity onPress={goBack} className="mb-4">
                <Text className="text-green-700 text-lg">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </Text>
              <Text className="text-gray-600 text-lg">
                Sign in to your account
              </Text>
            </View>
            {errors.global ? (
              <Text className="text-red-600 mb-2">{errors.global}</Text>
            ) : null}

            {/* Form */}
            <View className="flex-1">
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <Input
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((e) => ({ ...e, email: "" }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email ? (
                  <Text className="text-red-600 mb-2">{errors.email}</Text>
                ) : null}
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Password</Text>
                <Input
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: "" }));
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {errors.password ? (
                  <Text className="text-red-600 mb-2">{errors.password}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-xl items-center mb-4 ${
                  isLoading ? "bg-gray-400" : "bg-green-700"
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-semibold">
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center" onPress={goToSignup}>
                <Text className="text-green-700 text-base">
                  Don't have an account? Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
