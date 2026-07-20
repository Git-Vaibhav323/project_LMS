import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
}

// We only use Storage — disable realtime entirely so no WebSocket is needed.
// This makes the client compatible with Node 20 and avoids the missing
// native WebSocket error thrown by @supabase/realtime-js on older Node versions.
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: { disconnect: () => {} } as any,
});

export default supabase;
