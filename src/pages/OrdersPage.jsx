import React, { useState, useEffect, useMemo } from 'react';
import OrdersTable from '../components/OrdersTable.jsx';
import '../styles/orders-page.css';
import { getOrders, createOrders } from '../utils/api.js';
import { validateOrderPayload } from '../utils/validators.js';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // state untuk menampilkan pesan validasi
  const [formError, setFormError] = useState(null);

  // Modal or form state
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    order_number: '',
    customer_name: '',
    platform: 'Tokipedia',
    destination: '',
    total_amount: 1,
    status: 'Pending',
    created_at: new Date().toISOString(),
  });

  // Load orders from backend on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getOrders();
        if (!mounted) return;
        setOrders(Array.isArray(list) ? list.map(o => ({
          orderId: o.order_number,
          customer: o.customer_name,
          platform: o.platform,
          destination: o.destination,
          total_amount: o.total_amount,
          status: o.status,
          created_at: o.created_at ? new Date(o.created_at).toLocaleString() : null,
        })) : []);

      } catch (err) {
        console.error('Failed to load orders', err);
        if (mounted) setError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Open/close modal
  const openCreate = () => {
    setNewOrder({
      order_number: generateOrderId(),
      customer_name: '',
      platform: 'Tokipedia',
      destination: '',
      total_amount: 1,
      status: 'Pending',
      created_at: new Date().toISOString(),
    });
    setShowCreate(true);
    setError(null);
  };
  const closeCreate = () => {
    setShowCreate(false);
  };

  // Save handler for new order -> call backend and update UI
  async function handleCreateOrderSave() {
    setFormError(null);

    // Form validation
    const check = validateOrderPayload({
      order_number: newOrder.order_number,
      customer_name: newOrder.customer_name,
      platform: newOrder.platform,
      destination: newOrder.destination,
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      created_at: newOrder.created_at,
    });

    if (!check.ok) {
      setFormError(check.reason || 'Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      // Build payload expected by backend. Sesuaikan nama field dengan API server.
      const payload = {
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        platform: newOrder.platform,
        destination: newOrder.destination,
        total_amount: Number(newOrder.total_amount) || 1,
        status: newOrder.status.toLowerCase(),
        created_at: newOrder.created_at,

      };

      const created = await createOrders(payload);

      // Map response: use created_at from backend
      const mapped = {
        id: created.id ?? generateOrderId(),
        orderId: created.order_number ?? payload.order_number,
        customer: created.customer_name ?? payload.customer_name,
        platform: created.platform ?? payload.platform,
        destination: created.destination ?? payload.destination,
        total_amount: created.total_amount ?? payload.total_amount,
        status: created.status ?? payload.status.toLowerCase(),
        created_at: created.created_at     
          ? new Date(created.created_at).toLocaleString()
          : new Date(payload.created_at).toLocaleString(),
      };

      setOrders(prev => [mapped, ...prev]);
      setShowCreate(false);
    } catch (err) {
      console.error('Create order failed', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  }

  // Filtered list for display
  const filtered = orders.filter(o => {
    if (search && !(
      String(o.orderId).toLowerCase().includes(search.toLowerCase()) ||
      String(o.customerName).toLowerCase().includes(search.toLowerCase())
    )) return false;
    if (platform !== 'all' && o.platform !== platform) return false;
    if (status !== 'all' && o.status !== status) return false;
    return true;
  });

  // HELPERS
  // Untuk cek validitas form saat mengetik
  const isFormValid = useMemo(() => {
    const check = validateOrderPayload({
      order_number: newOrder.order_number,
      customer_name: newOrder.customer_name,
      platform: newOrder.platform,
      destination: newOrder.destination,
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      created_at: newOrder.created_at,
    });
    return check.ok;
  }, [newOrder]);

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
            <option value="pending">Pending</option>
            <option value="shipping">Shipped</option>
            <option value="completed">Completed</option>
          </select>

          <button className="btn btn-outline" onClick={resetFilters}>
            Reset
          </button>

          <button className="btn btn-primary"
            onClick={openCreate}
          >
            Create New Order
          </button>
        </div>
      </div>

      {loading && <p>Loading orders…</p>}
      {error && <div className="error">{error}</div>}

      <div className="orders-card">
        <OrdersTable 
          orders={filtered}
          search={search}
          platform={platform}
          status={status}
        />
      </div>
      {/* Button Create New Order */}
      {showCreate && (
        <div className="order-modal" role="dialog" aria-modal="true" aria-label="Create new order">
          <div className="modal-card">
            <div className="modal-head">
              <h2>Create New Order</h2>
              <button className="btn-close" onClick={closeCreate} aria-label="Close">✕</button>
            </div>

            <div className="modal-body">
              <form className="order-form" onSubmit={handleCreateOrderSave}>
                {/* Order Number */}
                <div className="form-row">
                  <label>Order Number</label>
                  <input
                    input value={newOrder.order_number}
                    onChange={e => updateField('order_number', e.target.value)}
                    required
                  />
                </div>
                {/* Customer Name */}
                <div className="form-row">
                  <label>Customer Name</label>
                  <input
                    input value={newOrder.customer_name}
                    onChange={e => updateField('customer_name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Platform</label>
                  <select
                    value={newOrder.platform}
                    onChange={e => updateField('platform', e.target.value)}
                    required
                  >
                    <option value="Tokipedia">Tokipedia</option>
                    <option value="Shoopa">Shoopa</option>
                    <option value="Lazado">Lazado</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Destination</label>
                  <input
                    value={newOrder.destination}
                    onChange={e => updateField('destination', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.total_amount}
                    onChange={e => updateField('total_amount', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Status</label>
                  <select
                    value={newOrder.status}
                    onChange={e => updateField('status', e.target.value)}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="shipping">Shipped</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Date</label>
                  <input
                    type="datetime-local"
                    className="control-input"
                    value={newOrder.created_at
                      ? new Date(newOrder.created_at).toISOString().slice(0,16) // format ke yyyy-MM-ddTHH:mm
                      : new Date().toISOString().slice(0,16)}
                    onChange={e => updateField('created_at', new Date(e.target.value).toISOString())}
                  />
                </div>

                {formError && <div className="form-error">{formError}</div>}

                <div className="modal-actions">
                  <button onClick={closeCreate} disabled={saving}>Cancel</button>
                  <button
                    onClick={handleCreateOrderSave}
                    disabled={saving || !isFormValid}
                  >
                    {saving ? 'Saving…' : 'Save Order'}
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