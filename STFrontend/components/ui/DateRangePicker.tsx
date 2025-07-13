import React from "react";
import { View, Text } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startDateError?: string;
  endDateError?: string;
  label?: string;
  checkConstraintError?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startDateError,
  endDateError,
  label = "Term",
  checkConstraintError,
}: DateRangePickerProps) {
  return (
    <View className="mb-2">
      <Text className="mb-1 font-medium">{label}</Text>
      <View className="flex-row gap-4 py-5 border border-gray-300 rounded-xl mb-2 px-3 bg-white items-center">
        <View className="flex-1 items-center">
          <Text className="mb-1">Start Date</Text>
          <DateTimePicker
            value={startDate ? new Date(startDate + "T12:00:00") : new Date()}
            mode="date"
            display="compact"
            onChange={(event, date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                onStartDateChange(`${yyyy}-${mm}-${dd}`);
              }
            }}
            style={{ width: 140, alignSelf: "center" }}
          />
        </View>
        <View className="justify-center items-center mt-5">
          <Text className="text-2xl text-gray-400">→</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="mb-1">End Date</Text>
          <DateTimePicker
            value={endDate ? new Date(endDate + "T12:00:00") : new Date()}
            mode="date"
            display="compact"
            onChange={(event, date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                onEndDateChange(`${yyyy}-${mm}-${dd}`);
              }
            }}
            style={{ width: 140, alignSelf: "center" }}
          />
        </View>
      </View>
      {startDateError && (
        <Text className="text-red-600 mb-2">{startDateError}</Text>
      )}
      {endDateError && (
        <Text className="text-red-600 mb-2">{endDateError}</Text>
      )}
      {checkConstraintError && (
        <Text className="text-red-600 mb-2">{checkConstraintError}</Text>
      )}
    </View>
  );
}
