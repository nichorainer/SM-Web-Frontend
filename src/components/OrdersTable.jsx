import React, { useMemo, useState, useEffect } from 'react';
import '../styles/orders.css';

export default function OrdersTable({ orders = [], search = '', platform = 'all', status = 'all', onAddOrder }) {
  // keep a local copy so the component can update itself and react to prop changes
  const [list, setList] = useState(Array.isArray(orders) ? orders : []);

  // sync local list when parent prop changes
  useEffect(() => {
    setList(Array.isArray(orders) ? orders : []);
  }, [orders]);

  // listen to global 'orders:add' events and update list
  useEffect(() => {
    function handleAdd(e) {
      const newOrder = e?.detail;
      if (!newOrder) return;
        // only update local list; DO NOT call onAddOrder to avoid duplicate add in parent
        setList(prev => [newOrder, ...prev]);
      }
      window.addEventListener('orders:add', handleAdd);
      return () => window.removeEventListener('orders:add', handleAdd);
    }, []);

  // compute filtered list from local list and filters
  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return (Array.isArray(list) ? list : []).filter(o => {
      const plat = (o.platform || '').toLowerCase();
      const stat = (o.status || '').toLowerCase();

      if (platform !== 'all' && plat !== (platform || '').toLowerCase()) return false;
      if (status !== 'all' && stat !== (status || '').toLowerCase()) return false;
      if (!q) return true;

      const idField = (o.orderId || o.id || '').toString().toLowerCase();
      const customer = (o.customer || '').toString().toLowerCase();
      const destination = (o.destination || '').toString().toLowerCase();
      const platformField = plat;

      return (
        idField.includes(q) ||
        customer.includes(q) ||
        destination.includes(q) ||
        platformField.includes(q)
      );
    });
  }, [list, search, platform, status]);

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Platform</th>
              <th>Destination</th>
              <th>Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="7" className="empty-cell">No orders found</td>
              </tr>
            ) : (
              filtered.map((o, idx) => {
                const key = o.orderId || o.id || `order-${idx}`;
                const statusClass = ((o.status || '').toString().toLowerCase() === 'completed') ? 'completed' : 'pending';

                return (
                  <tr key={key}>
                    <td className="mono">{o.orderId || o.id || '-'}</td>
                    <td>{o.date || '-'}</td>
                    <td>{o.customer || '-'}</td>
                    <td>{o.platform || '-'}</td>
                    <td>{o.destination || '-'}</td>
                    <td className="center">{o.items != null ? o.items : '-'}</td>
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