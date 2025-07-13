import React from "react";
import { TextInput, TextInputProps } from "react-native";

const Input = (props: TextInputProps) => (
  <TextInput
    {...props}
    className="border border-gray-300 px-3 py-4 rounded-xl mb-1 bg-gray-100"
    placeholderTextColor="#888"
  />
);

export default Input;
