import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import "../global.css";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#166534", // Tailwind green-800
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          default: { backgroundColor: "white" },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-listing"
        options={{
          title: "Add Listing",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deactivate-listing"
        options={{
          title: "Deactivate",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="minus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listing"
        options={{
          title: "Listing Details",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="mappin.and.ellipse" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account-management"
        options={{
          title: "Account Management",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="mappin.and.ellipse" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
