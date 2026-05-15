import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-green-700">QuickMart</Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/products" className="hover:text-green-600">Shop</Link>
          <Link to="/cart" className="relative">
            <ShoppingCart />
            {itemCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{itemCount}</span>}
          </Link>
          {user ? (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-1 hover:text-green-600">
                <User size={20} /> {user.name}
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hover:text-green-600">Login</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-2 px-4 flex flex-col gap-3">
          <Link to="/products" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          <Link to="/cart" onClick={() => setIsMenuOpen(false)}>Cart ({itemCount})</Link>
          {user ? (
            <>
              <span className="text-gray-600">Hi, {user.name}</span>
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left text-red-600">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}