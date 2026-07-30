import { createClient } from '@supabase/supabase-js';

// LingoBite Play uses its OWN Supabase project - separate from LingoBite
// and LingoTrace. It is style-matched to the ecosystem but does not share
// accounts, data, or backend with either app.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
