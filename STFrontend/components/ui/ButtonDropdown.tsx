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

interface Option {
  value: string | number;
  label: string;
}

interface ButtonDropdownProps {
  value: string | number;
  onValueChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  buttonLabel?: string; // new prop: static label on button
  className?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
}

const ButtonDropdown = ({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  buttonLabel,
  className = "",
  searchPlaceholder = "Search...",
  searchable = true,
}: ButtonDropdownProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
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

  const selectedLabel = options.find((o) => o.value === value)?.label;

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

  return (
    <>
      {/* Main button trigger */}
      <TouchableOpacity
        className={`mb-3 rounded bg-green-800 px-4 py-3 items-center ${className}`}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text className="text-white font-bold text-lg">
          {buttonLabel ?? selectedLabel ?? placeholder}
        </Text>
      </TouchableOpacity>

      {/* Modal */}
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
            onPress={() => setModalVisible(false)}
          >
            <Animated.View
              style={{
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }],
                maxHeight: "70%",
              }}
            >
              <View className="bg-white rounded-b-2xl p-4 pt-8">
                {/* Optional selected label preview */}
                <View className="bg-gray-100 border border-gray-300 rounded px-3 py-3 mb-3 min-h-[42px] justify-center">
                  <Text className="text-[#222]">
                    {selectedLabel || placeholder}
                  </Text>
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

                {/* Options list */}
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => String(item.value)}
                  renderItem={({ item }) => (
                    <Pressable
                      className="px-3 py-3 border-b border-gray-100"
                      onPress={() => {
                        onValueChange(item.value);
                        setModalVisible(false);
                        setSearch("");
                      }}
                    >
                      <Text
                        className={
                          value === item.value
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
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default ButtonDropdown;
