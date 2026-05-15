const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// Products
export const getAdminProducts = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/products`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};
export const createProduct = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Create failed');
  return res.json();
};
export const updateProduct = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
};
export const deleteProduct = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
};

// Variants
export const createVariant = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Create variant failed');
  return res.json();
};
export const updateVariant = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/admin/variants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Update variant failed');
  return res.json();
};
export const deleteVariant = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/variants/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Delete variant failed');
  return res.json();
};

// Inventory
export const getInventory = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/inventory`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
};
export const addInventory = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/inventory`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Add inventory failed');
  return res.json();
};
export const deleteInventory = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Delete inventory failed');
  return res.json();
};

// Orders
export const getAdminOrders = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/orders`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};
export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Update status failed');
  return res.json();
};

// Delivery slots
export const getSlots = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/slots`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch slots');
  return res.json();
};
export const createSlot = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/slots`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Create slot failed');
  return res.json();
};
export const updateSlot = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/admin/slots/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Update slot failed');
  return res.json();
};
export const deleteSlot = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/slots/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Delete slot failed');
  return res.json();
};