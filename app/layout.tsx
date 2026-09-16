import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linkplek — jouw links, één plek",
  description: "Maak je eigen linkpagina en deel alles met één QR-code.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
