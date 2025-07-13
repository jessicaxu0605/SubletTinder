import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { apiGet } from "@/lib/api";
import Input from "./ui/Input";

interface Prediction {
  description: string;
  place_id: string;
  [key: string]: any;
}

interface AddressAutocompleteProps {
  value: string;
  onSubmitCallback: (description: string) => void;
  disabled?: boolean;

}

export function AddressAutocomplete({
  value,
  onSubmitCallback,
  disabled = false
}: AddressAutocompleteProps) {
  const [input, setInput] = useState<string>(value || "");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [hasFocused, setHasFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<string>(value || "");

  useEffect(() => {
    if (selection) {
      const timeout = setTimeout(() => setSelection(undefined), 300);
      return () => clearTimeout(timeout);
    }
  }, [selection]);

  const search = () => {
    setLoading(true);
    apiGet(`/locations/${encodeURIComponent(input)}`)
      .then((data) => {
        setPredictions(data.predictions || []);
        setShowDropdown(true);
      })
      .catch(() => {
        setPredictions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // debounced search
  useEffect(() => {
    if (!input.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const delay = setTimeout(() => {
      search();
    }, 500); // debounce delay

    return () => clearTimeout(delay);
  }, [input]);

  useEffect(() => {
    if (!submitted) return;

    search();
  }, [submitted]);

  useEffect(() => {
    setSubmitted(false);
  }, [input]);

  const handleSelect = (description: string) => {
    setInput(description);
    setShowDropdown(false);
    setModalVisible(false);
    setLastConfirmed(description);
    onSubmitCallback(description);
  };

  // Helper to handle modal close: clear if not confirmed
  const handleModalClose = () => {
    setModalVisible(false);
    if (input !== lastConfirmed) {
      setInput("");
      onSubmitCallback("");
    }
  };

  return (
    <View className="mb-2">
      <TouchableOpacity
        onPress={() => {
          if (!disabled) setModalVisible(true);
        }}
        activeOpacity={disabled ? 1 : 0.8}
        className="w-full"
      >
        <View pointerEvents="none">
          <Input
            placeholder="Search"
            value={input}
            editable={false}
            style={{
              backgroundColor: disabled ? "#e5e7eb" : "#f3f4f6", 
              borderColor: disabled ? "#e5e7eb" : "#d1d5db", 
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 12,
              minHeight: 42,
              justifyContent: "center",
              color: disabled ? "#9ca3af" : "#111827",
              borderStyle: disabled ? "dashed" : "solid",
            }}
          />
        </View>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleModalClose}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
          onPress={handleModalClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              minHeight: 300,
              maxHeight: 420,
            }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold">Search Address</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <Text className="text-xl">✕</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Search"
              value={input}
              onChangeText={setInput}
              autoFocus
              className="mb-2"
            />
            {loading && <ActivityIndicator className="my-2" />}
            {showDropdown &&
              !loading &&
              submitted &&
              predictions.length === 0 && (
                <View className="bg-whiterounded p-3">
                  <Text className="text-gray-500 text-center">
                    No results found
                  </Text>
                </View>
              )}
            {showDropdown && predictions.length > 0 && (
              <View className="bg-white rounded max-h-48 border-b border-gray-100">
                <FlatList
                  data={predictions}
                  keyExtractor={(item: Prediction) => item.place_id}
                  renderItem={({ item }: { item: Prediction }) => (
                    <TouchableOpacity
                      className="px-3 py-3 border-t border-gray-100"
                      onPress={() => handleSelect(item.description)}
                    >
                      <Text className="text-gray-800">{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
