import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ListingForm, { ListingFormData } from "@/components/ListingForm";
import { apiGet, apiPatch } from "@/lib/api";

export default function UpdateListingScreen() {
  const { listingId } = useLocalSearchParams();
  const [initialValues, setInitialValues] = useState<ListingFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listing = await apiGet(`/listings/${listingId}`);
        console.log(listing);
        // Parse photos and amenities
        // const parsedPhotos = JSON.parse(listing.photos || "[]");
        // const flatPhotos = parsedPhotos.map((p: any) => p.label);

        const parsedAmenities = JSON.parse(listing.amenities || "[]");

        // setOriginalPhotos(flatPhotos);

        setInitialValues({
          user_id: listing.user_id, // won't be updated
          start_date: listing.start_date,
          end_date: listing.end_date,
          target_gender: listing.target_gender || "",
          asking_price: listing.asking_price.toString(),
          num_bedrooms: listing.num_bedrooms.toString(),
          num_bathrooms: listing.num_bathrooms.toString(),
          pet_friendly: listing.pet_friendly,
          utilities_incl: listing.utilities_incl,
          description: listing.description,
          building_type_id: listing.building_type_id.toString() || "", // fallback to name string
          amenities: parsedAmenities,
          photos: [], //flatPhotos,
          raw_address: listing.address_string || "", // updated from address_string
        });
      } catch (err) {
        console.error("Failed to load listing", err);
      }
    };

    if (listingId) fetchListing();
  }, [listingId]);

  const handleSubmit = async (formData: ListingFormData) => {
    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      // // Compute added and removed photos
      // const photos_to_add = formData.photos
      //   .filter((photo) => !originalPhotos.includes(photo))
      //   .map((label) => ({ url: label, label }));

      // const photos_to_delete = originalPhotos.filter((photo) => !formData.photos.includes(photo));

      const payload = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        target_gender: formData.target_gender || null,
        asking_price: Number(formData.asking_price),
        num_bedrooms: Number(formData.num_bedrooms),
        num_bathrooms: Number(formData.num_bathrooms),
        pet_friendly: Boolean(formData.pet_friendly),
        utilities_incl: Boolean(formData.utilities_incl),
        description: formData.description,
        amenities: formData.amenities,
        // photos_to_add,
        // photos_to_delete,
      };
      console.log(payload);
      console.log(listingId);

      await apiPatch(`/listings/${listingId}`, payload);
      setMessage("Listing updated!");
    } catch (e: any) {
      if (e.message?.includes("chk_term_length")) {
        setErrors({ check_constraint: "The term length should be at least a month." });
      } else if (e.message?.includes("chk_start_date_future")) {
        setErrors({ check_constraint: "The start date must be in the future." });
      } else {
        setMessage(e.message || "Error updating listing");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!initialValues) return null;

  return (
    <View className="flex-1">
      <ListingForm
        type="update"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={loading}
        message={message}
        submitLabel="Update Listing"
        externalErrors={errors}
        key={JSON.stringify(errors)}
      />
    </View>
  );
}
