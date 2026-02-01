import React, { useEffect } from 'react';
import '../styles/orders.css';
import { validateOrderPayload } from '../utils/validators';

export default function OrdersTable({
  orders = [],
  onAddOrder, // optional callback if parent wants to be notified (not used for event-driven adds)
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
        id: newOrder.id ?? newOrder.order_id ?? newOrder.orderNumber ?? newOrder.order_number,
        orderId: newOrder.order_number ?? newOrder.orderId ?? newOrder.orderNumber ?? newOrder.id,
        customer: newOrder.customer_name ?? newOrder.customerName ?? newOrder.customer,
        platform: newOrder.platform ?? 'Unknown',
        destination: newOrder.destination ?? '',
        total_amount: newOrder.total_amount ?? 0,
        status: newOrder.status ?? 'Pending',
        created_at: newOrder.created_at ?? new Date().toISOString(),
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

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Created At</th>
              <th>Customer Name</th>
              <th>Platform</th>
              <th>Destination</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="7" className="empty-cell">No orders found</td>
              </tr>
            ) : (
              orders.map((o, idx) => {
                const key = o.orderId || o.id || `order-${idx}`;

                // status class for 3 options
                const statusValue = (o.status || '').toString().toLowerCase();
                let statusClass = '';
                if (statusValue === 'completed') {
                  statusClass = 'completed';   // green
                } else if (statusValue === 'shipping') {
                  statusClass = 'shipping';    // gray
                } else {
                  statusClass = 'pending';     // red
                }

                return (
                  <tr key={key}>
                    <td className="mono">{o.orderId || o.id || '-'}</td>
                    <td>{o.created_at || '-'}</td>
                    <td>{o.customer || '-'}</td>
                    <td>{o.platform || '-'}</td>
                    <td>{o.destination || '-'}</td>
                    <td className="center">{o.total_amount != null ? o.total_amount : '-'}</td>
                    <td className="center">
                      <span className={`status ${statusClass}`}>
                        {o.status || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}