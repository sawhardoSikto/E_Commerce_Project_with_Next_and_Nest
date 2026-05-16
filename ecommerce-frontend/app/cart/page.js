"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", success: true });

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cart/my");
      setCart(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, []);

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    try {
      await api.delete(`/cart/${itemId}`);
      setCart((prev) => prev.filter((item) => item.id !== itemId));
      showToast("Item removed from cart.", true);
    } catch {
      showToast("Failed to remove item.", false);
    } finally {
      setRemovingId(null);
    }
  };
  // handleRemove এর পাশে এই function add করো
  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.patch(`/cart/${itemId}`, { quantity: newQty });
      setCart((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQty } : item,
        ),
      );
    } catch {
      showToast("Failed to update quantity.", false);
    }
  };
  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await api.post("/orders");
      showToast("Order placed successfully!", true);
      setCart([]);
      setTimeout(() => router.push("/orders"), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to place order.", false);
    } finally {
      setPlacingOrder(false);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast.show && (
        <div className="toast toast-top toast-center z-50 pt-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-sm font-medium ${toast.success ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.success ? (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-sm font-bold text-gray-900">My Cart</h1>
          {cart.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
              {cart.length} {cart.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : cart.length === 0 ? (
          /* Empty */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href="/products"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Cart Items */}
            <div className="flex-1 space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors p-3 flex gap-3 items-start"
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    {item.product?.imageUrl ? (
                      <img
                        src={`http://localhost:3000${item.product.imageUrl}`}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-gray-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs line-clamp-1">
                      {item.product?.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.product?.category}
                    </p>
                    <div className="flex items-center gap-2 mt-1">

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-40 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-xs font-semibold text-gray-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400">
                          × ${item.product?.price}
                        </span>
                      </div>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        ${item.product?.price} each
                      </span>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900">
                      ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:w-60 shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-16">
                <h2 className="font-bold text-gray-900 text-xs mb-3">
                  Order Summary
                </h2>

                <div className="space-y-2 mb-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs text-gray-500"
                    >
                      <span className="truncate max-w-[140px]">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-700 shrink-0 ml-2">
                        $
                        {((item.product?.price ?? 0) * item.quantity).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">
                      Total
                    </span>
                    <span className="text-base font-extrabold text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  {placingOrder ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  {placingOrder ? "Placing order..." : "Place Order"}
                </button>

                <Link
                  href="/products"
                  className="flex items-center justify-center gap-1.5 mt-3 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
