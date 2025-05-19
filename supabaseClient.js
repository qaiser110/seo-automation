import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
console.log("SUPABASE_URL, SUPABASE_ANON_KEY", SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
