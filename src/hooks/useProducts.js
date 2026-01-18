import { useState, useCallback } from 'react';
import api from '../api';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (payload) => {
    const res = await api.post('/products', payload);
    setProducts((p) => [res.data, ...p]);
    return res.data;
  }, []);

  const updateStock = useCallback(async (id, delta) => {
    const res = await api.patch(`/products/${id}`, { delta });
    // backend returns updated product or { stock }
    const updated = res.data;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    products,
    setProducts,
    loading,
    fetchProducts,
    addProduct,
    updateStock,
    deleteProduct,
  };
}