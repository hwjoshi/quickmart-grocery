import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-green-700">QuickMart</Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/products" className="hover:text-green-600">Shop</Link>
          <Link to="/cart" className="relative">
            <ShoppingCart />
            {itemCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{itemCount}</span>}
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-2 px-4 flex flex-col gap-3">
          <Link to="/products" className="hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          <Link to="/cart" className="relative inline-flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            Cart <ShoppingCart size={18} />
            {itemCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2">{itemCount}</span>}
          </Link>
        </div>
      )}
    </nav>
  );
}