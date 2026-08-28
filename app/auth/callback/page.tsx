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
    <div className="min-h-screen bg-[#0a0a0a] crt-flicker flex items-center justify-center px-4">
      <div className="crt-overlay" />

      <div className="relative z-10 w-full max-w-md border border-[#333] bg-[#0a0a0a]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#333]">
          <span className="terminal-dot bg-[#ff5f57]" />
          <span className="terminal-dot bg-[#ffbd2e]" />
          <span className="terminal-dot bg-[#28c840]" />
          <span className="ml-3 text-[11px] text-[#4a7a4a]">
            oauth — bash — 80&times;24
          </span>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-1 text-sm leading-relaxed">
          <div className="flex items-center gap-0">
            <span className="text-[#00ff41]">$</span>
            <span className="text-[#b0ffb0] ml-2">gh auth status</span>
          </div>
          <div className="text-[#8ab88a] text-xs pt-1">
            exchanging code for session token...
          </div>
          <div className="flex items-center gap-2 pt-2 text-xs text-[#00ff41]">
            <span className="cursor-blink">█</span>
            <span>signing you in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
