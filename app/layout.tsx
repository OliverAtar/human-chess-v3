import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Chess",
  description: "Play chess against verified humans. Win tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
