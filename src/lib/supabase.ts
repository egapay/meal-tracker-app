import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Vite replaces missing env vars with undefined at build time, which would
// otherwise surface much later as an opaque fetch failure.
if (!url || !publishableKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project values.',
  )
}

// Defaults already persist the session in localStorage and refresh the access
// token in the background, which is what keeps the Home Screen app signed in.
export const supabase = createClient(url, publishableKey)
