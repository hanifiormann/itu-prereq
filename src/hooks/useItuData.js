import { useState, useEffect } from 'react';
import { fetchAndParseData } from '../utils/parser';

export const useItuData = () => {
  const [data, setData] = useState({ courses: {}, plans: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await fetchAndParseData();
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  return { ...data, loading, error };
};
