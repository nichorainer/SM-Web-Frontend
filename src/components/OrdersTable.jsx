import React, { useMemo } from 'react';
import '../styles/orders.css';

const SAMPLE_ORDERS = [
  { id: '#000005', date: '05/15/2025', customer: 'Jennifer', platform: 'Tokipedia', destination: 'Jakarta', items: 1, status: 'Completed' },
  { id: '#000004', date: '04/30/2025', customer: 'Michelle', platform: 'Shoopa', destination: 'Jakarta', items: 2, status: 'Pending' },
  { id: '#000003', date: '02/16/2025', customer: 'Nixon', platform: 'Lazado', destination: 'Bandung', items: 3, status: 'Completed' },
  { id: '#000002', date: '02/03/2025', customer: 'Owen', platform: 'Tokipedia', destination: 'Medan', items: 2, status: 'Pending' },
  { id: '#000001', date: '01/20/2025', customer: 'Calvin', platform: 'Tokipedia', destination: 'Surabaya', items: 5, status: 'Completed' },
];

export default function OrdersTable({ orders = [], search = '', platform = 'all', status = 'all' }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (platform !== 'all' && o.platform.toLowerCase() !== platform.toLowerCase()) return false;
      if (status !== 'all' && o.status.toLowerCase() !== status.toLowerCase()) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q) ||
        o.platform.toLowerCase().includes(q)
      );
    });
  }, [orders, search, platform, status]);

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>order ID</th>
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
              filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td>{o.date}</td>
                  <td>{o.customer}</td>
                  <td>{o.platform}</td>
                  <td>{o.destination}</td>
                  <td className="center">{o.items}</td>
                  <td className="center">
                    <span className={`status ${o.status.toLowerCase() === 'completed' ? 'completed' : 'pending'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}