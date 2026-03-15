"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

/**
 * GitHub OAuth redirects back here with ?code=xxx in the URL.
 * Supabase exchanges the code for a session, then we send the user
 * to the admin dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = getBrowserClient();

    // Supabase detects the code in the URL automatically when
    // detectSessionInUrl: true (set in the browser client).
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/admin/dashboard/");
      } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        router.replace("/admin/");
      }
    });

    // Also try an explicit session check in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin/dashboard/");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Signing you in…</p>
    </div>
  );
}
