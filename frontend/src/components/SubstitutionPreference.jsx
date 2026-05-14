export default function SubstitutionPreference({ value, onChange }) {
  const options = [
    { value: "no", label: "❌ Cancel item if unavailable" },
    { value: "similar", label: "🔄 Replace with similar item (e.g., organic → regular)" },
    { value: "any", label: "✅ Any available substitute" },
  ];
  return (
    <div className="space-y-2">
      <label className="block font-medium">Substitution Preference</label>
      <div className="space-y-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="substitution"
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              className="text-green-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}