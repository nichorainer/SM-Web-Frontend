import React, { useState } from 'react';
import '../styles/add-product-modal.css';

export default function AddProductModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    productId: '',
    supplierId: '',
    category: '',
    price: '',
    stock: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form); // sample data only
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Product</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} />

          <label>Product ID</label>
          <input name="productId" value={form.productId} onChange={handleChange} />

          <label>Supplier ID</label>
          <input name="supplierId" value={form.supplierId} onChange={handleChange} />

          <label>Category</label>
          <input name="category" value={form.category} onChange={handleChange} />

          <label>Price</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" />

          <label>Stock Level</label>
          <input name="stock" value={form.stock} onChange={handleChange} type="number" />

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}