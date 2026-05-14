import { useState } from "react";

const mockSlots = [
  { id: 1, label: "Today, 10 AM – 12 PM", available: true },
  { id: 2, label: "Today, 12 PM – 2 PM", available: true },
  { id: 3, label: "Today, 4 PM – 6 PM", available: false },
  { id: 4, label: "Tomorrow, 8 AM – 10 AM", available: true },
];

export default function DeliverySlotPicker({ selectedSlot, onSelect }) {
  return (
    <div className="space-y-2">
      <label className="block font-medium">Select Delivery Slot</label>
      <div className="grid grid-cols-2 gap-2">
        {mockSlots.map((slot) => (
          <button
            key={slot.id}
            disabled={!slot.available}
            onClick={() => onSelect(slot)}
            className={`p-2 border rounded-lg text-sm ${
              selectedSlot?.id === slot.id
                ? "bg-green-100 border-green-500 text-green-700"
                : slot.available
                ? "bg-white border-gray-300 hover:border-green-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {slot.label}
            {!slot.available && <span className="block text-xs">(Full)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}