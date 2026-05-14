import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant) => {
    // variant should have { id, weight, price, unit }
    const existingIndex = cartItems.findIndex(
      item => item.productId === product.id && item.variantId === variant.id
    );
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
      toast.success(`Added another ${variant.weight}g of ${product.name}`);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          productImage: product.image_url,
          variantId: variant.id,
          variantWeight: variant.weight,
          price: variant.price,
          quantity: 1,
        }
      ]);
      toast.success(`${variant.weight}g ${product.name} added to cart`);
    }
  };

  const updateQuantity = (itemIndex, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((_, i) => i !== itemIndex));
    } else {
      const updated = [...cartItems];
      updated[itemIndex].quantity = newQuantity;
      setCartItems(updated);
    }
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, clearCart, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};