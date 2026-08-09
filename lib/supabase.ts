import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vfjnsfxuxejeqrhmzkam.supabase.co";
const supabaseAnonKey = "sb_publishable_R7ue2u32C8Amtjd8tY6ViA_dll3jrFu";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
