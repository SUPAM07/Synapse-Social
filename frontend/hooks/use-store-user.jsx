"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api";

/**
 * Ensures the current Clerk user is synced with the Express backend
 * and returns the loading / authenticated state.
 */
export function useStoreUser() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsSynced(false);
      return;
    }

    let cancelled = false;

    const syncUser = async () => {
      try {
        const token = await getToken();
        await apiCall("/auth/me", token);
        if (!cancelled) setIsSynced(true);
      } catch {
        // If /auth/me fails the backend may not know the user yet; 
        // still mark as synced so the UI doesn't block indefinitely.
        if (!cancelled) setIsSynced(true);
      }
    };

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  return {
    isLoading: !isLoaded || (isSignedIn && !isSynced),
    isAuthenticated: isLoaded && isSignedIn,
  };
}
