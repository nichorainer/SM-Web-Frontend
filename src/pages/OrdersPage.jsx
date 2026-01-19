import React, { useState, useEffect } from 'react';
import OrdersTable from '../components/OrdersTable.jsx';
import '../styles/orders-page.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

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
    date: new Date().toISOString().slice(0, 10), // default today (YYYY-MM-DD)
  });

  // Fetch orders from backend
  useEffect(() => {
    fetch('http://localhost:8080/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));
  }, []);

  const resetFilters = () => {
    setSearch('');
    setPlatform('all');
    setStatus('all');
  };

  function updateField(field, value) {
    setNewOrder(prev => ({ ...prev, [field]: value }));
  }

  // Save handler: send to backend and refresh table
  function handleCreateOrder(e) {
    e.preventDefault();
    setSaving(true);

    const orderPayload = {
      customer: newOrder.customer,
      platform: newOrder.platform,
      destination: newOrder.destination,
      items: Number(newOrder.items),
      status: newOrder.status,
      date: newOrder.date,
    };

    fetch('http://localhost:8080/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    })
      .then(res => res.json())
      .then(createdOrder => {
        setOrders(prev => [...prev, createdOrder]); // update local state
        setShowCreate(false);
        setNewOrder({
          customer: '',
          platform: 'Tokipedia',
          destination: '',
          items: 1,
          status: 'Pending',
          date: new Date().toISOString().slice(0, 10),
        });
      })
      .catch(err => console.error('Error creating order:', err))
      .finally(() => setSaving(false));
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