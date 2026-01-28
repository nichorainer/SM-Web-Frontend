import React, { useState, useEffect } from 'react';
import OrdersTable from '../components/OrdersTable.jsx';
import '../styles/orders-page.css';

// define storage key
const STORAGE_KEY = 'sm_orders_demo';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

  // Orders state: initialize from localStorage if available
  const [orders, setOrders] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : [
        { orderId: '100201', date: '2025-01-01', customer: 'Alice', platform: 'Tokipedia', destination: 'Jakarta', items: 2, status: 'Pending' },
        { orderId: '100302', date: '2025-01-02', customer: 'Bob', platform: 'Shoopa', destination: 'Bandung', items: 1, status: 'Completed' },
      ];
    } catch (err) {
      console.error('Failed to read orders from localStorage', err);
      return [
        { orderId: '100201', date: '2025-01-01', customer: 'Alice', platform: 'Tokipedia', destination: 'Jakarta', items: 2, status: 'Pending' },
        { orderId: '100302', date: '2025-01-02', customer: 'Bob', platform: 'Shoopa', destination: 'Bandung', items: 1, status: 'Completed' },
      ];
    }
  });

  // Persist orders to localStorage whenever orders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Failed to save orders to localStorage', err);
    }
  }, [orders]);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    customer: '',
    platform: 'Tokipedia',
    destination: '',
    items: 1,
    status: 'Pending',
    date: new Date().toISOString().slice(0, 10), // default today
  });

  // Reset func for search bar
  const resetFilters = () => {
    setSearch('');
    setPlatform('all');
    setStatus('all');
  };

  function updateField(field, value) {
    setNewOrder(prev => ({ ...prev, [field]: value }));
  }

  // Generate next Order ID in format
  function generateOrderId() {
    const base = Math.floor(Math.random() * 900000) + 100000;
    return `#${String(base).slice(0, 6)}`;
  }

  // Save handler: save, close modal, and refresh table
  function handleCreateOrder(e) {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      const order = {
        orderId: generateOrderId(),
        date: newOrder.date,
        customer: newOrder.customer,
        platform: newOrder.platform,
        destination: newOrder.destination,
        items: Number(newOrder.items),
        status: newOrder.status,
      };

      // IMPORTANT: update local orders state so parent passes new list to OrdersTable
      setOrders(prev => [order, ...prev]);
      
      // dispatch global event
      window.dispatchEvent(new CustomEvent('orders:add', { detail: order }));

      setSaving(false);
      setShowCreate(false);

      // Reset form
      setNewOrder({
        customer: '',
        platform: 'Tokipedia',
        destination: '',
        items: 1,
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
      });
    }, 600);
  }

  return (
    <div className="orders-page">
      <div className="page-top">
        <div className="title-group">
          <h2 className="page-title">Orders</h2>
          <p className="page-sub">Manage and track all orders</p>
        </div>

        <div className="actions-group">
          <input
            className="control-input"
            placeholder="Search orders, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />

          <select
            className="control-select"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            aria-label="Filter platform"
          >
            <option value="all">All platforms</option>
            <option value="Tokipedia">Tokipedia</option>
            <option value="Lazado">Lazado</option>
            <option value="Shoopa">Shoopa</option>
          </select>

          <select
            className="control-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter status"
          >
            <option value="all">All status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          <button className="btn btn-outline" onClick={resetFilters}>
            Reset
          </button>

          <button className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            Create New Order
          </button>
        </div>
      </div>

      <div className="orders-card">
        <OrdersTable 
          orders={orders}
          search={search}
          platform={platform}
          status={status}
          // keep onAddOrder only if you want parent callback
          // onAddOrder={(o) => setOrders(prev => [o, ...prev])}
        />
      </div>
      {showCreate && (
        <div className="order-modal" role="dialog" aria-modal="true" aria-label="Create new order">
          <div className="modal-card">
            <div className="modal-head">
              <h2>Create New Order</h2>
              <button className="btn-close" onClick={() => setShowCreate(false)} aria-label="Close">✕</button>
            </div>

            <div className="modal-body">
              <form className="order-form" onSubmit={handleCreateOrder}>
                <div className="form-row">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={newOrder.customer}
                    onChange={e => updateField('customer', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Platform</label>
                  <select
                    value={newOrder.platform}
                    onChange={e => updateField('platform', e.target.value)}
                  >
                    <option value="Tokipedia">Tokipedia</option>
                    <option value="Shoopa">Shoopa</option>
                    <option value="Lazado">Lazado</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Destination</label>
                  <input
                    type="text"
                    value={newOrder.destination}
                    onChange={e => updateField('destination', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Items</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.items}
                    onChange={e => updateField('items', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Status</label>
                  <select
                    value={newOrder.status}
                    onChange={e => updateField('status', e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newOrder.date}
                    onChange={e => updateField('date', e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}