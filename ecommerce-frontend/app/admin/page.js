'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  shipped:   { label: 'Shipped',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'  },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const formatDate = (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(d));

function Toast({ toast }) {
  if (!toast.show) return null;
  return (
    <div className="toast toast-top toast-center z-50 pt-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs font-medium ${toast.success ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('products');
  const [toast, setToast] = useState({ show: false, msg: '', success: true });

  // products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [modal, setModal] = useState(null);
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

  // users state (read-only)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  // auth guard
  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const user = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!user || user.role !== 'admin') router.push('/products');
    } catch { router.push('/products'); }
  }, []);

  // fetch all
  const fetchProducts = async () => {
    setProdLoading(true);
    try { const res = await api.get('/products'); setProducts(res.data.data || res.data || []); }
    catch { showToast('Failed to load products.', false); }
    finally { setProdLoading(false); }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try { const res = await api.get('/orders'); setOrders(res.data.data || res.data || []); }
    catch { showToast('Failed to load orders.', false); }
    finally { setOrdersLoading(false); }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try { const res = await api.get('/users'); setUsers(res.data || []); }
    catch { showToast('Failed to load users.', false); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => { fetchProducts(); fetchOrders(); fetchUsers(); }, []);

  // product handlers
  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setImageFile(null); setImagePreview(null); setModal('create'); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category, isActive: p.isActive });
    setEditId(p.id); setImagePreview(p.imageUrl ? `http://localhost:3000${p.imageUrl}` : null); setImageFile(null); setModal('edit');
  };
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      let savedId = editId;
      if (modal === 'create') { const res = await api.post('/products', payload); savedId = res.data.data?.id || res.data.id; showToast('Product created!'); }
      else { await api.patch(`/products/${editId}`, payload); showToast('Product updated!'); }
      if (imageFile && savedId) {
        const fd = new FormData(); fd.append('image', imageFile);
        await api.post(`/products/${savedId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModal(null); fetchProducts();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed.', false); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try { await api.delete(`/products/${id}`); setProducts(p => p.filter(x => x.id !== id)); showToast('Product deleted.'); }
    catch { showToast('Delete failed.', false); }
    finally { setDeletingId(null); }
  };
  const handleQuickUpload = async (productId, file) => {
    setUploadingId(productId);
    try {
      const fd = new FormData(); fd.append('image', file);
      await api.post(`/products/${productId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Image uploaded!'); fetchProducts();
    } catch { showToast('Upload failed.', false); }
    finally { setUploadingId(null); }
  };

  // order handler
  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId);
    try { await api.patch(`/orders/${orderId}/status`, { status }); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o)); showToast(`Marked as ${status}.`); }
    catch { showToast('Update failed.', false); }
    finally { setUpdatingId(null); }
  };

  // stats
  const stats = [
    { label: 'Users',     value: users.length,                                    color: 'bg-pink-50 text-pink-600' },
    { label: 'Products',  value: products.length,                                 color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending',   value: orders.filter(o => o.status === 'pending').length, color: 'bg-amber-50 text-amber-600' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'bg-emerald-50 text-emerald-600' },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} />

      {/* Product Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">{modal === 'create' ? 'New Product' : 'Edit Product'}</h2>
              <button onClick={() => setModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-3 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Image */}
              <div onClick={() => fileRef.current?.click()}
                className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50 cursor-pointer transition-all flex items-center justify-center overflow-hidden">
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                  : <div className="text-center"><svg className="w-7 h-7 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg><p className="text-xs text-gray-400">Click to upload</p></div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. iPhone 15 Pro"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={2} placeholder="Short description..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all resize-none" />
              </div>
              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Price ($)', name: 'price', placeholder: '0.00', step: '0.01' }, { label: 'Stock', name: 'stock', placeholder: '0' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input name={f.name} type="number" min="0" step={f.step} value={form[f.name]} onChange={handleFormChange} placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
              {/* Category + Active */}
              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select name="category" value={form.category} onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-1">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} className="checkbox checkbox-primary checkbox-sm" />
                  <span className="text-xs font-medium text-gray-600">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-all">
                {saving && <span className="loading loading-spinner loading-xs" />}
                {saving ? 'Saving...' : modal === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400">Manage your store</p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs font-semibold text-amber-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
            Admin
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {stats.map(s => (
            <div key={s.label} className={`rounded-xl border border-gray-100 p-3 flex items-center gap-2.5 bg-white`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-extrabold ${s.color}`}>
                {s.value}
              </div>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
          {['products', 'orders', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{products.length} products</p>
              <button onClick={openCreate}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                New Product
              </button>
            </div>
            {prodLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3"><div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse shrink-0" /><div className="flex-1 space-y-2 py-1"><div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" /><div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/4" /></div></div>)}</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h, i) => (
                        <th key={i} className={`text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5 ${i === 1 ? 'hidden sm:table-cell' : i === 3 ? 'hidden md:table-cell' : i === 4 ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                              {p.imageUrl ? <img src={`http://localhost:3000${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-4 h-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-xs truncate max-w-[130px]">{p.name}</p>
                              <label className="flex items-center gap-1 mt-0.5 cursor-pointer group">
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) handleQuickUpload(p.id, e.target.files[0]); }} />
                                {uploadingId === p.id ? <span className="loading loading-spinner loading-xs text-indigo-400" /> : <svg className="w-2.5 h-2.5 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}
                                <span className="text-[10px] text-gray-300 group-hover:text-indigo-500 transition-colors">Upload</span>
                              </label>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell"><span className="text-xs text-gray-500">{p.category}</span></td>
                        <td className="px-3 py-2.5"><span className="text-xs font-bold text-gray-900">${p.price}</span></td>
                        <td className="px-3 py-2.5 hidden md:table-cell"><span className={`text-xs font-medium ${p.stock > 5 ? 'text-emerald-600' : p.stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>{p.stock}</span></td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1 h-1 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-0.5 justify-end">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                              {deletingId === p.id ? <span className="loading loading-spinner loading-xs" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <div className="py-10 text-center"><p className="text-xs text-gray-400">No products yet.</p><button onClick={openCreate} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">Add first product →</button></div>}
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === 'orders' && (
          <div>
            <p className="text-xs text-gray-400 mb-3">{orders.length} orders total</p>
            {ordersLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex justify-between"><div className="h-3.5 bg-gray-100 rounded animate-pulse w-28" /><div className="h-5 bg-gray-100 rounded animate-pulse w-20" /></div>)}</div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-xl border border-gray-100"><p className="text-xs text-gray-400">No orders yet.</p></div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => {
                  const isOpen = expanded === order.id;
                  const total = order.orderItems?.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0) ?? 0;
                  const nextStatus = order.status === 'pending' ? 'shipped' : order.status === 'shipped' ? 'delivered' : null;
                  const orderUser = users.find(u => u.id === order.userId);
                  const phone = order.user?.phone || orderUser?.phone;
                  const customerName = order.user?.name || orderUser?.name || 'Customer';

                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2.5 gap-3">
                        {/* Left */}
                        <button onClick={() => setExpanded(isOpen ? null : order.id)} className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900">Order #{order.id}</p>
                            <p className="text-[11px] text-gray-400 truncate">{customerName}{order.createdAt && ` · ${formatDate(order.createdAt)}`}</p>
                          </div>
                        </button>
                        {/* Right */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={order.status} />
                          <span className="text-xs font-extrabold text-gray-900 hidden sm:block">${total.toFixed(2)}</span>
                          {/* Call button */}
                          {phone && (
                            <a href={`tel:${phone}`} title={phone}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                              Call
                            </a>
                          )}
                          {nextStatus && (
                            <button onClick={() => handleStatusUpdate(order.id, nextStatus)} disabled={updatingId === order.id}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50">
                              {updatingId === order.id && <span className="loading loading-spinner loading-xs" />}
                              Mark {nextStatus}
                            </button>
                          )}
                          {order.status === 'delivered' && <span className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg">Done ✓</span>}
                        </div>
                      </div>
                      {/* Expanded */}
                      {isOpen && order.orderItems?.length > 0 && (
                        <div className="border-t border-gray-50 px-3 pb-3 pt-2 space-y-2">
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                {item.product?.imageUrl ? <img src={`http://localhost:3000${item.product.imageUrl}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{item.product?.name}</p>
                                <p className="text-[11px] text-gray-400">×{item.quantity} · ${item.product?.price}</p>
                              </div>
                              <span className="text-xs font-bold text-gray-900">${((item.product?.price ?? 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-1.5 border-t border-gray-50">
                            <span className="text-[11px] text-gray-400">Total</span>
                            <span className="text-xs font-extrabold text-gray-900">${total.toFixed(2)}</span>
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

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <div>
            <p className="text-xs text-gray-400 mb-3">{users.length} registered users</p>
            {usersLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 items-center"><div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" /><div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" /><div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" /></div></div>)}</div>
            ) : users.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-xl border border-gray-100"><p className="text-xs text-gray-400">No users found.</p></div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5">User</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5 hidden md:table-cell">Email</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5 hidden sm:table-cell">Phone</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5">Role</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                              {(u.name || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-gray-900 truncate max-w-[100px]">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell"><span className="text-xs text-gray-500">{u.email}</span></td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          {u.phone
                            ? <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                                {u.phone}
                              </a>
                            : <span className="text-xs text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            <span className={`w-1 h-1 rounded-full ${u.role === 'admin' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <span className="text-xs text-gray-400">{u.createdAt ? formatDate(u.createdAt) : '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}