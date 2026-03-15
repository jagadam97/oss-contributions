import { getContributions } from "@/lib/supabase";
import { ContributionsGrid } from "@/components/ContributionsGrid";
import { Github, ExternalLink, Code2 } from "lucide-react";

export const revalidate = 3600; // ISR: revalidate every hour

export default async function Home() {
  const contributions = await getContributions();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-cyan-600/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <Code2 size={16} className="text-indigo-400" />
            <span>jagadam97</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-200">oss-contributions</span>
          </div>
          <a
            href="https://github.com/jagadam97"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Github size={16} />
            GitHub
          </a>
        </nav>

        {/* Hero */}
        <header className="py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Open Source Portfolio
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            <span className="text-slate-100">My </span>
            <span
              className="gradient-text"
            >
              Open Source
            </span>
            <br />
            <span className="text-slate-100">Contributions</span>
          </h1>

          <p className="max-w-xl mx-auto text-slate-400 text-lg leading-relaxed">
            A living record of bugs fixed, features shipped, docs improved, and
            ideas merged — across the open source ecosystem.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://github.com/jagadam97"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <Github size={15} />
              View on GitHub
            </a>
            <a
              href="https://github.com/jagadam97/oss-contributions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium transition-colors"
            >
              <ExternalLink size={15} />
              Source
            </a>
          </div>
        </header>

        {/* Contributions */}
        <main className="pb-24">
          <ContributionsGrid contributions={contributions} />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-600 space-y-1">
          <p>Built with Next.js · Tailwind CSS · Supabase</p>
          <p>
            <a
              href="https://github.com/jagadam97/oss-contributions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              github.com/jagadam97/oss-contributions
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
