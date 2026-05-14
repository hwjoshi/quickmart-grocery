export default function WeightSelector({ variants, selectedVariant, onSelect }) {
  // Helper to calculate price per kg
  const getPricePerKg = (weightGrams, price) => {
    const perKg = (price / weightGrams) * 1000;
    return perKg.toFixed(0);
  };

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {variants.map((variant, idx) => {
        const isSelected = selectedVariant?.weight === variant.weight;
        const pricePerKg = getPricePerKg(variant.weight, variant.price);
        return (
          <button
            key={idx}
            onClick={() => onSelect(variant)}
            className={`px-3 py-1 rounded-full border ${
              isSelected
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
            } text-sm font-medium flex flex-col items-center`}
          >
            <span>{variant.weight}g – Rs.{variant.price}</span>
            <span className="text-xs opacity-70">(Rs.{pricePerKg}/kg)</span>
          </button>
        );
      })}
    </div>
  );
}