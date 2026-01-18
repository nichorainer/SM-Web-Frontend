import React, { useMemo } from 'react';
import '../styles/home-page.css';

export default function HomePage() {
  const products = [
    { id: '000105', name: 'Fred Perry Tee', sold: 16, stock: 2 },
    { id: '000224', name: 'New Jeans', sold: 10, stock: 8 },
    { id: '000325', name: 'Short Pants', sold: 7, stock: 1 },
    { id: '000451', name: 'Classic Shirt', sold: 5, stock: 12 },
  ];

  const orders = [
    { Product: 'Fred Perry Tee', ProductID: '#000105', Stock: 2, status: 'Low Stock!' },
    { Product: 'New Jeans', ProductID: '#000224', Stock: 1, status: 'Low Stock!' },
  ];

  const totalProducts = products.length;
  const ordersThisWeek = 34;
  const lowStockCount = orders.length;

  const topSelling = useMemo(
    () => products.slice().sort((a, b) => b.sold - a.sold).slice(0, 4),
    [products]
  );

  return (
    <div className="home-page">
      <div className="dashboard-header">
        <h2>Home</h2>
        <p className="subtitle">Welcome back!</p>
      </div>

      {/* Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders This Week</div>
          <div className="stat-value">{ordersThisWeek}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Alerts</div>
          <div className="stat-value danger">{lowStockCount}</div>
        </div>
      </div>

      <div className="grid">
        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <h3>Top Selling Products</h3>
            <span className="badge success">Best Seller</span>
          </div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Product ID</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>#{p.id}</td>
                  <td>{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Products */}
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h3>Low Stock Products</h3>
              <span className="badge danger">Critical</span>
            </div>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Product ID</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, index) => (
                  <tr key={index}>
                    <td>{o.Product}</td>
                    <td>{o.ProductID}</td>
                    <td>{o.Stock}</td>
                    <td className="danger">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}