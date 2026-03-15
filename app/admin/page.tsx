"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import { Github, Code2 } from "lucide-react";

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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0f0f1a] p-8 space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Code2 size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">oss-contributions</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800" />

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed">
          Sign in with your GitHub account to add, edit, or remove contributions.
        </p>

        {/* Sign in button */}
        <button
          onClick={signInWithGitHub}
          disabled={signing}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {signing ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Github size={17} />
          )}
          {signing ? "Redirecting…" : "Continue with GitHub"}
        </button>

        <a
          href="/"
          className="block text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to portfolio
        </a>
      </div>
    </div>
  );
}
