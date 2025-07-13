import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import Checkbox from "./Checkbox";

interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  value: (string | number)[];
  onValueChange: (value: (string | number)[]) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
}

const MultiSelect = ({
  value = [],
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
  searchPlaceholder = "Search...",
  searchable = true,
}: MultiSelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [selected, setSelected] = useState<(string | number)[]>(value);
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setFilteredOptions(
      search && searchable
        ? options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase())
          )
        : options
    );
  }, [search, options, searchable]);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  // Animate modal content on open
  useEffect(() => {
    if (modalVisible) {
      slideAnim.setValue(-40);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  // Always display the placeholder in the main box
  // For amenities, value and option.value are numbers, so compare as numbers
  const selectedLabels = options
    .filter((o) => selected.map(Number).includes(Number(o.value)))
    .map((o) => o.label)
    .join(", ");

  const toggleOption = (optionValue: string | number) => {
    const numValue = Number(optionValue);
    setSelected((prev) =>
      prev.map(Number).includes(numValue)
        ? prev.filter((v) => Number(v) !== numValue)
        : [...prev, numValue]
    );
  };

  const handleDone = () => {
    onValueChange(selected.map(Number));
    setModalVisible(false);
    setSearch("");
  };

  return (
    <>
      {/* Main select box */}
      <TouchableOpacity
        className={`mb-3 bg-gray-100 border border-gray-300 rounded px-3 py-4 min-h-[42px] justify-center ${className}`}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text className={"text-[#888]"}>{placeholder}</Text>
      </TouchableOpacity>
      {/* Modal for options */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-start bg-black/40"
            onPress={handleDone}
          >
            <Animated.View
              style={{
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }],
                maxHeight: "70%",
              }}
            >
              <View className="bg-white rounded-b-2xl p-4 pt-8">
                {/* Copy of select box at top for continuity */}
                <View className="bg-gray-100 border border-gray-300 rounded px-3 py-3 mb-3 min-h-[42px] justify-center">
                  <Text className={"text-[#888]"}>{placeholder}</Text>
                </View>
                {/* Search bar */}
                {searchable && (
                  <TextInput
                    className="bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-3"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                  />
                )}
                {/* Options list without checkboxes */}
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => String(item.value)}
                  renderItem={({ item }) => (
                    <Pressable
                      className="flex-row items-center px-3 py-3 border-b border-gray-100"
                      onPress={() => toggleOption(item.value)}
                    >
                      <Text
                        className={
                          selected.map(Number).includes(Number(item.value))
                            ? "text-green-700 font-bold"
                            : "text-gray-800"
                        }
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )}
                  style={{ maxHeight: 250 }}
                  keyboardShouldPersistTaps="handled"
                />
                {/* Done/Close button */}
                <TouchableOpacity
                  className="mt-4 py-3 rounded bg-gray-200 items-center"
                  onPress={handleDone}
                >
                  <Text className="text-gray-700 font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default MultiSelect;
