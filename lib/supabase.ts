import { createClient } from "@supabase/supabase-js";
import { Contribution } from "./types";
import { placeholderContributions } from "./placeholder-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function getContributions(): Promise<Contribution[]> {
  if (!supabase) {
    // Fall back to placeholder data when Supabase is not configured
    return placeholderContributions;
  }

  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error, falling back to placeholder data:", error);
    return placeholderContributions;
  }

  return (data as Contribution[]) ?? placeholderContributions;
}
