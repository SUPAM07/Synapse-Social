import { auth } from '@clerk/nextjs/server';
import { createClient, type InsForgeClient } from '@insforge/sdk';

// Environment variables
const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
const PROJECT_API_KEY = process.env.INSFORGE_PROJECT_API_KEY
const TEMPLATE = process.env.CLERK_INSFORGE_TEMPLATE;

const SERVER_TOKEN_TEMPLATE = TEMPLATE || 'insforge';

const TOKEN_REFRESH_MS = 50_000; // Clerk template tokens expire in 60s by default

let cachedClient: InsForgeClient | null = null;
let cachedUserId: string | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

async function refreshAuthToken(client: InsForgeClient, retries = 3): Promise<void> {
  try {
    const session = await auth();
    const token = await session?.getToken({ template: SERVER_TOKEN_TEMPLATE });
    if (token) {
      client.getHttpClient().setAuthToken(token);
    } else {
      throw new Error('No token received from Clerk');
    }
  } catch (err) {
    // if (retries > 0) {
    //   console.log(`Retrying token refresh... (${retries} retries left)`);
    //   setTimeout(() => refreshAuthToken(client, retries - 1), 1000);
    // }else {
    console.error('Failed to refresh Clerk token for InsForge client', err);
    client.getHttpClient().setAuthToken(null);
  }
}

/*
// Per-request client version I tried. Keeping here only for comparison.
export async function getInsforgeServerClient(): Promise<{ insforge: InsForgeClient; userId: string | null }> {
  if (!BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_BASE_URL or INSFORGE_BASE_URL environment variable');
  }
  if (!ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_ANON_KEY or INSFORGE_ANON_KEY environment variable');
  }

  const session = await auth();
  const { userId } = session;

  const insforge = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
    isServerMode: true,
  });

  if (userId) {
    const token = await session.getToken({ template: SERVER_TOKEN_TEMPLATE });

    if (token) {
      insforge.getHttpClient().setAuthToken(token);
    } else {
      console.error('No Clerk token received for InsForge client');
      insforge.getHttpClient().setAuthToken(null);
    }
  }

  return { insforge, userId };
}
*/

export async function getInsforgeServerClient(): Promise<{ insforge: InsForgeClient; userId: string | null }> {
  if (!BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_BASE_URL or INSFORGE_BASE_URL environment variable');
  }
  if (!ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_ANON_KEY or INSFORGE_ANON_KEY environment variable');
  }

  // Get current user from Clerk
  const { userId } = await auth();

  // Recreate client if user changed or no cached client
  if (userId !== cachedUserId || !cachedClient) {
    // Clear existing refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }

    // Create new client
    cachedClient = createClient({
      baseUrl: BASE_URL,
      anonKey: ANON_KEY,
    });
    cachedUserId = userId;

    // Set auth token if user is signed in
    if (userId) {
      await refreshAuthToken(cachedClient);

      // Start refresh interval
      refreshInterval = setInterval(async () => {
        if (cachedClient && cachedUserId) {
          await refreshAuthToken(cachedClient);
        }
      }, TOKEN_REFRESH_MS);
    }
  } else if (userId) {
    await refreshAuthToken(cachedClient);
  }

  return { insforge: cachedClient, userId };
}

export function getInsforgeAdminClient(): InsForgeClient {
  // Validate environment variables
  if (!BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_BASE_URL or INSFORGE_BASE_URL environment variable');
  }
  if (!ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_ANON_KEY or INSFORGE_ANON_KEY environment variable');
  }
  if (!PROJECT_API_KEY) {
    throw new Error('Missing INSFORGE_PROJECT_API_KEY or INSFORGE_API_KEY environment variable');
  }

  return createClient({
    baseUrl: BASE_URL,
    anonKey: PROJECT_API_KEY,
    isServerMode: true,
  });
}

export const getInsforgeUploadClient = getInsforgeAdminClient;
