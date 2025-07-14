import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiGet } from "@/lib/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

import { useActiveRole } from "../../components/ActiveRoleContext";
import HomePageSwiper from "../../components/HomePageSwiper";
import { View } from "react-native";

export default function TabsHome() {
  const { isRenter, resourceId } = useActiveRole();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const swiperRef = useRef<any>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const url = `/${isRenter ? "renters" : "listings"}/${resourceId}/${
      isRenter ? "listing_matches" : "renter_matches"
    }`;
    console.log(url);
    const fetchMatches = async () => {
      if (!user) return;

      setLoading(true);
      setError("");
      try {
        const data = await apiGet(url);
        console.log(data);
        setMatches(data.matches || []);
      } catch (e: any) {
        setError(e.message || "Error fetching matches");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user, isRenter, resourceId]);

  return (
    <View className="flex-1 bg-white">
      <HomePageSwiper
        matches={matches}
        loading={loading}
        error={error}
        swiperRef={swiperRef}
        isRenter={isRenter}
      />
    </View>
  );
}
