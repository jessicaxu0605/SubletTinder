import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { UserCircle2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext"; // Adjust import path if needed
import { useActiveRole } from "@/components/ActiveRoleContext"; // Adjust import path if needed
import ButtonDropdown from "@/components/ui/ButtonDropdown";

const AccountSidebar: React.FC = () => {
  const { user } = useAuth();
  const {
    isRenter,
    setIsRenter,
    renterProfileId,
    listingIds,
    setResourceId,
    resourceId,
  } = useActiveRole();

  const menuItems = [
    "Manage Accounts",
    "Manage Listings",
    "Settings",
  ];

  const handlePress = (item: string) => {
    console.log("Clicked:", item);
  };

  const resourceOptions = [
    ...(renterProfileId !== null
      ? [{ label: `Renter Profile ${renterProfileId}`, value: renterProfileId, type: "renter" }]
      : []),
    ...listingIds.map((id) => ({ label: `Listing ${id}`, value: id, type: "listing" })),
  ];

  return (
    <View className="w-full min-h-screen bg-white p-5">
      <View className="flex-row items-center gap-3 mb-4">
        <UserCircle2 size={32} color="black" />
        <View>
          <Text className="font-semibold text-sm">
            {user ? `${user.first_name} ${user.last_name}` : "Guest User"}
          </Text>
          <Text className="text-xs text-gray-500">
            Current role: {isRenter ? "Renter" : "Listing"}
          </Text>
          <Text className="text-xs text-gray-500">
            Resource ID: {resourceId}
          </Text>
        </View>
      </View>

      <View className="mb-6">
        <ButtonDropdown
          value={resourceId}
          onValueChange={(id) => {
            setResourceId(Number(id));
            // Find the selected option to determine role
            const selectedOption = resourceOptions.find((opt) => opt.value === id);
            if (selectedOption) {
              setIsRenter(selectedOption.type === "renter");
            }
          }}
          options={resourceOptions}
          placeholder="Select Resource"
          buttonLabel="Switch Roles"
          searchable={false}
        />
      </View>

      <View className="flex gap-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(item)}
            activeOpacity={0.6}
          >
            <Text className="text-sm text-gray-700">{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default AccountSidebar;
