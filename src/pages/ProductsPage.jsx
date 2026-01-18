import React, { useState } from 'react';
import '../styles/products-page.css';

const PRODUCTS = [
  { name: 'Shirt', id: 'TUX001234', supplier: 'REMA0123', category: 'T-Shirt', price: 4500, stock: 12000, },
  { name: 'T-Shirt', id: 'TUX001234', supplier: 'REMA0123', category: 'Shirt', price: 450, stock: 12000, },
  { name: 'Short Pants', id: 'TUX001234', supplier: 'REMA0123', category: 'Shorts', price: 4500, stock: 12000, },
  { name: 'Jeans', id: 'TUX001234', supplier: 'REMA0123', category: 'Pants', price: 4500, stock: 12000, }
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="products-page">
      <div className="page-top">
        <div className="title-group">
          <h2 className="page-title">Products</h2>
          <p className="page-sub">Manage and track all products</p>
        </div>

        <div className="actions-group">
          <input
            className="control-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <button className="btn btn-outline" onClick={() => setSearch('')}>Reset</button>
          <button className="btn btn-primary">Add New Product</button>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>PRODUCT NAME</th>
              <th>PRODUCT ID</th>
              <th>SUPPLIER ID</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STOCK LEVEL</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="7" className="empty-cell">No products found</td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.name}</td>
                  <td className="mono">{p.id}</td>
                  <td className="mono">{p.supplier}</td>
                  <td>{p.category}</td>
                  <td className="num">{`$${p.price}`}</td>
                  <td className="center mono">{p.stock}</td>
                  <td className="actions-cell">
                    <button className="action-btn">✏️</button>
                    <button className="action-btn">🗑️</button>
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
