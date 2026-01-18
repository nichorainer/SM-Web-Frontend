import React from 'react';

export default function TopCards() {
  return (
    <div className="card">
      <h3>Top selling Products</h3>
      <div className="top-list">
        <div className="top-item">
          <img src="https://via.placeholder.com/64" alt="product" />
          <div>
            <div className="mono">#000105</div>
            <div className="muted">Quantity: 16</div>
          </div>
        </div>

        <div className="top-item">
          <img src="https://via.placeholder.com/64" alt="product" />
          <div>
            <div className="mono">#000224</div>
            <div className="muted">Quantity: 10</div>
          </div>
        </div>
      </div>
    </div>
  );
}