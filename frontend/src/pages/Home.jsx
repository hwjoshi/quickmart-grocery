import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../services/api";
import toast from "react-hot-toast";

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
    };
    loadProducts();
    const stored = localStorage.getItem("lastOrder");
    if (stored) setLastOrder(JSON.parse(stored));
  }, []);

  const categories = [...new Set(products.map(p => p.category))];
  const featured = products.slice(0, 4);

  const handleReorder = () => {
    if (!lastOrder || !lastOrder.items) return;
    lastOrder.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const variant = product.variants.find(v => v.weight === item.variant.weight);
        if (variant) addToCart(product, variant);
      }
    });
    toast.success("Previous order items added to cart");
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-green-700 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">Fresh Groceries, Delivered Fast</h1>
        <p className="text-lg">Farm-fresh vegetables, fruits & daily essentials</p>
        <Link to="/products" className="inline-block mt-6 bg-white text-green-700 px-6 py-2 rounded-full font-semibold">Shop Now →</Link>
      </section>

      {/* Reorder Section */}
      {lastOrder && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold mb-2">🔄 Reorder from your last purchase</h2>
            <p className="text-gray-600 mb-3">Order #{lastOrder.id} placed on {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-500 mb-4">{lastOrder.items.length} item(s) - Total Rs. {lastOrder.total}</p>
            <button onClick={handleReorder} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Add All to Cart
            </button>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="flex flex-wrap gap-4">
          {categories.map(cat => (
            <Link key={cat} to={`/products?category=${cat}`} className="bg-white shadow-sm rounded-full px-5 py-2 border hover:border-green-500">
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Fresh Picks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map(product => (
            <div key={product.id} className="border rounded-xl overflow-hidden bg-white">
              <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-green-600">from Rs.{product.variants[0]?.price}</p>
                <Link to={`/products?search=${product.name}`} className="text-sm text-green-600 mt-1 inline-block">View Details →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}