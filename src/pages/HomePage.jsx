import React, { useState, useEffect } from 'react';
import '../styles/home-page.css';
import { getProducts, getOrders, fetchTopProductsFromOrders } from '../utils/api';



export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prod = await getProducts();
        const ord = await getOrders();
        setProducts(prod || []);
        setOrders(ord || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  // Upper card
  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;

  // Short Card
  const randomProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 5);
  const pendingOrders = orders.filter(o => String(o.status).toLowerCase() === "pending").slice(0, 5);

  // --- Revenue calculation for completed orders ---
  // --- helper: parse price string like "IDR 980 K", "980K", "980000", or numeric ---
  const parsePriceToNumber = (raw) => {
    if (raw == null) return 0;
    // if already number
    if (typeof raw === 'number' && !Number.isNaN(raw)) return Number(raw);

    // normalize to string
    let s = String(raw).trim();

    // remove currency words/symbols and spaces
    s = s.replace(/(idr|rp|\$|,|\s)/ig, '');

    // handle K (thousand) and M (million)
    const kMatch = s.match(/^([\d.,]+)k$/i);
    if (kMatch) {
      const n = parseFloat(kMatch[1].replace(',', '.'));
      return Math.round(n * 1000);
    }
    const mMatch = s.match(/^([\d.,]+)m$/i);
    if (mMatch) {
      const n = parseFloat(mMatch[1].replace(',', '.'));
      return Math.round(n * 1000000);
    }

    // plain numeric string (may contain dots as thousand separators or decimal)
    const cleaned = s.replace(/[^\d.]/g, '');
    if (cleaned === '') return 0;
    const parts = cleaned.split('.');
    const normalized = parts.length > 1 ? parts.slice(0, -1).join('') + '.' + parts.slice(-1)[0] : cleaned;
    const num = Number(normalized);
    return Number.isFinite(num) ? Math.round(num) : 0;
  };

  // --- new getOrderTotal using price (unit) * quantity (total amount) ---
  // includes heuristic: if unitRaw is numeric but order has a display string containing 'K', treat numeric as 'K' (multiply by 1000)
  const getOrderTotal = (order) => {
    if (!order) return 0;

    // 1) Determine quantity field (try common names)
    const qty = Number(order.total_amount ?? order.totalAmount ?? order.quantity ?? order.qty ?? 0) || 0;

    // 2) Determine unit price field (try common names)
    const possiblePriceFields = [
      'price', 'price_idr', 'unit_price', 'unitPrice', 'priceIdr', 'amount', 'price_per_unit'
    ];

    let unitRaw = null;
    for (const f of possiblePriceFields) {
      if (order[f] != null) {
        unitRaw = order[f];
        break;
      }
    }

    // 3) If no direct field, try to extract from order.price_string or formatted fields
    const displayPriceCandidates = [
      order.price_string, order.priceText, order.price_display, order.price_formatted, order.priceString
    ];
    const displayPrice = displayPriceCandidates.find(x => typeof x === 'string' && x.trim().length > 0);

    if (unitRaw == null && displayPrice) {
      unitRaw = displayPrice;
    }

    // 4) parse unit price to number (IDR)
    let unitPrice = parsePriceToNumber(unitRaw);

    // 4b) Heuristic: if unitRaw was numeric (or parsed small) but displayPrice contains 'k', treat as thousands
    if (unitPrice > 0 && unitPrice < 10000) {
      // If displayPrice explicitly contains 'K' we are certain; otherwise apply heuristic
      if ((displayPrice && /k/i.test(displayPrice)) || typeof unitRaw === 'number' || (/^[\d.,]+$/.test(String(unitRaw ?? '')))) {
        unitPrice = Math.round(unitPrice * 1000);
      }
    }

    // 5) fallback: if items array exists, sum item price*qty
    if ((!unitPrice || unitPrice === 0) && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, it) => {
        const p = parsePriceToNumber(it.price ?? it.unit_price ?? it.price_idr ?? 0);
        const q = Number(it.quantity ?? it.qty ?? 1) || 1;
        return sum + p * q;
      }, 0);
    }

    // 6) compute total
    return unitPrice * qty;
  };

  // --- filter completed orders (same as before) ---
  const completedOrders = orders.filter(o => {
    const s = String(o.status ?? '').toLowerCase();
    return s === 'complete' || s === 'completed' || s === 'done' || s === 'paid';
  });

  // --- compute revenue ---
  let totalRevenueNumber = completedOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);

  // Heuristic check: if parsed unit prices look small (likely in 'K') and there are display strings containing 'K',
  // then assume backend sent prices in thousands and multiply total by 1000.
  (() => {
    if (totalRevenueNumber <= 0) return;

    // collect parsed unit prices and display price hints
    const unitPrices = [];
    let hasKDisplay = false;

    for (const o of completedOrders) {
      // try to find raw unit field (same logic as getOrderTotal)
      const possiblePriceFields = ['price', 'price_idr', 'unit_price', 'unitPrice', 'priceIdr', 'amount', 'price_per_unit'];
      let unitRaw = null;
      for (const f of possiblePriceFields) {
        if (o[f] != null) { unitRaw = o[f]; break; }
      }
      const displayCandidates = [o.price_string, o.priceText, o.price_display, o.price_formatted, o.priceString];
      const displayPrice = displayCandidates.find(x => typeof x === 'string' && x.trim().length > 0);
      if (displayPrice && /k/i.test(displayPrice)) hasKDisplay = true;

      const parsed = parsePriceToNumber(unitRaw);
      if (parsed > 0) unitPrices.push(parsed);
    }

    // compute average parsed unit price (if any)
    const avgUnit = unitPrices.length ? unitPrices.reduce((a,b) => a+b, 0) / unitPrices.length : 0;

    // If average unit price is small (< 10k) and we saw at least one display with 'K', assume values are in K
    if (avgUnit > 0 && avgUnit < 10000 && hasKDisplay) {
      totalRevenueNumber = Math.round(totalRevenueNumber * 1000);
    }
  })();

  // Robust formatting: if value small (<1000) assume it's K and append .000, else format normally
  const formattedRevenue = (() => {
    const v = Number(totalRevenueNumber) || 0;
    if (v === 0) return 'Rp 0';

    if (v > 0 && v < 1000) {
      return `Rp ${v.toLocaleString('id-ID')}.000`;
    }

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(v);
  })();

  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    async function loadTopProducts() {
      try {
        const data = await fetchTopProductsFromOrders();
        setTopProducts(data);
      } catch (err) {
        // bisa tambahin error UI
      }
    }
    loadTopProducts();
  }, []);


  return (
    <div className="home-page">
      <div className="dashboard-header">
        <h2>Home</h2>
        <p className="subtitle">Welcome back!</p>
      </div>

      {/* Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{totalProducts}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>

        {/* Total Revenue Card */}
        <div className="stat-card">
          <div className="stat-label">Total Revenue (This Month)</div>
          <div className="stat-value">{formattedRevenue}</div>
        </div>
      </div>

      <div className="grid">
        {/* Short List Products */}
        <div className="card">
          <div className="card-header">
            <h3>Top Products</h3>
            <span className="badge success">Selling</span>
          </div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_id}</td>
                  <td>{p.product_name}</td>
                  <td>{p.total_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Short List Orders */}
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h3>Pending Orders</h3>
              <span className="badge danger">Critical</span>
            </div>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
            <tbody>
              {pendingOrders.map((o, index) => (
                <tr key={index}>
                  <td>{o.order_number}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.destination}</td>
                  <td>
                    <span
                      className={`badge-orders ${o.status === "pending" ? "danger" : "success"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}