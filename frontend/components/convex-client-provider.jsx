"use client";

/**
 * Formerly the Convex provider; now a lightweight passthrough so that
 * the rest of the component tree doesn't need to be restructured.
 */
export function ConvexClientProvider({ children }) {
  return children;
}
