import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct,
  createVariant, updateVariant, deleteVariant,
  getInventory, addInventory, deleteInventory,
  getAdminOrders, updateOrderStatus,
  getSlots, createSlot, updateSlot, deleteSlot
} from '../services/adminApi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', image_url: '', is_perishable: true });
  const [variantForm, setVariantForm] = useState({ product_id: '', weight_grams: '', price: '', sku: '' });
  const [slotForm, setSlotForm] = useState({ slot_date: '', start_time: '', end_time: '', capacity: '' });
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  // Redirect if not admin
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, inventoryRes, ordersRes, slotsRes] = await Promise.all([
        getAdminProducts(),
        getInventory(),
        getAdminOrders(),
        getSlots()
      ]);
      setProducts(productsRes);
      setInventory(inventoryRes);
      setOrders(ordersRes);
      setSlots(slotsRes);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const handleCreateProduct = async () => {
    try {
      const newProduct = await createProduct(productForm);
      setProducts([...products, newProduct]);
      setShowProductForm(false);
      setProductForm({ name: '', description: '', category: '', image_url: '', is_perishable: true });
      toast.success('Product created');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const updated = await updateProduct(editingProduct.id, productForm);
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null);
      setShowProductForm(false);
      setProductForm({ name: '', description: '', category: '', image_url: '', is_perishable: true });
      toast.success('Product updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product? Variants will also be deleted.')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
        toast.success('Product deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Variant handlers
  const handleCreateVariant = async () => {
    try {
      const newVariant = await createVariant(variantForm);
      // Refresh products to show new variant
      const updatedProducts = await getAdminProducts();
      setProducts(updatedProducts);
      setShowVariantForm(false);
      setVariantForm({ product_id: '', weight_grams: '', price: '', sku: '' });
      toast.success('Variant added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteVariant = async (id) => {
    if (window.confirm('Delete variant?')) {
      try {
        await deleteVariant(id);
        const updatedProducts = await getAdminProducts();
        setProducts(updatedProducts);
        toast.success('Variant deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Inventory handlers
  const handleAddInventory = async (variantId) => {
    const qty = prompt('Enter quantity in grams:');
    if (!qty) return;
    const expiry = prompt('Expiry date (YYYY-MM-DD):');
    if (!expiry) return;
    try {
      await addInventory({ variant_id: variantId, quantity_grams: parseInt(qty), expiry_date: expiry });
      const updated = await getInventory();
      setInventory(updated);
      toast.success('Inventory added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteInventory = async (id) => {
    if (window.confirm('Delete this batch?')) {
      try {
        await deleteInventory(id);
        setInventory(inventory.filter(i => i.id !== id));
        toast.success('Batch deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Order handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delivery slot handlers
  const handleCreateSlot = async () => {
    try {
      const newSlot = await createSlot(slotForm);
      setSlots([...slots, newSlot]);
      setShowSlotForm(false);
      setSlotForm({ slot_date: '', start_time: '', end_time: '', capacity: '' });
      toast.success('Slot created');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateSlot = async () => {
    try {
      const updated = await updateSlot(editingSlot.id, slotForm);
      setSlots(slots.map(s => s.id === updated.id ? updated : s));
      setEditingSlot(null);
      setShowSlotForm(false);
      setSlotForm({ slot_date: '', start_time: '', end_time: '', capacity: '' });
      toast.success('Slot updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (window.confirm('Delete slot?')) {
      try {
        await deleteSlot(id);
        setSlots(slots.filter(s => s.id !== id));
        toast.success('Slot deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['products', 'inventory', 'orders', 'slots'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', category: '', image_url: '', is_perishable: true }); setShowProductForm(true); }} className="mb-4 bg-green-600 text-white px-4 py-2 rounded">+ New Product</button>
          {showProductForm && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h3 className="font-bold mb-2">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="border p-1" />
                <input placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="border p-1" />
                <input placeholder="Category" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="border p-1" />
                <input placeholder="Image URL" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} className="border p-1" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.is_perishable} onChange={e => setProductForm({...productForm, is_perishable: e.target.checked})} /> Perishable</label>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {products.map(product => (
              <div key={product.id} className="border rounded p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <p className="text-sm">{product.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductForm(true); }} className="text-blue-600">Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600">Delete</button>
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="font-semibold">Variants</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.variants?.map(v => (
                      <div key={v.id} className="bg-gray-100 rounded px-2 py-1 text-sm flex items-center gap-2">
                        {v.weight_grams}g - ₹{v.price}
                        <button onClick={() => { setVariantForm({ product_id: product.id, weight_grams: v.weight_grams, price: v.price, sku: v.sku }); setEditingVariant(v); setShowVariantForm(true); }} className="text-blue-500 text-xs">Edit</button>
                        <button onClick={() => handleDeleteVariant(v.id)} className="text-red-500 text-xs">X</button>
                      </div>
                    ))}
                    <button onClick={() => { setVariantForm({ product_id: product.id, weight_grams: '', price: '', sku: '' }); setEditingVariant(null); setShowVariantForm(true); }} className="bg-green-100 px-2 py-1 text-sm rounded">+ Add Variant</button>
                  </div>
                  <div className="mt-2">
                    <button onClick={() => handleAddInventory(product.variants?.[0]?.id)} className="text-sm text-green-600">+ Add Inventory Batch</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showVariantForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h3 className="font-bold mb-4">{editingVariant ? 'Edit Variant' : 'New Variant'}</h3>
                <select value={variantForm.product_id} onChange={e => setVariantForm({...variantForm, product_id: e.target.value})} className="w-full border p-2 mb-2">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input placeholder="Weight (grams)" type="number" value={variantForm.weight_grams} onChange={e => setVariantForm({...variantForm, weight_grams: e.target.value})} className="w-full border p-2 mb-2" />
                <input placeholder="Price (₹)" type="number" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: e.target.value})} className="w-full border p-2 mb-2" />
                <input placeholder="SKU" value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} className="w-full border p-2 mb-2" />
                <div className="flex gap-2">
                  <button onClick={editingVariant ? handleUpdateVariant : handleCreateVariant} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                  <button onClick={() => { setShowVariantForm(false); setEditingVariant(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Product</th><th>Variant</th><th>Quantity (g)</th><th>Expiry</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(batch => (
                <tr key={batch.id}>
                  <td className="border p-2">{batch.product_name}</td>
                  <td className="border p-2">{batch.weight_grams}g</td>
                  <td className="border p-2">{batch.quantity_grams}</td>
                  <td className="border p-2">{new Date(batch.expiry_date).toLocaleDateString()}</td>
                  <td className="border p-2"><button onClick={() => handleDeleteInventory(batch.id)} className="text-red-600">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="border p-2">#{order.id}</td>
                  <td className="border p-2">{order.user_name || 'Guest'} ({order.email})</td>
                  <td className="border p-2">₹{order.total_amount}</td>
                  <td className="border p-2">
                    <select value={order.status} onChange={e => handleUpdateOrderStatus(order.id, e.target.value)} className="border rounded p-1">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packing">Packing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="border p-2">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="border p-2">
                    <button onClick={() => alert(JSON.stringify(order, null, 2))} className="text-blue-600">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div>
          <button onClick={() => { setEditingSlot(null); setSlotForm({ slot_date: '', start_time: '', end_time: '', capacity: '' }); setShowSlotForm(true); }} className="mb-4 bg-green-600 text-white px-4 py-2 rounded">+ New Slot</button>
          {showSlotForm && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h3 className="font-bold mb-2">{editingSlot ? 'Edit Slot' : 'New Slot'}</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={slotForm.slot_date} onChange={e => setSlotForm({...slotForm, slot_date: e.target.value})} className="border p-1" />
                <input type="time" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} className="border p-1" />
                <input type="time" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} className="border p-1" />
                <input type="number" placeholder="Capacity" value={slotForm.capacity} onChange={e => setSlotForm({...slotForm, capacity: e.target.value})} className="border p-1" />
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={editingSlot ? handleUpdateSlot : handleCreateSlot} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                <button onClick={() => { setShowSlotForm(false); setEditingSlot(null); }} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Date</th><th>Start</th><th>End</th><th>Capacity</th><th>Booked</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td className="border p-2">{slot.slot_date}</td>
                  <td className="border p-2">{slot.start_time}</td>
                  <td className="border p-2">{slot.end_time}</td>
                  <td className="border p-2">{slot.capacity}</td>
                  <td className="border p-2">{slot.booked}</td>
                  <td className="border p-2">
                    <button onClick={() => { setEditingSlot(slot); setSlotForm(slot); setShowSlotForm(true); }} className="text-blue-600 mr-2">Edit</button>
                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}