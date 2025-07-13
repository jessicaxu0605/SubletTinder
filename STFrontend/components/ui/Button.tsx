import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  className?: string;
}

const Button = ({ children, className = "", ...props }: ButtonProps) => (
  <TouchableOpacity
    {...props}
    className={`mb-2 rounded-full bg-green-800 px-4 py-3 items-center ${
      props.disabled ? "bg-gray-400" : "bg-green-800"
    } ${className}`}
  >
    <Text className="text-white font-bold text-lg">{children}</Text>
  </TouchableOpacity>
);

export default Button;
