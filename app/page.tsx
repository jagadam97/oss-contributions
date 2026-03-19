import { ContributionsGrid } from "@/components/ContributionsGrid";
import { Github } from "lucide-react";

// Static shell — data is fetched live client-side from Supabase,
// so the page always shows the latest contributions without a redeploy.
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] crt-flicker">
      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Tmux-style status bar / nav ── */}
        <nav className="flex items-center justify-between py-3 border-b border-[#333] text-xs">
          <div className="flex items-center gap-1">
            <span className="bg-[#00ff41] text-black px-2 py-0.5 font-bold">
              0:oss
            </span>
            <span className="text-[#4a7a4a] ml-2">
              jagadam97@oss:~$
            </span>
            <span className="text-[#b0ffb0] ml-1">
              ./portfolio
            </span>
            <span className="text-[#00ff41] cursor-blink ml-0.5">█</span>
          </div>
          <a
            href="https://github.com/jagadam97"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#4a7a4a] hover:text-[#00ff41] transition-colors"
          >
            <Github size={13} />
            <span>git remote -v</span>
          </a>
        </nav>

        {/* ── Terminal window hero ── */}
        <header className="pt-8 pb-10">
          {/* Terminal window chrome */}
          <div className="border border-[#333] bg-[#0a0a0a]">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#333]">
              <span className="terminal-dot bg-[#ff5f57]" />
              <span className="terminal-dot bg-[#ffbd2e]" />
              <span className="terminal-dot bg-[#28c840]" />
              <span className="ml-3 text-[11px] text-[#4a7a4a]">
                jagadam97@oss — bash — 80×24
              </span>
            </div>

            {/* Terminal content */}
            <div className="px-5 py-5 space-y-1 text-sm leading-relaxed">
              {/* whoami */}
              <div className="flex items-center gap-0">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">whoami</span>
              </div>
              <div className="text-[#00ff41] phosphor-glow font-bold">
                jagadam97
              </div>

              {/* realname */}
              <div className="flex items-center gap-0 pt-2">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">cat /etc/realname</span>
              </div>
              <div className="text-[#e0ffe0]">
                Dinesh Reddy Jagadam
              </div>

              {/* README */}
              <div className="flex items-center gap-0 pt-2">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">cat README.md</span>
              </div>
              <div className="text-[#8ab88a] max-w-2xl leading-relaxed">
                A living record of bugs fixed, features shipped, docs improved,
                and ideas merged — across the open source ecosystem.
              </div>

              {/* ls contributions */}
              <div className="flex items-center gap-0 pt-3">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">ls ./contributions</span>
              </div>
              <div className="text-[#4a7a4a] text-xs pt-1">
                Loading entries from database...
              </div>
            </div>
          </div>
        </header>

        {/* Contributions — fetched live from Supabase in the browser */}
        <main className="pb-12">
          <ContributionsGrid />
        </main>

        {/* ── Terminal status bar footer ── */}
        <footer className="border-t border-[#333] py-4 text-[11px] text-[#2d5a2d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>SESSION: <span className="text-[#00ff41]">active</span></span>
            <span className="text-[#333]">│</span>
            <span>CONN: supabase <span className="text-[#00ff41]">●</span></span>
            <span className="text-[#333]">│</span>
            <span>BUILT: next.js + tailwind</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jagadam97/oss-contributions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00ff41] transition-colors"
            >
              src: github.com/jagadam97/oss-contributions
            </a>
            <span className="text-[#333]">│</span>
            <span>EOF</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
