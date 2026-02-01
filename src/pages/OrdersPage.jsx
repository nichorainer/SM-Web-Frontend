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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load orders from backend on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getProducts();
        if (!mounted) return;
        // Ensure consistent shape: map backend fields to frontend if needed
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load products', err);
        if (mounted) setError(err.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

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

  async function handleModalSave(newProduct) {
    const payload = {
      product_id: newProduct.productId || undefined,
      product_name: newProduct.name,
      supplier_name: newProduct.supplierName,
      category: newProduct.category,
      price_idr: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      // created_by: newProduct.createdBy || 'frontend',
    };

    try {
      const created = await createProduct(payload);
      const mapped = {
        name: created.product_name ?? created.name,
        productId: created.product_id ?? created.productId ?? `P-${Date.now()}`,
        supplierName: created.supplier_name ?? created.supplierName,
        category: created.category,
        price: created.price_idr ?? created.price,
        stock: created.stock,
      };

      // Add to UI
      setProducts((prev) => [mapped, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error('Create product failed', err);
      // If you did optimistic update earlier, consider rolling back here
      setError(err.message || 'Failed to create product');
      // show user feedback (toast) if you have one
    }
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
              <form className="order-form" onSubmit={handleModalSave}>
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