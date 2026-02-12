import React, { useEffect, useState } from 'react';
import '../styles/orders.css';
import { updateOrderStatus, deleteOrder } from '../utils/api';
import { validateOrderPayload } from '../utils/validators';

export default function OrdersTable({
  orders = [],
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
}) {

  // Add order handler
  useEffect(() => {
    function handleAdd(e) {
      const newOrder = e?.detail;
      if (!newOrder) return;

      // validate payload shape and required fields
      const check = validateOrderPayload(newOrder);
      if (!check.ok) {
        console.warn('Ignored invalid orders:add event:', check.reason, newOrder);
        return;
      }

      // normalize minimal fields for UI consistency
      const normalized = {
        id: newOrder.id ?? null,
        orderId: newOrder.order_number ?? newOrder.orderId ?? '',
        customer: newOrder.customer_name ?? newOrder.customer ?? '',
        platform: newOrder.platform ?? 'Unknown',
        destination: newOrder.destination ?? '',
        total_amount: newOrder.total_amount ?? 1,
        status: (newOrder.status ?? 'pending').toLowerCase(),
        created_at: newOrder.created_at
          ? new Date(newOrder.created_at).toLocaleString()
          : new Date().toLocaleString(),
        __raw: newOrder,
      };


      // optionally notify parent (do not call parent to re-add to backend)
      if (typeof onAddOrder === 'function') {
        try {
          onAddOrder(normalized);
        } catch (err) {
          // swallow errors from parent callback to avoid breaking table
          console.warn('onAddOrder callback error', err);
        }
      }
    }

    window.addEventListener('orders:add', handleAdd);
    return () => window.removeEventListener('orders:add', handleAdd);
  }, [onAddOrder]);

  // Handler for edit status and delete order
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function openEditStatus(order) {
    const newStatus = prompt("Enter new status (pending/shipping/completed):", order.status);
    if (!newStatus) return;
    try {
      const updated = await updateOrderStatus(order.id, newStatus.toLowerCase());
      if (typeof onUpdateOrder === "function") {
        onUpdateOrder(order.id, updated.status);
      }
      setSelectedOrder(null);
    } catch (err) {
      console.error("Update status failed", err);
    }
  }

  async function handleDeleteOrder(order) {
    if (!window.confirm(`Delete order ${order.orderId}?`)) return;
    try {
      await deleteOrder(order.id);
      if (typeof onDeleteOrder === "function") {
        onDeleteOrder(order.id);
      }
      setSelectedOrder(null);
    } catch (err) {
      console.error("Delete order failed", err);
    }
  }

  return (
    <div className="card">
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Customer Name</th>
              <th>Platform</th>
              <th>Destination</th>
              <th>Total Amount</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="10" className="empty-cell">No orders found</td>
              </tr>
            ) : (
              orders.map((o, idx) => {
                const key = o.orderId || o.id || `order-${idx}`;
                // status class for 3 options
                const statusValue = (o.status || '').toLowerCase();
                let statusClass = '';
                if (statusValue === 'completed') {
                  statusClass = 'completed';   // green
                } else if (statusValue === 'shipping' || statusValue === 'shipped') {
                  statusClass = 'shipping';    // gray
                } else if (statusValue === 'pending') {
                  statusClass = 'pending';     // red
                }

                return (
                  <tr key={key} onClick={() => setSelectedOrder(o)}>
                    <td className="mono">{o.orderId || o.id || '-'}</td>
                    <td>{o.product_id != null ? o.product_id : '-'}</td>
                    <td>{o.product_name != null ? o.product_name : '-'}</td>
                    <td>{o.customer || '-'}</td>
                    <td>{o.platform || '-'}</td>
                    <td>{o.destination || '-'}</td>
                    <td className="center">{o.total_amount != null ? o.total_amount : '-'}</td>
                    <td className="center">
                      IDR {o.price_idr != null ? o.price_idr : '-'} K</td>
                    <td className="center">
                      <span className={`status ${statusClass}`}>
                        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                      </span>
                    </td>
                    <td>
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {selectedOrder && (
          <div className="row-actions">
            <button onClick={() => openEditStatus(selectedOrder)}>Edit Status</button>
            <button onClick={() => handleDeleteOrder(selectedOrder)}>Delete Order</button>
          </div>
        )}
      </div>
    </div>
  );
}