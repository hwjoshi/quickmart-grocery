import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../services/api";
import DeliverySlotPicker from "../components/DeliverySlotPicker";
import SubstitutionPreference from "../components/SubstitutionPreference";

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [subPref, setSubPref] = useState("similar");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error("Please enter your delivery address");
      return;
    }

    const orderItems = cartItems.map(item => ({
      variant_id: item.variantId,
      weight_grams: item.variantWeight,
      price: item.price,
      quantity: item.quantity
    }));

    const orderPayload = {
      user_id: null,
      payment_method: paymentMethod,
      address: address,
      substitution_preference: subPref,
      total_amount: getCartTotal(),
      items: orderItems
    };

    setLoading(true);
    try {
      const result = await placeOrder(orderPayload);
      toast.success(`Order ${result.orderId} placed successfully!`);
      clearCart();
      navigate(`/order-tracking/${result.orderId}`);
    } catch (err) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <label className="block font-medium mb-1">Delivery Address</label>
            <textarea
              rows="2"
              className="w-full border rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
              placeholder="House number, street, landmark, city, pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <DeliverySlotPicker selectedSlot={selectedSlot} onSelect={setSelectedSlot} />

          <SubstitutionPreference value={subPref} onChange={setSubPref} />

          <div>
            <label className="block font-medium mb-1">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="text-green-600"
                />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="text-green-600"
                />
                Pay Online (Razorpay - mock)
              </label>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-50 p-4 rounded-xl shadow-sm h-fit">
          <h2 className="font-bold text-lg mb-3">Order Summary</h2>
          {cartItems.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span>{item.productName} ({item.variantWeight}g) x{item.quantity}</span>
              <span>Rs. {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 font-bold flex justify-between">
            <span>Total</span>
            <span>Rs. {getCartTotal()}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !address}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}