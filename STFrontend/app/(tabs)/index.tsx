import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import Swiper from "react-native-deck-swiper";
import { apiGet } from "@/lib/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  // Add ordinal suffix
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  return `${month} ${day}${getOrdinal(day)}`;
}

export default function TabsHome() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOutOfMatches, setShowOutOfMatches] = useState(false);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError("");
      try {
        // TODO: replace hardcoded renter_id
        const data = await apiGet("/renters/1/matches");
        setMatches(data.matches || []);
        setShowOutOfMatches(false); // reset when new matches are loaded
      } catch (e: any) {
        setError(e.message || "Error fetching matches");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleSwipeLeft = useCallback((i: number) => {
    console.log("swiped left on ", matches[i]);
  }, []);

  const handleSwipeRight = useCallback((i: number) => {
    // TODO
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Loading matches...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }
  if (!matches.length) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>No matches found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View
        pointerEvents="none"
        className="absolute inset-0 justify-center items-center z-0"
      >
        <Text className="text-2xl font-bold text-gray-400 text-center">
          Out of matches :(
        </Text>
      </View>
      <Swiper
        ref={swiperRef}
        cards={matches}
        renderCard={(match) => (
          <View className="w-[90vw] max-w-xl h-full max-h-[90vh] bg-slate-50 rounded-2xl p-7 flex flex-col shadow-md mx-auto justify-center">
            {/* Title and Address */}
            <Text className="text-2xl font-bold mb-0.5 text-left">
              {match.lister_name
                ? `${match.lister_name}'s Apartment`
                : "Apartment"}
            </Text>
            <View className="flex-row items-center mb-2">
              <MaterialIcons size={16} name={"location-on"} color={"#505050"} />
              <Text className="text-sm text-gray-700 ml-1">
                {match.address_string}
              </Text>
            </View>
            {/* Price and Dates */}
            <View className="border border-gray-200 rounded-lg p-3 w-full mb-2 items-start">
              <View className="flex-row items-end">
                <Text className="text-2xl font-bold text-gray-900">
                  ${Math.round(match.asking_price).toLocaleString()}
                </Text>
                <Text className="text-lg text-gray-500 font-semibold ml-1">
                  /month
                </Text>
              </View>
              <Text className="text-sm text-gray-700 mt-1">
                {formatDate(match.start_date)} - {formatDate(match.end_date)}
              </Text>
              <View className="h-px bg-gray-200 my-4 w-full" />
              {/* Beds/Baths */}
              <Text className="text-base text-gray-700">
                {match.num_bedrooms} Beds, {match.num_bathrooms} Baths
              </Text>
            </View>
            {/* Photo */}
            {match.photo_url ? (
              <Image
                source={{ uri: match.photo_url }}
                className="flex-1 w-full min-h-[120px] rounded-xl mb-4 mt-2"
                style={{ resizeMode: "cover" }}
              />
            ) : (
              <View className="flex-1 w-full min-h-[120px] rounded-xl mb-4 mt-2 bg-gray-200 justify-center items-center">
                <Text>No Photo</Text>
              </View>
            )}
            {/* Buttons */}
            <View className="flex-row justify-between w-full mt-2 mb-0">
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-gray-100 justify-center items-center"
                onPress={() => swiperRef.current?.swipeLeft()}
              >
                <MaterialIcons size={28} name="highlight-off" color="#505050" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 mx-3 bg-green-800 rounded-lg justify-center items-center h-12">
                <Text className="text-white font-bold">Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-gray-100 justify-center items-center"
                onPress={() => swiperRef.current?.swipeRight()}
              >
                <MaterialIcons
                  size={28}
                  name="favorite-border"
                  color="#505050"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        cardIndex={0}
        backgroundColor="transparent"
        stackSize={3}
        showSecondCard={true}
        onSwipedLeft={handleSwipeLeft}
        onSwipedRight={handleSwipeRight}
        onSwipedAll={() => setShowOutOfMatches(true)}
        disableTopSwipe
        disableBottomSwipe
        verticalSwipe={false}
        horizontalSwipe={true}
      />
    </View>
  );
}
