import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_URL. ' +
        'Add it to .env.local — see .env.example for reference.'
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add it to .env.local — see .env.example for reference.'
    );
  }
  return key;
}

function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add it to .env.local — see .env.example for reference.'
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Server-side client (uses anon key — respects RLS with user JWT)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client for use in **server-side** contexts
 * (API routes, Server Components, middleware).
 *
 * Uses the anon key so RLS policies are enforced.
 */
export function createClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Server-side admin client (uses service role key — bypasses RLS)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client that **bypasses** Row Level Security.
 *
 * ⚠️  Only use this in trusted server contexts (API routes, cron jobs).
 *     Never expose the service role key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Browser-side client (safe for Client Components)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client for use in **browser** / Client Components.
 *
 * Uses the public anon key and persists the session in cookies via
 * `@supabase/ssr`.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}
