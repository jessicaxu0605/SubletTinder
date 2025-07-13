import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useRouter } from "expo-router";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function RenterProfilePersonalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    user_id: user?.id,
    age: "",
    gender: "",
    bio: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [genderOptions, setGenderOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    const loadGenderOptions = async () => {
      const data = await apiGet("/genders");
      setGenderOptions(
        data.map((item: any) => ({
          value: item.gender,
          label: item.gender,
        }))
      );
    };
    loadGenderOptions();
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.age) newErrors.age = "Age is required.";
    if (form.age && Number(form.age) < 18)
      newErrors.age = "You must be 18 or older.";
    if (!form.gender) newErrors.gender = "Gender is required.";
    // bio is optional
    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    router.push({
      pathname: "/forms/renter-profile-sublet",
      params: form,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1 bg-white p-8">
          <View className="bg-white">
            <Text className="text-4xl font-bold mb-6">Personal Info</Text>
            {/* Profile Picture and Name (Uneditable) */}
            {user && (
              <View className="items-center mb-6">
                {user.profile_photo ? (
                  <Image
                    source={{ uri: user.profile_photo }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      marginBottom: 8,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#e5e7eb",
                      marginBottom: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text className="text-2xl text-gray-400">
                      {user.first_name?.[0] || "?"}
                    </Text>
                  </View>
                )}
                <Text className="text-xl font-bold text-center">
                  {user.first_name} {user.last_name}
                </Text>
              </View>
            )}
            <View className="py-2">
              <Text className="mb-1 font-medium">Age</Text>
              <Input
                placeholder="Age"
                value={form.age}
                onChangeText={(v: string) => handleChange("age", v)}
                className="mb-4"
                keyboardType="numeric"
              />
              {errors.age && (
                <Text className="text-red-600 mb-2">{errors.age}</Text>
              )}
            </View>
            <View className="py-2 z-[10]">
              <Text className="mb-1 font-medium">Gender</Text>
              <View className="z-[10]">
                <Select
                  placeholder="No preference"
                  value={form.gender}
                  onValueChange={(v) => handleChange("gender", String(v))}
                  options={genderOptions}
                  searchable={false}
                />
                {errors.gender && (
                  <Text className="text-red-600 mb-2">{errors.gender}</Text>
                )}
              </View>
            </View>
            <View className="py-2">
              <Text className="mb-1 font-medium">Bio</Text>
              <Input
                placeholder="Tell us about yourself"
                value={form.bio}
                onChangeText={(v: string) => handleChange("bio", v)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 p-8">
          <Button onPress={handleNext}>Next</Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
