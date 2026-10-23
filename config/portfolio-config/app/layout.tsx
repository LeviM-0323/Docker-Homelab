import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Modernization Preview",
  description: "A preview of the modernized portfolio website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
