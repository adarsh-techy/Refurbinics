import { useCallback, useEffect, useState } from 'react';
import apiClient from '../services/api-client';

// Fetches a list from `endpoint` on mount and exposes a refetch/refresh helper
// so feature pages don't each re-implement the same loading/error dance.
function useFetchList(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result } = await apiClient.get(endpoint);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export default useFetchList;
