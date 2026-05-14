import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { cartItems, updateQuantity, getCartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <Link to="/products" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 border-b pb-4">
            <img src={item.productImage} alt={item.productName} className="w-20 h-20 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-semibold">{item.productName}</h3>
              <p className="text-sm text-gray-500">{item.variantWeight}g – Rs. {item.price}</p>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-1 border rounded"><Minus size={16} /></button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-1 border rounded"><Plus size={16} /></button>
                <button onClick={() => updateQuantity(idx, 0)} className="ml-2 text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">Rs. {item.price * item.quantity}</p>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mt-6">
          <p className="text-xl font-bold">Total: Rs. {getCartTotal()}</p>
          <Link to="/checkout" className="bg-green-600 text-white px-6 py-2 rounded-lg">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}