import { useState, useEffect } from 'react';
import { getHealth } from '../services/api';

export function useApiData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message || 'Failed to load data'); setLoading(false); } });
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}

export function useApiStatus() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    getHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);
  return status;
}
