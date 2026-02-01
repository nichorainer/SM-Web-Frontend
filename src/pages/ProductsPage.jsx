import React, { useState, useEffect } from 'react';
import AddProductModal from '../components/AddProductModal';
import '../styles/products-page.css';
import { getProducts, createProduct } from '../utils/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Filter search across all columns
  const q = searchTerm.toLowerCase();
  const filteredProducts = products.filter((p) =>
    [p.name, p.productId, p.supplierName, p.category, String(p.price), String(p.stock)]
      .some((field) => (field || '').toLowerCase().includes(q))
  )

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
  }

  function handleResetSearch() {
    setSearchTerm('');
  }
  
  // Load products from backend on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getProducts();
        if (!mounted) return;
        // Ensure consistent shape: map backend fields to frontend if needed
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load products', err);
        if (mounted) setError(err.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Open modal
  function handleAddProductClick() {
    setModalOpen(true);
  }

  // Close modal
  function handleModalClose() {
    setModalOpen(false);
  }

  // Save from modal -> send to backend then update UI
  async function handleModalSave(newProduct) {
    // normalize payload to backend expected fields
    const payload = {
      name: newProduct.name,
      product_id: newProduct.productId || undefined, // adapt field names if backend expects product_id
      supplier_name: newProduct.supplierName,
      category: newProduct.category,
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      // add other fields if needed
    };

    // Option A: optimistic update (uncomment if you want immediate UI update)
    // const temp = { ...newProduct, productId: newProduct.productId || `P-${Date.now()}` };
    // setProducts(prev => [temp, ...prev]);

    try {
      const created = await createProduct(payload);
      // adapt to backend response shape: created may be the created object or { data: obj }
      // Map backend fields to frontend fields used in the table
      const mapped = {
        name: created.name ?? created.product_name ?? newProduct.name,
        productId: created.product_id ?? created.productId ?? (newProduct.productId || `P-${Date.now()}`),
        supplierName: created.supplier_name ?? created.supplierName ?? newProduct.supplierName,
        category: created.category ?? newProduct.category,
        price: created.price ?? newProduct.price,
        stock: created.stock ?? newProduct.stock,
        // include any other fields returned by backend
      };
      // Add to UI
      setProducts((prev) => [mapped, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error('Create product failed', err);
      // If you did optimistic update earlier, consider rolling back here
      setError(err.message || 'Failed to create product');
      // show user feedback (toast) if you have one
    }
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h2 className="page-title">Products</h2>
        <p className="page-sub">Manage and track all products</p>
      </div>

      <div className="page-actions">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button type="button" className="btn btn-subtle" onClick={handleResetSearch}>Reset</button>
        </div>

        <button className="btn-primary" onClick={handleAddProductClick}>
          Add New Product
        </button>
      </div>

      {loading && <div className="muted">Loading products…</div>}
      {error && <div className="error">Error: {error}</div>}
      <table className="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Product ID</th>
            <th>Supplier Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <tr key={p.product_id}>
                <td>{p.product_name}</td>
                <td>{p.id}</td>
                <td>{p.supplier_name}</td>
                <td>{p.category}</td>
                <td>IDR {p.price_idr}K</td>
                <td>{p.stock}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Render modal using the same modalOpen state and handlers above */}
      {typeof AddProductModal !== 'undefined' && modalOpen && (
        <AddProductModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}