import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import MultiSelect from "@/components/ui/MultiSelect";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { apiGet } from "@/lib/api";

export interface ListingFormData {
  user_id: number;
  start_date: string;
  end_date: string;
  target_gender: string;
  asking_price: string;
  num_bedrooms: string;
  num_bathrooms: string;
  pet_friendly: boolean;
  utilities_incl: boolean;
  description: string;
  building_type_id: string;
  amenities: number[];
  photos: string[];
  raw_address: string;
}

interface ListingFormProps {
  type : string;
  initialValues: ListingFormData;
  onSubmit: (values: ListingFormData) => Promise<void>;
  loading?: boolean;
  message?: string;
  submitLabel?: string;
  externalErrors?: { [key: string]: string }; // ✅ NEW

}

export default function ListingForm({
  type,
  initialValues,
  onSubmit,
  loading = false,
  message = "",
  submitLabel = "Submit",
  externalErrors
}: ListingFormProps) {
  const [form, setForm] = useState<ListingFormData>(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [amenities, setAmenities] = useState<Array<{ value: number; label: string }>>([]);
  const [buildingTypes, setBuildingTypes] = useState<Array<{ value: number; label: string }>>([]);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [amenitiesData, buildingTypesData, genderData] = await Promise.all([
          apiGet("/amenities"),
          apiGet("/building-types"),
          apiGet("/genders"),
        ]);

        setAmenities(
          amenitiesData.map((item: any) => ({ value: item.id, label: item.name }))
        );
        setBuildingTypes(
          buildingTypesData.map((item: any) => ({ value: item.id, label: item.type }))
        );
        setGenderOptions(
          genderData.map((item: any) => ({ value: item.gender, label: item.gender }))
        );
      } catch (err) {
        console.error("Failed to fetch options", err);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (externalErrors) {
      setErrors((prev) => ({ ...prev, ...externalErrors }));
    }
  }, [externalErrors]);


  const handleChange = (key: keyof ListingFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleAmenity = (id: number) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleTogglePhoto = (name: string) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.includes(name)
        ? prev.photos.filter((p) => p !== name)
        : [...prev.photos, name],
    }));
  };

  const handleLocalSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.raw_address) newErrors.raw_address = "Address is required.";
    if (!form.start_date) newErrors.start_date = "Start date is required.";
    if (!form.end_date) newErrors.end_date = "End date is required.";
    if (!form.asking_price) newErrors.asking_price = "Monthly rent is required.";
    if (!form.num_bedrooms) newErrors.num_bedrooms = "Number of bedrooms is required.";
    if (!form.num_bathrooms) newErrors.num_bathrooms = "Number of bathrooms is required.";
    if (!form.building_type_id) newErrors.building_type_id = "Building type is required.";

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (form.start_date && !dateRegex.test(form.start_date)) {
      newErrors.start_date = "Invalid date format (YYYY-MM-DD)";
    }
    if (form.end_date && !dateRegex.test(form.end_date)) {
      newErrors.end_date = "Invalid date format (YYYY-MM-DD)";
    }

    if (
      form.asking_price &&
      (!/^[0-9]+(\.[0-9]+)?$/.test(form.asking_price) || Number(form.asking_price) <= 0)
    ) {
      newErrors.asking_price = "Rent must be a number";
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(form);
  };

  const handleAddPhoto = () => {
    alert("Add Photo button pressed!");
  };

  return (
    <ScrollView className="flex-1 bg-white p-8" keyboardShouldPersistTaps="handled">
      <View className="bg-white">
        <Text className="text-4xl font-bold mb-6">{type === "add" ? "Add a Listing" : "Update a Listing"}</Text>
        <DateRangePicker
          startDate={form.start_date}
          endDate={form.end_date}
          onStartDateChange={(date: string) => handleChange("start_date", date)}
          onEndDateChange={(date: string) => handleChange("end_date", date)}
          startDateError={errors.start_date}
          endDateError={errors.end_date}
          checkConstraintError={errors.check_constraint}
          label="Term"
        />
        <View className="py-2">
          <Text className="mb-1">Monthly Rent</Text>
          <Input
            placeholder="$"
            value={form.asking_price}
            onChangeText={(v: string) => handleChange("asking_price", v)}
            className="mb-4"
            keyboardType="numeric"
          />
          {errors.asking_price && (
            <Text className="text-red-600 mb-2">{errors.asking_price}</Text>
          )}
        </View>
        <View className="flex-row items-center mb-4">
          <Checkbox
            value={form.utilities_incl}
            onValueChange={(v: boolean) => handleChange("utilities_incl", v)}
            label="Utilities Included"
          />
        </View>
        <View className="h-px bg-gray-200 my-4" />
        <View className="py-2">
          <Text className="mb-1">Address</Text>
          <AddressAutocomplete
            value={form.raw_address}
            onSubmitCallback={(desc) => handleChange("raw_address", desc)}
            disabled={type === "update"} // Make read-only during update
          />
          {errors.raw_address && (
            <Text className="text-red-600 mb-2">{errors.raw_address}</Text>
          )}
        </View>
        <View className="py-2">
          <Text className="mb-1">Bedrooms</Text>
          <Input
            placeholder="#"
            value={form.num_bedrooms}
            onChangeText={(v: string) => handleChange("num_bedrooms", v)}
            className="mb-4"
            keyboardType="numeric"
          />
          {errors.num_bedrooms && (
            <Text className="text-red-600 mb-2">{errors.num_bedrooms}</Text>
          )}
        </View>
        <View className="py-2">
          <Text className="mb-1">Bathrooms</Text>
          <Input
            placeholder="#"
            value={form.num_bathrooms}
            onChangeText={(v: string) => handleChange("num_bathrooms", v)}
            className="mb-4"
            keyboardType="numeric"
          />
          {errors.num_bathrooms && (
            <Text className="text-red-600 mb-2">{errors.num_bathrooms}</Text>
          )}
        </View>
        <View className="py-2 z-[30]">
          <Text className="mb-1">Building Type</Text>
          <Select
            placeholder="Select"
            value={parseInt(form.building_type_id)}
            onValueChange={(v) => handleChange("building_type_id", v)}
            options={buildingTypes}
            disabled={type === "update"} // disable on update

          />
          {errors.building_type_id && (
            <Text className="text-red-600 mb-2">{errors.building_type_id}</Text>
          )}
        </View>
        <View className="h-px bg-gray-200 my-4" />
        <Text className="mb-1">Amenities</Text>
        <View className="z-[20]">
          <MultiSelect
            placeholder="Add an amenity"
            value={form.amenities}
            onValueChange={(arr) => handleChange("amenities", arr)}
            options={amenities}
          />
        </View>
        <View className="flex-row flex-wrap mb-4">
          {form.amenities.map((id) => {
            const label = amenities.find((a) => a.value === id)?.label || id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => handleToggleAmenity(id)}
                className="bg-green-700 px-3 py-1 rounded-full mr-2 mb-2"
              >
                <Text className="text-white text-sm">{label} ✕</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text className="mb-1">Target Gender</Text>
        <View className="z-[10]">
          <Select
            placeholder="No preference"
            value={form.target_gender}
            onValueChange={(v) => handleChange("target_gender", String(v))}
            options={genderOptions}
            searchable={false}
          />
        </View>
        <View className="flex-row items-center mb-4 mt-4">
          <Checkbox
            value={form.pet_friendly}
            onValueChange={(v: boolean) => handleChange("pet_friendly", v)}
            label="Pet Friendly"
          />
        </View>
        <View className="py-2">
          <Text className="mb-1">Description</Text>
          <Input
            placeholder="Text"
            value={form.description}
            onChangeText={(v: string) => handleChange("description", v)}
            multiline
            numberOfLines={3}
          />
        </View>
        <Text className="mb-1">Photos</Text>
        <Button onPress={handleAddPhoto} className="mb-2">
          Add Photo
        </Button>
        {/* <View className="flex-row flex-wrap mb-4">
          {form.photos.map((name) => (
            <TouchableOpacity
              key={name}
              onPress={() => handleTogglePhoto(name)}
              className="bg-green-700 px-3 py-1 rounded-full mr-2 mb-2"
            >
              <Text className="text-white text-sm">{name} ✕</Text>
            </TouchableOpacity>
          ))}
        </View> */}
        <Button onPress={handleLocalSubmit} disabled={loading}>
          {loading ? "Submitting..." : submitLabel}
        </Button>
        {!!message && (
          <Text className="mt-4 text-center text-green-700 font-bold">
            {message}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
