const API_BASE = 'http://localhost:5000/api';

export const fetchProducts = async () => {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const checkHealth = async () => {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
};