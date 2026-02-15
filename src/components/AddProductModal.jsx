import React, { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { validateProductPayload } from '../utils/validators';
import '../styles/add-product-modal.css';

export default function AddProductModal({ isOpen, onClose, onSave }) {
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    productId: '',
    supplierName: '',
    category: '',
    price: '',
    stock: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', productId: '', supplierName: '', category: '', price: '', stock: '' });
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate using shared validator
    const check = validateProductPayload({
      name: form.name,
      productId: form.productId,
      supplierName: form.supplierName,
      category: form.category,
      price: form.price === '' ? NaN : Number(form.price),
      stock: form.stock === '' ? NaN : Number(form.stock),
    });

    if (!check.ok) {
      setErrors(check.errors);
      // show toast summary of first error
      const firstKey = Object.keys(check.errors)[0];
      toast({
        title: 'Validation error',
        description: check.errors[firstKey],
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      name: String(form.name).trim(),
      productId: String(form.productId).trim(),
      supplierName: String(form.supplierName).trim(),
      category: String(form.category).trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    setSaving(true);
    try {
      await onSave(payload); // parent handles API
      toast({
        title: 'Product added',
        description: `${payload.name} has been added successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      const message = err?.message || 'Failed to save product';
      setErrors((prev) => ({ ...prev, _global: message }));
      toast({
        title: 'Save failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Add new product">
        <h3>Add New Product</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} />
          {errors.name && <div className="error">{errors.name}</div>}

          <label>Product ID</label>
          <input name="productId" value={form.productId} onChange={handleChange} />
          {errors.productId && <div className="error">{errors.productId}</div>}

          <label>Supplier Name</label>
          <input name="supplierName" value={form.supplierName} onChange={handleChange} />
          {errors.supplierName && <div className="error">{errors.supplierName}</div>}

          <label>Category</label>
          <input name="category" value={form.category} onChange={handleChange} />
          {errors.category && <div className="error">{errors.category}</div>}

          <label>Price</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" min="0" />
          {errors.price && <div className="error">{errors.price}</div>}

          <label>Stock</label>
          <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" />
          {errors.stock && <div className="error">{errors.stock}</div>}

          {errors._global && <div className="error">{errors._global}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-subtle" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}