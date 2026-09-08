import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Environment helpers — return null instead of throwing when vars are missing
// so the module is safe to import even without Supabase configured.
// ---------------------------------------------------------------------------

function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}

function getSupabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
}

function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

// ---------------------------------------------------------------------------
// Server-side client (uses anon key — respects RLS with user JWT)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client for use in **server-side** contexts.
 * Returns null if Supabase environment variables are not configured.
 */
export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Server-side admin client (uses service role key — bypasses RLS)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase admin client (bypasses RLS).
 * Returns null if Supabase environment variables are not configured.
 * ⚠️  Only use in trusted server contexts — never expose to the browser.
 */
export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Browser-side client (safe for Client Components)
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client for use in **browser** / Client Components.
 * Returns null if Supabase environment variables are not configured.
 */
export function createBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createSupabaseBrowserClient(url, key);
}

