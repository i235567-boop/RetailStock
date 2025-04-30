import { useState, useEffect } from 'react';
import { financingService } from '../services/apiServices';

/**
 * Hook to manage active financing state
 * Used on dashboard and financing pages
 */
export function useFinancing() {
  const [active,  setActive]  = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [a, h] = await Promise.all([financingService.getActive(), financingService.getHistory()]);
      setActive(a.data.data.records);
      setHistory(h.data.data.records);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load financing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalDue = active.reduce((sum, f) => sum + (f.remainingBalance || 0), 0);
  const nextDue  = active.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;

  return { active, history, loading, error, totalDue, nextDue, refetch: load };
}
