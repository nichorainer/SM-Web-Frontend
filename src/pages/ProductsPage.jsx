import React, { useState } from 'react';
import AddProductModal from '../components/AddProductModal';
import '../styles/products-page.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([
    {
      name: 'Fred Perry',
      productId: 'TUX001234',
      supplierName: 'Company A',
      category: 'T-Shirt',
      price: 1500,
      stock: 24,
    },
    {
      name: 'New Jeans',
      productId: 'TUX001235',
      supplierName: 'Seller B',
      category: 'Pants',
      price: 2500,
      stock: 12,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  function handleAddProductClick() {
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
  }

  function handleModalSave(newProduct) {
    setProducts((prev) => [...prev, newProduct]);
    setModalOpen(false);
  }

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
  }

  function handleResetSearch() {
    setSearchTerm('');
  }

  // Filter search berdasarkan semua kolom
  const q = searchTerm.toLowerCase();
  const filteredProducts = products.filter(p =>
    [p.name, p.productId, p.supplierName, p.category, String(p.price), String(p.stock)]
      .some(field => field.toLowerCase().includes(q))
  );

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
              <tr key={p.productId}>
                <td>{p.name}</td>
                <td>{p.productId}</td>
                <td>{p.supplierName}</td>
                <td>{p.category}</td>
                <td>IDR {p.price}K</td>
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

      {modalOpen && (
        <AddProductModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}