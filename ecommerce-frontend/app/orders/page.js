"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
const formatDate = (dateString) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const router = useRouter();

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login'); 
    return;
  }
  
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchOrders();
}, []);
  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track your purchases</p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Shop More
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex justify-between mb-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
                  <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
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
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No orders yet
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Your order history will appear here.
            </p>
            <Link
              href="/products"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isOpen = expanded === order.id;
              const total =
                order.items?.reduce(
                  (sum, item) =>
                    sum + (item.product?.price ?? 0) * item.quantity,
                  0,
                ) ?? 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden"
                >
                  {/* Order Header — clickable to expand */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.createdAt
                            ? formatDate(order.createdAt)
                            : "N/A"}
                          {order.items?.length > 0 &&
                            ` · ${order.items.length} item${order.items.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={order.status} />
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-gray-900">
                          ${total.toFixed(2)}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Items */}
                  {isOpen && order.items?.length > 0 && (
                    <div className="border-t border-gray-50 px-5 pb-4">
                      <div className="pt-3 space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                              {item.product?.imageUrl ? (
                                <img
                                  src={`http://localhost:3000${item.product.imageUrl}`}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-gray-200"
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
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                                {item.product?.name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Qty: {item.quantity} · ${item.product?.price}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-gray-900 shrink-0">
                              $
                              {(
                                (item.product?.price ?? 0) * item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                        <span className="text-xs text-gray-500">
                          Order Total
                        </span>
                        <span className="text-sm font-extrabold text-gray-900">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
