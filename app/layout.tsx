import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OSS Contributions — jagadam97",
  description:
    "A living record of open source contributions by jagadam97 — bugs fixed, features shipped, docs improved.",
  openGraph: {
    title: "OSS Contributions — jagadam97",
    description: "Open source contributions portfolio by jagadam97",
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
      <body className={`${inter.className} antialiased bg-[#0a0a0f] text-slate-200 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
