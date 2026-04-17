import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mass Grooming | Planning Poker",
  description: "Professional Agile Planning Poker & Grooming Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-900 text-slate-50 selection:bg-blue-500/30">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950"></div>
        {children}
      </body>
    </html>
  );
}
