import { useState, useCallback } from 'react';
import api from '../api';

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    setTransactions,
    loading,
    fetchTransactions,
  };
}