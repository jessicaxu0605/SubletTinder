import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiPost, apiGet } from "@/lib/api";

export default function RenterProfileSubletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [form, setForm] = useState({
    user_id: params.user_id || "",
    age: params.age || "",
    gender: params.gender || "",
    bio: params.bio || "",
    start_date: "",
    end_date: "",
    budget: "",
    num_bedrooms: "",
    num_bathrooms: "",
    has_pet: false,
    raw_address: "",
    building_type_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [buildingTypes, setBuildingTypes] = useState<
    Array<{ value: number; label: string }>
  >([]);

  useEffect(() => {
    const loadBuildingTypesOptions = async () => {
      const data = await apiGet("/building-types");
      setBuildingTypes(
        data.map((item: any) => ({
          value: item.id,
          label: item.type,
        }))
      );
    };
    loadBuildingTypesOptions();
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
    if (!form.raw_address) newErrors.raw_address = "Location is required.";
    if (!form.start_date) newErrors.start_date = "Start date is required.";
    if (!form.end_date) newErrors.end_date = "End date is required.";
    if (!form.budget) newErrors.budget = "Budget is required.";
    if (!form.num_bedrooms)
      newErrors.num_bedrooms = "Number of bedrooms is required.";
    if (!form.num_bathrooms)
      newErrors.num_bathrooms = "Number of bathrooms is required.";
    if (!form.building_type_id)
      newErrors.building_type_id = "Building type is required.";
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (form.start_date && !dateRegex.test(form.start_date)) {
      newErrors.start_date = "Invalid date format (YYYY-MM-DD)";
    }
    if (form.end_date && !dateRegex.test(form.end_date)) {
      newErrors.end_date = "Invalid date format (YYYY-MM-DD)";
    }
    if (
      form.budget &&
      (!/^[0-9]+(\.[0-9]+)?$/.test(form.budget) || Number(form.budget) <= 0)
    ) {
      newErrors.budget = "Budget must be a number";
    }
    if (
      form.num_bedrooms &&
      (!/^[0-9]+$/.test(form.num_bedrooms) || Number(form.num_bedrooms) <= 0)
    ) {
      newErrors.num_bedrooms = "Number of bedrooms must be a number";
    }
    if (
      form.num_bathrooms &&
      (!/^[0-9]+$/.test(form.num_bathrooms) || Number(form.num_bathrooms) <= 0)
    ) {
      newErrors.num_bathrooms = "Number of bathrooms must be a number";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        budget: Number(form.budget),
        num_bedrooms: Number(form.num_bedrooms),
        num_bathrooms: Number(form.num_bathrooms),
        has_pet: Boolean(form.has_pet),
        building_type_id: form.building_type_id
          ? Number(form.building_type_id)
          : undefined,
      };
      await apiPost("/renters", payload);
      setMessage("Renter profile created!");
      // Navigate to index tab after successful submission
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (e: any) {
      if (e.message && e.message.includes("chk_term_length")) {
        setErrors((prev) => ({
          ...prev,
          check_constraint: "The term length should be at least a month.",
        }));
        setMessage("");
      } else if (e.message && e.message.includes("chk_start_date_future")) {
        setErrors((prev) => ({
          ...prev,
          check_constraint: "The start date must be in the future.",
        }));
        setMessage("");
      } else {
        setMessage(e.message || "Error creating profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1 p-8"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <TouchableOpacity onPress={goBack} className="mb-4">
            <Text className="text-green-800 text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-4xl font-bold mb-6">Sublet Info</Text>
          <View className="py-2">
            <Text className="mb-1">Desired Location</Text>
            <AddressAutocomplete
              value={form.raw_address}
              onSubmitCallback={(desc) => handleChange("raw_address", desc)}
            />
            {errors.raw_address && (
              <Text className="text-red-600 mb-2">{errors.raw_address}</Text>
            )}
          </View>
          <DateRangePicker
            startDate={form.start_date}
            endDate={form.end_date}
            onStartDateChange={(date: string) =>
              handleChange("start_date", date)
            }
            onEndDateChange={(date: string) => handleChange("end_date", date)}
            startDateError={errors.start_date}
            endDateError={errors.end_date}
            checkConstraintError={errors.check_constraint}
          />
          <View className="py-2 z-[10]">
            <Text className="mb-1">Building Type</Text>
            <Select
              placeholder="Select"
              value={form.building_type_id}
              onValueChange={(v) => handleChange("building_type_id", v)}
              options={buildingTypes}
            />
            {errors.building_type_id && (
              <Text className="text-red-600 mb-2">
                {errors.building_type_id}
              </Text>
            )}
          </View>
          <View className="py-2">
            <Text className="mb-1">Budget</Text>
            <Input
              placeholder="$"
              value={form.budget}
              onChangeText={(v: string) => handleChange("budget", v)}
              className="mb-4"
              keyboardType="numeric"
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              autoCapitalize="none"
              importantForAutofill="no"
            />
            {errors.budget && (
              <Text className="text-red-600 mb-2">{errors.budget}</Text>
            )}
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="mb-1">Bedrooms</Text>
              <Input
                placeholder="#"
                value={form.num_bedrooms}
                onChangeText={(v: string) => handleChange("num_bedrooms", v)}
                className="mb-4"
                keyboardType="numeric"
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
                autoCapitalize="none"
                importantForAutofill="no"
              />
              {errors.num_bedrooms && (
                <Text className="text-red-600 mb-2">{errors.num_bedrooms}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="mb-1">Bathrooms</Text>
              <Input
                placeholder="#"
                value={form.num_bathrooms}
                onChangeText={(v: string) => handleChange("num_bathrooms", v)}
                className="mb-4"
                keyboardType="numeric"
                autoComplete="off"
                textContentType="none"
              />
              {errors.num_bathrooms && (
                <Text className="text-red-600 mb-2">
                  {errors.num_bathrooms}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center mb-4 mt-4">
            <Checkbox
              value={form.has_pet}
              onValueChange={(v: boolean) => handleChange("has_pet", v)}
              label="I have a pet"
            />
          </View>
          {!!message && (
            <Text className="mt-4 text-center text-green-700 font-bold">
              {message}
            </Text>
          )}
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 p-8 bg-white">
          <Button onPress={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Create Profile"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
