import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";

export default function Questionnaire() {
  const [selected, setSelected] = useState<"renter" | "landlord" | null>(null);

  const handleNext = () => {
    if (selected === "renter") {
      router.replace("/forms/renter-profile-personal");
    } else if (selected === "landlord") {
      router.replace("/forms/add-listing");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-8">
        <Text className="text-2xl font-semibold mb-8 mt-2">
          What best describes you?
        </Text>

        <TouchableOpacity
          className={`border-2 rounded-xl py-4 px-4 mb-4 ${
            selected === "renter"
              ? "border-green-700 bg-green-50"
              : "border-gray-400 bg-white"
          }`}
          onPress={() => setSelected("renter")}
        >
          <Text className="text-lg text-center">I’m a renter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`border-2 rounded-xl py-4 px-4 mb-4 ${
            selected === "landlord"
              ? "border-green-700 bg-green-50"
              : "border-gray-400 bg-white"
          }`}
          onPress={() => setSelected("landlord")}
        >
          <Text className="text-lg text-center">I’m a landlord</Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 pb-8">
        <TouchableOpacity
          className="w-full py-4 rounded-lg bg-green-700"
          disabled={!selected}
          onPress={handleNext}
        >
          <Text className="text-white text-center text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
