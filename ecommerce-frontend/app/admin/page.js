'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  shipped:   { label: 'Shipped',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'  },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString));
};

function Toast({ toast }) {
  if (!toast.show) return null;
  return (
    <div className="toast toast-top toast-center z-50 pt-3">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-sm font-medium ${toast.success ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
        {toast.success
          ? <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          : <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
        {toast.msg}
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: 'Electronics', isActive: true };
const CATEGORIES = ['Electronics', 'Sports', 'Stationery', 'Fashion', 'Home'];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('products');
  const [toast, setToast] = useState({ show: false, msg: '', success: true });

  // products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileRef = useRef();

  // orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  // Auth guard
  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const user = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!user || user.role !== 'admin') router.push('/products');
    } catch { router.push('/products'); }
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || res.data || []);
    } catch { showToast('Failed to load products.', false); }
    finally { setProdLoading(false); }
  };

  // Fetch orders (admin sees all)
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data || res.data || []);
    } catch { showToast('Failed to load orders.', false); }
    finally { setOrdersLoading(false); }
  };

  useEffect(() => { fetchProducts(); fetchOrders(); }, []);

  // ── Product handlers ──────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setModal('create');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '',
      price: p.price, stock: p.stock,
      category: p.category, isActive: p.isActive,
    });
    setEditId(p.id);
    setImagePreview(p.imageUrl ? `http://localhost:3000${p.imageUrl}` : null);
    setImageFile(null);
    setModal('edit');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      let savedId = editId;

      if (modal === 'create') {
        const res = await api.post('/products', payload);
        savedId = res.data.data?.id || res.data.id;
        showToast('Product created!');
      } else {
        await api.patch(`/products/${editId}`, payload);
        showToast('Product updated!');
      }

      // Upload image if selected
      if (imageFile && savedId) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.post(`/products/${savedId}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setModal(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed.', false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(p => p.filter(x => x.id !== id));
      showToast('Product deleted.');
    } catch { showToast('Delete failed.', false); }
    finally { setDeletingId(null); }
  };

  const handleQuickUpload = async (productId, file) => {
    setUploadingId(productId);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/products/${productId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Image uploaded!');
      fetchProducts();
    } catch { showToast('Upload failed.', false); }
    finally { setUploadingId(null); }
  };

  // ── Order handlers ────────────────────────────────────────────────────────

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast(`Order marked as ${status}.`);
    } catch { showToast('Status update failed.', false); }
    finally { setUpdatingId(null); }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = [
    { label: 'Products', value: products.length, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
    ), color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Orders', value: orders.length, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
    ), color: 'bg-violet-50 text-violet-600' },
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ), color: 'bg-amber-50 text-amber-600' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ), color: 'bg-emerald-50 text-emerald-600' },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} />

      {/* ── Product Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {modal === 'create' ? 'New Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-center overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-xs text-gray-400">Click to upload image</p>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium">Change image</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Name</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. iPhone 15 Pro"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={2}
                  placeholder="Short product description..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all resize-none" />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price ($)</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFormChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stock</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleFormChange}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
                </div>
              </div>

              {/* Category + Active */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                  <select name="category" value={form.category} onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange}
                    className="checkbox checkbox-primary checkbox-sm" />
                  <span className="text-xs font-semibold text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm shadow-indigo-200 transition-all">
                {saving ? <span className="loading loading-spinner loading-xs" /> : null}
                {saving ? 'Saving...' : modal === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your store</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-xs font-semibold text-amber-700">Admin</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
          {['products', 'orders'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-150 ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{products.length} products total</p>
              <button onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                New Product
              </button>
            </div>

            {prodLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Product</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Category</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Price</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Stock</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                              {p.imageUrl
                                ? <img src={`http://localhost:3000${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                  </div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-xs truncate max-w-[140px]">{p.name}</p>
                              {/* Quick image upload */}
                              <label className="flex items-center gap-1 mt-0.5 cursor-pointer group">
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={e => { if (e.target.files[0]) handleQuickUpload(p.id, e.target.files[0]); }} />
                                {uploadingId === p.id
                                  ? <span className="loading loading-spinner loading-xs text-indigo-400" />
                                  : <svg className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                }
                                <span className="text-[10px] text-gray-300 group-hover:text-indigo-500 transition-colors">Upload image</span>
                              </label>
                            </div>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-gray-500">{p.category}</span>
                        </td>
                        {/* Price */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">${p.price}</span>
                        </td>
                        {/* Stock */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-medium ${p.stock > 5 ? 'text-emerald-600' : p.stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                            {p.stock}
                          </span>
                        </td>
                        {/* Active */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                              {deletingId === p.id
                                ? <span className="loading loading-spinner loading-xs" />
                                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="py-16 text-center">
                    <p className="text-sm text-gray-400">No products yet.</p>
                    <button onClick={openCreate} className="mt-3 text-sm font-semibold text-indigo-600 hover:underline">
                      Add your first product →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === 'orders' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">{orders.length} orders total</p>

            {ordersLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
                      <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-400">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => {
                  const isOpen = expanded === order.id;
                  const total = order.orderItems?.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0) ?? 0;
                  const nextStatus = order.status === 'pending' ? 'shipped' : order.status === 'shipped' ? 'delivered' : null;

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden">
                      <div className="flex items-center justify-between p-4 gap-4">

                        {/* Left: expand + info */}
                        <button onClick={() => setExpanded(isOpen ? null : order.id)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0">
                          <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">Order #{order.id}</p>
                            <p className="text-xs text-gray-400">
                              {order.user?.name || order.user?.email || 'Customer'}
                              {order.createdAt && ` · ${formatDate(order.createdAt)}`}
                            </p>
                          </div>
                        </button>

                        {/* Right: status + price + action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={order.status} />
                          <span className="text-sm font-extrabold text-gray-900 hidden sm:block">${total.toFixed(2)}</span>

                          {nextStatus && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, nextStatus)}
                              disabled={updatingId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updatingId === order.id
                                ? <span className="loading loading-spinner loading-xs" />
                                : null}
                              Mark {nextStatus}
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                              Completed ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded items */}
                      {isOpen && order.orderItems?.length > 0 && (
                        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                {item.product?.imageUrl
                                  ? <img src={`http://localhost:3000${item.product.imageUrl}`} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><svg className="w-4 h-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></div>
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{item.product?.name}</p>
                                <p className="text-[11px] text-gray-400">×{item.quantity} · ${item.product?.price}</p>
                              </div>
                              <span className="text-xs font-bold text-gray-900">
                                ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t border-gray-50">
                            <span className="text-xs text-gray-400">Total</span>
                            <span className="text-sm font-extrabold text-gray-900">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}