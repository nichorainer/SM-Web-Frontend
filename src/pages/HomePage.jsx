import React, { useState, useEffect } from 'react';
import '../styles/home-page.css';
import { getProducts, getOrders } from '../utils/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
          const prod = await getProducts();
          const ord = await getOrders();
          setProducts(prod);
          setOrders(ord);
        } catch (err) {
          console.error("Failed to fetch data:", err);
        }
      };
      fetchData();
    }, []);

  
  // Upper card
  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;

  // Short Card
  const randomProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 5);
  const pendingOrders = orders.filter(o => o.status === "pending").slice(0, 5);

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
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>
      </div>

      <div className="grid">
        {/* Short List Products */}
        <div className="card">
          <div className="card-header">
            <h3>Your Products</h3>
            <span className="badge success">Selling</span>
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
              {randomProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.product_name || p.name}</td>
                  <td>{p.product_id || p.id}</td>
                  <td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Short List Orders */}
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h3>Pending Orders</h3>
              <span className="badge danger">Critical</span>
            </div>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
            <tbody>
              {pendingOrders.map((o, index) => (
                <tr key={index}>
                  <td>{o.order_number}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.destination}</td>
                  <td>
                    <span 
                      className={`badge-orders ${o.status === "pending" ? "danger" : "success"}`}
                    >
                      {o.status}
                    </span>
                  </td>
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