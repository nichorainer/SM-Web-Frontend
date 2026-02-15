import React, { 
  useState, 
  useEffect, 
  useMemo 
} from 'react';
import {
  Button,
  HStack
} from "@chakra-ui/react";
import { IoCloseSharp } from "react-icons/io5";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import OrdersTable from '../components/OrdersTable.jsx';
import '../styles/orders-page.css';
import { getOrders, createOrders, getProducts, fetchNextOrderNumber } from '../utils/api.js';
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

  // State to track if we're currently generating an order ID to prevent multiple simultaneous calls
  const [generatingId, setGeneratingId] = useState(false);

  const handleRegenerateId = async () => {
    setGeneratingId(true);
    try {
      const raw = await generateOrderId();
      const next = raw == null ? '' : String(raw);
      setNewOrder(prev => ({ ...prev, order_number: next }));
    } catch (err) {
      console.error('Regenerate order id failed', err);
      toast({ title: 'Failed to generate ID', status: 'error', duration: 3000 });
      setNewOrder(prev => ({ ...prev, order_number: '' }));
    } finally {
      setGeneratingId(false);
    }
  };

  // For product selection in create order form
  const [products, setProducts] = useState([]);

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
          id: o.id,
          orderId: o.order_number,
          product_id: o.product_id,
          product_name: o.product_name,
          customer: o.customer_name,
          platform: o.platform,
          destination: o.destination,
          total_amount: o.total_amount,
          status: o.status,
          price_idr: o.price_idr,
          created_at: o.created_at ? new Date(o.created_at).toLocaleString() : null
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

  // Load products for selection in create order form from backend on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const list = await getProducts();
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    }
    loadProducts();
  }, []);

  // Open/close modal
  const openCreate = async () => {
    // const nextOrderNumber = await generateOrderId();
    let nextOrderNumber = '';
    try {
      const raw = await generateOrderId();
      nextOrderNumber = raw == null ? '' : String(raw);
    } catch (err) {
      console.error('generateOrderId failed', err);
      nextOrderNumber = '';
    }

    setNewOrder({
      order_number: nextOrderNumber || '',
      customer_name: '',
      platform: '',
      destination: '',
      total_amount: '',
      status: '',
      created_at: new Date().toISOString(),
      id_from_product: null,
      product_id: '',
      product_name: '',
      price_idr: 0,
    });
    setShowCreate(true);
    setError(null);
  };
  const closeCreate = () => {
    setShowCreate(false);
  };
  
  // Generate next Order ID in format (real-time from BE)
  async function generateOrderId() {
    try {
      const nextOrderNumber = await fetchNextOrderNumber();
      return nextOrderNumber;
    } catch (err) {
      console.error("Failed to fetch next order number", err);
      return null;
    }
  }

  // Save handler for new order -> call backend and update UI
  async function handleCreateOrderSave() {
    setFormError(null);

    // Form validation
    const check = validateOrderPayload({
      order_number: newOrder.order_number,
      customer_name: newOrder.customer_name,
      platform: newOrder.platform,
      destination: newOrder.destination,
      total_amount: Number(newOrder.total_amount) || 1,
      status: newOrder.status.toLowerCase(),
      created_at: newOrder.created_at,
      id_from_product: newOrder.id_from_product ? Number(newOrder.id_from_product) : null,
    });

    if (!check.ok) {
      setFormError(check.reason || 'Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      // Build payload expected by backend
      const payload = {
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        platform: newOrder.platform,
        destination: newOrder.destination,
        total_amount: Number(newOrder.total_amount) || 1,
        status: newOrder.status.toLowerCase(),
        created_at: newOrder.created_at,
        id_from_product: newOrder.id_from_product ? Number(newOrder.id_from_product) : null,
        product_id: newOrder.product_id,
        price_idr: newOrder.price_idr ? Number(newOrder.price_idr) : 0,
      };

      const created = await createOrders(payload);

      // Map response: use created_at from backend
      const mapped = {
        id: created.id,
        orderId: created.order_number,
        customer: created.customer_name ?? payload.customer_name,
        platform: created.platform ?? payload.platform,
        destination: created.destination ?? payload.destination,
        total_amount: created.total_amount ?? payload.total_amount,
        status: created.status ?? payload.status.toLowerCase(),
        created_at: created.created_at
          ? new Date(created.created_at).toLocaleString()
          : new Date(payload.created_at).toLocaleString(),
        product_id: created.product_id ?? newOrder.product_id,
        product_name: created.product_name ?? newOrder.product_name,
        price_idr: created.price_idr ?? newOrder.price_idr,
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

  // Filtered list for search bar
  const filtered = orders.filter(o => {
    if (search) {
      const s = search.toLowerCase();

      // Order ID: prefix match
      const cleanOrderId = o.orderId ? String(o.orderId).replace(/^#/, '').toLowerCase() : '';
      const orderIdMatch = cleanOrderId.startsWith(s);

      // Customer Name: substring match
      const customerMatch = o.customer && String(o.customer).toLowerCase().includes(s);

      // Destination: substring match
      const destinationMatch = o.destination && String(o.destination).toLowerCase().includes(s);

      // Created At: not filtered, always shown all
      if (!(orderIdMatch || customerMatch || destinationMatch)) {
        return false;
      }
    }

    // Platform filter
    if (platform !== 'all' && o.platform !== platform) return false;

    // Status filter
    if (status !== 'all' && o.status !== status) return false;

    return true;
  });

  // HELPERS
  // Check form validation status before enabling save button
  const isFormValid = useMemo(() => {
    const check = validateOrderPayload({
      order_number: newOrder.order_number,
      customer_name: newOrder.customer_name,
      platform: newOrder.platform,
      destination: newOrder.destination,
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      created_at: newOrder.created_at, // wajib ada
      id_from_product: newOrder.id_from_product ? Number(newOrder.id_from_product) : null, // wajib ada
      product_id: newOrder.product_id,
      product_name: newOrder.product_name,
      price_idr: newOrder.price_idr ? Number(newOrder.price_idr) : 0,
    });

  // To make sure all required fields are filled
  const allFilled =
    !!newOrder.order_number &&
    !!newOrder.customer_name &&
    !!newOrder.platform &&
    !!newOrder.destination &&
    !!newOrder.total_amount &&
    !!newOrder.status &&
    !!newOrder.created_at &&
    !!newOrder.id_from_product &&
    !!newOrder.product_id &&
    !!newOrder.product_name;

  return check.ok && allFilled;
}, [newOrder]);

  // Reset func for search bar
  const resetFilters = () => {
    setSearch('');
    setPlatform('all');
    setStatus('all');
  };

  function updateField(field, value) {
    // jika value adalah Promise/thenable, resolve dulu
    if (value && typeof value.then === 'function') {
      Promise.resolve(value)
        .then(resolved => {
          setNewOrder(prev => ({ ...prev, [field]: resolved == null ? '' : resolved }));
        })
        .catch(err => {
          console.error('Failed to resolve value for updateField', err);
          setNewOrder(prev => ({ ...prev, [field]: '' }));
        });
      return;
    }

    // normal case
    setNewOrder(prev => ({ ...prev, [field]: value }));
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
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
          </select>

          <button 
            className="btn btn-outline" 
            onClick={resetFilters}
          >
            Reset
          </button>

          <button 
            className="btn btn-primary"
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
          onUpdateOrder={(id, newStatus) => {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
          }}
          onDeleteOrder={(id) => {
            setOrders(prev => prev.filter(o => o.id !== id));
          }}
        />
      </div>
      {/* Button Create New Order */}
      {showCreate && (
        <div className="order-modal" role="dialog" aria-modal="true" aria-label="Create new order">
          <div className="modal-card">
            <div className="modal-head">
              <h2>Create New Order</h2>
              <button className="btn-close" onClick={closeCreate} aria-label="Close"><IoCloseSharp /></button>
            </div>

            <div className="modal-body">
              <form className="order-form" onSubmit={handleCreateOrderSave}>
                {/* Order Number */}
                <div className="form-row">
                  <label>Order Number</label>
                  <input
                    value={newOrder.order_number || ''}
                    onChange={e => updateField('order_number', e.target.value)}
                    required
                  />
                  <Button
                    size="sm"
                    onClick={handleRegenerateId}
                    isLoading={generatingId}
                    loadingText="Generating"
                    type="button"
                  >
                    Regenerate Order Number
                  </Button>
                </div>

                {/* Products Selection */}
                <div className="form-row">
                  <label>Product</label>
                  <select
                    value={newOrder.id_from_product || ''}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const product = products.find(p => p.id === selectedId);
                      setNewOrder(prev => ({
                        ...prev,
                        id_from_product: selectedId, 
                        product_id: product?.product_id || '',
                        product_name: product?.product_name || '',
                        price_idr: product?.price_idr || 0,
                      }))
                    }}
                    required
                  >
                    <option value="" disabled>Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Name */}
                <div className="form-row">
                  <label>Customer Name</label>
                  <input
                    value={newOrder.customer_name}
                    onChange={e => updateField('customer_name', e.target.value)}
                    required
                    placeholder="Enter customer name"
                    style={{ 
                      fontStyle: newOrder.customer_name === "" ? "italic" : "normal", 
                      color: newOrder.customer_name === "" ? "#888" : "#333" 
                    }}
                  />
                </div>
                
                {/* Platform Selection */}
                <div className="form-row">
                  <label>Platform</label>
                  <select
                    value={newOrder.platform}
                    onChange={e => updateField('platform', e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select Platform
                    </option>
                    <option value="Tokipedia">Tokipedia</option>
                    <option value="Shoopa">Shoopa</option>
                    <option value="Lazado">Lazado</option>
                  </select>
                </div>

                {/* Destination Form */}
                <div className="form-row">
                  <label>Destination</label>
                  <input
                    value={newOrder.destination}
                    onChange={e => updateField('destination', e.target.value)}
                    required
                    placeholder="Enter destination"
                      style={{ 
                      fontStyle: newOrder.destination === "" ? "italic" : "normal", 
                      color: newOrder.destination === "" ? "#888" : "#333" 
                    }}
                  />
                </div>

                {/* Total Amount Form */}
                <div className="form-row">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.total_amount}
                    onChange={e => updateField('total_amount', e.target.value)}
                    required
                    placeholder="Enter total amount"
                      style={{ 
                      fontStyle: newOrder.total_amount === "" ? "italic" : "normal", 
                      color: newOrder.total_amount === "" ? "#888" : "#333" 
                    }}
                  />
                </div>

                {/* Status Selection */}
                <div className="form-row">
                  <label>Status</label>
                  <select
                    value={newOrder.status}
                    onChange={e => updateField('status', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="shipping">Shipping</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Date Form (Created At) */}
                <div className="form-row">
                  <label className="form-label">Created At</label>
                  <DatePicker
                    selected={newOrder.created_at ? new Date(newOrder.created_at) : null}
                    onChange={date => updateField('created_at', date ? date.toISOString() : '')}
                    maxDate={new Date()}
                    showTimeSelect
                    dateFormat="Pp"
                    customInput={<input className="control-input" />}
                  />
                    <HStack mt={2}>
                      <Button
                        className="btn-modal btn-primary-modal"
                        size="sm" 
                        onClick={() => updateField('created_at', new Date().toISOString())}
                      >
                        Today
                      </Button>
                      <Button 
                        className="btn-modal btn-outline-modal" 
                        size="sm" 
                        onClick={() => updateField('created_at', '')}
                      >
                        Clear
                      </Button>
                    </HStack>
                </div>

                {formError && <div className="form-error">{formError}</div>}

                <div className="modal-actions">
                  <button 
                    className="btn-modal btn-outline-modal" 
                    onClick={closeCreate} 
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn-modal btn-primary-modal`}
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