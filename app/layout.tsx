import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "jagadam97@oss:~$ — Open Source Contributions",
  description:
    "A living record of open source contributions by jagadam97 — bugs fixed, features shipped, docs improved.",
  openGraph: {
    title: "jagadam97@oss:~$ — Open Source Contributions",
    description: "Open source contributions terminal by jagadam97",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono antialiased bg-[#0a0a0a] text-[#b0ffb0] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
