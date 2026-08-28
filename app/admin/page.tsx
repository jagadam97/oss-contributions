"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase-browser";
import { Github } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin/dashboard/");
      else setLoading(false);
    });
  }, [router]);

  async function signInWithGitHub() {
    setSigning(true);
    const supabase = getBrowserClient();
    const base =
      process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}${base}/auth/callback/`,
      },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] crt-flicker flex items-center justify-center text-xs text-[#4a7a4a]">
        <div className="crt-overlay" />
        <span className="text-[#00ff41] cursor-blink mr-2">█</span>
        checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] crt-flicker flex flex-col items-center justify-center px-4">
      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      <div className="relative z-10 w-full max-w-md">
        {/* ── Terminal window ── */}
        <div className="border border-[#333] bg-[#0a0a0a]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#333]">
            <span className="terminal-dot bg-[#ff5f57]" />
            <span className="terminal-dot bg-[#ffbd2e]" />
            <span className="terminal-dot bg-[#28c840]" />
            <span className="ml-3 text-[11px] text-[#4a7a4a]">
              login — bash — 80&times;24
            </span>
          </div>

          {/* Terminal content */}
          <div className="px-5 py-5 space-y-1 text-sm leading-relaxed">
            <div className="flex items-center gap-0">
              <span className="text-[#00ff41]">$</span>
              <span className="text-[#b0ffb0] ml-2">sudo -u admin ./portfolio</span>
            </div>
            <div className="text-[#00ff41] phosphor-glow font-bold pt-1">
              AUTH REQUIRED
            </div>

            <div className="flex items-center gap-0 pt-3">
              <span className="text-[#00ff41]">$</span>
              <span className="text-[#b0ffb0] ml-2">cat /etc/motd</span>
            </div>
            <div className="text-[#8ab88a] text-xs leading-relaxed">
              Sign in with GitHub to add, edit, or remove contributions.
              Writes are gated by row-level security.
            </div>

            <div className="flex items-center gap-0 pt-3">
              <span className="text-[#00ff41]">$</span>
              <span className="text-[#b0ffb0] ml-2">gh auth login</span>
              <span className="text-[#00ff41] cursor-blink ml-1">█</span>
            </div>
          </div>

          {/* Sign in button */}
          <div className="px-5 pb-5">
            <button
              onClick={signInWithGitHub}
              disabled={signing}
              className="w-full flex items-center justify-center gap-2 border border-[#333] bg-[#111] px-4 py-3 text-xs text-[#00ff41] hover:border-[#00ff41] hover:bg-[#0d1a0d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed card-hover"
            >
              <Github size={14} />
              {signing ? (
                <>
                  redirecting to github.com
                  <span className="cursor-blink">█</span>
                </>
              ) : (
                "[ CONTINUE WITH GITHUB ]"
              )}
            </button>
          </div>
        </div>

        {/* ── Status bar footer ── */}
        <div className="border border-t-0 border-[#333] px-3 py-2 text-[10px] text-[#2d5a2d] flex items-center justify-between">
          <span>
            AUTH: <span className="text-[#ffb800]">pending</span>
          </span>
          <Link
            href="/"
            className="hover:text-[#00ff41] transition-colors"
          >
            $ cd ../ &nbsp;# back to portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
