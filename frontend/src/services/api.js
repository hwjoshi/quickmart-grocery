// Base URL – uses Vite's environment variable (set in Vercel)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Fetch all products with variants
export const fetchProducts = async () => {
  try {
    const [productsRes, variantsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/products`),
      fetch(`${API_BASE_URL}/variants`)
    ]);
    if (!productsRes.ok) throw new Error('Failed to fetch products');
    if (!variantsRes.ok) throw new Error('Failed to fetch variants');
    
    const products = await productsRes.json();
    const variants = await variantsRes.json();
    
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variants
        .filter(v => v.product_id === product.id)
        .map(v => ({
          id: v.id,
          weight: v.weight,
          price: v.price,
          unit: v.unit
        }))
        .sort((a, b) => a.weight - b.weight)
    }));
    
    return productsWithVariants;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Place order
export const placeOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Order failed');
  }
  return response.json();
};