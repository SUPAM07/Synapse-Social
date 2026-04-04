import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";

/**
 * Hook for fetching data from the Express REST API.
 *
 * @param {string|null} endpoint - API path (e.g. "/events/me"). Pass null to skip.
 * @param {object|string|null} params - Query parameters object or "skip" to skip the request.
 */
export const useConvexQuery = (endpoint, params = null) => {
  const { getToken } = useAuth();
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable serialisation of params for the dependency array
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!endpoint || params === "skip") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        let url = endpoint;
        if (params && typeof params === "object") {
          const filtered = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          );
          const qs = new URLSearchParams(filtered).toString();
          if (qs) url = `${endpoint}?${qs}`;
        }
        const result = await apiCall(url, token);
        if (!cancelled) {
          // Unwrap common Express response shapes { data: { events } }, { data: { event } }, etc.
          setData(result.data !== undefined ? result.data : result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          toast.error(err.message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey]);

  return { data, isLoading, error };
};

/**
 * Hook for mutating data via the Express REST API.
 *
 * Returns `{ mutate, data, isLoading, error }`.
 * Call `mutate(endpoint, options)` where `options` follows the standard
 * fetch `RequestInit` shape (method, body, headers, …).
 */
export const useConvexMutation = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (endpoint, options = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const result = await apiCall(endpoint, token, options);
        const responseData =
          result.data !== undefined ? result.data : result;
        setData(responseData);
        return responseData;
      } catch (err) {
        setError(err);
        toast.error(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getToken]
  );

  return { mutate, data, isLoading, error };
};
