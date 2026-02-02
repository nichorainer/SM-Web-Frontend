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

  const filteredProducts = products.filter((p) => {
    if (!q) return true;

    // Product ID: prefix match
    const productIdMatch = p.productId && p.productId.toLowerCase().startsWith(q);

    // Product Name: per kata
    const productNameMatch =
      p.name &&
      p.name
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(q));

    // Supplier Name: per kata
    const supplierMatch =
      p.supplierName &&
      p.supplierName
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(q));

    // Category: per kata
    const categoryMatch =
      p.category &&
      p.category
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(q));

    // Price: prefix match angka
    const priceStr = String(p.price_idr ?? p.price).toLowerCase();
    const priceMatch = /^\d+/.test(q) && priceStr.startsWith(q);

    return productIdMatch || productNameMatch || supplierMatch || categoryMatch || priceMatch;
  });

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
          setProducts(Array.isArray(list) ? list.map(p => ({
            name: p.product_name ?? p.name,
            productId: p.product_id ?? p.productId,
            supplierName: p.supplier_name ?? p.supplierName,
            category: p.category,
            price: p.price_idr ?? p.price,
            stock: p.stock,
          })) : []);
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
    const payload = {
      product_id: newProduct.productId || undefined,
      product_name: newProduct.name,
      supplier_name: newProduct.supplierName,
      category: newProduct.category,
      price_idr: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
    };

    try {
      const created = await createProduct(payload);
      const mapped = {
        name: created.product_name ?? created.name,
        productId: created.product_id ?? created.productId ?? `P-${Date.now()}`,
        supplierName: created.supplier_name ?? created.supplierName,
        category: created.category,
        price: created.price_idr ?? created.price,
        stock: created.stock,
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
      <div className="products-table-wrapper">
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
              filteredProducts.map((p, idx) => (
                <tr key={p.productId ?? p.product_id ?? p.id ?? `product-${idx}`}>
                  <td>{p.name ?? p.product_name}</td>
                  <td>{p.productId ?? p.product_id ?? p.id}</td>
                  <td>{p.supplierName ?? p.supplier_name}</td>
                  <td>{p.category}</td>
                  <td>IDR {p.price ?? p.price_idr}</td>
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
      </div>
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