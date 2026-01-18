import React from 'react';
import TopCards from '../components/TopCards';

export default function HomePage() {
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Overview of top selling products and stock alerts</p>
      </div>

      <div className="grid">
        <div className="col">
          <TopCards />
        </div>

        <div className="col">
          <div className="card">
            <h3>Stock Alert</h3>
            <table className="simple-table">
              <thead>
                <tr><th>order ID</th><th>Date</th><th>Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td>#000001</td><td>01/01/2026</td><td>2</td><td className="danger">Low Stock!</td></tr>
                <tr><td>#000122</td><td>10/12/2025</td><td>1</td><td className="danger">Low Stock!</td></tr>
                <tr><td>#000325</td><td>08/10/2025</td><td>2</td><td className="danger">Low Stock!</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}