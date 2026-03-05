"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import {
  fetchWooStats,
  fetchWooOrders,
  updateWooOrderStatus,
  fetchWooProducts,
} from "@/application/woocommerce/woocommerce-actions";
import type {
  BridgeWooStats,
  BridgeWooOrder,
  BridgeWooProduct,
  BridgeWooOrderStatus,
} from "@/infrastructure/wp-bridge/types";

interface Props {
  siteId: string;
}

type WooTab = "orders" | "products";

const ORDER_STATUS_COLORS: Record<string, "warning" | "info" | "success" | "light" | "error"> = {
  pending: "warning",
  processing: "info",
  "on-hold": "warning",
  completed: "success",
  cancelled: "light",
  refunded: "error",
  failed: "error",
};

const STOCK_COLORS: Record<string, "success" | "error" | "warning"> = {
  instock: "success",
  outofstock: "error",
  onbackorder: "warning",
};

const ORDER_STATUSES: BridgeWooOrderStatus[] = [
  "pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed",
];

function MetricCard({
  label,
  value,
  prefix,
}: {
  label: string;
  value: number | string;
  prefix?: string;
}) {
  return (
    <div className="card-hover rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default function WooCommerceHub({ siteId }: Props) {
  const [stats, setStats] = useState<BridgeWooStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [wooInactive, setWooInactive] = useState(false);

  const [tab, setTab] = useState<WooTab>("orders");

  const [orders, setOrders] = useState<BridgeWooOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<number | null>(null);

  const [products, setProducts] = useState<BridgeWooProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Load stats
  useEffect(() => {
    void (async () => {
      setStatsLoading(true);
      const result = await fetchWooStats(siteId);
      if (result.success) {
        if (!result.data.is_active) {
          setWooInactive(true);
        } else {
          setStats(result.data);
        }
      } else {
        if (
          result.error.includes("woocommerce_inactive") ||
          result.error.includes("404")
        ) {
          setWooInactive(true);
        } else {
          setStatsError(result.error);
        }
      }
      setStatsLoading(false);
    })();
  }, [siteId]);

  // Load orders
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    const result = await fetchWooOrders(siteId);
    if (result.success) setOrders(result.data);
    else setOrdersError(result.error);
    setOrdersLoading(false);
  }, [siteId]);

  // Load products
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    const result = await fetchWooProducts(siteId);
    if (result.success) setProducts(result.data);
    else setProductsError(result.error);
    setProductsLoading(false);
  }, [siteId]);

  useEffect(() => {
    if (wooInactive || statsLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "orders") void loadOrders();
    else void loadProducts();
  }, [tab, wooInactive, statsLoading, loadOrders, loadProducts]);

  const handleOrderStatusChange = useCallback(
    async (orderId: number, status: BridgeWooOrderStatus) => {
      setOrderActionLoading(orderId);
      await updateWooOrderStatus(siteId, orderId, status);
      setOrderActionLoading(null);
      await loadOrders();
    },
    [siteId, loadOrders],
  );

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-700/60" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-700/60" />
      </div>
    );
  }

  if (wooInactive) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
          WooCommerce not detected on this site
        </p>
        <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-300">
          Install and activate WooCommerce to manage your store from here.
        </p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {statsError}
      </div>
    );
  }

  const symbol = stats?.currency_symbol ?? "$";

  return (
    <div className="space-y-6">
      {/* Stock alerts */}
      {stats && stats.low_stock_count > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-400">
          ⚠️ {stats.low_stock_count} product{stats.low_stock_count > 1 ? "s" : ""} with low stock.
        </div>
      )}
      {stats && stats.out_of_stock_count > 0 && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          🚫 {stats.out_of_stock_count} product{stats.out_of_stock_count > 1 ? "s" : ""} out of stock.
        </div>
      )}

      {/* Metric cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Revenue Today" value={stats.revenue_today.toFixed(2)} prefix={symbol} />
          <MetricCard label="Revenue This Month" value={stats.revenue_month.toFixed(2)} prefix={symbol} />
          <MetricCard label="Orders Pending" value={stats.orders_pending} />
          <MetricCard label="Orders Processing" value={stats.orders_processing} />
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["orders", "products"] as WooTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <>
          {ordersError && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {ordersError}
            </div>
          )}
          {ordersLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 border-b border-gray-100 dark:border-gray-800 py-2">
                  <div className="h-4 w-16 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 w-28 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 flex-1 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">#Order</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                        #{order.number}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-gray-400">{order.customer_email}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                        {order.currency} {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1">
                          <Badge size="sm" color={ORDER_STATUS_COLORS[order.status] ?? "light"}>
                            {order.status}
                          </Badge>
                          <select
                            className={cn(
                              "mt-1 rounded border border-gray-300 px-2 py-0.5 text-xs",
                              "dark:border-gray-700 dark:bg-gray-800 dark:text-white",
                              "focus:border-brand-500 focus:outline-none",
                            )}
                            value={order.status}
                            disabled={orderActionLoading === order.id}
                            onChange={(e) =>
                              void handleOrderStatusChange(
                                order.id,
                                e.target.value as BridgeWooOrderStatus,
                              )
                            }
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {order.payment_method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <>
          {productsError && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {productsError}
            </div>
          )}
          {productsLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 border-b border-gray-100 dark:border-gray-800 py-2">
                  <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 w-16 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                  <div className="h-4 flex-1 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No products found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">SKU</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Price</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Stock</th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                        {product.sku || "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                        {symbol}{product.price.toFixed(2)}
                        {product.is_on_sale && product.sale_price !== null && (
                          <span className="ml-1 text-xs text-error-500 line-through">
                            {symbol}{product.regular_price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge size="sm" color={STOCK_COLORS[product.stock_status]}>
                          {product.stock_status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                        {product.stock_quantity ?? "—"}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {product.total_sales}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
