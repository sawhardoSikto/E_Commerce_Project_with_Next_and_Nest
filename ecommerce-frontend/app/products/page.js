'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const CATEGORY_ICONS = {
  Electronics: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
    </svg>
  ),
  Sports: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Stationery: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  ),
  Fashion: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  ),
  Home: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [user, setUser] = useState(null);
  const [toastState, setToastState] = useState({ show: false, success: true, msg: '' });
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined') setUser(JSON.parse(userData));
    } catch { localStorage.removeItem('user'); }
    fetchProducts();
  }, []);

  const showToast = (msg, success = true) => {
    setToastState({ show: true, success, msg });
    setTimeout(() => setToastState((s) => ({ ...s, show: false })), 2500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (search.trim()) {
        const res = await api.get(`/products/search?keyword=${search}`);
        setProducts(res.data.data);
      } else {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategory = async (cat) => {
    setLoading(true);
    setCategory(cat);
    try {
      const res = cat
        ? await api.get(`/products/category/${cat}`)
        : await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setAddingId(productId);
    try {
      await api.post('/cart', { productId, quantity: 1 });
      showToast('Added to cart successfully!', true);
    } catch (err) {
      showToast('Failed to add to cart.', false);
    } finally {
      setAddingId(null);
    }
  };

  const categories = ['Electronics', 'Sports', 'Stationery', 'Fashion', 'Home'];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toastState.show && (
        <div className="toast toast-top toast-center z-50 pt-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-sm font-medium ${
            toastState.success ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
          }`}>
            {toastState.success ? (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toastState.msg}
          </div>
        </div>
      )}

      {/* ── Compact Toolbar: Search + Categories in one sticky bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-1.5 w-72 shrink-0">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); fetchProducts(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              Search
            </button>
          </form>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            <button
              onClick={() => handleCategory('')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                category === ''
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  category === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
              </button>
            ))}
          </div>

          {/* Count */}
          {!loading && products.length > 0 && (
            <span className="hidden xl:block text-xs text-gray-400 shrink-0">
              {products.length} results
            </span>
          )}
        </div>
      </div>

      {/* ── Products ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="h-32 bg-gray-100 animate-pulse" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="flex justify-between pt-1">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-10" />
                    <div className="h-6 bg-gray-100 rounded animate-pulse w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No products found</h3>
            <p className="text-xs text-gray-500 mb-4">Try adjusting your search or browse all categories.</p>
            <button
              onClick={() => { setSearch(''); setCategory(''); fetchProducts(); }}
              className="px-4 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* 6 columns on XL — enough products visible without scroll */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="relative h-32 bg-gray-50 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={`http://localhost:3000${product.imageUrl}`}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                  )}
                  {/* Category badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 rounded border border-gray-100 shadow-sm">
                    {product.category}
                  </span>
                  {/* Out of stock */}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-white rounded-full border border-gray-200 uppercase tracking-wide">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-xs leading-snug line-clamp-1 mb-0.5">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed mb-1.5">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">${product.price}</span>
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                        product.stock > 5 ? 'text-emerald-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          product.stock > 5 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-400'
                        }`} />
                        {product.stock > 0 ? `${product.stock} left` : 'Sold out'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0 || addingId === product.id}
                      className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                        product.stock === 0
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
                      }`}
                    >
                      {addingId === product.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : product.stock === 0 ? (
                        'Unavailable'
                      ) : user ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                          </svg>
                          Add to Cart
                        </>
                      ) : (
                        'Sign in to Buy'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}